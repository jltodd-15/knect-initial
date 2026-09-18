# Roadmap

**This is subject to change — formatting and content both.** It's the overall picture of
what's planned, not a contract. Ticket numbering, splits, sequencing and scope have all
moved before and will move again; a line here can be renumbered, merged, split or dropped.
Treat it as an index, not a spec — the real acceptance criteria live in each ticket's own
doc. Keep it in sync as work lands: check off a ticket when it's done, add a one-line
placeholder for a new one as soon as it's known. Per [`CLAUDE.md`](CLAUDE.md)'s doc-hygiene
note, only describe a ticket's *scope* once it's actually been decided — a placeholder title
is fine well ahead of time, invented implementation detail isn't.

**Legend**
- `[x]` / `[ ]` — code shipped and verified / not shipped
- 📄 — a written spec doc exists. **Read it; do not infer scope from the title here.**
- 🚧 — hard-blocked. The blocker is named inline.
- ⏸️ — **deferred.** Not before launch. No scope decided, and none should be invented.
- ❓ — real work with no ticket and no owner yet.

---

## Project 0 — Stack & conventions
- [x] 0 — Stack & conventions 📄 *(also becomes `CLAUDE.md`; redraft planned last, once every convention is settled)*
- [x] 0.1 — Repair the boot path 📄
- [x] 0.2 — iOS Firebase & Xcode project setup 📄 *(needs a Mac with Xcode; does **not** need a paid Apple Developer account)*

## Project 1 — Firebase migration & auth
- [x] 1.1 — Replace the native bridge with `react-native-firebase` (Android only; no auth behavior yet) 📄
- [ ] 1.2 — Real auth, wired to `react-native-firebase`'s auth SDK 📄
- [ ] 1.3 — Google & Apple sign-in (includes regenerating `google-services.json`) 📄 ⭐ *gates App Review; needs a paid Apple Developer membership*
- [ ] 1.4 — Onboarding sequence / `CreateProfilePage` screen work 📄

## Project 2 — Firestore & the user document
- [ ] 2.1 — Firestore config module, including turning on offline persistence 📄
- [ ] 2.2 — The `Users` document: schema, types & the creation write 📄 ⭐ *defines the shape 4, 5, 6, 7 and 13.2 all read*
- [ ] 2.3 — Signup states & missing-profile detection 📄

## Project 3 — Security rules *(four tickets, not one)*
- [ ] 3.1 — Firebase CLI, emulator & the rules test harness 📄 *needs a Java JDK 11+ on the Mac*
- [ ] 3.2 — Rules: user tree & activities 📄
- [ ] 3.3 — Rules: chats, messages, votes & events 📄
- [ ] 3.4 — Rules realignment & deny-case audit 📄

## Project 4 — User search
- [ ] 4 — User search tab 📄

## Project 5 — Friend requests
- [ ] 5 — Friend request logic 📄 *depends on D2 and 15.1 — see Running Order F1*

## Project 6 — Profile pictures
- [ ] 6 — Profile picture upload 📄

## Project 7 — Public profile
- [ ] 7 — Public profile routing 📄

## Project 8 — Activity schema
- [ ] 8 — Define the activity schema 📄 *pins the final `category` value set*

## Project 9 — Seed data
- [ ] 9 — Seed data via CMS 📄 *non-coding; must adopt 1.4's interest vocabulary*

## Project 10 — API integrations
- ⏸️ 10 — API integrations. **Deferred post-beta.** No scope.

## Project 11 — Discover feed
- [ ] 11 — Discover tab data-layer fetch 📄 🚧 *nothing to query until D4 writes location/geohash*

## Project 12 — Activity detail page
- [ ] 12 — Activity detail page 📄

## Project 13 — Discover search, algorithm & UGC
- [ ] 13.1 — Search & scoring algorithm 📄 🚧 *same D4 block*
- [ ] 13.2 — Tag affinity 📄
- [ ] 13.3 — User-generated content 📄 *also owns content reporting, which gates App Review — cannot stay deferred through launch*

## Project 14 — Ad placements
- ⏸️ 14 — Ad placements. **Deferred post-launch.** No scope.

## Project 15 — Group chat & messaging
- [ ] 15.1 — Group chat infrastructure: chat creation & data model 📄
- [ ] 15.2 — Real-time messaging & listeners 📄 *depends on D2*

## Project 16 — Activity proposals
- [ ] 16.1 — Propose an activity, the `Events` write, RSVPs 📄 🚧 **hard-blocked on Project 3** — no `/Events/` rule exists, so every Events read and write is denied today
- [ ] 16.2 — Proposal resolution, the 24h sweep, expiry, cancel 📄 🚧 *same block; depends on D2*

## Project 17 — Voting system
- [ ] 17.1 — Vote creation & casting 📄 🚧 *same Project 3 block*
- [ ] 17.2 — Server-side tally & resolution 📄 🚧 *same block; depends on D2.* **Highest-risk ticket in the roadmap and it fails silently** — a wrong tally returns a plausible winner nobody questions. Unit tests against seeded fixtures before it is wired to anything; manual verification is not a sufficient bar here.

## Project 18 — Internal calendar
- ⏸️ 18 — Internal calendar 📄 **Deferred.** *single events only for MVP; recurrence deferred*

## Project 19 — External calendar sync
- ⏸️ 19 — External calendar sync. **Excluded from MVP.** No scope.

## Project 20 — Push notifications
- ⏸️ 20 — Push notifications 📄 **Deferred.** *hangs off 15.2, 16.2 and 17.2's writes*

## Project 21 — Deep linking & SMS sharing
- ⏸️ 21 — Deep linking & SMS sharing 📄 **Deferred.** *needs a link-service decision first — Firebase Dynamic Links is discontinued*

---

## Cross-cutting (D-tickets)
Not owned by any numbered project above.

- [ ] D2 — Cloud Functions setup, including scheduled functions 📄 *hard dependency of 5, 15.1, 15.2, 16.2, 17.2*
- [ ] D3 — Planner tab & Create Event screen 📄 *screen only — 16.1 owns the `Events` write and D3 inherits it, not the other way around*
- [ ] D4 — Location capture & the `geohash` write ❓ *called for but never given a ticket. Blocks 8, 11, 12, 13.1 from having anything to query against.*
- [ ] D5 — User status 📄 *deliberately light; owns the `status_visibility` value set*
- [ ] D9 — Firebase Storage rules ❓ *separate file, separate syntax, named in no ticket. Launch blocker if skipped.*
- [ ] D11 — Analytics event taxonomy 📄 *placeholder; belongs after the screens exist*

### Pending Jonathan
- [ ] D6 — Own-profile tab
- [ ] D8 — Settings, logout & account deletion

### Real work, no ticket, no owner ❓
- [ ] `firestore.indexes.json` — six tickets need composite indexes. Firestore fails a missing composite at runtime: survivable in dev, a launch blocker in production.
- [ ] Group-chat self-join — 15.1 owns add/remove-member; nothing covers a person joining a chat themselves.
- [ ] The interests ↔ `Activities.tags` vocabulary contract — 1.4 writes 35 interest strings, 13.2 matches them against tags Project 9 writes, and 2.2 normalizes nothing. A mismatch silently zeroes every user's tag affinity.
- [ ] `@d11/react-native-fast-image` — in `dependencies`, named in no ticket. Probably Project 6 or 11. Someone has to decide whether it stays.
- [ ] Firebase Console config — Email/Password provider **on** and email-enumeration protection **off**. Both one-time Console actions, neither is build scope, and the first blocks 1.2 from being verified at all.
- [ ] Published contact information — App Review Guideline 1.2 requires it and it has no home.

---

Add future projects/tickets here as they're planned, even as a bare one-line title — that's
useful context for whoever (human or Claude) picks up the next piece of work, without needing
to know anything about how it'll actually be built yet. A bare title is the correct resting
state for anything not yet decided; it is not a gap to fill in.
