# Knect — Ticket Restructure Plan

**Status:** Proposed 2026-08-31, revised the same day to Kyson's session structure. **Needs Kyson's review before the pass starts** — the split maps below are Claude's proposal built from Kyson's rulings, and an error in one propagates into a dozen tickets.

**What this decides:** how big a ticket is, where context lives, how tickets are numbered and marked, how the pass is sequenced, and how 15.2, 16 and 17 break apart.

---

## 1. The sizing rule

**One ticket = one Claude Code session.**

The constraint is **not** ticket count. Ten tickets in a project is fine. The constraint is whether Kyson, Jonathan or Jonah can read the ticket and the diff that comes out of it and know whether it's right. A ticket is too big the moment reviewing it means holding two unrelated kinds of failure in your head at once.

**The practical bar:**

- One kind of code per session — rules, or data layer, or a Function, or UI. **Never a schema/rules change in the same ticket as UI.** They fail differently, they're reviewed differently, and a working screen hides a bad rule.
- One verification method per session. If the acceptance criteria need both the Rules Playground *and* two phones, it's two tickets.
- Roughly three files. More than that is usually two jobs wearing one hat.

**Some projects won't need splitting at all.** 0.1, 9, D9 and D5 are likely one session each already. Splitting a ticket that doesn't need it is a mistake, not thoroughness. Expect a mix — 16 and 17 are the outliers, which is why they hurt.

**Accepted consequence:** several tickets in a row will end with nothing new visible in the app. That's not a lack of progress — it's the part where mistakes are cheap to catch.

---

## 2. The `*` convention — tickets that get extra eyes

**An asterisk before the number marks a ticket that needs more attention than the others** — from Kyson, and specifically from Jonathan and Jonah. `*16.1` rather than `16.1`.

A ticket earns one if any of these are true:

1. **It changes the schema or the security rules.** An error here is invisible in the app and expensive to unwind.
2. **It writes something only the Admin SDK may write.** Those are the trust boundary — status, results, previews.
3. **It's server-side logic that fails quietly.** A tally, a sweep, a trigger. A wrong answer looks exactly like a right one.
4. **It gates App Review** — blocking, reporting, account deletion.

Everything else stays unmarked. **The point of the mark is that it's rare**; if half the roadmap is starred it stops meaning anything.

**Currently earning one:** `*2`, `*3.1`, `*3.2`, `*15.5` (Messages rules), `*16.1`, `*16.6`, `*16.7`, `*17.1`, `*17.6`, `*17.7`, and 13.3 whenever it comes back from deferral.

---

## 3. Where context lives — three layers

### Layer 1 — `CLAUDE.md`, loaded on every session

A page. Always-true rules only, because every ticket pays for every line whether it's relevant or not: stack and commands; `snake_case`; Firestore `Timestamp` never epoch ms; **the schema wins over anything in `components/`, `types.ts` or `services/`**; every `onSnapshot` needs an unsubscribe; never touch a file outside the ticket's allowlist; stop and ask rather than inventing a field name, a rule, or a collection.

### Layer 2 — the repo, written by each project's `.1` ticket

The per-project model — the Events lifecycle table, the vote model — lives **in the code**: the `status` union in `types.ts` with the lifecycle table as a comment block beside it, and the rules in `firestore.rules`. Every later ticket in that project says *read those first.*

**Why:** Claude Code reads the repo far more reliably than it retains a doc pasted at the top of a prompt, and one copy sitting next to the thing it governs can't drift from it.

### Layer 3 — the ticket itself

What this change is, plus **a three-line summary of the part of the model it touches**, for the humans reviewing it. That summary is a third copy and it can drift; it's cheap, and **the repo is authoritative when they disagree.**

### What changes about Project 0

**It splits in two.** `CLAUDE.md` is the page above, versioned in the repo. **Project 0 — Stack & Conventions** stays the longer human-readable doc with the reasoning. Cost: two documents that can disagree. When a convention changes, both get edited — and if that discipline fails, `CLAUDE.md` is the one that's right, because it's what the code is built against.

---

## 4. Numbering — local, with one exception that matters

**One decimal level. No `16.1.2`, ever.**

**Children are numbered inside their parent, in the same session that splits it** — `16.1`, `16.2`, `16.3`. This is local and safe **when the parent has no existing children**, which is almost everywhere.

**🔴 Two parents already have children, and their whole family has to be renumbered in one session:**

- **15** — `15.1` and `15.2` both exist and both split. Split in separate sessions, they produce colliding numbers, and "15.2" silently changes meaning. **Do 15.1 and 15.2 together.**
- **13** — `13.1`, `13.2`, `13.3` exist. Same rule if any of them splits.

**References in other documents break the moment 13 or 15 is renumbered, and they stay broken until the final sweep.** That's expected. Fixing a reference mid-pass, before the numbers have settled, is how they end up pointing at the wrong ticket.

---

## 5. How the pass runs — one session per parent, then one sweep

Splitting a ticket needs *that ticket* plus the schema, the decision log, and the repo. It does not need the other twenty-three. **Only the final cross-reference sweep is global, and it operates on an index table rather than on prose.**

### The main pass — one parent project per session

Update it against every ruling → add what later decisions gave it → reconcile its section of the Change List → split it if it needs splitting → number the children → append to the index → **stop.**

All in one session, because the alternative is one session reading the ticket, the schema and the decision log to make edits, then a second session reading all three again to split it. Same reasoning done twice, with a chance to diverge in between.

### The sweep — one session, last

Every stale reference fixed against the index: the tickets themselves, the Running Order's two orders and its implementation graph, the Decision Log's propagation lines, the Master Schema's ticket column, the reconciliation's verdict table, START_HERE's doc table.

### Then the export

Kyson reviews ticket by ticket **in the project** — one document at a time, drop the `(r)` as each clears. **The Google Doc comes after that review**, and it exists for Jonathan and Jonah. Claude cannot write Google Docs (Decision Log, Round 6), so that export is structured by hand, once, from already-reviewed content.

---

## 6. What a resized ticket looks like

Same five sections. Shorter, and two of them get **more** important, not less:

1. **User Story** — one sentence. For a data-layer ticket it's the parent's story, scoped down.
2. **Architecture & Technical Details** — the three-line model summary, then what this ticket does. Known bugs only if this ticket's code path touches them.
3. **UI & Layout** — often "No UI. This is a data-layer ticket." Written out, not left blank.
4. **Security and Scope** — **the files allowlist matters more at this size, not less.** A small ticket with a vague allowlist is exactly where Claude Code helpfully fixes four adjacent things. "Security rules changes: none" gets written out rather than implied.
5. **Acceptance Criteria** — ideally under a dozen, all checkable by the ticket's single verification method.

The **feed-to-AI ordering** note disappears from most tickets. It existed to sequence work *inside* an oversized ticket; at this size the ticket number is the ordering.

---

## 7. Project 3 — implemented twice, so it's two tickets

Kyson's ruling: the rules are important and awkward, so Claude Code writes them **right after Project 2**, and then again **after everything else is written**, to confirm they still hold.

- **`*3.1` — Initial security rules.** Right after Project 2. The rules file moves into the repo as `firestore.rules`, deployed by CLI. **It also creates `firestore.indexes.json`** — the file has needed an owner since F8, and this is the same "config lands in the repo" job. Later tickets add their own indexes to a file that already exists.
- **`*3.2` — Rules realignment & deny-case audit.** After every other ticket is written. The full hardening pass, plus the Rules Playground deny cases run as a suite.

**16.1 and 17.1 each write their collection's rule block. Those are drafts that 3.2 audits**, not competing versions — 3.1 establishes the file, each schema ticket adds its block, 3.2 hardens the whole thing at the end.

---

## 8. Small items that fold into existing umbrellas

| Item | Folds into |
|---|---|
| `firestore.indexes.json` creation | **`*3.1`** |
| Per-ticket composite indexes | Each ticket that needs one adds it to the existing file |
| The in-chat activity card variant | Appendix B |
| The vote card variants | Appendix B |
| The three listener conventions | Project 0's redraft |
| The shared scheduled sweep convention | Project 0's redraft |

**Still needing their own tickets, unowned today:** iOS Firebase setup · content reporting (13.3, deferred) · group-chat self-join · published contact information (a launch-checklist item, not a ticket).

---

## 9. Project 15.2 → eight tickets

Kyson ruled that 15.2 gets resized **even though it was written, reviewed and cleared** — he'll be re-reviewing every ticket anyway, and bite-sized is faster to re-review than re-reading one large ticket to find what changed.

**Do this in the same session as 15.1**, per §4.

| Ticket | Scope | Verified by |
|---|---|---|
| **`*` Messages schema & rules** | The `message_type` union, `deleted_at`, `event_id`, `vote_id`, the full Messages rule block, the 2,000-char cap, the chat-list index | Rules Playground |
| Message repository & the two listeners | Delete `ChatService.ts`, build the repository, both listeners with teardown, 25-message pagination with the `startAfter` cursor | Emulator + two devices |
| The send path | Optimistic send, the failed state, tap-to-retry, long-press to discard | Two devices |
| The preview Cloud Function | `recent_message`, `recent_message_timestamp`, `recent_message_sender_id`, on create **and** update | Emulator |
| Tombstone delete | Sender-only update, "Message deleted" in place, preview cleared | Emulator + the thread |
| Sender identity resolution | Live name and picture, deduped and session-cached, "Deleted user" fallback | A 100-message thread issues 4 reads |
| Blocking | The receive-side filter in all three places, the send-side input gate | Two accounts |
| Device-local unread | AsyncStorage last-read, the dot, clearing on open | One device, reinstall |

**15.1's split isn't mapped here** — it wasn't re-read while writing this plan, and guessing at it is exactly the failure this document exists to prevent.

---

## 10. Project 16 → eight tickets

| # | Ticket | Scope | Verified by | Depends on |
|---|---|---|---|---|
| **`*16.1`** | Events schema & rules | The `/Events/` rule block, the widened Messages `create` rule, `Events`/`Message` types, the lifecycle comment block, composite indexes | Rules Playground | 3.1 |
| **16.2** | Events repository & the proposal write | Repository module; the batched Event + message write with `event_id` linking them | Emulator | 16.1 |
| **16.3** | The proposal card | Repoint the existing card at the repository; RSVP writes; invitee avatars via the session cache | Two devices | 16.2 |
| **16.4** | The Events listener & planner ghost | The third app-wide listener and its teardown; ghost render; drag/resize locked to personal events | Two devices | 16.2 |
| **16.5** | Entry points | The Discover chooser, the share affordance, the `"activity"` share card | By hand, all three | 16.3 |
| **`*16.6`** | Confirmation | The trigger that confirms on the first non-owner yes, with its re-fire guard | Emulator | 16.2, D2 |
| **`*16.7`** | The resolution sweep | The scheduled Function — `resolves_at`, confirm, expire | Emulator | 16.6 |
| **16.8** | Cancel & Free_Busy | Owner cancel; the `Free_Busy` write on confirmation and its removal on cancel; resolved card states | Emulator + the card | 16.7 |

---

## 11. Project 17 → eight tickets

| # | Ticket | Scope | Verified by | Depends on |
|---|---|---|---|---|
| **`*17.1`** | Votes schema & rules | The `Votes` rule block, `Events.status: "candidate"`, `Messages.vote_id`, types, the vote-model comment block, indexes | Rules Playground | 16.1 |
| **17.2** | Vote repository & creating a vote | The batched write: candidate Event, Vote, vote message, `linked_vote_id` | Emulator | 17.1 |
| **17.3** | Casting ballots | Normal and ranked writes, one key per voter, locked when closed | Emulator + deny cases | 17.2 |
| **17.4** | Adding options mid-vote | Append-only options, `options_revision`, the stale-ballot marker | Emulator | 17.3 |
| **17.5** | The vote card | Pre-vote (no counts), post-vote (counts and names), the re-rank prompt | Look at it | 17.4 |
| **`*17.6`** | **The tally function** | IRV and pick-one. One function, one call site, **unit-tested against fixtures including the inversion case. Wired to nothing.** | `npm test` | 17.1 |
| **`*17.7`** | Closing a vote | The three close conditions, `close_reason`, extending 16.7's sweep | Emulator | 17.6, 16.7 |
| **17.8** | Applying the winner | Write-back to the original, candidate cleanup, unfreezing the event, closed card states | Emulator + the card | 17.7 |

**`*17.6` is the reason this restructure is worth doing.** A tally wired into a Function is a tally nobody tests in isolation, and a wrong tally returns a plausible winner nobody questions. On its own, with fixtures, it's the most testable ticket in the roadmap — and it can be built in parallel with 17.2–17.5, since it only needs the types from 17.1.

---

## 12. Scale, so the work gets planned honestly

Twenty-four projects at this ticket size is roughly **sixty to eighty sub-tickets.** That is not one session, and it isn't two. One session per parent project, with the index as the thing that survives between them.
