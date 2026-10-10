# Roadmap

**This is subject to change — formatting and content both.** It's the overall picture of
what's planned, not a contract. Ticket numbering, splits, sequencing and scope have all
moved before and will move again; a line here can be renumbered, merged, split or dropped.
Treat it as an index, not a spec — the real acceptance criteria live in each ticket's own
doc. Keep it in sync as work lands: check off a ticket when it's done, add a one-line
placeholder for a new one as soon as it's known. Per [`CLAUDE.md`](CLAUDE.md)'s doc-hygiene
note, only describe a ticket's *scope* once it's actually been decided — a placeholder title
is fine well ahead of time, invented implementation detail isn't.

**Ticket specs and open decisions:** every ticket's text is in [`docs/tickets/`](docs/tickets/), and
the status table, standing rules and open decisions are in [`docs/ROADMAP.md`](docs/ROADMAP.md). This
file keeps the build notes for what has landed; the two get merged in a later session.

**Seen on a phone:** issues found and changes wanted from device runs are collected in
[`DEVICE_FINDINGS.md`](DEVICE_FINDINGS.md), waiting to become tickets. Device testing is paused
until the app is connected (decided 2026-10-09); the reasons are there too.

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
  - *Decided (1.4):* once the account exists, the back arrow to the email/password step is grayed out and locked, with no message. Next and back are arrows, not words.
  - *Open:* nothing catches a mistyped email (`Kysn@` for `Kyson@`); a format check can't. A confirm step (type it twice, or show it back before the account is created) would catch most typos without sending an email.
  - *Built (1.4), not yet device-tested:* a signed-in user with no profile resumes at the profile step, with no email/password step. That screen still has no sign-out. ❓ no ticket owns adding one.
  - *Built (1.4):* `components/InitialsAvatar.tsx`, the picture every user has until they upload one. Other tickets that show a person reuse it (noted on each below).
  - *Google & Apple buttons are hidden* on the login screen until 1.3 lands.

## Project 2 — Firestore & the user document
- [ ] 2.1 — Firestore config module, including turning on offline persistence 📄
- [ ] 2.2 — The `Users` document: schema, types & the creation write 📄 ⭐ *defines the shape 4, 5, 6, 7 and 13.2 all read*
- [ ] 2.3 — Signup states & missing-profile detection 📄

## Project 3 — Security rules *(four tickets, not one)*
- [ ] 3.1 — Firebase CLI, emulator & the rules test harness 📄 *needs a Java JDK 11+ on the Mac*
- [ ] 3.2 — Rules: user tree & activities 📄
- [ ] 3.3 — Rules: chats, messages, votes & events 📄
- [ ] 3.4 — Rules realignment & deny-case audit 📄

## Project 4 — User search *(split into four tickets; was one "4 — User search tab")*
- [ ] 4.1 — React Navigation migration 📄
  - *Built (4.1), not yet device-tested:* the signed-in app is a root stack holding five tabs (Planner, Discover, Search, Circle, Profile). Search is a placeholder. Checks are in `DEVICE_TESTS.md`.
  - *Tests run against a stand-in* for React Navigation (`jest.setup.js`), not the library itself: it ships in a format this Jest config doesn't load, and `jest.config.js` wasn't 4.1's to change. ❓ no ticket owns loading the real library in tests.
- [ ] 4.2 — Styling, theming & dark mode
  - *Built (4.2), not yet device-tested:* the theme (`theme/`), the three shared states (`components/shared/`), and every screen moved onto them. The app follows the phone's dark mode, the two launch waits show the "Kn" logo, and Discover loads with skeleton cards. Checks, with screenshots asked for in both modes, are in `DEVICE_TESTS.md`.
  - *Left as found:* four "missing dependency" lint errors on effects in `DraggableEvent.tsx`, `CreateEventModal.tsx` and `SocialDashboard.tsx`. Fixing them changes logic, which 4.2 may not. ❓ no ticket owns them.
  - *Also left:* the crash screen (`ErrorBoundary`) is always light, because `index.js` mounts it above `ThemeProvider` and `index.js` wasn't 4.2's to change.
- [ ] 4.3 — Search tab contents
  - *Built (4.3), not yet device-tested:* the Search tab looks people up by the start of their name, in any capitalization, from 3 characters on, and lists up to 10 by initials and name. Checks are in `DEVICE_TESTS.md`.
  - *Prefix-only on purpose:* "smith" does not find "John Smith". Substring search needs a search service; revisit if real users keep searching by last name.
  - *Uses `components/InitialsAvatar.tsx`* (from 1.4) for any person with no uploaded picture, or who no longer exists ("Deleted user"). Don't build a second placeholder.
- [ ] 4.4 — Friends list & pending requests
  - *Built (4.4), not yet device-tested:* under the search bar, a Pending Requests section (hidden when there are none, with a red count badge) and (moved to its own screen by 4.6) a Friends section (close friends first, then A–Z, filled or outline star). Read-only. Both disappear while a search is showing. Checks are in `DEVICE_TESTS.md`.
  - *Nothing writes a Friends document yet* (Project 5), so the only way to see rows is to add documents by hand in the Console.
  - *Names are remembered for the session* in `services/userProfileCache.ts`: one `Users` read per person, re-read only on pull-down or after signing in as someone else. 15.2's sender names reuse it instead of building a second cache.
  - *The badge's white number* used the `onPrimary` token until 4.5 added `onDanger`.
  - ❓ *No ticket owns this:* `App.tsx` throws a tab's screen away when you leave it and rebuilds it when you come back (`FocusedOnly`). That was a stopgap from 4.1 and isn't a long-term answer (it loses scroll position and typed text, and re-reads on every visit). The Search tab already reloads on real focus, so it keeps working when this is removed; the other tabs need checking.
- [ ] 4.5 — Token, font & icon update 📄 *(built after 4.6)*
  - *Built (4.5), not yet device-tested:* `theme/tokens.ts` matches Appendix A and `docs/design/tokens.json` (a test compares them). Text on green buttons is dark green, not white. The app's font is Manrope. The tab bar, the Friends box, the friends list, the no-name avatar and the password eye use Lucide icons. Checks are in `DEVICE_TESTS.md`.
  - *New dependency:* `lucide-react-native`.
  - *The fonts are wired into both native projects but have never been built.* Nothing here can prove the phone draws Manrope; if it falls back to the system font, the wiring is the first place to look.
  - *Left for the screens' own tickets:* about 75 hand-drawn icons in the Planner, the create-event modal, Circle, Discover and the Profile tab (18, 15–17, 11–12, D6).
  - *Text that never named a font* still uses the phone's own font. ❓ No ticket owns finding and fixing those.
  - *Tests run against a stand-in* for `lucide-react-native` (`jest.setup.js`), for the same reason as React Navigation in 4.1.
  - ❓ *Found, not fixed:* `./gradlew :app:compileDebugKotlin --offline` fails on this Mac before compiling anything (`JvmVendorSpec ... IBM_SEMERU`, a Gradle and toolchain-plugin mismatch). It is not caused by 4.5, but it means the Android font change could not be compile-checked here.
- [ ] 4.6 — Friends box & the friends list screen 📄 *(4.4 follow-up; built before 4.5)*
  - *Built (4.6), not yet device-tested:* the Search tab no longer lists friends. It shows a Friends box with two counts ("12 friends · 2 close friends"); tapping it opens the friends list on its own screen, with a back arrow. Opening Search now costs two count reads instead of one read per friend. Checks are in `DEVICE_TESTS.md`.
  - *Counts need a connection:* offline, the box shows "Friends" with no numbers and still opens the list.
  - *The list screen covers the tab bar.* The design board keeps the tab bar visible; 4.1 pushes screens on the root stack, above the tabs. ❓ Kyson to decide whether that matters.
  - *"Find friends" on an empty list goes back to Search;* it no longer puts the cursor in the search bar.

## Project 5 — Friend requests
- [ ] 5 — Friend requests 📄 *(parent page; split into four on 2026-10-10. Each sub-ticket still has open decisions in its file.)*
- [ ] 5.1 — Cloud Functions setup & test harness 📄 *(absorbs D2; needs the Blaze plan)*
- [ ] 5.2 — `acceptFriendRequest` & the 1-on-1 chat 📄 ⭐ *writes past the rules with the Admin SDK*
- [ ] 5.3 — Friend actions: the app's data layer 📄 ⭐ *writes `blocked_users`; adds `@react-native-firebase/functions`*
- [ ] 5.4 — Friend buttons: accept, decline, star, the shared action button 📄
  - *Uses `components/InitialsAvatar.tsx`* (from 1.4) for any person with no uploaded picture, or who no longer exists ("Deleted user"). Don't build a second placeholder.

## Project 6 — Profile pictures
- [ ] 6 — Profile picture upload 📄
  - *Uses `components/InitialsAvatar.tsx`* (from 1.4) as the fallback: until someone uploads, `profile_picture_url` is `""` and the initials avatar shows. Upload replaces it for that user; the fallback stays for everyone else.

## Project 7 — Public profile
- [ ] 7 — Public profile routing 📄
  - *Uses `components/InitialsAvatar.tsx`* (from 1.4) for any person with no uploaded picture, or who no longer exists ("Deleted user"). Don't build a second placeholder.

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
  - *Uses `components/InitialsAvatar.tsx`* (from 1.4) for any person with no uploaded picture, or who no longer exists ("Deleted user"). Don't build a second placeholder.
- [ ] 15.2 — Real-time messaging & listeners 📄 *depends on D2*
  - *Uses `components/InitialsAvatar.tsx`* (from 1.4) for any person with no uploaded picture, or who no longer exists ("Deleted user"). Don't build a second placeholder.

## Project 16 — Activity proposals
- [ ] 16.1 — Propose an activity, the `Events` write, RSVPs 📄 🚧 **blocked on 3.3 merging** — the `/Events/` rule is written and tested on `ticket/3.3`
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
  - *Uses `components/InitialsAvatar.tsx`* (from 1.4) for any person with no uploaded picture, or who no longer exists ("Deleted user"). Don't build a second placeholder.
- [ ] D8 — Settings, logout & account deletion
  - *Uses `components/InitialsAvatar.tsx`* (from 1.4): a deleted account shows as "Deleted user" with that component's plain person icon.
  - *Open:* no ticket lets a user change their login email, so a typo made at signup is permanent, and password-reset emails go to the mistyped address. Does changing email belong here? (Firebase's safe way applies the change only after a link at the new address is clicked.)

### Real work, no ticket, no owner ❓
- [ ] `firestore.indexes.json` — six tickets need composite indexes. Firestore fails a missing composite at runtime: survivable in dev, a launch blocker in production.
- [ ] Group-chat self-join — 15.1 owns add/remove-member; nothing covers a person joining a chat themselves.
- [ ] The interests ↔ `Activities.tags` vocabulary contract — 1.4 writes 35 interest strings, 13.2 matches them against tags Project 9 writes, and 2.2 normalizes nothing. A mismatch silently zeroes every user's tag affinity.
- [ ] `@d11/react-native-fast-image` — in `dependencies`, named in no ticket. Probably Project 6 or 11. Someone has to decide whether it stays.
- [ ] Firebase Console config — Email/Password provider **on** and email-enumeration protection **off**. Both one-time Console actions, neither is build scope, and the first blocks 1.2 from being verified at all.
- [ ] Published contact information — App Review Guideline 1.2 requires it and it has no home.
- [ ] Email verification — nothing sends a "confirm your email" message. It proves the user owns the address and exposes typos, but doesn't fix them without a way to change email (see D8). Needs decisions first: can someone use the app before verifying, and what happens to accounts that never do? Decide before launch.

---

Add future projects/tickets here as they're planned, even as a bare one-line title — that's
useful context for whoever (human or Claude) picks up the next piece of work, without needing
to know anything about how it'll actually be built yet. A bare title is the correct resting
state for anything not yet decided; it is not a gap to fill in.
