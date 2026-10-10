# Knect — Implementation Start Guide

**What this is:** how to go from "tickets are written" to "code is being committed." Written 2026-09-11, updated the same day after Kyson's first pass at the checklist. Covers the pre-flight checklist, git in plain language, and the session-by-session build order for every ticket that has been through the edit pass.

**This replaces nothing.** START_HERE is still orientation; the Ticket Split Index is still provenance. This is the doing document.

---

## Part 1 — Before you open Claude Code

| # | Do this | Status | Blocks |
|---|---|---|---|
| 1 | Confirm git works: `git config user.name` prints your name | ✅ **Done** | Everything |
| 2 | Install Homebrew, then `brew install gh`, then `gh auth login` | ⬜ **Blocked — see below** | Pushing any work |
| 3 | Get **write access** to `github.com/jltodd-15/knect-initial` from Jonathan | ⬜ **Blocked — see below** | Pushing any work |
| 4 | Clone the repo, check out `auth` | ❓ **Unconfirmed — verify below** | Everything |
| 5 | **Enable the Email/Password provider** | ✅ **Done** | 1.2 can't be verified at all |
| 6 | **Turn email enumeration protection OFF** | ✅ **Done** | `*1.3`'s account linking |
| 7 | Write `CLAUDE.md` (~60 lines, invariants only) in the repo root | ✅ **Done** | Not a blocker, but every session is worse without it |
| 8 | **Password policy: 8–24 chars, one capital, one number** | ✅ **Done 2026-09-11** | 1.4's regex must mirror it |

### Item 2 — `gh: command not found`

`gh` isn't installed, and installing it needs Homebrew (macOS's installer for command-line tools) first.

```bash
# Install Homebrew. It will ask for your Mac password.
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

When it finishes it prints two `export` commands under **"Next steps."** Run those — that is what makes `brew` findable by the terminal. Then:

```bash
brew install gh
gh auth login
```

Answers for `gh auth login`: **GitHub.com** → **HTTPS** → **Yes** (authenticate git) → **Login with a web browser**. It shows a code, you paste it into the browser page it opens, and you're done permanently.

### Item 3 — write access is not the same as public

**Public means anyone can read the repo. It does not let anyone write to it.** These are separate settings and confusing them is the most common GitHub misunderstanding. You can clone a public repo you have no write access to, work in it all day, and only discover the problem at `git push`.

Send Jonathan this:

> github.com/jltodd-15/knect-initial → **Settings** → **Collaborators** (left sidebar) → **Add people** → `kysonallstar` → role **Write** → Add.

You'll get an email invite; accept it and `git push` works.

**You are not blocked while you wait.** Clone, branch, and commit locally — commits are local until pushed anyway, so nothing is lost. Only the upload waits.

⚠️ **Separately: private repos are free on GitHub, and have been for years.** Whatever required a subscription earlier, it was not repo privacy — most likely GitHub Actions minutes or an org feature. Worth revisiting: a public repo means the roadmap, the rules file and the Firebase config are readable by anyone who finds it. None of that is a credential leak (J6 ruled `google-services.json` is a client config, not a secret, and the `GEMINI_API_KEY` was revoked 2026-09-03), but it should be a choice rather than an accident.

### Item 4 — confirm the clone

```bash
cd ~/knect-initial && git status
```

- Prints `On branch ...` → you're set. If the branch isn't `auth`, run `git checkout auth`.
- `no such file or directory` → not cloned yet: `git clone https://github.com/jltodd-15/knect-initial.git`
- `not a git repository` → you have the files but not the repo. Delete the folder and clone fresh.

### Later, not now

- **Create the Firestore database in `knect-db`** — before ticket 2.1. Creating it permanently fixes Native mode and the region, so do it deliberately.
- **Install a Java JDK 11+** (`brew install openjdk@17`) and run `firebase login` — before `*3.1`. The Firestore emulator is a Java program. Gates all four Project 3 tickets. (Needs Homebrew from item 2, so that unblocks this too.)
- **Paid Apple Developer membership (~$99/yr)** — before `*1.3` only. The only thing in Project 1 that costs money.

---

## Part 2 — Git, explained simply

### What git actually is

Git is a save-game system for a folder. You work normally, and at points you choose, you take a snapshot ("commit"). Every snapshot is permanent and you can go back to any of them. GitHub is a website that stores copies of those snapshots so other people can get them.

Three ideas and you have the whole model:

- **A commit** is a labeled snapshot of the whole project.
- **A branch** is a line of commits with a name. One per ticket, so your work-in-progress never sits on top of everyone else's.
- **Push / pull** are upload and download, between your Mac and GitHub.

### One-time setup

```bash
git config --global user.name "Kyson"
git config --global user.email "kysonallstar@gmail.com"

gh auth login          # see Part 1 item 2

git clone https://github.com/jltodd-15/knect-initial.git
cd knect-initial
git checkout auth
```

That's the last time you run any of those.

### The loop you actually repeat

```bash
git checkout -b ticket/0.1     # 1. start a ticket

#    2. ... do the Claude Code session ...

git status                     # 3. what changed?
git add -A                     # 4. include it all
git commit -m "0.1 session A: register Root, fix StatusService"
git push -u origin ticket/0.1  # 5. upload (first time on this branch)
git push                       # 5b. upload (every time after)
```

Read it as a sentence: *make a workspace → do work → look at it → save it → upload it.*

### The five worth knowing by heart

| Command | Plain English |
|---|---|
| `git status` | "What have I changed, and is it saved?" |
| `git add -A` | "Include all of it in the next snapshot" |
| `git commit -m "..."` | "Take the snapshot, label it this" |
| `git push` | "Upload my snapshots to GitHub" |
| `git log --oneline` | "Show me my last snapshots" |

**`git status` is the important one.** Claude Code runs the others and narrates what it did. You need to answer "is my work saved?" yourself, because that is what makes `/clear` and `/rewind` safe.

### Four things that will confuse you the first week

- **`add` then `commit` is two steps.** `add` puts it in the box, `commit` seals the box.
- **A commit is local until you push.** Committing does not upload.
- **You are always "on" a branch.** `git status` says which on its first line. Being on the wrong one is the most common beginner mistake.
- **`/rewind` in Claude Code is not git.** It undoes edits Claude's file tools made — **not** `rm`, `mv`, or `npm uninstall`. Ticket 0.1 Session B does all three, so commit before it and after it.

### If something goes wrong

```bash
git status              # always start here
git diff                # exactly what changed, line by line
git checkout -- <file>  # throw away my changes to one file (unsaved work is gone)
git log --oneline       # what have I committed
```

Beyond that: **do not run commands you found online.** Paste `git status` output into a Claude session and ask. `reset --hard` and `push --force` are the only commands that can lose committed work, and neither is ever needed in this workflow.

---

## Part 3 — Project 0 and `CLAUDE.md`

**Split the work in two.** They have different readiness dates.

**`CLAUDE.md` — done.** ~60 lines, repo root, loads on every session. Everything in it is already settled and won't move as the edit pass continues: the `71a7c07` authorship warning (**where generated shapes disagree with the Master Schema, the schema wins** — the single highest-value line in the file), the data conventions, "treat every storage call as async," and the allowlist + stop-and-ask rules.

Expect to amend it two or three times over the first few tickets. That's correct — a `CLAUDE.md` never corrected by a real session is a guess. Verify it loads with `/context`; it should appear under **Memory files**.

**Project 0, the conventions doc — still last.** Styling tokens, feed order, negative-grep criteria, Appendix A/B. Those genuinely move as tickets get edited. Per Operating Notes §1.1 it lives in `.claude/rules/` split by path glob, not in `CLAUDE.md` — it is ~4,000 words and loading it whole makes Claude follow it *less* reliably.

---

## Part 4 — The build order

Left to right. 🧑 = human task, no Claude Code session.

| Step | Ticket | Sessions | Notes |
|---|---|---|---|
| 1 | 🧑 **Finish pre-flight** | — | Items 2, 3, 4 |
| 2 | **0.1** Repair the Boot Path | **3** | **A:** boot path (`index.js` → `Root`, ProfilePage loader IIFE, StatusService) · **B:** cut Gemini (deletes + `npm uninstall` — commit before and after) · **C:** the async conversion. Split already in the ticket; C splits to C1/C2/C3 if it runs long |
| 3 | **0.2** iOS Firebase & Xcode Setup | **1** | ⬆️ **Moved up 2026-09-11 — Xcode is installed, so this is no longer deferred.** Bundle ID, Podfile/target mismatch, `GoogleService-Info.plist`, `FirebaseApp.configure()`, privacy manifest. **Free Apple ID is enough.** Revert any hand-edits to `ios/` first |
| 4 | **1.1** Replace the Native Bridge | **1** | Delete the Kotlin bridge, install RNFirebase, reconcile Gradle, fix `.gitignore`. **Add `.firebaserc` to its acceptance criteria** — the current list checks only three of the four ignored files |
| 5 | 🧑 **Create the Firestore DB** in `knect-db` | — | Permanent choice of Native mode + region |
| 6 | **2.1** Firestore Setup & Persistence | **1** | JS install only. `android/app/build.gradle:121` already declares the artifact — a Gradle edit here is a stop-and-ask |
| 7 | **1.2** Auth Flows & Session | **2** | **A:** the four auth calls + `onAuthStateChanged` with teardown, kill the `setTimeout`, `knect_session` and `keyChain` · **B:** the seven screen states + error-code mapping |
| 8 | **`*2.2`** ⭐ The Users Document | **2** | **A:** schema-shaped types + the field table · **B:** the two-document batch write, wired from `handleProfileComplete`. **Manual approval mode** — defines the shape 4, 5, 6, 7 and 13.2 all read |
| 9 | **2.3** Signup States & Detection | **1** | Verify the offline-hangs finding on a device before building around it — with persistence on, `commit()` may never reject |
| 10 | **1.4** Onboarding Sequence | **3** | **A:** step machine + the two bugs + back route + the password rule · **B:** the 35-value interests picker · **C:** initials avatar + orphan-account routing |
| 11 | 🧑 **Java JDK 11+** and `firebase login` | — | Gates every Project 3 ticket |
| 12 | **`*3.1`** ⭐ CLI, Emulator & Harness | **2** | **A:** `firebase-tools`, config files, **transcribe what's actually published in the Console** · **B:** the test harness + two tests. Read the Console first — the mirrored rules are dated 5/11/26 but testing may be running against open test-mode rules |
| 13 | **`*3.2`** ⭐ Rules — User Tree & Activities | **3** | **A:** `Users` / `Private_info` / `Free_Busy` · **B:** `Friends` (the direction-split `create` — the most important deny case in the ticket) · **C:** `Activity_History` / `Liked_Activities` / `Activities`. **Manual approval, permanently** |
| 14 | **`*3.3`** ⭐ Rules — Chats, Votes & Events | **3** | **A:** `Chats` + `Messages` · **B:** `Votes` · **C:** `/Events/` + the three-window RSVP clause. Highest-risk ticket in Project 3 |
| 15 | **`*3.4`** ⭐ Rules Realignment & Audit | **1** | Audit only. Read Project 5's status first — the `Friends` owner-only rule depends on no client-side acceptance path existing |

**Still deferred:** **`*1.3` Google & Apple Sign-In — 2 sessions.** Needs the paid Apple account, plus regenerating `google-services.json` with debug **and release** SHA-1. Safe to defer — nothing else in the roadmap breaks. 1.4 is built to accept a pre-filled identity either way.

### Permission mode by ticket

| Tickets | Mode |
|---|---|
| 0.1, 0.2, 1.1, 1.2, `*1.3`, 1.4 | Plan → **Manual** (approve every edit) |
| `*2.2` | Plan → **Manual** |
| Everything touching `firestore.rules` (`*3.1`–`*3.4`) | Plan → **Manual**, permanently |
| UI tickets, after you've done a few | Plan → **Accept edits**, review the whole diff |

### The loop, per session

1. `git checkout -b ticket/<n>` (or stay on the branch for session B of the same ticket)
2. Claude desktop app → **Code tab** → Plan mode
3. Paste the ticket. `CLAUDE.md` loads from the repo automatically
4. **Review the plan before approving it** — this is where scope drift gets caught, not after
5. Run the ticket's acceptance criteria yourself
6. `git status` → `git add -A` → `git commit -m "..."` → `git push`
7. `/clear`

Step 7 is not optional. A session left open re-sends the whole conversation on every request, and the prompt cache expires after about an hour — the first message after a break reprocesses everything.

---

## Part 5 — Standing risks this guide depends on

- 🔴 **The Google Doc and these project docs are two sources of truth, and they already disagree in both directions.** The Doc was newer for 1.2 and 1.4 (the bracket resolutions, folded in here 2026-09-11); these docs are newer for 2.3 (the Doc still shows a sign-out-copy bracket that was ruled on 9/08). "Newer supersedes older" cannot resolve this when both look final. **Recommendation: these project docs are canonical and the Doc is the export for Jonathan and Jonah** — but that is Kyson's call, and either answer is better than the current ambiguity.
- ⚠️ **The password rule now lives in two places** — the regex in `CreateProfilePage.tsx:67` and the Firebase Console policy. They will drift. **The Console is authoritative;** 1.2 maps Firebase's own policy rejection to the same copy as a safety net.
- ⚠️ **1.1's acceptance criteria miss `.firebaserc`.** Either add it there or let `*3.1` fix it — `*3.1` is written to handle both. Without it tracked, `firebase deploy` works on Kyson's Mac and fails on a fresh clone.
- ⚠️ **1.2's `email-already-in-use` copy is load-bearing for 2.3.** It's the only thing telling a bounced user to sign in rather than assume nothing happened.
