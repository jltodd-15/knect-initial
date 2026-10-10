# Knect — Edit Pass Brief

**This is the operating manual for the edit-and-split pass.** A new session reads this first, does **one parent project**, and stops. Nothing here is optional.

**Created:** 2026-08-31. Revised the same day to Kyson's structure: one session per parent project, doing every job on that project at once.

---

## 0. What one session does

For **one parent project**, in this order:

1. **Update it.** Apply every ruling from the Decision Log, the Master Schema, and the Project 16 Phase 1 ledger that touches this project. This is the "edit pass" — bringing an old ticket up to current decisions.
2. **Add what's missing.** Some projects gained scope from later decisions (15.1 has to write `Events.shared_with`; 12 gains the Planner-or-chat chooser). Some gained whole new tickets.
3. **Reconcile against the Change List.** See §6.
4. **Split it** to one-session size, per `Knect_Ticket_Restructure_Plan (r).md`. **Some projects won't need splitting** — 0.1, 9, D9 and D5 are likely already one session each. Splitting a ticket that doesn't need it is a mistake, not thoroughness.
5. **Number the children**, locally — `16.1`, `16.2`, and so on.
6. **Append to the index**, and stop.

**Why all in one session:** the alternative is one session reading the ticket, the schema and the decision log to make edits, then a second session reading all three again to split it. Same reasoning done twice, with a chance to diverge in between.

> ⚠️ **A ruling can change the split, and the restructure plan's map is a proposal rather than a constraint.** Project 3's session is the worked example: two of Kyson's four rulings — an emulator-backed test suite instead of the Console Playground, and one whole rules file instead of per-project blocks — turned the plan's two tickets into four, because the tooling setup and the rules themselves are different kinds of code with different verification methods. **Verify the map against the rulings; don't inherit it.**

---

## 1. Read this much, and no more

1. **`Knect_Ticket_Restructure_Plan (r).md`** — the sizing bar, the `*` convention, the three-layer context model, the format.
2. **`Knect_START_HERE.md`** — process, standing decisions, what's blocking.
3. **`Knect_Master_Schema.md`** — **the only source for field names.** Part 2 summarises the published security rules; **the full current rules are mirrored in the "Firebase Master Schemas" Google Doc under *Current Firebase rules*.** They are readable — read them before writing anything about rules. ⚠️ **Readable is not the same as live:** the mirror is dated 5/11/26 and `*2.2`'s session recorded that testing currently runs against open rules. If a claim depends on what is *actually deployed*, that has to be read in the Console.
4. **`Knect_Decision_Log.md`** — search before treating anything as unresolved.
5. **`Knect_Project_16_Phase1_Decisions.md`** — every Project 16 and 17 ruling. Not folded into the Decision Log yet.
6. **`Knect_Round_10_Standing_Rulings.md`** — every Project 1 and Project 2 ruling. Also not folded in yet.
7. **`Knect_Roadmap_Change_List.md`** — **only the section for this project.** Partly stale; see §6.
8. **`Knect_Ticket_Split_Index.md`** — read at the start, append at the end.
9. **The project's current ticket(s).**
10. **The repo**, where this project touches existing code.

**Do not read the other projects.** They aren't needed, and reading them is how this goes wrong.

---

## 2. Numbering — local, with one exception that matters

**Number the children inside the parent: `16.1`, `16.2`, `16.3`.** No second decimal, ever. This is local and safe **when the parent has no existing children.**

**🔴 Two parents already have children, and they need their whole family renumbered in one session:**

- **15** — `15.1` and `15.2` both exist and both split. Doing them in separate sessions produces colliding numbers. **Do 15.1 and 15.2 in the same session**, number the whole family at once.
- **13** — `13.1`, `13.2`, `13.3` exist. Same rule if any of them splits.

Everywhere else, numbering is a non-event.

**What you do not do:** renumber anything outside the parent you're working on, or fix a reference in another document. References break the moment 13 or 15 is renumbered and **they stay broken until the final cross-reference sweep**, which is its own session. That's expected, not a bug.

> **Project 3 is now `*3.1` through `*3.4`.** The old `*3.1` maps to the new `*3.1` + `*3.2` + `*3.3`; the old `*3.2` (realignment) is now `*3.4`. Every reference to `*3.1` or `*3.2` written before 2026-09-09 points at something that changed meaning — the sweep fixes them.

---

## 3. Rules that keep this honest

These matter more than anything about formatting.

1. **Field names come from the Master Schema. Nowhere else.** Not from the prototype's `types.ts` (generated guesses), not from an older ticket, not from memory. A field you need that isn't in the schema is a finding to flag — not a field to invent. **Project 3's session found the sharp version of this:** Master Schema Part 2 specifies a rule gated on "the vote's creator," and the `Votes` document had no creator field. The rule was **bracketed and put to Kyson**, not written against an invented one — and he ruled the field in (`Votes.created_by`). The bracket was the right move even though the answer turned out to be "add it."
2. **Newer decisions supersede older ones.** If a ticket, the schema, and the decision log disagree, the most recent ruling wins. Don't average them; don't assume the older one was deliberate.
3. **Never resolve an open bracket.** `[DECISION: ...]` and `[RESEARCH: ...]` carry into whichever sub-ticket inherits them. Splitting is not an occasion to decide something Kyson hasn't. **Putting the question to Kyson in-session is fine and encouraged** — what you may not do is answer it yourself.
4. **Never invent scope.** If the original doesn't say it and no ruling adds it, the sub-tickets don't either.
5. **Preserve every technical decision in the original.** Content that doesn't clearly belong in any sub-ticket is a flag for Kyson — not something to drop, and not something to find a home for on your own judgment.
6. **Flag, don't fix.** Contradictions between documents go in the index's flag column with the reasoning.
7. **Cite `file:line` for every codebase claim.** If you can't cite it, you didn't verify it, and you don't write it. This also applies to claims a *document* makes about the code — verify it yourself or write down that you couldn't.
8. **A ruling Kyson makes mid-session gets written into the ticket as if it had always been there.** The dated audit trail belongs in the index; the ticket reads as one coherent brief, not a document with amendments stapled to it.

---

## 4. The repo

`git clone --depth 1 -b auth https://github.com/jltodd-15/knect-initial.git`

**Branch is `auth`, not `main`.** Clone it whenever the project touches existing code — it has already changed decisions in this project, and it's cheap.

---

## 5. What a sub-ticket looks like

The five sections from `knect-project-doc`, at the size in restructure plan §6.

- Header: `**Status:**` / `**Depends on:**` / `**Blocks:**`
- Section 2 opens with the **three-line model summary** — the part of the project's model this ticket touches, for the humans reviewing it.
- Section 4's **files allowlist is mandatory and specific.** At this size a vague allowlist is where Claude Code helpfully fixes four adjacent things.
- Section 4 states security rules changes explicitly, including "No changes needed."
- Section 5's acceptance criteria are all checkable by **one** verification method. Two methods means two tickets.
- `*` before the number if it meets any criterion in restructure plan §2.
- **A human-setup block goes at the top**, above section 1, when the ticket cannot be verified without something Kyson does outside the repo. 0.2, 2.1 and `*3.1` all carry one.

One document per sub-ticket: `Knect_Project_<n>_<n>_<Title>.md`.

---

## 6. Absorbing the Roadmap Change List

`Knect_Roadmap_Change_List.md` is the original gap analysis. It is **partly stale** — much of it was resolved in the Decision Log, and some of it describes a roadmap that no longer exists. It is also a hallucination trap: a session that acts on a stale claim in it will produce a confidently wrong ticket.

**It gets retired incrementally rather than rewritten.** In each session, for the project you're working on:

- Read only that project's section. **Where the project is the subject of Part B items too, read those** — Project 3's section in Part C is six lines, and seven Part B items plus D9 were also its scope.
- For each item: confirm it's already applied, apply it, or flag it as obsolete — **with the reason**, in the index's flag column.
- Never act on a Change List claim without verifying it against the Master Schema, the Decision Log, the mirrored security rules, or the repo first. Its *suggested answers* are the least reliable part of it — but "I can't verify it" is not the same as "it's wrong." Project 2's session recorded one of its answers as unverifiable and then found the evidence in the Google Doc; the answer had been right the whole time. **Go looking before you write the caveat.**

When every project has been through this pass, the Change List has been fully absorbed and gets marked superseded. No separate effort, and nothing is lost on the way.

---

## 7. The index — append every time

`Knect_Ticket_Split_Index.md`, one row per sub-ticket. It is now a **record and a cross-reference input**, not a numbering input — numbering happens in-session. Its job is the final reference sweep and Kyson's own tracking.

It is also where the **provenance** lives — which rulings were made when, which corrections were found, and what stayed open. Per §3 rule 8 the tickets themselves read clean, so the index is the only place that history exists.

**A session that writes sub-tickets and forgets the index has done the work twice.**

---

## 8. Open items — carry these, never resolve them

- **🔴 17's stale-ballot rule** — how a ranked ballot cast against an older option list is tallied.
- **Master Schema Q4's sub-decision** — the `category` value set is confirmed as a concept with six starting values, but O17 wants 15–20 mapping 1:1 to illustrations. Project 8 pins the final list.
- **Master Schema Q8's sub-decision** — whether "an alternative is open" stays derived from `linked_vote_id` or gets a denormalized flag.
- **Master Schema Q9's build call** — the value `"cancelled"` is reserved; whether 17.2 builds the originator-cancel path is that session's.
- **Master Schema Q10** — nothing writes `Private_info.location` or `geohash`, and no ticket owns capturing them.
- **Master Schema Q11** — `status_visibility` has no value set. D5's.
- **Firebase Storage rules** — Master Schema Part 2 item 7, Change List D9. Explicitly out of scope in all four Project 3 tickets and still unowned.
- Whether 15.2's sub-tickets keep its reviewed status or go back to unreviewed.

**Closed since this list was written**, in Project 2's session: **Q1** (`name_lowercase` is a stored field), **Q4** (`category` is in and required), **Q7** (`rsvps` closes when `event_time` passes, not at resolution), **Q9** (Vote `status` is three values) and **Q12** (`is_active` / `updated_at` stay deferred to 13.3). Q7's resolution gave 16.2 new scope — see the Master Schema's Events note.

**Closed in Project 3's session (2026-09-09):** rules are verified by an emulator suite rather than the Console Playground · `*3.x` writes the whole rules file rather than per-project blocks · shape validation is ownership plus a field allowlist · **blocking stays receive-side** — see §9.

**Closed in Project 3's review pass (2026-09-10)**, which took the ticket count from three open brackets to zero: **`Friends` `update` stays owner-only** and acceptance is Function-only · **`Private_info`'s document ID is pinned to `main`** · **`Votes` gains `created_by`**, the only schema addition in Project 3. Each ruling rests on a condition rather than being unconditional — `*3.4` re-checks all three, and §9 carries them.

> ⚠️ **Worth the note for future sessions: two of those three closed only because Kyson pushed back on the draft, and one of his pushbacks found a hole the draft had copied forward from the published rules.** He questioned the `Friends` update rule; the answer was that his constraint was right but belonged on `create`, where the published rule let anyone plant a `close_friend` entry in a stranger's list. **Phase 4 review is not a formality here.**

---

## 9. Already decided — do not re-open

Search the Decision Log, Round 10 and the 16 ledger before treating any of these as open:

- `react-native-firebase`; `geofire-common`; five tabs; React Navigation; `#10b981`.
- Collections are `Users`, `Activities`, `Chats`, `Events`. Fields are `snake_case`. Timestamps are Firestore `Timestamp`.
- No denormalized names or pictures anywhere; "Deleted user" fallback everywhere.
- `name_lowercase` is a **stored** field, computed at write time. Not derived at query time.
- Three app-wide listeners, each with teardown on unmount and background.
- The Events lifecycle is forward-only. `rsvps` is the single representation of "who's coming."
- One vote per event; options append-only; the tally is server-side with one implementation; ties go to the earliest option.
- **The rules live in the repo as `firestore.rules`, deploy by CLI, and are tested against the Firebase Emulator Suite.** Not the Console, and not the Rules Playground.
- **Rules constrain ownership plus a field allowlist and nothing more** — not types, not required fields.
- **`Friends` `update` is owner-only, permanently.** Acceptance runs through `acceptFriendRequest` and cannot be client-side regardless: O4's block check reads a field no client can read, and S4/15.1 requires the chat find-or-create. Owner-only is therefore the *tightest* rule, not a broken one — B9 is closed. **`create` is constrained by direction** (own doc → `request_sent` only; someone else's → `pending` only), which closes a real forging hole. **`close_friend` is one-sided and needs no schema change.**
- **`Private_info`'s rule pins the document ID to the literal `main`.** F2's hot-path split is the only thing that reopens it.
- **`Votes.created_by` identifies who may cancel a vote.** The event owner does not work — the vote's opener is usually not the event's owner, and a freeform vote has no event.
- **Blocking is receive-side, permanently, and that is the decision rather than an interim.** Ruled 2026-09-09 in `*3.3`. `blocked_users` is owner-only, so no rule can check whether the recipient blocked the sender without a new readable block record, a Project 5 write, and a billed `get()` per message. 15.2's receive-side filter is the real protection. **Never describe blocking as enforced** — the messages are still written and stored. Revisit only if 13.3's reporting needs a server-side record.

---

## 10. Deliverable and stopping point

At the end of a session: the sub-ticket documents in the project, new rows in the index, and a short summary to Kyson of what split, what got a `*`, what got flagged, and what the Change List had for this project.

**Then stop.** Don't start the next project, and don't touch cross-references in other documents — the reference sweep is its own session, and it runs last. **The one exception is a question Kyson closes in-session:** a settled question that still reads as open elsewhere will get re-asked, so fix it where it's stated and say which documents you touched.
