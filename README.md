# Knect

A React Native app. Pre-launch — no real users yet, no App Store or Play Store listing.

Firebase reaches the app through [`@react-native-firebase`](https://rnfirebase.io/) — `app`,
`auth`, `analytics` and `firestore` are wired in on Android. There is no hand-written native bridge and no
`NativeModules.FirebaseModule`; the previous Kotlin bridge was deleted in favor of the SDK.
Sign-in is not implemented yet — tapping SIGN IN / CREATE ACCOUNT is inert on purpose. Firestore is
configured once, in `services/firestore.ts`, with offline persistence on. The only write is the
sign-up batch that creates a user's `Users` documents (`services/UsersRepository.ts`); the only read
is a one-time `get()` of `Users/{uid}` after sign-in (`hooks/useProfileCheck.ts`), used to detect an
Auth account with no profile document behind it.

Development here is ticket-driven: **[`CLAUDE.md`](CLAUDE.md)** is the source of truth for data
conventions (Firestore field naming, timestamp handling, collection shapes), styling conventions,
and how work is scoped and reviewed in this repo. **[`ROADMAP.md`](ROADMAP.md)** tracks what's
shipped and what's planned, project by project. Read both before making changes — this README is
just the "how do I run it" layer on top. **[`DEVICE_TESTS.md`](DEVICE_TESTS.md)** lists the checks
that need a real device or emulator, ticket by ticket.

## Running it

```sh
npm install
npm start          # Metro dev server
npm run android     # build & run on Android (emulator or device)
npm run ios         # build & run on iOS (see CocoaPods note below)
```

For iOS, install CocoaPods dependencies first (only needed on first clone or after native deps
change):

```sh
bundle install
bundle exec pod install
```

## Testing

```sh
npm test            # Jest unit tests (__tests__/), react-native preset
npm run lint         # ESLint
npm run test:rules   # Firestore security rules tests — needs the Firestore emulator running
```

New behavior should have a failing test written before the implementation — see
`.claude/skills/tdd-workflow/SKILL.md` for the loop this repo follows.

## Structure

- `App.tsx` — root component; tab switching and the (currently inert) auth screen.
- `components/` — screens and widgets. Mostly generated from an AI-studio commit (`71a7c07`) —
  see `CLAUDE.md` for which pieces are hand-written and trustworthy versus generated shape that
  yields to the schema.
- `services/firestore.ts` — the one place Firestore is configured (offline persistence on). Other
  files import `db` from here; imported first in `index.js` so it runs before any Firestore call.
- `services/UsersRepository.ts` — creates `Users/{uid}` and `Users/{uid}/Private_info/main` in one
  batch at sign-up. Doesn't accept a password.
- `MASTER_SCHEMA.md` — repo copy of the Firestore Master Schema; where code and schema disagree, the
  schema wins (see `CLAUDE.md`). It can lag the source doc, so flag a mismatch rather than guessing.
- `utils/storage.ts` — hand-written async storage wrapper; not the browser's `localStorage`.
- `android/`, `ios/` — native projects. Firebase config lives at `android/app/google-services.json`
  (Android) and `ios/GoogleService-Info.plist` (iOS).
