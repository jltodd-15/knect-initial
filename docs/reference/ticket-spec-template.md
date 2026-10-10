# Knect Ticket Spec Template

Use this for every ticket before generating any code with AI. The goal: nothing gets built until the data/security implications are decided, so nothing drifts later.

**Updated 8/26/26** for Claude Code as the implementer rather than a human developer. Two things changed: the section structure now matches what the roadmap tickets actually use (five numbered sections), and three items were added that a human would infer and an AI won't.

---

## [Project Number]. [Ticket Name]

**Status:** Not started / In progress / Done (date)
**Depends on:** [tickets that must land first] · **Blocks:** [tickets waiting on this]

**1 - User Story (or Goals)**
As a [user type], I want to [action], so that [outcome].
*(If there's no clean single-sentence story, "Goals" as a short bullet list is fine — don't force one.)*

**2 - The Architecture & Technical Details**
- Target Database Collection(s)
- **Data model changes** — write "None" explicitly if nothing new. Never leave blank. Diff against the master schema; don't redefine it.
- Core logic / flow description
- Edge cases — what happens if [X fails / is missing / is duplicated]?
- Known bugs to avoid — reference actual codebase state, not memory

**3 - The UI and Layout Requirements**
- Loading state
- Empty state
- Error state
- Success state
- Any other states specific to this feature

**4 - Security and Scope**
- **In scope** — exactly what this ticket includes.
- **Explicitly out of scope** — what it does NOT do.
- **Files this ticket may modify** — an explicit allowlist. Anything not listed is out of scope by default.
- **Security rules changes** — who reads, who writes, any new `allow` conditions, anything exposed that should stay private. Write "No changes needed" explicitly if true.
- If a known bug from section 2 creates a security exposure, flag it here too.

**5 - Acceptance Criteria**
- Specific and testable — "user cannot see another user's `private_info`," not "security works correctly."
- **Verification commands** — the exact commands to run. `npm run lint`, `npm test`, specific greps.

**If anything here is ambiguous, stop and ask rather than picking a plausible default.**
An unanswered question costs a message. A plausible wrong guess about schema shape, a security rule, or scope costs a review cycle and often isn't caught.

**Feed to AI in this order**
1. Data model + security rules first — smallest and most critical; review before anything else.
2. Core logic — pure functions where possible, easiest to review and test in isolation.
3. UI last — lowest risk, easiest to verify visually.

---

### Why the three additions

**Files-to-touch allowlist.** The most common AI failure on a good spec isn't building the wrong thing — it's building four adjacent things nobody asked for, touching files three other tickets depend on. A human infers the boundary from context; an AI doesn't have the context.

**Verification commands.** Without them, "done" means "the code compiles." With them, the implementer checks its own work before handing it back.

**Stop-and-ask.** No spec is complete. The question is only whether the gap surfaces as a question or as a silent plausible guess — and the guess is the expensive one, because it looks correct in review.

### Why the feed order matters

Vibe-coded apps fail at steps 1 and 2, not step 3 — code that *looks* right in the UI with broken access rules or data assumptions underneath. Reviewing rules and data logic before the UI exists catches the expensive mistakes while they're still cheap.
