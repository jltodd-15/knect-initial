# Knect — Start Here

**Read this first in any new session.** It's short on purpose. Everything else is reference; this is orientation.

**Updated:** 2026-09-10

---

## The goal

Get the Projects Roadmap to a state where Claude Code can implement from it. Kyson writes and edits the tickets → Jonathan and Jonah review and add → Kyson runs each through Claude Code → the team reviews the code.

That means **the tickets are the product of this work**, and they have to stand alone: Claude Code implements from the ticket, not from a conversation.

---

## The process — this part is non-negotiable

Four phases, from the `collaborative-draft-workflow` skill:

1. **Outline / decisions — Kyson's.** Surface every decision, don't make them. Use multiple-choice for clean either/ors.
2. **Draft — Claude's.** In Kyson's voice, in the `knect-project-doc` format. Anything unresolved gets bracketed `[DECISION: ...]` or `[RESEARCH: ...]`, never guessed.
3. **Flag — Claude's.** Call out what Phase 1 might have missed, **with the reasoning, not just the fix.** Don't resolve your own flags.
4. **Review — Kyson's.**

**Phase 1 does not get skipped**, including when a lot of context is already loaded and the answer seems obvious. That's exactly when it gets skipped, and it has been. Kyson is directing AI implementation without writing the code himself, so if the decisions drift to Claude he can't own or review the result.

Corollary: when Kyson says he doesn't know enough to decide, **explain the tradeoff so he can**, don't decide for him. Point at his own code where possible; it teaches faster than an abstraction. Project 16's listener decision is the worked example — cloning the repo and showing him the line where RSVPs currently live turned an abstract question into an obvious one. **The repo is cheap to check and it has changed decisions. Check it.**

**A decision Kyson makes mid-session gets written into the ticket as if it had always been there.** The dated audit trail lives in the split index; the ticket reads as one coherent brief rather than a document with amendments stapled on.

---

## Two standing rules about the docs themselves

**Newer decisions supersede older ones.** If a ticket, the schema, and the decision log disagree, the most recent ruling wins. Don't average them, don't assume the older one was deliberate, and don't ask Kyson to re-decide something he already settled — search first.

**The `(r)` convention.** A doc with `(r)` in its filename needs Kyson's review: it contains something Claude decided or restructured, and an error in it propagates into code. Docs without it are ledgers of Kyson's own decisions, derived status views, or verified facts. **When Kyson reviews a doc, drop the `(r)`.** When one gets substantially rewritten, add it back.

Currently marked: **Appendix A/B**. **16.1, 16.2, 17.1 and 17.2 are drafted and unreviewed but were not named with `(r)`** — either rename them or review them; don't leave it ambiguous. Per Round 10 §8 the convention is **not** applied to edit-pass sub-tickets, which Kyson skim-reviews as they land.

---

## Where things live

| Doc | What it's for | How to use it |
|---|---|---|
| **Knect_Master_Schema** | The schema and rules, with a change log | Source of truth for every field name. Part 1 is fields only; Part 4 is what's undecided. **Synced to the Google Doc 2026-09-08**; **two blocks pending** — Projects 16/17 and Project 3 — plus two transcription gaps logged at the top of Part 3. **Project 3's block carries a new field**, `Votes.created_by` |
| **Knect_Decision_Log.md** | Every ruling made, with reasoning | Search it before re-asking something. Parts 3–13 are resolutions. **Projects 16/17 and Round 10 are not folded in yet** — see the ledgers below |
| **Knect_Project_16_Phase1_Decisions.md** | Every Project 16 ruling, with reasoning and the code facts behind it | Read before touching 16.1, 16.2 or 17. Folds into the Decision Log as Part 14 once the tickets are reviewed |
| **Knect_Round_10_Standing_Rulings.md** | Every Project 1 and Project 2 ruling | Read alongside the Decision Log. Several rulings are app-wide |
| **Knect_Ticket_Split_Index.md** | One row per sub-ticket from the edit pass, plus every flag and correction | **The provenance record.** Read at the start of an edit-pass session, append at the end |
| **Knect_Edit_Pass_Brief.md** | The operating manual for an edit-and-split session | Read first if you're running one |
| **Knect_Running_Order.md** | What's written, what's next, what's blocking | Check at the start of a session |
| **Knect_Codebase_Reconciliation.md** | What's built vs. planned, per ticket | Read §4's verdict table before writing any ticket that touches existing code. **Its Project 1 and Project 2 rows are superseded** |
| **Knect_Codebase_Audit.md** | Stack facts, provenance, security findings | Reference. §0 (provenance) matters most |
| **Knect_Project_0_Stack_and_Conventions.md** | Stack, conventions, known bugs | Goes above every Claude Code prompt. **Needs a redraft once the tickets are settled** |
| **Knect_Project_0_1_Repair_Boot_Path** | First implementation ticket | Not obsolete — nothing in it touches Firebase |
| **Knect_Project_0_2_iOS_Firebase_Setup** | iOS from zero — bundle ID, Podfile, plist, privacy manifest | Carries a human-setup block. Needs a Mac with Xcode; no paid Apple account |
| **Knect_Project_1_1 … 1_4** | Auth, split four ways | 1.1 and 1.2 skim-reviewed; `*1.3` and 1.4 unreviewed |
| **Knect_Project_2_1_Firestore_Setup_and_Persistence** | Install Firestore, one config module, persistence on | Reviewed. Carries a human-setup block — a Firestore database has to exist in `knect-db` |
| **Knect_Project_2_2_Users_Document_and_Creation_Write** | ⭐ The `Users` + `Private_info/main` batch write and the canonical field list | **The document shape 4, 5, 6, 7 and 13.2 all read.** Starred. Reviewed 9/08 |
| **Knect_Project_2_3_Signup_States_and_Missing_Profile_Detection** | Submitting states, retry-then-sign-out, missing-profile detection | Reviewed 9/08. No open brackets |
| **Knect_Project_3_1_CLI_Emulator_and_Rules_Test_Harness** | ⭐ The Firebase CLI, `firestore.rules` in the repo, and the emulator test suite | Written 9/09, skim-reviewed 9/10. Carries a human-setup block — a Java JDK 11+ and one `firebase login`. Writes no rule policy on purpose |
| **Knect_Project_3_2_Rules_User_Tree_and_Activities** | ⭐ Seven rule blocks: the `/Users/` tree plus `Activities` | Written 9/09, **reviewed 9/10.** No open brackets — `Friends` `update` and `Private_info`'s doc ID both ruled |
| **Knect_Project_3_3_Rules_Chats_Messages_Votes_and_Events** | ⭐ `/Calendars/` → `/Events/`, the three-window RSVP clause, and the trust boundary | Written 9/09, **reviewed 9/10.** **The highest-risk ticket in Project 3**, and the only one with a schema change — `Votes.created_by` |
| **Knect_Project_3_4_Rules_Realignment_and_Deny_Case_Audit** | ⭐ The seven-step audit, run after every other ticket is written | Written 9/09, skim-reviewed 9/10. **Inherits no brackets — three conditions to re-check**, one of which requires reading Project 5 first |
| **Knect_Project_15_2_Messaging_and_Listeners** | Messaging, listeners, message delete, blocking | Sets the `onSnapshot` and teardown convention |
| **Knect_Project_16_1_Activity_Proposals** | Propose, write the Event, RSVPs, card, planner ghost | Drafted 8/31, unreviewed |
| **Knect_Project_16_2_Proposal_Resolution** | Confirmation, the 24h sweep, expiry, cancel, Free_Busy | Drafted 8/31, unreviewed. Carries one 🔴 blocking bracket |
| **Knect_Project_17_1_Vote_Creation_and_Casting** | Votes, candidate events, ballots, the card | Drafted 8/31, unreviewed |
| **Knect_Project_17_2_Tally_and_Resolution** | Server-side tally, close conditions, write-back | Drafted 8/31, unreviewed. **Highest-risk ticket in the roadmap** |
| **Knect_Appendix_A_B_Tokens_and_Components (r)** | Color tokens, component names | Folds into Project 0 at its redraft |
| **Knect_Ticket_Spec_Template** | The ticket format | Restructured 8/26 for Claude Code as implementer |
| **Knect_Roadmap_Change_List.md** | Original gap analysis | **Partly stale** — verify against source before acting on any claim |

---

## Standing decisions that apply everywhere

- **`react-native-firebase`**, not hand-written native bridges. The Kotlin bridge gets deleted, not fixed. iOS needs setup from zero.
- **`geofire-common`** for geohash queries.
- **Five tabs:** Planner, Discover, Search, Circle, Profile. Circle holds chats *and* status.
- **React Navigation** replaces the hand-rolled `AppTab` switch. Needs its own migration ticket.
- **Primary green is `#10b981`** (emerald-500). Grays are Tailwind zinc.
- **Collections:** `Users`, `Activities`, `Chats`, `Events`. Fields are `snake_case`. All timestamps are Firestore `Timestamp` — the prototype's epoch milliseconds convert at the boundary.
- **`name_lowercase` is a stored field**, computed with `.toLowerCase()` at write time and written to the document. It is never derived at query time — Firestore has no case-insensitive mode, and Project 4's search is a server-side range query against stored data.
- **`Events.rsvps` closes when `event_time` has passed, not when the event resolves.** Free changes while `proposed`; after resolution a `pending` invitee may answer once; after the event, nothing. Q7.
- **The published security rules are readable** — mirrored in the "Firebase Master Schemas" Google Doc under *Current Firebase rules*, dated 5/11/26. **Read them before claiming anything about them.** ⚠️ **But do not assume they are what's live** — `*2.2`'s session recorded that testing currently runs against open rules, and a database created in test mode carries a different rule. `*3.1` reads the Console and transcribes whatever is actually published.
- **The security rules move into the repo as `firestore.rules`, deployed by CLI**, and are verified by the **Firebase Emulator Suite with `@firebase/rules-unit-testing`** — not the Console Rules Playground. Ruled 2026-09-09. The Playground tests one request by hand and forgets; this file is edited by at least five tickets and needs a regression check. **Requires a Java JDK 11+ on the Mac.**
- **Cloud Functions** for: chat find-or-create, `acceptFriendRequest`, the chat-list preview write, push notifications, and **one scheduled sweep serving both 16.2 (proposals) and 17.2 (votes)**. **Not** engagement counters — those are client-side `FieldValue.increment()` behind one shared service module.
- **Three app-wide listeners, and that is the ceiling** — chat list, open thread, and 16.1's `Events where shared_with array-contains uid`. Every one unsubscribes on unmount and on background. 15.2 said two; 16.1 is a deliberate exception because the planner ghost and the chat card are two renderings of one document. **The next exception needs a real argument, not this precedent.**
- **Firestore offline persistence is ON**, at the default cache size, set explicitly in one config module. **Ticket 2.1 owns that module.**
- **Baseline is what's committed.** Jonathan's uncommitted local work is discardable, and per Round 10 §1 it is no longer a reason to leave a file alone.
- **No denormalized names or pictures anywhere.** Every screen showing a person needs a "Deleted user" fallback.
- **The security rules get a full realignment**, not per-ticket patches. Project 3 owns it — now four tickets: `*3.1` (CLI, emulator, harness) → `*3.2` (the `/Users/` tree + `Activities`) → `*3.3` (`Chats`, `Messages`, `Votes`, `Events`) → `*3.4` (the audit, last). **Don't treat a rule gap as fixed because a Function with Admin SDK credentials bypasses it.**
- **`*3.x` writes the whole rules file**, every collection, rather than leaving blocks to 16.1, 15.2 and 17.1. Ruled 2026-09-09. **Restructure plan §§10–11 still give `*16.1` and `*17.1` their own rule blocks — those are now verify-and-extend, not write.**
- **Rules constrain ownership plus a field allowlist (`hasOnly`), and nothing more.** Ruled 2026-09-09. Not type checks, not required-field checks. The two value checks that survive were already ruled independently: `Friends.status`'s four strings and `Activities.source`.
- **`Friends` `update` is owner-only and acceptance is Function-only — B9 is closed.** Ruled 2026-09-10. `acceptFriendRequest` has to run regardless, for O4's block check (no client can read the recipient's `blocked_users`) and S4/15.1's chat find-or-create, so owner-only is the tightest rule rather than a broken one. **`create` is constrained by direction** — in your own doc only `request_sent` is creatable, in someone else's only `pending` — which closes a hole in the published rule that let anyone plant a `close_friend` entry in a stranger's list. **`close_friend` is one-sided and needs no schema change.** Reopens only if Project 5 adds a client-side acceptance path.
- **`Private_info`'s rule pins the document ID to the literal `main`.** Ruled 2026-09-10. Decision Log F2's hot-path split is the only thing that reopens it.
- **`Votes.created_by` (String — UID) says who opened a vote, and is the only schema addition in Project 3.** Ruled 2026-09-10. The event owner cannot stand in for it: the vote's opener is usually not the event's owner, and a freeform vote has no event at all. 17.1 writes it.
- **Blocking removes the friendship, and it is enforced on the *receiving* side — permanently, not as an interim.** Ruled 2026-09-09 in `*3.3`. `blocked_users` is owner-only, so no rule can check whether the *recipient* blocked the sender without a new readable block record, a Project 5 write, and a billed `get()` per message sent. 15.2's receive-side filter is the real protection, and the only person who can bypass it is the person it protects — how iMessage behaves. **Accepted cost: a blocked user's messages are still created, stored and delivered before being filtered out. Never describe blocking as enforced.** Revisit if 13.3's reporting needs a server-side record of who blocked whom.
- **UI-level enforcement gets labeled as such.** Free/busy visibility, device-local unread, and the block filter all put protection or state outside the server because the cheap version is good enough. A defensible posture — and now a closed one: all three are decided, written down as UI/device-level, and none is waiting on a later ticket.
- **The Events lifecycle is forward-only:** `proposed → confirmed | expired | cancelled`, all terminal. An alternative can only be raised while an event is still `proposed`. This is what keeps 16.2 and 17.2 from needing a reversible state machine, and it should not be relaxed casually.
- **"Who's coming" has exactly one representation:** the `rsvps` map on the Event. `confirmed_participants` is derived from it and never written by a client.
- **One vote per event, and it grows.** The first alternative creates the vote; later alternatives append options to it. Options are appended, never edited or removed — every `option_id` is referenced by ballots already cast.
- **Every tally is server-side, and there is exactly one implementation.** Not a preference: `votingLogic.ts` breaks ties with `Math.random()`, so two devices tallying identical ballots pick different winners. Ties resolve to the **earliest option**, which in an alternative vote is the original plan.
- **Anything a client can write, a client can lie about.** `Events.status` (except `cancelled` by the owner), every vote result field, and every preview field are Admin-SDK-only. That list is the trust boundary, and `*3.3` writes it into the rules as absent clauses rather than as comments.

---

## Things not worth re-deriving

The repo clones anonymously from `github.com/jltodd-15/knect-initial`, branch `auth`.

- The app has never successfully written a field to Firestore. **Ticket `*2.2` is the first one that does.**
- **There is no Firestore code at all.** Verified at `8493a36`, 2026-09-09: no `firestore.rules`, no `firebase.json`, no `.firebaserc`, no `firestore.indexes.json`, no `functions/`, and zero occurrences of `firestore` in any `.ts`/`.tsx`/`.js` file. Project 3 is greenfield, not a repair.
- Three of four tabs crash on load. `index.js` registers `App` instead of the `ErrorBoundary`-wrapped `Root`.
- Root cause of most of it: `utils/storage.ts` names an async API `localStorage`.
- Almost everything in `components/`, `types.ts`, and `services/` came from one commit — `71a7c07`, "adding latest changes from AI studios." **Those shapes are generated guesses, not decisions.** Where they disagree with the schema, the schema wins.
- Hand-written and worth respecting: `FirebaseModule.kt`, `DBService.kt`, `FirebasePackage.kt`, and rewrites of `CreateProfilePage.tsx` and `storage.ts`.
- **`ChatEventWidget.tsx` and `utils/votingLogic.ts` are dead** — nothing imports either. The live vote UI is inside `SocialDashboard.tsx`, and `DraggableVoteList` is imported and working. Verified 8/31.
- **The live ranked "tally" is a Borda count** — `SocialDashboard.getRankedResults`, line 45 — inside a feature named ranked-choice. The IRV file it contradicts is the dead one.
- **`android/app/google-services.json` is present and correct** — project `knect-db`, client `com.knect`, API key present, and not gitignored. Its `oauth_client` is an empty array, which is `*1.3`'s to fix.
- **`.gitignore:78–79` (`*firebase*`, `*firestore*`) matches four files, not three** — `firebase.json`, `firestore.rules`, `firestore.indexes.json` **and `.firebaserc`**. 1.1's acceptance criteria check the first three only. Verified with `git check-ignore` 2026-09-09.

---

## Open, waiting on people

- **The `category` value set** — Q4 is resolved and the field is required with six starting values, but O17 wants 15–20 mapping 1:1 to illustrations. Project 8 pins the final list.
- **Own-profile tab and settings/account deletion** — outlines only until walked through with Jonathan. Account deletion is an App Store requirement and its cleanup strategy is a schema decision. (Onboarding is no longer here — it is ticket 1.4.)
- **Appendix A/B** — folds into Project 0 at its redraft.

## Blocking right now

- **🔴 Two Firebase Console switches have no owner.** The **Email/Password provider** has to be enabled before 1.2 can be verified at all, and **email enumeration protection has to be off** for `*1.3`'s account linking. Neither appears in any ticket.
- **🔴 Location capture has no ticket.** `Private_info.location` and `geohash` anchor Projects 8, 11, 12 and 13.1, and nothing writes them — `*2.2` confirmed it does not. Change List D4 called for a ticket and it never got one. `*3.2` allowlists both fields, so the rule is ready whenever a writer exists.
- **🔴 Firebase Storage rules still have no owner.** A separate file with separate syntax — Master Schema Part 2 item 7, Change List D9. All four Project 3 tickets put it explicitly out of scope. `*3.4` names it as a launch blocker if it doesn't exist by then.
- **⚠️ A Java JDK 11 or higher on the Mac.** Not a ticket — the Firestore emulator is a Java binary, and all four Project 3 tickets are verified through it. Free, one install.

**Closed since this list was last written:** `Liked_Activities` now has a rule (`*3.2`) · `firestore.indexes.json` now has an owner (`*3.1` creates it; each ticket adds its own index) · **the `Votes` creator field is resolved** — `created_by`, written by 17.1.

## Two things that gate App Review and have no owner

- **Content reporting.** Apple Guideline 1.2. Ruled to 13.3 — which is deferred, and whose scope has to widen past activities to cover chat messages and profile fields.
- **Published contact information.** A launch-checklist item with no home.

## Immediate next

1. **Two sync fixes in the Google Doc** — `Private_info`'s document ID is still `(Private ID)` and should read `main`, and `Activities.is_active` / `updated_at` need their ⏸️ deferral marks back.
2. **Sync the Master Schema's Project 3 block into the Google Doc** — it now carries a new field (`Votes.created_by`) that Jonathan and Jonah will otherwise not see.
3. **Continue the edit pass.** Projects 16, 17, 15.1+15.2 together, then the social graph. **Project 5 carries a Project 3 dependency** — its session has to state whether any friend-acceptance path stays client-side, because `*3.2`'s owner-only `Friends` rule assumes none does.
4. **Redraft Project 0** last, once the tickets are settled.
