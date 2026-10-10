# Claude Code — Operating Notes for Knect

**Created:** 2026-09-02 · **Status:** reference, derived from the official Claude Code docs + this project's own docs
**Full guide:** published as an artifact — "Claude Code for Knect"

This doc records the decisions and findings from researching Claude Code against this roadmap, so a future session doesn't re-derive them. It is not a substitute for the guide; it's the part that affects other Knect docs.

---

## 1. Two findings that change existing docs

### 1.1 🔴 Project 0 cannot be the repo's CLAUDE.md as written

Project 0 §"How to use this" says a copy lives in the repo root as `CLAUDE.md`. The Claude Code docs are explicit that `CLAUDE.md` should target **under 200 lines**, because longer files consume context on every turn and **reduce adherence** — rules get lost in the noise. Project 0 is ~4,000 words across 14 sections. Loaded whole, it would make Claude follow Knect's conventions *less* reliably, not more.

**Proposed structure** (needs Kyson's review before it lands in the repo):

```
knect-initial/
├── CLAUDE.md                     # ~60 lines, invariants only, loads every session
└── .claude/rules/
    ├── firestore-conventions.md  # paths: services/**/*.ts
    ├── styling-tokens.md         # paths: components/**/*.tsx
    ├── security-rules.md         # paths: firestore.rules, storage.rules
    └── known-bugs.md             # no paths frontmatter — short, loads always
```

Files in `.claude/rules/` take YAML frontmatter with a `paths:` glob list and load only when Claude reads a matching file. Risk to watch: a genuinely universal rule filed under a path is a rule that sometimes isn't loaded. When in doubt, root file.

**Highest-value content for the root file** — the things Claude cannot derive from reading the repo, because the repo is wrong and the doc is right:
1. The three-layer authorship warning (`71a7c07` generated most of `components/`, `types.ts`, `services/`; **where those shapes disagree with the schema, the schema wins**). This is the single most valuable line in the file.
2. `snake_case` fields, Firestore `Timestamp` not epoch millis, the four friend-status strings, `Private_info/main`'s fixed doc ID.
3. "Treat every storage and Firestore call as async" — because `utils/storage.ts` exports an async API named `localStorage`.
4. The allowlist rule and the stop-and-ask rule from the Ticket Spec Template.

Run `/init` to generate a starter, then **delete everything it derived from the codebase** (which is what the docs say to cut) and keep only the above. Verify with `/context` — the file should appear under **Memory files**.

**Action:** fold this into the Project 0 redraft (currently item 4 on the Start Here immediate-next list).

### 1.2 The cheap way to raise the testing bar is greps, not tests

Project 0 §11 says "revisit this once we have a read on Claude Code." The read: the docs' central verification principle is *"Claude stops when the work looks done — without a check it can run, you become the verification loop."* Project 0.1's acceptance criteria already do this correctly (`grep -rn "localStorage" ... → no results`, `npm run lint`, "these files unmodified").

**The generalization:** every convention in Project 0 §7 that can be phrased as "this string should not appear here" becomes a machine-checkable acceptance criterion at the cost of one line. Candidates:
- `grep -rn "#8e8e93\|#1c1c1e\|#2c2c2e\|#f2f2f7" components/` → must be empty (iOS gray phase-out)
- `grep -rn "emerald-600\|#059669" .` → must be empty
- camelCase field names in `services/` → must be empty per file touched
- `grep -rn "new Date(" --include=*.ts services/` → review each hit for epoch-millis assumptions

This is a better use of the testing budget than a component test suite, and it does not raise the manual-verification bar for UI/Firestore.

**Action:** add negative-grep criteria to tickets during the 1–13.2 / 15.1 / 15.2 editing round.

---

## 2. Session splitting — the layer the roadmap is missing

Tickets are correctly sized as **units of decision**. Sessions are sized by **context and verifiability**. These are different constraints, so the split belongs at the session layer, not in a ticket rewrite.

**Rules:**
1. One verifiable unit per session — can I check it and commit it before `/clear`?
2. Split at verification boundaries, not file boundaries.
3. If a ticket's own text says "this is most of the work," that sentence is a session boundary. (0.1's Fix 4 note is exactly this.)
4. Keep the Project 0 §14 feed order — data model + rules, then pure logic, then UI. Each phase is a natural session.
5. Mechanical changes across many call sites split **by cluster**, not by count.
6. Don't over-split — each session re-reads the files it needs. Split where file sets genuinely differ.
7. A ticket with an unresolved bracket isn't ready for a session at all.

**Worked example — Project 0.1 in three sessions:**

| Session | Contents | Verify before clearing |
|---|---|---|
| **A** — make failures visible | Fix 1 (`index.js` → `Root`), Fix 5 (`ProfilePage` loader IIFE), Fix 2 (`StatusService` undefined `storage` ref + restore `UserStatus.timestamp`) | App launches; ErrorBoundary fallback renders on a thrown error; `npm run lint`; commit |
| **B** — cut Gemini | Fix 3 in full: delete `geminiService.ts`, `@google/genai`, `.env.local`, `.env.example`; schema-shaped mock; rewire `DiscoveryFeed.tsx` | Discover renders the mock; four files gone; `@google/genai` out of `package.json`; commit |
| **C** — the async conversion | Fix 4: rename the `localStorage` export, `ChatService`'s 14 call sites + 10 methods, ~13 downstream callers, `StatusService:22`, `ProfilePage:76`, `storage.ts:16`, sequence `deleteConversation` | `grep -rn "localStorage"` empty; no unawaited `userStore` calls in `ChatService`; messages + status persist across navigation; `npm test`; commit |

If C alone is too large: **C1** rename + `storage.ts` + `ProfilePage`; **C2** `ChatService` + downstream callers; **C3** `StatusService` + `deleteConversation` sequencing.

**Action:** during the editing round, add a two-or-three-sentence suggested session split under each ticket's existing feed-to-AI note. Cheap to write while the ticket is open; expensive to re-derive at implementation time.

---

## 3. Usage limits — what is and isn't known

- Claude Code on Pro shares **one usage pool** with Claude chat and Cowork. [Certain]
- Limits reset on a **rolling five-hour window**; paid plans add a **weekly limit**. [Certain]
- Anthropic publishes **no absolute figure** for Pro — only "at least 5× Free per 5-hour session." Any hours-per-week number found online is an estimate. [Certain]
- Hitting a limit mid-task does **not** kill the session: Claude Code parks with `Usage limit reached · continuing automatically at <time>` and resumes the task itself after the reset. It re-arms at most twice, then stops with `/rate-limit-options`. [Certain for interactive CLI; Likely for the desktop Code tab]
- **A session left open all day costs usage even when idle** — full conversation is re-sent every request, and the prompt cache expires after ~1 hour on a subscription, so the first message after a break reprocesses everything. [Certain]

**Biggest levers, in order:** `/clear` between fixes (free) · keep `CLAUDE.md` short · mid-tier model for implementation, top model for planning only · plan mode on anything non-trivial · specific prompts · subagents for exploration · `/effort` down for mechanical work.

Run `/usage` — on a paid plan it flags any behavior accounting for 10%+ of recent usage.

---

## 4. Surface and mode decisions

- **Surface:** the Claude **desktop app → Code tab**. It ships Claude Code; no CLI, Node, or terminal install needed. Same engine as the CLI, shares `CLAUDE.md`, settings, MCP servers, and hooks.
- **Permission mode escalation for this project:**
  - Tickets 0.1 and 1 — Plan → **Manual**, approve every edit.
  - Project 3 and anything touching `firestore.rules` — Plan → **Manual**, permanently.
  - UI tickets, after a few — Plan → **Accept edits**, review the whole diff.
  - Auto mode is the account default on Pro for terminal/VS Code sessions; check the desktop selector rather than assuming.
- **Checkpointing is not git.** `Esc Esc` / `/rewind` restores file edits made by Claude's editing tools only — **not** changes made by bash commands (`rm`, `mv`, `npm install`/`uninstall`), and generally not background-subagent edits. Session B of 0.1 involves deletions and a package removal, so: commit at every verified boundary.
- **Prerequisite before any session:** revoke the `GEMINI_API_KEY`. Public repo; deleting `.env.local` leaves the value reachable at `71a7c07`. Claude Code cannot do this.

---

## 5. Not adopted yet, and why

- **Worktrees** — solve parallel-session file collisions. One person implementing one ticket at a time in a defined order doesn't have that problem. Revisit if Jonathan and Jonah implement in parallel; then the thing to know is `.worktreeinclude` for carrying `.env` into fresh checkouts. (Note: the desktop app gives every *parallel* session its own worktree automatically.)
- **Custom subagents in `.claude/agents/`** — the two useful uses (scoped exploration, adversarial diff review in fresh context) are just prompt phrasings and need no config. A `knect-rules-reviewer` with read-only tools is plausible for Project 3, later.
- **Hooks** — the one worth building eventually is a `PreToolUse` hook blocking writes to `components/CreateProfilePage.tsx` and `ChatEventWidget.tsx`. Every ticket's out-of-scope list currently depends on Claude *choosing* to respect it; `CLAUDE.md` is advisory, hooks are deterministic. Worth it after three or four tickets, once there's real data on how often scope drifts.
