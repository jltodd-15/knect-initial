# 0. Stack, Environment & Conventions

**Status:** Draft — 2026-08-25
**Depends on:** Nothing. **Blocks:** Everything.

> **How to use this:** this isn't a ticket, it's the context block that goes above every ticket. Paste it (or let `CLAUDE.md` load it) at the start of every Claude Code session, then paste the one ticket you're actually working on. It exists so we stop getting a different set of invented conventions every session.
>
> A copy of this lives in the repo root as `CLAUDE.md`. If the two ever disagree, this doc wins and `CLAUDE.md` gets updated.

---

## 1 - Goals

- Say exactly what the stack is, so nothing gets guessed.
- Say what our naming and data conventions are, once, so every ticket doesn't have to repeat them.
- Say what "done" means.
- Record the known bugs and anti-patterns that already exist in the repo, so we stop rebuilding them.

---

## 2 - The Stack

All of this is confirmed against the repo (`jltodd-15/knect-initial`, branch `auth`, audited 8/25/26). Don't infer any of it from the code you happen to be looking at — this list is the answer.

| | |
|---|---|
| Framework | **Bare React Native 0.83.1.** Not Expo. Run with `npx react-native run-android` / `run-ios` |
| React | 19.2.0 |
| Language | **TypeScript** (5.8.3), extending `@react-native/typescript-config` |
| Node | ≥ 20 |
| Package manager | npm (there's a `package-lock.json`, no yarn lock) |
| Android | `minSdkVersion` 24, `compileSdkVersion`/`targetSdkVersion` 36, NDK 27.1.12297006 |
| iOS | **Minimum 15.1.** Podfile uses `min_ios_version_supported` from React Native |
| Testing | Jest, preset `react-native`. There is one test (`__tests__/App.test.tsx`). Run with `npm test` |
| Linting | ESLint (`@react-native/eslint-config`) + Prettier 2.8.8. Run with `npm run lint` |

**The iOS project is not configured.** The Xcode project is still named `AwesomeProject` from the React Native template, with target `Knect`. There is no `GoogleService-Info.plist` and no Firebase of any kind on iOS. Knect is an iOS app, so this is a hard blocker on iOS builds generally — not just for one feature.

---

## 3 - Firebase

**[DECISION: This is the open one. See the Firebase Integration Architecture briefing — it's Jonathan's call on feasibility, mine on velocity, and it's not settled yet.]**

Two paths, and they produce almost entirely different code:

- **`react-native-firebase`** (`@react-native-firebase/app`, `/auth`, `/firestore`, `/storage`, `/messaging`) — callable directly from TypeScript, no native code per feature. Offline persistence and listener reconnection come from the native SDK. Since we're bare RN (not Expo), the standard autolinking install applies.
- **Hand-written native bridges** — a Kotlin module per feature on Android, and the Swift equivalent built from zero on iOS. Offline persistence, listener reconnection, and retry all get hand-built.

**Until this is decided, no ticket should name a Firebase import path.** Write Firestore work as "read/write `Users/{uid}`" rather than as SDK calls, and let the implementation session resolve the syntax once this line says which one.

**What is true either way:**

- Neither `@react-native-firebase/*` nor the JS `firebase` web SDK is currently installed. Today the only Firebase integration in the entire repo is `android/app/src/main/java/com/knect/FirebaseModule.kt`.
- **Auth persistence must be explicit, not assumed.** The current ticket language ("usually the default in mobile frameworks") isn't good enough — the two paths handle it differently, and `react-native-keychain` is already installed and unused, which suggests somebody intended to do this deliberately at some point.
- **Offline persistence** is currently configured nowhere in the codebase. No `enablePersistence`, no `cacheSizeBytes`, nothing. **[DECISION: on or off, and at what cache size — but it depends on the SDK answer above.]**

### Geohash

Firestore has no native geo query. Use **`geofire-common`** (manual bounds, actively maintained) rather than `geofirestore` (wrapper, less maintained). Projects 8, 11, and 13.1 all depend on this. **[DECISION: Jonathan to confirm — the choice changes the query code substantially.]**

---

## 4 - Navigation

**We are adopting React Navigation.** Right now there is no navigation library at all — `components/Navigation.tsx` is a hand-rolled tab bar switching on an `AppTab` enum in `types.ts`.

The reason we're migrating rather than keeping it: Project 21 (deep linking) and Project 20 (tapping a notification and landing in the right chat) both need URL-to-screen routing, and an enum switch has no concept of a route or a stack. We'd end up hand-building linking on top of it. Projects 7 and 12 also both assume a pushed screen you can navigate back from, which doesn't exist today.

**This migration is its own ticket.** It is not something to fold into a feature ticket.

### The tab bar — five tabs

| Order | Tab | Icon | Contains |
|---|---|---|---|
| 1 | **Planner** | Calendar | Calendar view, create event (Project D3, 18) |
| 2 | **Discover** | Compass | Activity feed, search bar, filter (Projects 11, 13.1) |
| 3 | **Search** | Magnifying glass | User search, pending requests, Close Friends widget (Project 4) |
| 4 | **Circle** | — | Chats **and** Status. Not chat-only — it's the social hub (Projects 15.1, 15.2, D5) |
| 5 | **Profile** | — | Own profile, settings (Project D6) |

**Naming, settled — sweep these:**

- The first tab is **Planner**. Not "Calendar." Project 18 says Calendar; fix it.
- The second tab is **Discover**. Not "activities tab." Project 11 §4 says activities tab; fix it.
- **Circle** is the tab name. It holds chats and status, and may absorb Search later — but not now.

---

## 5 - Styling

There is no styling library. No NativeWind, no Tailwind, no styled-components — every color in the app is a raw hex literal inside a `StyleSheet`.

**Colors, type scale, and spacing live in Appendix A.** Reference tokens by name in tickets, never a hex. If you find yourself writing a hex value into a ticket, the token doesn't exist yet and needs adding to Appendix A first.

Two things that are already settled and worth stating here because they contradict older tickets:

- **Primary green is `#10b981`** — Tailwind `emerald-500`. Several tickets say "emerald-600." They're wrong; the app has used `#10b981` in 87 places from the beginning. Sweep the docs, not the code.
- **Grays come from the Tailwind zinc scale.** There are currently two competing gray systems in the code (zinc and iOS system grays). Zinc wins — it's the majority and it lives in the same system as our green and red. **The iOS system grays (`#8e8e93`, `#1c1c1e`, `#2c2c2e`, `#f2f2f7`) get phased out entirely** — 22 usages. Any ticket that touches a screen containing one should replace it with the zinc token on the way past, rather than waiting for a dedicated sweep.

---

## 6 - State & data layer

No state management library, and we're not adding one yet. Plain React state and props, with Context for genuinely app-wide values (the signed-in user, theme). If a ticket seems to need Redux or Zustand, that's a conversation, not a decision to make mid-ticket.

**Services live in `/services`** as plain TypeScript modules exporting functions — that's the existing convention (`ChatService.ts`, `StatusService.ts`, `geminiService.ts`). Firestore access goes through a service module, not inline in a component. This matters specifically for engagement counters (see §7).

---

## 7 - Data conventions

These apply to every ticket. They exist because the prototype and the schema doc currently disagree on all of them.

- **Collection names are case-sensitive**, and we have one unresolved conflict. `FirebaseModule.kt` writes to `"users"` lowercase; the schema doc, every ticket, and the published security rules all say `Users`. Firestore treats those as two different collections.

  **[DECISION: which casing wins.]** Continuity says follow Jonathan's code — that file is his hand-written work, not AI output, so lowercase may well be deliberate. But the cost isn't symmetric, and it's worth knowing before deciding:

  - **Uppercase `Users` wins:** change one string in one Kotlin file.
  - **Lowercase `users` wins:** rewrite the security rules (`match /Users/{userId}` → `/users/`), the master schema doc, and every ticket that names the collection.

  Also worth noting: the published rules only protect `Users`, and there's a catch-all deny at the bottom. So **writes to lowercase `users` are denied in production today** — they only appear to work because `debug = true` routes everything to an emulator with no rules loaded. Ask Jonathan whether the lowercase was intentional; if it wasn't, this is a one-character fix rather than a convention.

  Everything else is settled: `Activities`, `Chats`, `Events`.
- **Field names are `snake_case`.** `profile_picture_url`, `name_lowercase`, `click_count`, `tag_affinity_scores`. The prototype's TypeScript uses camelCase (`lastMessage`, `isGroup`); those get renamed as each ticket touches them.
- **All timestamps are Firestore `Timestamp`.** The prototype uses epoch milliseconds (`timestamp: number`) everywhere. Every rewrite converts. Don't leave a mixed codebase — a screen reading epoch millis from a field written as a Timestamp fails quietly.
- **`Private_info` has a fixed document ID:** `Users/{uid}/Private_info/main`. Never a query, never a generated ID.
- **Friend status is one of exactly four strings:** `"pending"`, `"request_sent"`, `"friend"`, `"close_friend"`. Not booleans. The prototype's `Friend.status?: Boolean` is wrong and gets replaced.
- **Engagement counters are client-side.** `FieldValue.increment()` for `click_count` and `likes`, called from **one shared service module** so every call site routes through a single file. Not a Cloud Function. If we ever need to move it server-side, that one file changes and nothing else does.

---

## 8 - Cloud Functions

We are using them, but narrowly. Right now, three things:

1. **Chat find-or-create** (Project 15.1) — computes `participant_hash`, returns the existing chat or creates one. Three entry points call it, so the recipe lives in one place and can't drift.
2. **Accepting a friend request** (Project 5) — the block check has to be server-side, because `blocked_users` lives in `Private_info` and the sender physically can't read it.
3. **Sending push notifications** (Project 20) — FCM can't be sent from a client. There's no client-only version of this.

**Not** counters (see §7). Setup, runtime, deploy process, and the callable auth pattern are Project D2.

**Worth noting:** #1 and #2 fire on the same user action. Accepting a friend request creates the friendship *and* the 1-on-1 chat. Spec them as one callable, not two the client has to sequence.

---

## 9 - Offline & error conventions

Half the tickets describe a lost-internet state individually and slightly differently. Here's the one pattern; tickets should reference it rather than redescribe it.

- **Connectivity detection:** one app-level hook. Not a per-screen check.
- **The error visual** is the shared component from Appendix B: a circle with `!` inside it, plus a message. Every screen uses it. The message text is per-screen; the component is not.
- **Standard copy:** "Sorry, we couldn't load anything right now." for a failed load. Screen-specific empty states (no search results, end of feed) use their own copy and are not the same thing as an error.
- **Optimistic writes revert on failure.** The heart on an activity card fills immediately and un-fills if the write fails (Project 11). Same rule applies to friend actions, which currently don't specify it.
- **Firestore offline persistence:** **[DECISION: pending the §3 SDK answer.]**

---

## 10 - Security rules

- **Rules live in the repo**, as `firestore.rules` and `storage.rules`, deployed via the Firebase CLI. Not edited by hand in the Console. They're the most security-critical files in the project and they're currently not version-controlled at all — there is no `firestore.rules` anywhere in the repo today.
- **`firestore.indexes.json` is version-controlled too.** Projects 11 and 13.1 will need composite indexes; Firestore fails those at runtime with a create-index link, which is survivable in dev and a launch blocker in production.
- **Every ticket states its rules changes explicitly**, even when the answer is "no changes needed." Never leave it implicit.
- **Rules are tested in the Rules Playground for the deny cases**, not just the allow cases. A rule that permits what it should permit but also permits everything else passes an allow-only test.

---

## 11 - What "done" means

Jest is set up and there's exactly one test, so we have infrastructure and no coverage.

**The bar for MVP:**

- Every acceptance criterion in the ticket is manually verified. Not "the code compiles" — actually run it and check.
- **Pure logic gets a unit test.** Anything that's a function taking input and returning output, with no Firestore or UI in it — `votingLogic.ts`, the heuristic scoring formula (13.1), tag score decay (13.2), the distance calculation (12), `participant_hash`. These are cheap to test and they're where silent wrongness hides.
- **UI and Firestore integration are manually verified** at MVP. We're not building a test harness for those yet.
- Security rules changes are tested in the Rules Playground, allow *and* deny.

**This is the bar for now, and it's deliberately low.** The argument for it: a solo developer at one day a week gets more value from tested pure logic than from a component test suite. The argument against: AI-written code with no test target gets reported complete when it compiles.

**Revisit this once we have a read on Claude Code.** If it starts moving quickly and Jonathan trusts what it produces, raise the bar — more coverage is worth more when the code is arriving faster than anyone can read it line by line.

---

## 12 - Known bugs and standing rules

These already exist in the repo. Every ticket that touches this code inherits them, so they're listed once here rather than repeated in nine tickets.

### Async is not optional

`utils/storage.ts` exports `localStorage = createAsyncStorage("user_data")` — an **async** API deliberately named to look like the browser's synchronous one. `ChatService.ts` calls it at 15 sites without `await`; `StatusService.ts` does the same, and line 84 calls `storage.setItem` where every other line uses `localStorage`, which looks like an undefined reference.

Right now this appears to work, because AsyncStorage resolves fast enough to look synchronous. **The moment these become real Firestore calls it breaks intermittently** — which is the worst kind of bug to find.

**Standing rule:** treat every storage and Firestore call as async by default. And when the ticket that rewrites these services lands, **rename the export away from `localStorage`** — the name is what makes the mistake invisible.

### `FirebaseModule.kt` is not a working baseline

Whatever we decide in §3, do not treat the existing Kotlin module as correct code to build on. Confirmed problems in the committed version (Jonathan's local tree may be ahead — check with him first):

- `debug` is a hardcoded `true`, pointing auth and Firestore at an emulator at `10.0.2.2`. **Shipped as-is the app fails for every real user.** Also the Auth emulator port is wrong (9099, not 8080), and the emulator config is discarded a line later when `firebaseDB` is reassigned.
- `writeUserData` only writes if the document **already has** a `userId` field. For a new user it doesn't, so it returns `false` and writes nothing. Combined with the lowercase `"users"` collection, **no profile document has ever been successfully written by this code.**
- `SetOptions.mergeFields()` is called with no arguments — merges zero fields.
- `createNewUser` resolves its promise twice on the failure path.
- `authenticateUser` resolves errors instead of rejecting them, so every failure arrives on the JS side as a success.
- `getActiveUser` has an empty body and never settles its promise — any `await` on it hangs forever.
- `runBlocking` in `writeUserData` and `getUserData` forces async Firestore calls to be synchronous across the bridge, which can block the calling thread.

### Credentials — two exposures, one of them live

The repo cloned anonymously on 8/25/26, so it is public.

1. **`.env.local` is tracked and contains a live `GEMINI_API_KEY`.** Added 3/5/26 in the "adding latest changes from AI studios" commit. **Revoke the key.** Deleting the file doesn't fix it — the value stays reachable in git history at that commit.
2. **`android/app/google-services.json` is committed.** The `.gitignore` has `*firebase*` on line 78, which never matched that filename. Fix the pattern.

Neither of these depends on any other decision in this doc.

### Where the code came from — read this before trusting any of it

The repo has three distinct layers of authorship, and treating them the same is how a generated guess gets mistaken for a decision.

| Layer | What | Trust level |
|---|---|---|
| **Scaffolding** (Jan–Feb 2026, `jltodd-15`) | `react-native init` output, dependency setup | Fine, it's boilerplate |
| **Google AI Studio** (commit `71a7c07`, 3/5/26) | `types.ts`, `constants.ts`, every file in `components/`, `ChatService.ts`, `StatusService.ts`, `geminiService.ts`, `votingLogic.ts`, `storage.ts`, `calendarLayout.ts`, `useEventCreation.ts` | **Generated. Not decisions.** Where these shapes disagree with the schema doc, the schema wins by default — the code is a guess, not a choice somebody made |
| **Hand-written** (Apr–May 2026) | `FirebaseModule.kt`, `DBService.kt`, `FirebasePackage.kt`, plus rewrites of `CreateProfilePage.tsx` and `storage.ts` | Real work, mostly auth. Most current, and the layer where continuity actually matters |

**And there's a fourth layer that isn't in the repo at all:** Jonathan has uncommitted local work, concentrated in auth. Anything in the table above may already be superseded. Confirm before treating a bug as current.

### The debug flag pattern generally

Hardcoded environment constants are how the emulator bug happened. Environment config comes from a build variant or an env file, never a `val debug: Boolean = true` sitting in a class body.

---

## 13 - Dependencies

**Already installed — don't re-add:**

- `@d11/react-native-fast-image` ^8.13.0 — this is the maintained fork. Project 6 currently says to `npm install react-native-fast-image`; that's the *unmaintained original* and those instructions should be deleted.
- `@react-native-async-storage/async-storage`, `react-native-keychain`, `react-native-safe-area-context`, `react-native-svg`.

**To add:**

- React Navigation (§4) — its own migration ticket.
- `geofire-common` (§3) — Projects 8, 11, 13.1.
- `geolib` — distance calculation, Project 12.
- `fuse.js` — fuzzy search, Project 13.1. **Note: 13.1 currently calls this a "Levenshtein score." It isn't — the 0.0–1.0 range described is Fuse.js's own score. Spec it as `Fuse.js, threshold: 0.5, keys: name, tags` and drop the word Levenshtein**, or an implementer will write raw Levenshtein and the 0.5 threshold will mean something completely different.
- Firebase packages — **pending §3.**

**To remove:** `@google/genai` and `services/geminiService.ts`. **Confirmed dead** — Google AI Studio built it to populate the Discover tab with placeholder content. Delete both, and delete `.env.local` (see §12).

---

## 14 - Prompting conventions

One ticket per session, and feed it in this order — data model and security rules first, isolated pure logic second, UI last. The five-section ticket format is already close to this; the order matters because getting the schema wrong after the UI is built means rewriting both.

Out-of-scope lists do more work than anything else in a ticket. The most common failure isn't building the wrong thing — it's building four adjacent things nobody asked for, touching files three other tickets depend on.
