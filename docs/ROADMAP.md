# Knect — ticket roadmap, standing rules and open decisions

Sections 1–3 of the assembled ticket doc (2026-10-09). The tickets are in [`tickets/`](tickets/), the reference docs in [`reference/`](reference/), the designs in [`design/`](design/); [`KNECT_TICKETS.md`](KNECT_TICKETS.md) explains the layout. Build notes for what has already landed are in the root [`ROADMAP.md`](../ROADMAP.md).

---

## 1. Roadmap summary

Status key: **reviewed** · **written-unreviewed** · **needs split** (the Restructure Plan maps a split) · **needs edit pass** (written, pre-dates the rulings; Kyson + Claude chat session before Claude Code) · **unwritten** · **deferred**. Build notes in brackets. `*` = needs extra eyes.

| # | Title | Status | `*` | Depends on | Purpose |
|---|---|---|---|---|---|
| 0 | Stack & conventions (redraft) | unwritten | | — | Becomes `.claude/rules/` files; `CLAUDE.md` exists. See §5 |
| 0.1 | Repair the Boot Path | reviewed [merged to `main`] | | 0 | Stop three tabs crashing; fix async-storage root cause |
| 0.2 | iOS Firebase & Xcode Setup | reviewed | | 1.1 | Rename `AwesomeProject`, pods, plist, `FirebaseApp.configure()` |
| 1.1 | Replace the Native Bridge | reviewed | | 0, 0.1 | Delete Kotlin bridge; install RNFirebase app/auth/analytics |
| 1.2 | Auth Flows, Session & Error States | reviewed | | 1.1 | Email/password flows; `onAuthStateChanged` |
| 1.3 | Google & Apple Sign-In | reviewed (see §3.6) | `*` | 1.2, 0.2 | Social sign-in; App Review gate. Deferrable |
| 1.4 | Onboarding Sequence | reviewed | | 1.2, `*1.3`, `*2.2`, 2.3 | Signup sequence, interests, initials avatar |
| 2.1 | Firestore Setup & Persistence | reviewed | | 1.1 | One config module, persistence on |
| 2.2 | The Users Document | reviewed | `*` | 1.2, 2.1 | `Users` + `Private_info/main` batch write |
| 2.3 | Signup States & Missing-Profile Detection | reviewed | | `*2.2` | Retry/sign-out; detect auth user with no profile |
| 3.1 | CLI, Emulator & Rules Test Harness | reviewed | `*` | 1.1, 2.1 | `firestore.rules` in repo; emulator test suite |
| 3.2 | Rules — User Tree & Activities | reviewed | `*` | `*3.1` | Seven blocks with `hasOnly` allowlists |
| 3.3 | Rules — Chats, Messages, Votes & Events | reviewed | `*` | `*3.2` | `/Events/`, RSVP clause, trust boundary |
| 3.4 | Rules Realignment & Deny-Case Audit | reviewed | `*` | all tickets written | Final audit; runs last |
| 4.1 | React Navigation Migration | written-unreviewed [built, `ticket/4.1`] | | 0.1, 1.1 | Five-tab navigator + root stack |
| 4.2 | Theme, Tokens, Shared Components & Sweep | written-unreviewed [built — Likely] | | 4.1 | `theme/` + shared states; sweep onto Appendix A |
| 4.3 | Search Tab & User Search | written-unreviewed [built — Likely] | | 4.1, 4.2, `*2.2`, `*3.2` | Prefix search on `name_lowercase` |
| 4.4 | Friends List & Pending Requests | written-unreviewed [PR open — Kyson] | | 4.3, `*3.2` | Read-only friends + pending |
| 5 | Friend Request Logic | needs edit pass | `*` | 4.4; own Functions setup + chat creation (§3.3) | Send/accept/decline/star/remove/block |
| 6 | Profile Picture Uploads | needs edit pass | | `*2.2`, D9 | Pick, compress, upload |
| 7 | Public Profile Routing | needs edit pass | | 4.1, 5 | Tap a person → their profile |
| 8 | Define Activity Schema | needs edit pass | | `*3.2` | Activity document in code |
| 9 | Seed Data via CMS | needs edit pass | | 8 | Write and load seed activities |
| 10 | API Integration | deferred | | — | Places/Yelp venues |
| 11 | Discover Fetch & Infinite Scroll | needs edit pass | | 8, 9, D4 | Feed data layer, likes, pagination |
| 12 | Activity Detail Page | needs edit pass | | 11, 18 | Detail page; Planner-or-chat chooser |
| 13.1 | Discover Search & Algorithm | needs edit pass | | 11 | Fuse.js search, cost filter, score |
| 13.2 | Tag Affinity Scores | needs edit pass | | 11, 1.4 | Tag score writes, decay, cap |
| 13.3 | User Generated Content | deferred (App Review gate) | `*` | 8, 6, D9 | UGC + content reporting |
| 14 | AdMob Placeholders | deferred | | — | Ad slots |
| 15.1 | Chat Creation & Participant Management | needs split + edit pass | | `*3.3`, Functions | Find-or-create, rename, leave |
| 15.2 | Messaging & Real-Time Listeners | needs split | | 15.1, Functions, `*3.3` | Messages, listeners, preview Function |
| 16.1 | Activity Proposals | needs split | | `*3.3`, 15.1, 15.2 | Proposal batch; RSVPs; Events listener |
| 16.2 | Proposal Resolution | needs split | | 16.1, Functions | Sweep, cancel, `Free_Busy` |
| 17.1 | Vote Creation & Casting | needs split | | 16.x, 15.2 | Votes, candidates, ballots |
| 17.2 | Tally & Resolution | needs split | `*` | 17.1, 16.x | Server tally, close, apply winner |
| 18 | Planner & Create Event (18.1–18.5, absorbs D3) | written-unreviewed | `*18.4` | 4.2, 16.x, 17.x (plan numbering) | Planner redesign, create sheet, drag, busy overlay, suggest time |
| 19 | External Calendar Sync | deferred | | 18 | Google/Apple Calendar |
| 20 | Push Notifications | deferred | | Functions, 15.2, 16.x, 17.x | FCM + notification paths |
| 21 | Deep Linking & SMS Sharing | deferred | | 4.1 | Growth loop |
| D2 | Cloud Functions setup | unwritten (may fold into 5) | | 1.1 | Runtime, deploy, emulator, scheduler |
| D4 | Location capture & geohash | unwritten | | `*2.2`, `*3.2` | Writes `Private_info.location`/`geohash` |
| D5 | User status | unwritten | | `*2.2` | Available/unavailable |
| D6 | Own-profile tab | unwritten | | 4.2 | Edit own profile; 3-state theme |
| D8 | Settings, logout & deletion | unwritten | `*` | 1.2 | App Store deletion requirement |
| D9 | Firebase Storage rules | unwritten | `*` | `*3.1` | `storage.rules`; launch blocker |
| D11 | Analytics taxonomy | unwritten | | screens exist | Event naming, screen tracking |
| — | Group-chat self-join | unwritten | | 15.1 | No ticket anywhere |
| — | Itineraries in multi-day events | deferred | | 18 | Parent/child Events |

Build status of 0.2–3.4 isn't recorded in any doc; 4.1 was cut from `ticket/3.3`, so they're [Likely] built on the ticket stack. Folded in: D1 → 0 · D3 → 18 · D7 → 1.4 · D10 → 0 · iOS setup → 0.2 · `firestore.indexes.json` → `*3.1` · navigation migration → 4.1.

---

## 2. Standing rules

### Ticket format

Five sections in order: **1 User Story (or Goals) → 2 Architecture & Technical Details → 3 UI & Layout → 4 Security and Scope → 5 Acceptance Criteria.** Header lines `Status` / `Depends on` / `Blocks`. Section 2 states **Data model changes** ("None" if none). Section 4 has a files allowlist and a **Security rules changes** line ("No changes needed" if none). Unresolved items are `[DECISION: …]` / `[RESEARCH: …]` brackets — never guessed, never resolved by the implementer. Full template: `docs/reference/ticket-spec-template.md`. Edit-pass procedure: `docs/reference/edit-pass-brief.md`.

### Sizing and feeding

- **One ticket = one Claude Code session.** Follow any session split the ticket gives; commit at every verified boundary.
- **Test-first** wherever logic can be tested without a device.
- **Schema and rules never go in the same ticket as UI.**
- **Starred (`*`) tickets get a session to themselves.**
- Feed order: data model + rules → pure logic → UI.
- **Conflicts: the newest doc wins.** If a ticket and a newer ruling disagree and section 3.3 doesn't already settle it, stop and ask.

### Codebase rules

- **Branch from the tip of the stacked `ticket/*` branches** (Split Index, 2026-10-08). `main` has only 0.1 merged; `auth` is the July baseline. Confirm the tip with Kyson before the first session.
- **The schema wins.** `components/`, `types.ts`, `services/` were mostly generated in commit `71a7c07`; where they disagree with `docs/reference/master-schema.md`, the schema wins. Field names come from the Master Schema only — a needed field that isn't there is a stop-and-ask.
- **Don't rewrite working UI unless the ticket says to.** 18 is the ticket that redesigns the Planner.
- **Stay inside the files allowlist.** Stop and ask before touching anything else.
- Every storage/Firestore call is async. Every `onSnapshot` unsubscribes on unmount and background. Three app-wide listeners maximum (chat list, open thread, Events).
- `snake_case` fields; Firestore `Timestamp`, never epoch millis; `Private_info` doc ID is literally `main`; friend status is one of four strings.
- Rules are tested with `npm run test:rules` (emulator), not the Console Rules Playground. Older tickets that say "Rules Playground" mean the emulator suite. `npm test` never starts an emulator.
- `/rewind` does not undo `rm`, `mv`, `npm uninstall` — commit before and after.
- Plan → Manual permission mode for 0.x, 1.x, `*2.2`, and anything touching `firestore.rules`.

### Design-input gate — every UI ticket

Project 18 §0, applied to **every** ticket that writes UI.

1. Before any UI code, check Kyson has provided every design the ticket's screens need: an exported image, a canvas board link or HTML file, an SVG, or a written spec. A ticket's own section 3, where it fully specifies the screen, counts as a written spec.
2. **If anything is missing, stop.** Send Kyson the full list of what's missing, by name, as a checklist, and wait.
3. No guesses — no approximated layouts, placeholder colors, or stock icons.
4. **Boards labeled "Potential" count as missing** until Kyson approves them.
5. Data-layer work may proceed while waiting. Screens may not.
6. Design source of truth: the **Knect Visual Directions** canvas (Direction A, "Refined Emerald"), plus what Kyson attaches in-session. Where it disagrees with Appendix A, the canvas/Project 18 is newer and wins (section 3.3).

---

## 3. Open decisions and required edits

Tick as resolved. **blocks build** = the ticket can't go to Claude Code until this is answered. Ruling codes point into `docs/reference/`.

### 3.1 What blocks the next three tickets (5, 6, 7)

With 4.4 in PR, the next tickets by number are 5, 6 and 7. **None of them is ready for Claude Code** — all three are the original Google Doc text and have never been through the edit pass. The next step for each is an edit-pass session (Kyson + Claude chat, `edit-pass-brief.md`), not a build. The decisions that session needs:

- [ ] **Project 5 — does accepting a request ship before the 1-on-1 chat step exists?** Kyson ruled (2026-10-07) that Project 5 scopes its own Functions setup and chat creation rather than waiting on D2 and 15.1; whether acceptance lands first without the chat is "that session's call." — **blocks build (5)**
- [ ] **Project 5 — confirm no client-side acceptance path.** The Doc's Action B is a client batched write; `*3.2`'s owner-only `Friends` update denies it by ruling. Acceptance must be `acceptFriendRequest` (O4, F7). `*3.4` re-checks this. — **blocks build (5)**
- [ ] **`Friends` is readable by every signed-in user, pending requests included.** 4.4 reads it and 5 writes it. Rule it before 5 widens the exposure, or explicitly accept it for MVP. — owner: rules ticket
- [ ] **Project 6 — Storage path convention and `storage.rules` (D9).** Neither exists; 6 can't upload without both. Decide whether D9 folds into 6. — **blocks build (6)**
- [ ] **Project 7 — designs.** It renders "your own profile page" minus controls, but D6 (own-profile tab) is unwritten, so there's no layout to mirror. Under the design-input gate, 7 needs a public-profile design or written spec. — **blocks build (7)**

### 3.2 Open brackets, by ticket

- [ ] **0.2** — iOS bundle ID (`com.knect`?). Only open if 0.2 isn't built.
- [ ] **D11** — what analytics events get logged.
- [ ] **16.1** — Events listener date bound. — **blocks build (16.x)**
- [ ] **16.2** — sweep interval (5 / 15 / 60 min). — **blocks build (16.x)**
- [ ] **16.2** — immediate-confirmation mechanism: (a) trigger with re-fire guard, (b) sweep only, (c) client write. 17.2 reuses it. — **blocks build (16.x, 17.x)**
- [ ] **16.2** — expired-card copy.
- [ ] **16.2 / Q7** — does a late `going` on an expired event earn a `Free_Busy` block?
- [ ] **17.1 / Q8** — keep "alternative open" derived from `linked_vote_id`, or denormalize a boolean.
- [ ] **17.1 + 17.2** — how a stale ranked ballot is tallied. — **blocks build (17.x tally)**
- [ ] **17.1** — re-rank prompt: inline banner or push.
- [ ] **17.1** `[RESEARCH]` — must creating a `"candidate"` Event require chat membership?
- [ ] **17.2** — running counts: client-computed or Function-written.
- [ ] **17.2** — on vote close, the event's clock restarts fresh or with the remainder.
- [ ] **17.2** — rewrite `Free_Busy` when a winning option moves a confirmed event. Now reachable — 18.5 opened confirmed-event votes.
- [ ] **17.2 / Q9** — build the vote-cancel button for MVP; if yes, `close_reason` gets a fourth value or none.
- [ ] **18.2** — all-day `end_time`: inclusive end-of-day or exclusive next midnight. Pin it in the Master Schema. — **blocks build (18.2)**
- [ ] **18.2** — multi-day: separate toggle or tap the end date.
- [ ] **18.2** — confirm itineraries are deferred out of 18.
- [ ] **18.3** — drag all-day events across days: in or out.
- [ ] **18.5 + 17 + `*3.3`** — how RSVPs reopen once after a confirmed event's time changes. Likely: a per-uid "may re-answer" flag set by the winner write-back. — **blocks build (18.5 confirmed path)**
- [ ] **18.5 + 17** — vote deadline cap: `min(created_at + 24h, earliest start of original and candidate)`. Likely. — **blocks build (18.5 confirmed path)**

### 3.3 Settled by the newest-doc rule — edits to apply

Each line names the winner. Apply the edit in the named ticket the next time it's opened; don't re-ask.

- [ ] **`on-primary` = `#052E22`** (Project 18, 2026-10-09) over Appendix A's `#FFFFFF` (2026-10-08). Edit Appendix A and `theme/tokens.ts` (4.2 is built).
- [ ] **Event colors = base + 700 "poster" shade + text color each** (18's D-0.2) over 4.2's flat "unchanged" six. Amend `eventColors` in `theme/tokens.ts` before 18.1. Needs a small follow-up ticket; 4.2 is built.
- [ ] **Font = Manrope (OFL)** (18's D-0.4) over the code's `'Inter'` / `'Anonymous Pro'` (no files exist). Font files + per-platform linking need an owner (0.2 owned iOS asset linking).
- [ ] **Split 16 and 17 using the Restructure Plan's numbering** (16.1–16.8, 17.1–17.8), because 18 — the newest ticket — depends on those numbers (16.4, 16.7, 16.8, 17.2 "creating a vote", 17.5–17.8). The written "16.1/16.2/17.1/17.2" docs become the source text for those splits. Rules work in the plan's `*16.1`/`*17.1` is **verify-and-extend** (`*3.3`'s whole-file ruling is newer than the plan).
- [ ] **18's own rulings over its flags list:** RSVP carry-over and who can start are ruled in 18.5 (the flags list still calls them open); the busy field is one Boolean, no per-user map (18.2).
- [ ] **Votes on confirmed events are allowed** (18.5, 2026-10-09) over 16.1, the 16 Phase 1 ledger and the Master Schema ("alternatives only while proposed"). Project 17 change — see 3.4.
- [ ] **Q8 over 16.1's "alternative open" bracket** — no new field; `linked_vote_id` is the pointer.
- [ ] **Q7 over 16.2's 🔴 RSVP bracket** — three windows, one clause in `*3.3` (18.5 then adds a re-answer path, 3.2).
- [ ] **Q9 over 17.1's Vote `status` bracket** — `"open"`, `"closed"`, `"cancelled"`.
- [ ] **1.2's "delete `keyChain`" (2026-09-11) over 0.1's bracket.**
- [ ] **`*3.2`'s owner-only `Friends` ruling over the leftover "two answers… carry the bracket" paragraph** in the same ticket. Delete the paragraph.
- [ ] **Free_Busy fields:** 16.2's "event's `start_time`" means `Events.event_time` → `Free_Busy.start_time`, `end_time` → `end_time` (Master Schema).
- [ ] **Project 5 depends on its own Functions setup and chat creation** (Split Index, 2026-10-08) over the Running Order's D2 + 15.1 dependency.
- [ ] **`.firebaserc` belongs in 1.1's acceptance criteria** (Google Doc copy and Implementation Start Guide, both newer than the Project doc). Moot if 1.1 is built — `*3.1` fixes it either way.
- [ ] **2.3 is reviewed** (START_HERE / Split Index) over its own "Drafted" status line.
- [ ] **Branch = stacked `ticket/*`** (Split Index) over `auth` (Operating Notes, Edit Pass Brief).
- [ ] **Running Order (2026-08-31) and START_HERE (2026-09-10) are superseded** where they disagree with the Implementation Start Guide (2026-09-11) and Split Index (2026-10-08): Console switches done, Xcode installed, Project 4 is four tickets. Running Order needs a rewrite.
- [ ] **Project docs over the "Projects" Google Doc** for every ticket that exists in both (the Doc is older for 2.3 and 4.2–4.4, and has only "Currently Deferred" for 16–18).
- [ ] **Project 0** is fully stale (J1, persistence, geohash, `users` casing all decided; Playground superseded). Kept as a reference doc and a stub, not a ticket.

### 3.4 Cross-ticket edits still to make

From Project 18 (Kyson, 2026-10-09):

- [ ] **Events schema ticket (plan's `*16.1`) — add `counts_as_busy`** (Boolean), owner-written, with its rule. Defaults timed → busy, all-day → not busy; sender's setting applies to everyone. **18.2 is blocked on this.**
- [ ] **Free_Busy writer (plan's 16.8)** — also write on personal-event create/update/delete, respect the busy switch, move the block when a confirmed event's time changes.
- [ ] **Project 17 — confirmed-event votes.** Widen vote scope past `proposed`; "Keep current time" mandatory in every alternative vote; no votes or tie keeps current time; deadline before the event; winner write-back updates `event_time`/`end_time` on a confirmed event; re-check against 16.7's sweep.
- [ ] **16.1 text** — "do not rewrite the planner UI" points to 18; drag stays locked, time changes go through 18.5.
- [ ] **Master Schema** — pin the all-day `end_time` convention; record `counts_as_busy`; record confirmed-event votes.
- [ ] **Split Index** — add 18.1–18.5; mark D3 absorbed.
- [ ] **Free_Busy now holds personal events.** Q2 accepted open reads because a block reveals only *that* you're busy, and named "adding content" as the trigger to revisit. Personal events add exposure without adding fields — re-confirm Q2.

From earlier rulings, not yet in the ticket text:

- [ ] **15.1** — add/remove member writes `Events.shared_with` + `rsvps` for every open proposal; use `recent_message_sender_id` for the subtitle; its "blocking restricts new sends only" line predates the receive-side ruling; its `Chats` update rule is now `*3.3`'s.
- [ ] **12** — "Make This An Event" → chooser (Planner or chat). **11** — share affordance on the Discover card.
- [ ] **16.1 / 17.1** — still list `firestore.rules` as theirs to write and say "Rules Playground"; now verify-and-extend + emulator. 16.1 "Depends on: 3" → `*3.3`.
- [ ] **17.1** — must write `Votes.created_by`; candidate Events need `linked_chat_id`.
- [ ] **15.2** — 2.1 owns the Firestore config module, not 15.2; Messages create rule and blocking are now `*3.3`'s; reuse 4.4's `services/userProfileCache.ts` for sender names.
- [ ] **5** — drop `friend_name` / `friend_profile_picture_url` (Q3); Appendix B.1 button copy; block check inside `acceptFriendRequest` (O4); add an unblock action (Change List, Project 5); promote Action F out from under Action E.
- [ ] **6** — no friend picture copies (Q3); `@d11/react-native-fast-image` is installed, delete the `react-native-fast-image` install steps; initials avatar is the floor (1.4); needs D9.
- [ ] **7** — "Relationship Check" can't read another user's `blocked_users` (O4); "project 4 under 3.2" is gone (Appendix B.1); one-time `get()`, not a listener; push it on 4.1's root stack.
- [ ] **8** — counters client-side `FieldValue.increment()` (O6); add `source` (required), `category` (required), `creator_id` (UGC only); no radius in the schema ticket (R18); UI section moves to 11/12.
- [ ] **9** — valid `category` per activity (O17) replaces "a picture per activity"; adopt 1.4's 35 interests as the tag vocabulary; pin geohash precision; finish the upload sentence; Rowy vs Sheet import.
- [ ] **11** — no interleave; score orders (O11); pool fetch ~50 + ~25, sort once, paginate (F6); `liked_activity_ids` on `Private_info` (O2); `Activity_History` on tap (O5); client counters (O6).
- [ ] **13.1** — Fuse.js `threshold: 0.5`, keys `name`, `tags` (drop "Levenshtein"); cold-start from `created_at`; resolve radius against 8 and 11.
- [ ] **13.2** — path `Private_info/main` (R13); `tag_scores_last_decayed` (R15); decide decay compounding; debounce also covers `Activity_History` (O5).

### 3.5 Launch blockers and unowned items

- [ ] **Storage rules** (D9) — `*3.4` names it a launch blocker.
- [ ] **Location capture** (D4, Q10) — nothing writes `location`/`geohash`; blocks 8, 11, 12, 13.1.
- [ ] **Content reporting** (Guideline 1.2) — 13.3, deferred; scope must include messages and profile fields.
- [ ] **Published contact information** — launch checklist, no home.
- [ ] **Account deletion** (D8) — App Store requirement; cleanup strategy is a schema decision.
- [ ] **Interests ↔ `Activities.tags` vocabulary** — unowned; a mismatch silently zeroes tag affinity.
- [ ] **Q4** — final `category` list (6 vs 15–20 illustrations). Project 8.
- [ ] **Q11** — `status_visibility` values. D5.
- [ ] **`@d11/react-native-fast-image`** — installed, owned by no ticket (likely 6 or 11).
- [ ] **D2's fate** — Project 5 now scopes its own Functions setup; 15.x, 16.x, 17.x and 20 also need Functions. One setup, owned once.
- [ ] **Public repo** — `docs/reference/` puts the decision logs and rules reasoning in a public repo. Not a credential leak (J6), but a choice to make deliberately.

### 3.6 Still ambiguous — newest can't be determined

- [ ] **`*1.3` and 1.4 review status.** Their status lines say "Reviewed 2026-09-03"; Round 10 §8 (same day) calls both new and unreviewed, and nothing later settles it.
