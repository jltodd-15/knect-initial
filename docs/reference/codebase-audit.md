# Knect — Live Codebase Audit

**Source:** `github.com/jltodd-15/knect-initial`, branch `auth`, cloned 2026-08-25.
**Why this exists:** the roadmap docs are the source of truth, but several tickets are written against assumptions about the code that turn out not to hold. This records what's actually there, so the tickets can be written against reality instead of memory.

> **Correction, 8/25/26:** an earlier version of §4 described the prototype's data shapes as "architectural choices already made in code." **That framing was wrong.** Git history shows almost all of it came from a single commit — `71a7c07`, "adding latest changes from AI studios" — meaning those shapes are generated guesses, not decisions anybody made. §0 below sorts out what came from where; read it before §4.

---

## 0. Provenance — who wrote what

Three layers, and they deserve very different levels of trust.

| Layer | Commits | Files | How to treat it |
|---|---|---|---|
| **Scaffolding** | `3b03608`, `6c269dd`, `5b6fcfb` — Jan–Feb 2026, `jltodd-15` | `react-native init` output, dependency setup | Boilerplate |
| **Google AI Studio** | `71a7c07` — 3/5/26 | `types.ts`, `constants.ts`, **all of `components/`**, `ChatService.ts`, `StatusService.ts`, `geminiService.ts`, `votingLogic.ts`, `storage.ts`, `calendarLayout.ts`, `useEventCreation.ts` | **Generated output.** Where it disagrees with the schema doc, the schema wins by default. Kyson's read: the activity list it produced is low quality and needs redoing |
| **Hand-written** | `4964c0d`, `05cc943`, `1861fb1`, `70e2ae6`, `8493a36` — Apr–May 2026 | `FirebaseModule.kt`, `DBService.kt`, `FirebasePackage.kt`, rewrites of `CreateProfilePage.tsx` and `storage.ts`, the Android build config | Real work, concentrated in auth. **This is the layer where continuity matters** |

**Fourth layer, not visible here:** uncommitted local work, mostly auth. Anything below may already be fixed. Confirm before acting on a specific bug.

*Note on attribution:* all eight commits since March are authored by `BonusDucksMkII <indifferential.equations@gmail.com>`, and only the first three by `jltodd-15`. Worth confirming those are the same person under two accounts before drawing conclusions from it.

---

## 1. Stack — confirmed facts for Project 0

These no longer need to be asked. They're in `package.json` and the file tree.

| | Actual |
|---|---|
| Framework | **Bare React Native 0.83.1** — not Expo. Scripts are `react-native run-android` / `run-ios` |
| React | 19.2.0 |
| Language | **TypeScript** 5.8.3, `@react-native/typescript-config` |
| Node | ≥ 20 |
| Navigation | **None.** No `react-navigation`, no router of any kind. `components/Navigation.tsx` is a hand-rolled tab bar switching on an `AppTab` enum |
| Styling | **None.** No NativeWind, no Tailwind, no styled-components. Raw `StyleSheet` with inline hex values |
| State management | **None.** Plain React state and props |
| Data layer | `AsyncStorage` via `utils/storage.ts`, wrapping a single mock user with `id: 'me'` |
| Image caching | `@d11/react-native-fast-image` ^8.13.0 — **already installed** |
| Auth storage | `react-native-keychain` ^10.0.0 — present, currently unused for Firebase |
| Testing | **Jest is configured** — `jest.config.js`, `__tests__/App.test.tsx`, `npm test` |
| Firebase (JS) | **Neither** `@react-native-firebase/*` nor the `firebase` web SDK is installed |
| Firebase (Android) | One Kotlin bridge: `FirebaseModule.kt` + `FirebasePackage.kt` + `services/DBService.kt` |
| Firebase (iOS) | **Zero.** Only `ios/AwesomeProject/AppDelegate.swift`. No `GoogleService-Info.plist`, no Swift bridge, Xcode project still named `AwesomeProject` |
| Security rules | No `firestore.rules`, no `storage.rules`, no `firestore.indexes.json` anywhere in the repo |

### Corrections this forces on existing tickets

- **Project 6** says to run `npm install react-native-fast-image`. That package is the unmaintained original. The repo already has the maintained fork, `@d11/react-native-fast-image`. Delete the install instructions from the ticket entirely — it's installed.
- **Project 0** can't say "which navigation library" — there isn't one, and adding React Navigation is a real migration off the hand-rolled `AppTab` switch. That's a decision, not a documentation task.
- **F4 is now answerable:** Jest exists and one test exists. The "what does done mean" bar has infrastructure to build on rather than needing to be created.

---

## 2. 🔴 Security — needs action independent of every other decision

### 2.0 `.env.local` is tracked and holds a live API key

**The most urgent finding here.** `.env.local` was committed in `71a7c07` (3/5/26) and is **still tracked today** — it appears in `git ls-files`. It contains:

```
GEMINI_API_KEY=<redacted>
TESTING_DEBUG=<redacted>
```

The repo is public. A Firebase config file identifies a project; a Gemini API key is a real billable credential.

**Revoke the key.** Removing the file from the working tree does not remove it from history — it stays reachable at that commit, and anyone who has cloned the repo already has it.

### 2.1 `google-services.json` is committed to a public repository

Confirmed on both counts. The file is tracked at `android/app/google-services.json`, and the repository cloned anonymously with no credentials.

The `.gitignore` *looks* like it covers this — line 78 is `*firebase*` — but **`google-services.json` does not contain the string "firebase"**, so the pattern never matched it. The rule was written to solve this problem and silently doesn't.

*What's in it:* the Android API key, project ID, and app ID. Firebase API keys are not secrets in the way a private key is — they identify the project rather than authorize access — but combined with **§2.2** and the fact that no `firestore.rules` file exists in the repo, this is worth treating as exposure rather than as a non-issue. **Verify the repo's visibility setting today.**

### 2.2 Debug mode is hardcoded on

```kotlin
private val debug: Boolean = true

init {
    if (debug){
        auth.useEmulator("10.0.2.2", 8080)
        firebaseDB.useEmulator("10.0.2.2", 8080)
    }
    firebaseDB = FirebaseFirestore.getInstance("default")
}
```

Three separate problems in five lines:

1. **`debug` is a hardcoded constant, not a build flag.** Shipped as-is, every user's app tries to reach a Firebase emulator at `10.0.2.2` — an Android-emulator-only loopback address that means nothing on a real device. The app would fail completely in production.
2. **Wrong port for Auth.** The Auth emulator defaults to `9099`; `8080` is Firestore's. Even in local development this line doesn't do what it looks like it does.
3. **The emulator config is then thrown away.** `firebaseDB` is reassigned on the line *after* `useEmulator` is called on the previous instance, so the Firestore emulator setting never applies. Separately, `getInstance("default")` names a database `default` — Firestore's default database ID is `(default)`, with parentheses.

---

## 3. 🔴 `FirebaseModule.kt` — bug inventory

The earlier audit cited eight auth bugs. Here's the current committed state, itemized. **Jonathan's local tree may be ahead of this** — confirm before treating any of it as final.

| # | Bug | Consequence |
|---|---|---|
| 1 | `writeUserData` writes only if the document **already has** a `userId` field, else returns `false` | **A new user's profile document is never created.** The condition is inverted for the one case it exists to handle. This is Project 2's entire job silently failing |
| 2 | `SetOptions.mergeFields()` called with no arguments | Merges zero fields. Even when reached, the write is a no-op |
| 3 | Collection is `"users"` (lowercase) | Schema and every ticket say `Users`. **Firestore collection names are case-sensitive** — these are two different collections |
| 4 | `createNewUser` calls `promise.resolve(false)` without returning, then falls through to `promise.resolve(true)` | Double-resolve on the failure path. The JS side sees success |
| 5 | `authenticateUser`'s catch block calls `promise.resolve(e.toString())` instead of `promise.reject` | Every auth error arrives on the JS side as a successful result whose value happens to be an error string |
| 6 | `getActiveUser` is an empty function body — never resolves or rejects its promise | Any JS `await` on it hangs forever |
| 7 | `auth.currentUser!!` non-null assertion in `authenticateUser` | Crashes rather than erroring when no user is signed in |
| 8 | `authState` is a `lateinit var` field, shadowed by a local `val authState` inside `createNewUser` | The field is never initialized. Touching it throws |
| 9 | `runBlocking` in both `writeUserData` and `getUserData` | Forces async Firestore calls to behave synchronously across the bridge. Can block the calling thread — a real anti-pattern in a React Native native module, and the clearest illustration of what the hand-written-bridge-per-feature approach produces |
| 10 | `UserSchema` carries `email` on the user document | Contradicts the schema and Project 3's privacy model — `email` belongs in `Private_info`. See decision log R11 |

**What this means for Project 1 and Project 2:** the ticket text currently reads as though auth is close to working. Bugs 1, 2, and 3 together mean **no user profile document has ever been successfully written** by this code. Project 1 should be specced as a rewrite, not a fix, and its acceptance criteria should include verifying the document actually lands in `Users` — capital U.

---

## 4. 🟡 Prototype data shapes vs. the master schema

`types.ts` describes a prototype whose shapes diverge from the schema doc. **Per §0, all of this is Google AI Studio output** — so these are not decisions to be respected, they're guesses to be evaluated. Where the schema doc and the generated code disagree, **the schema wins unless there's a reason it shouldn't.**

The reason to read this section anyway: the generated code sometimes reached for a shape the schema doesn't have, and occasionally that shape is *better*. Worth looking at before discarding.

### 4.1 Votes: embedded on messages, not a subcollection

The master schema defines a `Votes` subcollection with `normal_votes` / `ranked_votes` / `change_type` / `vote_type`. The prototype puts the whole poll **inside a message**:

```ts
voteDetails?: {
  question: string;
  options: { id: string; text: string; votes: string[] }[];
  mode: 'normal' | 'ranked';
  context?: { eventId?: string; field?: 'time' | 'location'; initialValue?: string };
  rankedVotes?: { userId: string; order: string[] }[];
}
```

Two genuinely different architectures. **Embedded** means one read to render a chat, but every vote is a write to a message document that also carries chat history — and Firestore's ~1 write/sec per document limit applies to a group all voting at once. **Subcollection** means a separate document per vote with no contention, but an extra query per vote card in the chat.

**The schema's subcollection is almost certainly right**, for the write-contention reason. The embedded version is what a model produces when it isn't thinking about Firestore's per-document write limits. Project 17 should spec the subcollection and treat the prototype's shape as something to migrate away from.

*One thing worth keeping, though:* `context.field: 'time' | 'location'` is the generated code's answer to the schema's `change_type` — voting on what to change about an existing event, rather than only voting on which activity. The roadmap never describes that feature, and the schema has a `change_type` field with no explanation. **The generated code guessed at a real gap.** Worth deciding deliberately in Project 17 rather than inheriting by accident.

### 4.2 "Who's coming" is represented three different ways

- `Message.eventDetails.rsvps: Record<string, 'going' | 'not_going' | 'pending'>`
- `EventProposal.rsvps: Record<string, 'yes' | 'no'>`
- `CalendarEvent.attendees?: Attendee[]` with `status: 'confirmed' | 'declined' | 'pending'`

Three shapes, three different enum vocabularies, for one concept. The schema's `Events` doc has a fourth (`shared_with` / `confirmed_participants`). **This has to collapse to one before Projects 16, 17, 18 and D3 are written**, or each will pick a different one.

### 4.3 Friend status is a Boolean, not the four strings

```ts
export interface Friend {
  isCloseFriend?: Boolean;
  status?: Boolean;
}
```

Decision log R14 makes `"pending" | "request_sent" | "friend" | "close_friend"` canonical. The prototype has two independent booleans instead, and uses the boxed `Boolean` type rather than `boolean` — which is a giveaway that this is generated code rather than something anyone chose. Replace it.

### 4.4 `DiscoveryItem` bears almost no resemblance to the Activity schema

```ts
{ id, title, description, image, isAd, category, url?, location? }
```

vs. Project 8's `name`, `description`, `cost`, `tags[]`, `pictures[]`, `geohash`, `location`, `is_location_based`, `click_count`, `likes`, `created_at`, `source`.

Note `title` not `name`, `image` (single) not `pictures` (array), `category` (single string) not `tags` (array), and **no cost, no geohash, no counters**. Also `isAd` is baked into the type — AdMob is in the prototype's data model despite Project 14 being deferred.

### 4.5 Every timestamp is epoch milliseconds

`timestamp: number`, `endTime: number`, `lastMessageTimestamp: number` — all `Date.now()` style. The schema specifies Firestore `Timestamp` throughout. **Systematic conversion across the entire rewrite**, and the kind of thing that produces off-by-timezone bugs one screen at a time. Belongs as a standing rule in Project 0.

### 4.6 `Conversation` — 15.1's data model changes are confirmed accurate

```ts
{ id, title, participants, lastMessage, lastMessageTimestamp, isGroup, image?, admins? }
```

Exactly the fields 15.1 says to rename (`title` → `chat_name`, `lastMessage` → `recent_message`, `lastMessageTimestamp` → `recent_message_timestamp`) and drop (`admins`, `image`, `isGroup`). No changes needed to that ticket. **And 15.1's warning holds**: `title` is also a field on `CalendarEvent`, so a global find-and-replace catches both.

### 4.7 `Message.type` enum already exists in code

`'text' | 'system' | 'event-proposal' | 'vote'` — kebab-case. 15.2 needs to enumerate `message_type`; this is the existing vocabulary, and the schema's separate `activity_id` / `event_title` fields on messages suggest a fifth value (`'activity'`) that the prototype doesn't have.

### 4.8 The status feature has a generated shape worth a second look

```ts
export interface UserStatus {
  isAvailable: boolean;
  activity: string;
  privacy: 'all' | 'close-friends' | 'specific-groups';
  // TODO: reenable this
  //timestamp: number;
}
```

There's a `StatusComposer.tsx` and a `StatusService.ts`, both generated. So D5 has UI to look at, but nothing here is a decision: `status_visibility`'s three values are a model's guess at what visibility options should exist, and the commented-out `timestamp` — which maps to `status_expires_at` — was disabled by a `// TODO: reenable this`, not by a design call.

**`'specific-groups'` implies user-defined groups, which exist nowhere else in the roadmap or the schema.** That's the clearest sign this enum was invented rather than derived. D5 should decide the visibility options from scratch; `all` / `close-friends` is probably the whole MVP answer.

---

## 5. 🟡 The missing-`await` bug is bigger than two files

`utils/storage.ts` exports `localStorage = createAsyncStorage("user_data")` — an **async** API deliberately named to look like the browser's synchronous one. Then:

- `ChatService.ts` — **15 call sites**, all unawaited
- `StatusService.ts` — unawaited, plus line 84 calls `storage.setItem` where every other line uses `localStorage`, which looks like an undefined reference

Right now this is invisible: AsyncStorage resolves fast enough that the code appears to work. **The moment these become real Firestore calls it breaks intermittently** — the worst failure mode to debug, and the one most likely to be reported as "it works on my machine."

This isn't two bugs to fix in one ticket. It's a naming decision that makes every call site look correct. **Recommend renaming the export away from `localStorage`** as part of whichever ticket rewrites these services, so the mistake stops being invisible.

---

## 6. 🟡 The tab bar contradicts Project 4

`AppTab` in `types.ts`, rendered by `Navigation.tsx`:

```
PLANNER = 'planner'   → "Planner"
FEED    = 'discover'  → "Discover"
SOCIAL  = 'circle'    → "Circle"
PROFILE = 'profile'   → "Profile"
```

**Four tabs, and none of them is Search.** Project 4 §2 says to "create a new Search tab in the bottom navigation bar, it should be the third icon" — the third icon is currently Circle. Project 4 also says to move the Close Friends widget onto that new tab, and 15.1 notes there's no chat tab at all.

**✅ Settled 8/25/26 — five tabs:** Planner, Discover, Search, Circle, Profile. Circle is the social hub holding chats *and* status, not chat-only. Search may fold into Circle later, but not now. `AppTab` gains a fifth value and `Navigation.tsx` gets rebuilt as part of the React Navigation migration.

*Terminology, resolved by code:* the tab is called **Planner** (not "Calendar"), and **Discover** (not "activities tab"). Project 18's "Calendar" and Project 11 §4's "activities tab" should both be swept.

---

## 7. Design tokens already exist in the code

Extracted by frequency across all `.ts`/`.tsx` files. This is a real palette, not an invention — Appendix A can be written *from* it rather than from scratch.

| Role | Value | Uses | Note |
|---|---|---|---|
| Primary green | `#10b981` | 87 | **This is Tailwind `emerald-500`, not `emerald-600`** (`#059669`). Every ticket that says "emerald-600" disagrees with all 87 usages |
| Danger red | `#ef4444` | 9 | Tailwind `red-500` |
| Danger surface | `#fee2e2` | 4 | `red-100` |
| Primary surface | `#ecfdf5` | 4 | `emerald-50` |
| Primary deep | `#064e3b` | 4 | `emerald-900` |
| Accent blue | `#3b82f6` | 4 | `blue-500` |
| Text / gray | `#71717a` `#27272a` `#e4e4e7` `#a1a1aa` `#52525b` | 60 | Tailwind **zinc** scale |
| Dark surfaces | `#121212` `#1E1E1E` | 28 | Material-style |
| iOS system grays | `#8e8e93` `#1c1c1e` `#2c2c2e` `#f2f2f7` | 22 | **A second, competing gray system** |
| Light surfaces | `#FDFCFB` `#FFFFFF` `#f4f4f5` | 40 | |

**Two things to settle:**

1. **`emerald-600` vs `#10b981`.** The docs say one thing, 87 lines of code say another. Pick, then sweep.
2. **Two gray systems.** Tailwind zinc *and* iOS system grays are both in use, which is why "the same gray as before" keeps not quite matching. Pick one scale.

There's no theme file — every hex is inline. Appendix A should name the file these move into, since "use the same error state as before" only works once the color has a name.
