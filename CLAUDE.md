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

**Where the code disagrees with the Master Schema, the schema wins.** Do not preserve a field name,
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
- `name_lowercase` is a **stored** field, computed with `.toLowerCase()` at write time. It is never
  derived at query time. Do not optimize it away.
- No denormalized names or profile pictures anywhere. A screen showing a person reads the person.

## Treat every storage call as async

`utils/storage.ts` exports an async API named `localStorage`. It is not the browser's
`localStorage` and it does not return values synchronously. Every call into it, and every Firestore
call, is awaited.

## Styling

- Primary green is `#10b981` (emerald-500). Never `emerald-600` or `#059669`.
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

## Known bugs that are somebody else's ticket

- Three of four tabs crash on load — `index.js` registers `App` instead of the `ErrorBoundary`-wrapped
  `Root`. (Ticket 0.1)
- `components/ChatEventWidget.tsx` and `utils/votingLogic.ts` are dead — nothing imports either.
  Don't build on them. The live vote UI is inside `SocialDashboard.tsx`.
- `android/app/build.gradle` already declares the Firestore and Analytics artifacts under the BOM. A
  Gradle edit to add one is a stop-and-ask.

## Verification

Prefer a check you can run over a claim that the work looks done. Most conventions above are one
grep away from being an acceptance criterion — use them that way.

`npm run lint` and `npm test` pass before anything is considered finished. Rules tests are separate:
`npm run test:rules`, and they need the Firestore emulator running.
