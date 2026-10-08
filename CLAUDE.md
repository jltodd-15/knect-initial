# Knect

React Native app. Firebase Auth + Firestore via `react-native-firebase`. Pre-launch, no users.

## Repo identity

`origin` must be `https://github.com/jltodd-15/knect-initial.git`. Check with `git remote -v`
before doing anything else. If `origin` points anywhere else (a fork, e.g.
`kysonallstar-stack/knect-initial`), stop and ask — do not fetch, branch, or commit against it.
This repo has been mixed up with a fork before, causing a session to work from stale code and miss
this file entirely.

## Read this first: most of this repo is a generated guess

One commit — `71a7c07`, "adding latest changes from AI studios" — produced almost everything in
`components/`, `types.ts` and `services/`. Those shapes were generated, not decided.

**Where the code disagrees with the Master Schema (copy in `MASTER_SCHEMA.md`), the schema wins.** Do not preserve a field name,
a type, or a data shape because you found it in the codebase. Do not "reconcile" the two — replace
the code.

Hand-written and worth respecting: `CreateProfilePage.tsx`, `utils/storage.ts`.

## Data conventions

- Firestore field names are `snake_case`. Collections are `Users`, `Activities`, `Chats`, `Events`.
- All timestamps are Firestore `Timestamp`. The prototype's epoch milliseconds convert at the
  boundary — never store a number.
- `Users/{uid}/Private_info/main` — the document ID is the literal string `main`, never a
  generated ID.
- `Friends.status` is exactly one of: `request_sent`, `pending`, `friend`, `close_friend`.
- A user's own `Friends` document proves nothing: the rules let anyone set their own copy to
  `friend` without the other person agreeing. Anything that grants access because two people are
  friends (a rule, a Function, a screen) checks the **other** person's document,
  `Users/{other}/Friends/{me}`, never the requester's own.
- Anything a client can write, a client can lie about. Vote results (`status: "closed"`,
  `winning_option_id`, `closed_at`, `close_reason`, `final_counts`), event `status` other than the
  owner's cancel, `confirmed_participants`, and the chat `recent_message*` preview fields have no
  client clause in `firestore.rules`. Only the Admin SDK writes them. Don't add a client clause.
- Blocking is receive-side only (15.2's filter). No rule stops a blocked user's message being
  sent. Never describe blocking as enforced.
- `name_lowercase` is a **stored** field, computed with `.toLowerCase()` at write time. It is never
  derived at query time. Do not optimize it away.
- No denormalized names or profile pictures anywhere. A screen showing a person reads the person.
- A person with no uploaded picture, or who resolves to nothing ("Deleted user"), renders
  `components/InitialsAvatar.tsx`. Don't build a second placeholder.
- `interests` values come only from the fixed `INTERESTS` list in `components/CreateProfilePage.tsx`,
  stored verbatim. Never uppercase or reformat them.
- Security rules live in `firestore.rules` and are published only by `npm run rules:deploy`. Never
  edit them in the Firebase Console: the next deploy silently overwrites a Console edit.
- The Firestore instance is `db` from `services/firestore.ts`, configured once with offline
  persistence on. Import it from there; never call `initializeFirestore`, or set persistence or a
  cache size, anywhere else.

## Treat every storage call as async

`utils/storage.ts` exports an async API named `localStorage`. It is not the browser's
`localStorage` and it does not return values synchronously. Every call into it, and every Firestore
call, is awaited.

## Styling

- Colors, type sizes, spacing and radius are defined once, in `theme/tokens.ts`, and read through
  `useTheme()`. The three shared states (skeleton, empty, error) are in `components/shared/`. The big
  screens (onboarding, Profile, Discover, Planner, Circle) have not been moved onto either yet and
  still take an `isDarkMode` prop from `App.tsx` (ticket 4.2 is in progress).
- Primary green is `#10b981` (emerald-500). `emerald-600` / `#059669` exists only as the
  `primaryPressed` token, for a pressed state — never as a button's resting color.
- Grays are Tailwind zinc. The iOS system grays (`#8e8e93`, `#1c1c1e`, `#2c2c2e`, `#f2f2f7`) are
  being phased out — don't add new ones.

## How to work here

**Stay inside the ticket's files allowlist.** Every ticket names the files it may touch. A fix that
seems to require a file outside that list is a signal to stop, not to widen the list.

**Stop and ask instead of improvising** when: the change needs a file not on the allowlist; a new
dependency seems necessary; a fix requires a decision the ticket didn't make; or something in the
ticket contradicts what's actually in the code. Say what you found and wait. A wrong guess written
confidently into a spec-driven codebase is more expensive than a question.

**Don't fix adjacent things.** This repo has many known bugs and each one belongs to a ticket. An
unrelated bug found in passing gets reported, not fixed.

**Keep `README.md` and this file in sync with what has actually landed.** When a ticket's changes
make a line here stale (a "known bug" gets fixed, a convention changes), update it as part of that
ticket. Never get ahead of it — don't describe a decision, a data shape, or a capability for a
ticket that hasn't been built yet, even if you know it's coming.

## Known bugs that are somebody else's ticket

- Every tab except signup still runs on sample data and on-device storage, not Firestore. The
  Profile tab shows "Alex Rivera", not the profile written at signup (D6). Friends, chats, and
  activities are sample data (Projects 5, 9, 11 and 15).
- iOS has no Firebase config on this branch stack: `ios/Knect/GoogleService-Info.plist` is only in
  ticket 0.2's PR (#3), not merged yet. Until it is, test on Android. (Ticket 0.2)
- `firestore.rules` sits next to Rowy's default rules, which still give `ADMIN`/`OWNER` role
  accounts everything.
- `components/ChatEventWidget.tsx` and `utils/votingLogic.ts` are dead — nothing imports either.
  Don't build on them. The live vote UI is inside `SocialDashboard.tsx`.

## Verification

Prefer a check you can run over a claim that the work looks done. Most conventions above are one
grep away from being an acceptance criterion — use them that way.

`npm test` passes, and `npm run lint` reports no errors in the files the ticket touched, before
anything is considered finished. (The repo has older lint errors in files no ticket has touched
yet; those don't block a ticket.) Rules tests are separate: `npm run test:rules` needs Java 21
and starts and stops the Firestore emulator itself. They live in `firestore-tests/`, are the only
place the web `firebase` SDK may be imported, and never run under `npm test`.

Anything that can only be checked on a device or emulator goes in `DEVICE_TESTS.md`, under the
ticket's own heading, as part of that ticket.

### Testing protocol

- **Test-first.** For any ticket with testable JS/TS behavior, write the test before the
  implementation, per the `tdd-workflow` skill. It should fail for a specific, legible reason
  before you make it pass.
- **Never quietly narrow a failing assertion.** When a failing test needs its assertion changed,
  say so out loud in chat at the moment it happens, and classify it as one of two things:
  - *"This assertion was wrong, here's the fix"* — a genuine bug fix in the test.
  - *"I'm narrowing what this test covers, here's why"* — a scope reduction.

  These can produce an identical-looking diff, which is exactly why the distinction has to be
  said out loud rather than left for someone to infer from the diff.
- **A scope reduction is never silent.** It comes with a concrete note on what's now unverified
  and how it will actually get covered — e.g. flagged for on-device verification, deferred to
  another ticket. "I removed this assertion" without that note is not an acceptable stopping
  point.
