# Knect tickets — index

Every Knect ticket, plus the decisions and reference docs they depend on, in one file for the repo. Assembled 2026-10-09 (v2) from the Knect Project docs and the "Projects" and "Firebase Master Schemas" Google Docs.

**Conflict rule (Kyson, 2026-10-09): the most recently made ticket or doc wins.** Project 18 (2026-10-09) is the newest design source. Section 3.3 lists every conflict this rule settles and the edit it implies; section 3 only leaves open what no doc has decided.

## How this was split (2026-10-09)

The assembled file was 9,931 lines. It now lives as separate files, with the text between its markers unchanged:

- [`ROADMAP.md`](ROADMAP.md) — sections 1–3: the roadmap table, the standing rules, and the open decisions and required edits. "Section 3" in any ticket means section 3 of that file.
- [`tickets/`](tickets/) — section 4 (34 written tickets, including `appendix-a-b.md`) and section 5 (16 stubs). File names drop the `*` star (`*2.2` → `2.2.md`).
- [`reference/`](reference/) — section 6 (17 reference docs).
- [`design/`](design/) — the design handoff exported from the Knect Design canvas. Its own `README.md` is the index. Where a ticket names a canvas board (`screens/Planner`, `flows/CreateAllDay`), the board is the file of the same name in `design/app-screens/` or `design/planner-and-plans/`.

Nothing was dropped: every line of the assembled file is in one of these files or on this page. Edit tickets in place from here on; there is no second copy to keep in sync.

**Two files in the repo root predate this folder and still stand.** The root [`ROADMAP.md`](../ROADMAP.md) holds the build notes for what has landed; `docs/ROADMAP.md` is the ticket index and the open decisions. The root [`MASTER_SCHEMA.md`](../MASTER_SCHEMA.md) is the copy `CLAUDE.md` names as the authority; `reference/master-schema.md` is the fuller working copy. Until the two schema files are reconciled in their own session, a field that differs between them is a stop-and-ask.

## How to use it

**Every later session:** load `docs/ROADMAP.md` plus only the ticket file(s) being worked. Open a `docs/reference/` file only when a ticket or section 3 points at it — field names: `master-schema.md`; a ruling code (O6, Q7, R13, J1, F2, S4): `decision-log.md`, `round-10-standing-rulings.md`, `project-16-phase1-decisions.md`, or `master-schema.md` Part 4 (Q-codes). Never build from a stub. Never build a ticket with an unticked **blocks build** item in section 3.

**Formatting note for section 4.** Tickets 5, 6, 7, 8, 9, 11, 12, 13.1, 13.2 and 15.1 exist only in the "Projects" Google Doc and are copied from its Markdown export, which renders the Doc's code font as backticks. Read through them; they aren't code. Those ten have not been through the edit pass, so newer rulings override them — section 3.4 lists each conflict.

## Written tickets (`tickets/`)

Thirty-three ticket documents (Project 18's document holds sub-tickets 18.1–18.5), then Appendix A & B, which every UI ticket references. Text between the markers is copied unchanged from its source; the only additions are the marked **Split plan** blocks.

## Stubs (`tickets/`)

## 5. Tickets not written yet

## Reference docs (`reference/`)

Copied unchanged into `docs/reference/`. These are inputs to writing and editing tickets, not tickets. Staleness, per the newest-doc rule:

- `master-schema.md` — Working copy — the only source for field names. Newer than the Google Doc mirror.
- `firebase-master-schemas-gdoc.md` — Published Google Doc mirror. Its "Current Firebase rules" section is the 5/11/26 rules text `*3.1` transcribes. Older than master-schema.md (still shows `(Private ID)`, no deferral marks on `is_active`/`updated_at`).
- `decision-log.md` — Rulings S/R/O/J/F, Parts 1–13. Projects 16/17 and Round 10 not folded in yet.
- `round-10-standing-rulings.md` — Project 1/2 rulings. Its own ticket numbers (1.3 = onboarding, *1.4 = social) predate the §9 swap.
- `project-16-phase1-decisions.md` — Project 16/17 rulings. "RSVPs locked once it resolves" and "alternatives only while proposed" are superseded (Q7; 18.5).
- `ticket-split-index.md` — Provenance record. Newest planning doc (2026-10-08).
- `ticket-restructure-plan.md` — Split maps for 15.2, 16, 17. §2 star list and §7 superseded.
- `edit-pass-brief.md` — How an edit-pass session runs. §4 still says clone `auth`.
- `ticket-spec-template.md` — The ticket format.
- `implementation-start-guide.md` — Build order, session splits, pre-flight checklist (2026-09-11).
- `claude-code-operating-notes.md` — Session splitting and permission modes. §4 GEMINI key item is done; branch guidance stale.
- `start-here.md` — Orientation and standing decisions (2026-09-10). Partly superseded — see section 3.3.
- `running-order.md` — Stale (2026-08-31). Kept for its sequencing traps F1–F14.
- `roadmap-change-list.md` — Original gap analysis (2026-08-14). Partly stale — verify every claim; read only the section for the project being edited.
- `codebase-reconciliation.md` — What existed at `8493a36`. Project 1/2 rows superseded.
- `codebase-audit.md` — Stack facts and provenance (§0). §5's "15 call sites" is wrong (14).
- `project-0-stack-and-conventions.md` — Stale draft (2026-08-25); every open [DECISION] in it is resolved. Reference only.
