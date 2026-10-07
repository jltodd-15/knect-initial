# Knect

A React Native app. Pre-launch — no real users yet, no App Store or Play Store listing.

Firebase reaches the app through [`@react-native-firebase`](https://rnfirebase.io/) — `app`,
`auth`, `analytics` and `firestore`. There is no hand-written native bridge and no
`NativeModules.FirebaseModule`; the previous Kotlin bridge was deleted in favor of the SDK.
Firestore is configured once, in `services/firestore.ts`, with offline persistence on. The only write
is the sign-up batch that creates a user's `Users` documents (`services/UsersRepository.ts`); the only
read is a one-time `get()` of `Users/{uid}` after sign-in (`hooks/useProfileCheck.ts`), used to detect
an Auth account with no profile document behind it.

## Current state

- **Real, backed by Firebase:** email/password sign-in, sign-out, forgot password, and signup (a
  two-step onboarding sequence that creates the account and writes the `Users` documents). A
  signed-in user with no profile is sent back to finish signup.
- **Hidden:** Google and Apple sign-in, until ticket 1.3 (needs a paid Apple Developer account).
- **Reachable but not real yet:** the Planner, Discover, Circle and Profile tabs. They open without
  crashing, but show sample data. Anything changed there is saved only on that phone, never to
  Firebase. The Profile tab shows "Alex Rivera", not the profile created at signup. The Search tab
  is a placeholder: a title and nothing else.
- **Not verified on a device:** tickets 2.3, 1.4 and 4.1 (the move to React Navigation). Their checks are in `DEVICE_TESTS.md`. Test on Android for now: iOS is missing its Firebase config on this branch (see below).
- **Known bugs** that belong to other tickets are listed in [`CLAUDE.md`](CLAUDE.md), under
  "Known bugs that are somebody else's ticket".

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
npm run test:rules   # Firestore security rules tests (firestore-tests/) — needs Java 21; starts and stops the emulator itself
```

## Security rules

`firestore.rules` in this repo is the source of truth for the live Firestore rules on `knect-db`.
`npm run rules:deploy` is the only way they get published. There is no sync back from the Console:
an edit made in the Console is silently overwritten by the next deploy, so change the file instead.
The first deploy needs `npx firebase login` once, as an account with access to `knect-db`.

New behavior should have a failing test written before the implementation — see
`.claude/skills/tdd-workflow/SKILL.md` for the loop this repo follows.

## Structure

- `App.tsx` — root component: the sign-in screen (Firebase Auth), the signup/onboarding screen, the
  missing-profile check, and the signed-in navigator (React Navigation: a root stack holding the five
  tabs). The sign-in and signup screens sit outside the navigator.
- `components/Navigation.tsx` — the tab bar the navigator draws.
- `components/CreateProfilePage.tsx` — the onboarding sequence: an email/password step, then a
  profile step (name, optional bio, interests from a fixed list of 35, initials avatar).
- `components/InitialsAvatar.tsx` — the picture every user has until they upload one, drawn from
  their name. Also the placeholder for a person who no longer exists.
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
  (Android) and `ios/Knect/GoogleService-Info.plist` (iOS). The iOS file arrives with ticket 0.2's
  PR (#3), which isn't merged into this branch yet — see the known bugs in `CLAUDE.md`.
