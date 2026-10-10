# Knect — Codebase Reconciliation

**Read date:** 2026-08-26, branch `auth`, commit `8493a36`.
**Method:** every file below read in full, not skimmed. `votingLogic.ts` was executed against a 17-case suite rather than reasoned about. AsyncStorage's shipped type definitions were pulled from npm to settle the sync/async question empirically.

**What this is for:** deciding which planned tickets are already built, partly built, or greenfield — so we stop writing specs for things that exist and stop assuming things work that don't.

---

## 1. The headline

**The app has never successfully written a single field to Firestore.** Not once, by any code path. That isn't a figure of speech — `writeUserData` is the only write in the repo, and it has two independent blockers that each make it a no-op.

**Three of the four tabs crash on load**, each for a different reason, all traceable to the same root cause:

| Tab | What happens | Why |
|---|---|---|
| **Circle** | Throws on mount | `ChatService.getConversations()` — `JSON.parse` on a Promise |
| **Discover** | Throws on import | `geminiService.ts` constructs `GoogleGenAI` at module scope with an undefined API key |
| **Planner** | Throws on import | `StatusService`'s constructor throws → takes down `EventPlanner` and `StatusComposer` with it |

And there's no safety net: **`index.js` defines a `Root` wrapped in `ErrorBoundary`, then registers `App` instead.**

```js
const Root = () => (<ErrorBoundary><App /></ErrorBoundary>);
AppRegistry.registerComponent(appName, () => App);   // ← Root is never used
```

So every one of those throws is a red screen, not a caught error. One-line fix, and it should happen before anyone tries to test anything.

**The root cause of most of it is one line.** `utils/storage.ts:4`:

```ts
export const localStorage = createAsyncStorage("user_data");
```

An **async** API named after the browser's **synchronous** one. Every consumer was then written against the browser API — `const data = localStorage.getItem(KEY); JSON.parse(data)`. A Promise is always truthy, so `JSON.parse` stringifies it to `"[object Promise]"` and throws. Verified by execution:

```
getConversations() THREW: SyntaxError: Unexpected token 'o', "[object Promise]" is not valid JSON
```

This is unconditional — not a race, not an edge case. 14 unawaited call sites in `ChatService.ts` alone (6 reads that throw, 8 writes that are fire-and-forget), plus `StatusService.ts:22`. The codebase isn't even self-consistent about it: `ProfilePage.tsx:28` correctly awaits, line 76 doesn't.

**Rename that export before anything else.** It is the root cause, and while the name stays, it will keep producing this bug in new code.

---

## 2. The four defects that have to be fixed before anything can be tested

Ordered by how much they block.

1. **`index.js` registers `App` instead of `Root`** — no error boundary, every failure is a red screen. One line.
2. **`utils/storage.ts` names an async API `localStorage`** — rename, then fix the 15+ call sites. This is not "add `await` in 14 places": the methods are synchronous by design, all 10 `ChatService` signatures change, and all 13 call sites across `SocialDashboard`, `EventPlanner`, and `CreateEventModal` become async and need loading states they don't have.
3. **`StatusService.save()` references an undefined `storage`** (line 84 — every other line uses `localStorage`). ReferenceError on every write path. Also reads `UserStatus.timestamp` in five places, which was commented out of the type.
4. **`geminiService.ts` constructs its client at module scope** with `process.env.API_KEY` — `.env.local` names it `GEMINI_API_KEY`, and there's no dotenv babel plugin, so it's `undefined` either way. This file is being deleted, which fixes it, but note the deletion is cheap: **one import** (`DiscoveryFeed.tsx:5`). The other export has zero call sites.

---

## 3. Auth — the deep dive

This is what gets built next, so it gets the most detail.

### Auth is roughly 20% done, and the 20% is the easy part

**There is no `signInWithEmailAndPassword` call anywhere in the codebase.** `authenticateUser()` doesn't authenticate — it reads `auth.currentUser` and checks whether a session already exists. The email and password a user types are never sent to Firebase. Sign-in is not "buggy," it's unimplemented.

### All three JS→Kotlin call signatures are wrong

| JS call | Passes | Kotlin expects | Result |
|---|---|---|---|
| `App.tsx:43` `authenticateUser()` | 0 args | `authenticateUser(promise)` | Arity mismatch — bridge throws |
| `App.tsx:49` `authenticateUser()` | 0 args | same | Same, **and it's a duplicate native call** |
| `App.tsx:61` `createUserData(email, password)` | 2 args, both misplaced | `createUserData(displayName, email, promise)` | Arity **and** both positions wrong |
| — | never called | `createNewUser(email, password, promise)` | **Never called from JS. No Firebase Auth account is ever created.** |
| — | never called | `getActiveUser(promise)` | Never called, and its Kotlin body is empty |

### 🔴 One of those mismatches is a security bug, not a cosmetic one

`createUserData(email, password)` against `createUserData(displayName, email, promise)` means position 2 — the `email` field — **receives the password**. If that call ever succeeded, the user's plaintext password would be written into the Firestore `email` field.

It doesn't succeed today, for two unrelated reasons (the write is a no-op, and App's `email`/`password` state is bound to the *sign-in* form while sign-up keeps its own state in `CreateProfilePage`). But it's the kind of thing that starts working the moment somebody fixes the write, so it needs fixing in the same pass.

### Even with the arity fixed, sign-in would fail 100% of the time

```js
if (FirebaseModule.authenticateUser() == true) { ... }
```

Every `@ReactMethod` with a trailing `Promise` returns a JS Promise. `Promise == true` is always false. The else branch then does `setErrorText(FirebaseModule.authenticateUser())`, putting a Promise object into state and rendering it inside a `<Text>`. There is no `await` anywhere in the auth path.

There's also a hardcoded `setTimeout(..., 5000)` around the whole thing — a fake delay inherited from the AI Studio mock, since bumped from 1000ms.

### `writeUserData` can never write a new user — two independent blockers

```kotlin
if (userDoc.get().await().get("userId") != null) {
    userDoc.set(userData, SetOptions.mergeFields()).await()
```

1. The guard is **inverted**: a brand-new user's document doesn't exist, so `get("userId")` is null, so it returns `false` and writes nothing. Creation is impossible by construction.
2. **`SetOptions.mergeFields()` with no arguments merges zero fields** — a no-op even when reached.

### The emulator config is worse than "hardcoded on"

```kotlin
private val debug: Boolean = true
init {
    if (debug){
        auth.useEmulator("10.0.2.2", 8080)      // ← 8080 is Firestore's port; Auth is 9099
        firebaseDB.useEmulator("10.0.2.2", 8080)
    }
    firebaseDB = FirebaseFirestore.getInstance("default")   // ← discards the line above
}
```

Auth traffic is pointed at the Firestore emulator port. Then `firebaseDB` is **reassigned** on the next line to a fresh instance with no emulator config — so **Firestore is talking to production while `debug` is true.** And `"default"` is a *named* database; Firestore's actual default id is `"(default)"`.

### Everything else in the Kotlin module

- `getActiveUser` (L109–112) — **empty body.** Neither resolves nor rejects. Any JS `await` hangs forever.
- `authState: FirebaseAuth.AuthStateListener` — `lateinit`, never initialized, never registered. **No session-persistence mechanism exists.**
- `authenticateUser`'s catch does `promise.resolve(e.toString())` instead of rejecting — JS can't tell success from failure by promise state.
- `user!!` NPEs on cold start when `currentUser` is null.
- `collection("users")` lowercase vs the schema's `Users`. Firestore is case-sensitive; these are different collections. (Open — see decision log.)
- `runBlocking` in `writeUserData` and `getUserData`, on the bridge thread, for network I/O.
- `dbConnection: DBService` is dead — `DBService.kt` was gutted to a 5-line TODO in `70e2ae6`.

### Build config

- **The google-services plugin is applied to the root project**, not `android/app`, where it would actually process `google-services.json`.
- `implementation("com.google.gms:google-services:4.4.4")` adds a Gradle *plugin* artifact as an app runtime dependency.
- **Firebase Storage is not in `build.gradle` at all** — only analytics, auth, firestore. Relevant to Project 6.
- `kotlinx-coroutines-play-services` isn't declared, though `kotlinx.coroutines.tasks.await` is imported. May resolve transitively under the Firebase BOM — worth a clean build to confirm the module compiles.
- **No iOS module exists.** `NativeModules.FirebaseModule` is `undefined` on iOS, and `App.tsx:34` destructures it with no null guard.

### Session handling regressed

The `useEffect` that restored `knect_session` and `knect_theme` was **deleted** since the AI Studio commit. It's now `setIsDarkMode(false)`. `App.tsx:44` writes `knect_session`; nothing reads it; `handleLogout` never removes it. Cold start always lands on the login screen.

---

## 4. Ticket verdicts

**KILL** = already works. **SHRINK** = mostly exists, scope to the delta. **KEEP** = greenfield.

| Ticket | Verdict | What actually exists | What the ticket should cover |
|---|---|---|---|
| **1 — Firebase Auth** | **KEEP, full size** | A login screen and a Kotlin scaffold. ~20% | Real sign-in, fix 3 call signatures, implement `getActiveUser`, register the `AuthStateListener`, session restore, emulator port + instance-reassignment fix, `writeUserData` merge + guard, collection casing |
| **2 — Profile Schema & Creation** | **KEEP — the lynchpin** | `UserSchema` in Kotlin, disagreeing with the master on all 5 fields. Nothing has ever written | Correct field names, add `name_lowercase`, move `email` to `Private_info`, fix `writeUserData`, wire `onComplete`'s payload through App.tsx. **4 and 7 both block on this** |
| **4 — User Search Tab** | **KEEP, greenfield** | Nothing. The only "search" is a client-side filter over local chat titles | Add an explicit blocking dependency on 2 — search needs `name_lowercase`, which nothing writes |
| **6 — Profile Picture Uploads** | **KEEP, greenfield** | Two hardcoded 4-element Unsplash arrays, each with a TODO admitting it | **No image picker in package.json. No Firebase Storage in build.gradle.** Both are ticket scope |
| **7 — Public Profile Routing** | **KEEP — bigger than it reads** | Nothing | Hidden prerequisite: **there is no navigation library at all.** Routing to another user's profile means adopting React Navigation or hand-rolling a modal stack. Size the ticket to include it |
| **11 — Discover Frontend Fetch** | **SHRINK, significantly** | List, card, collapsing animated header, detail modal, loading state, and the `await getX() → setItems` pattern — all working | Swap `getDiscoveryFeed()` for a Firestore query, delete `geminiService.ts`, widen `DiscoveryItem` to the Activities shape. **Becomes a data-layer ticket** |
| **12 — Activity Detail Page** | **SHRINK, hard** | The detail view exists as a `pageSheet` modal — hero image, category tag, title, description, location, price, CTA that already routes to the planner | Bind to real Activities fields, add the `pictures` carousel, add like/click writes. If it must be a linkable page rather than a modal, that's ticket 7's problem — say so |
| **Planner & Create Event** | **SHRINK** | ~1,800 lines of working UI: week/day grid with now-line, 12-month view, 4-step create modal, drag + resize with 15-min snapping, cluster-based overlap layout, event popup | The UI half is **done**; the model/persistence half is **greenfield**. Mark the components "do not rewrite" |
| **15.1 — Chat creation** | **SHRINK, ~60% remaining** | `findConversation` implements `participant_hash` semantics in memory. `findOrCreateConversation` is the right primitive. Chat details UI is finished | Async rewrite against Firestore, real uids, persisted `participant_hash` + `chat_origin`, **and add/remove-member, which does not exist at all** |
| **15.2 — Messaging & listeners** | **SHRINK, heavily** | The chat UI is done: inverted FlatList, consecutive-sender bubble grouping, group avatars, search, input bar, long-press delete | **Listeners are 100% greenfield — not one `onSnapshot` in the repo.** Delete `ChatService.ts`, rewrite as a Firestore repository. Keep the UI nearly untouched |
| **16 — Activity Proposals** | **SHRINK** | The most complete feature in the prototype. Proposal card with proposer attribution, invitee avatars with per-person status badges, GOING/NO buttons, and a "propose a change instead" affordance | Keep the card UI; rebuild the data layer. **Blocked on a schema gap — see §5.1** |
| **17 — Voting System** | **KEEP** | ~350 lines of finished UI (vote cards with progress bars, ranked cards, creator modal) — free. The logic is another matter | Scope as **greenfield logic**, not "finish the voting feature." See §6 |
| **Own-profile tab** | **SHRINK — it's a bug-fix ticket** | View/edit toggle, inline inputs, interest add/remove, and save all exist | **The loader is dead code** — `useEffect(() => { (async () => {...}) }, [])` with no trailing `()`, so the save is write-only. Frame as "repoint at Firestore and fix the dead loader" |
| **Onboarding** | **KEEP, medium** | Two-step UI exists | **Step machine is broken** (`{ true && (` renders step 1 permanently; `hideButton` is a plain `var`, not state — both steps render at once after NEXT). Creates no auth user. Payload discarded. Password rule mismatch: message says 12–24, regex is `{2,24}` |
| **User status** | **KEEP** | The composer UI is done and keepable | **Mark `StatusService` non-functional, not "partly built"** — it throws at module load. Implement the 1-hour TTL the tooltip already promises. Reconcile the privacy enum against `Friends.status` |

---

## 5. Schema gaps the reconciliation found — these need decisions

### 5.1 🔴 RSVPs have no home in the master schema

The prototype stores them as `eventDetails.rsvps: Record<uid, 'going'|'not_going'|'pending'>` **inside a chat message document**, mutated by `ChatService.updateMessageRSVP`.

That's wrong for Firestore — per-user writes to a shared document, and you cannot write a rule that lets user B set their own RSVP without also letting them edit A's. But the schema doesn't offer an alternative: `Messages` has no RSVP field, `Votes` has none, and `Events` has only `confirmed_participants` (an array of uids), which can't express "declined" or "pending."

**This blocks Project 16.** Options: an RSVP map on the Event document keyed by uid, an RSVP subcollection, or accept that only "confirmed" is representable and drop the three-state model. **Needs a ruling.**

### 5.2 "Who's coming" has four representations

`Message.eventDetails.rsvps` (`going`/`not_going`/`pending`), `EventProposal.rsvps` (`yes`/`no`), `CalendarEvent.attendees[]` (`confirmed`/`declined`/`pending`), and the schema's `shared_with` + `confirmed_participants`. Four shapes, three vocabularies, one concept. `attendees` is dead code — never written, never read.

### 5.3 `Friend.status` is a direct name collision

Prototype `Friend.status?: Boolean` means **availability**. Schema `Friends.status: String` is the **four-state relationship** enum. Same field name, different meanings, different types. One has to move. Also `isCloseFriend?: Boolean` duplicates what `status: "close_friend"` already expresses.

### 5.4 `isAvailable` should be derived, not stored

The schema has no field for it, and that's correct — available ⟺ `current_status` non-empty AND `status_expires_at > now`. Worth stating explicitly so nobody adds the field.

### 5.5 `status_expires_at` vs the prototype's `timestamp` are semantically inverted

`timestamp` = last updated. `status_expires_at` = when it stops. The only expiry logic that exists is a calendar-day rollover check, while `StatusComposer.tsx:54` tells the user *"Your status will stay on for the next hour."* **No such logic exists anywhere.**

### 5.6 Everything else in the schema is unwritten

Nothing writes: `name_lowercase`, `profile_info`, `current_status`, `status_visibility`, `status_expires_at`, `profile_picture_url` (writes `""`). **The entire `Private_info` subcollection.** The entire `Friends`, `Free_Busy`, `Activity_History`, and `Liked_Activities` subcollections. **The entire `Activities` collection** — zero occurrences of `geohash`, `GeoPoint`, `click_count`, `likes`, `tags`, `cost`, or `Activities` anywhere in the repo.

---

## 6. The voting logic — read this before writing Project 17

`utils/votingLogic.ts` is the only non-trivial algorithm in the repo. It is also **dead code**: its only importer is `ChatEventWidget.tsx`, which is itself never imported anywhere.

It was executed against 17 cases rather than reviewed by eye. Findings:

### 🔴 `Math.random()` tie-breaking makes client-side tallying impossible

Both functions break ties with `Math.random()`. **Two devices tallying identical ballot data produce different winners.** This isn't a code smell — it's an architecture constraint. The tally has to run in a Cloud Function, or the tie-break has to be deterministic (seeded by the vote document id, say).

### 🔴 Batch elimination inverts winners — concrete failing case

`calculateRankedChoiceResult` implements Instant-Runoff Voting, and the transfer mechanism is textbook-correct. But it eliminates *every* option tied for last simultaneously. Given ballots A=2, B=2, C=3 where both A- and B-voters rank the other second:

- **This code:** min = 2, `losers = [A, B]`, both deleted → only C remains → **C wins.**
- **Standard IRV:** eliminate one, A's ballots transfer to B → B=4, C=3 → **B wins with a majority.**

Real RCV jurisdictions allow batch elimination only when the tied candidates' *combined* total is below the next-lowest. There's no such check. ~10 lines to fix.

### There are four tally implementations with three tie policies

- `votingLogic.calculatePickOneResult` — plurality, returns `isTie: true`
- `votingLogic.calculateRankedChoiceResult` — **IRV**, deliberately returns `isTie: false`
- `SocialDashboard.getRankedResults` — **Borda count**, display-only, hardcoded to Top 2. Its own comment says "let's do first choice count for simplicity," contradicting the code beneath it
- `SocialDashboard.createNewProposal` — **Borda** for ranked, plurality-via-sort for normal

**So the orphaned module implements a different algorithm (IRV) than the app displays (Borda).** Shipping `votingLogic.ts` as-is would silently change results users have already seen.

### Other defects

No empty/zero-input guards — empty options crashes one function and returns `undefined` from the other; zero ballots fabricates a random winner in both. No per-user dedup in either (the only caller that dedups is the dead one). Zero tests.

### The embedded-vs-subcollection question is moot

Moving votes out of messages into a `Votes` subcollection normally means rewriting reads, writes, listeners, and backfilling data. **None of those exist here.** No vote is ever persisted — `SocialDashboard.tsx:865` is literally a comment where the write should be:

```js
// In real app: ChatService.sendVote(selectedConvo.id, voteMsg);
setMessages(prev => [voteMsg as any, ...prev]);
```

Every vote dies when the user backs out of the chat. So "votes are embedded in messages" is a statement about `types.ts`, not about the architecture. **Go straight to the subcollection** — and note the schema's Map-keyed `normal_votes`/`ranked_votes` is the better design: each user writes one field they own, dedup becomes structural, and the security rule is one line. With the prototype's per-option arrays, neither is possible.

`handleCastVote` actually gets *smaller* under the Map shape — a 45-line nested `setMessages` map becomes a one-line `updateDoc`.

---

## 7. Questions for Jonathan

1. **Was `collection("users")` lowercase deliberate?** One string in one file if not; a rewrite of the rules, schema, and every ticket if so.
2. **Is `getActiveUser` half-written locally, or has it been an empty stub since May?** It has the empty `@ReactMethod`, an `ActiveUser` field declared and never assigned, and a working `getUserData` getter — the classic interrupted-mid-implementation signature. But the last commit is three months old, which is equally consistent with the work having stalled. **The answer changes the size of Project 1 materially.**
3. **Same question for `authState`** — `lateinit`, never initialized. Registration plus a `DeviceEventEmitter` back to JS is exactly the missing piece for session restore.
4. **Was `keyChain` meant to be called in `CreateProfilePage`?** It's imported there and in `App.tsx`, and called in neither. Importing a credential-storage helper into the signup screen and not using it suggests the next edit was `createNewUser` + `keyChain.userLogin`.
5. **Does the Android module actually compile?** `kotlinx-coroutines-play-services` isn't declared. It may resolve transitively under the Firebase BOM — worth a clean build.
6. **The SDK question**, with this as evidence: the hand-rolled bridge is ~145 lines with six distinct bugs, no iOS counterpart, and `runBlocking` on the bridge thread. `@react-native-firebase/auth` + `/firestore` deletes all of it and works on both platforms.
