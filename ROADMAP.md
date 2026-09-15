# Roadmap

What's shipped and what's planned, project by project. This is a planning index, not a spec —
the real acceptance criteria live in each ticket's own doc. Keep it in sync as work lands: check
off a ticket when it's done, add a one-line placeholder for a new one as soon as it's known. Per
[`CLAUDE.md`](CLAUDE.md)'s doc-hygiene note, only describe a ticket's *scope* once it's actually
been decided — a placeholder title is fine well ahead of time, invented implementation detail
isn't.

## Project 0 — Stack & conventions
- [x] 0 — Stack & conventions
- [x] 0.1 — Repair the boot path
- [x] 0.2 — iOS Firebase & Xcode project setup

## Project 1 — Firebase migration
- [x] 1.1 — Replace the native bridge with `react-native-firebase` (Android only; no auth behavior yet)
- [ ] 1.2 — Real auth, wired to `react-native-firebase`'s auth SDK
- [ ] 1.3 — Google & Apple sign-in (includes regenerating `google-services.json`)
- [ ] 1.4 — `CreateProfilePage` screen work

## Project 2 — Firestore
- [ ] Firestore config module, including turning on offline persistence

## Project 3 — Security rules
- [ ] Firestore security rules

---

Add future projects/tickets here as they're planned, even as a bare one-line title — that's
useful context for whoever (human or Claude) picks up the next piece of work, without needing to
know anything about how it'll actually be built yet.
