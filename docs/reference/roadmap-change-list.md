# Knect Projects Roadmap — Change List

**Purpose:** everything that has to change in the Projects Roadmap doc before it's safe to hand a ticket to Claude Code and get back something you'd actually merge.

**Ground rule for this whole list:** the docs are the source of truth. The existing repo was mostly AI-written as a baseline — where code and doc disagree, the code changes. Nothing below is "match the doc to the code."

**How to read the priorities:**

- 🔴 **Blocker** — a Claude Code session on the affected ticket will produce broken or insecure code without this. Fix before writing any prompt.
- 🟡 **Needed** — AI will silently invent an answer. Usually recoverable, but you'll waste a session.
- ⚪ **Polish** — hygiene. Do it in a batch pass.

---

# Part A — Doc-level changes (apply once, across every ticket)

### A1. Fix the numbering 🔴

The roadmap index restarts at 1 in every phase, so Phase 2 item 1 is actually Project 4, and Phase 5 item 4 is Project 21. The ticket bodies below use the real continuous numbers. Right now the index and the bodies don't agree, and any reference to "Project 13" is ambiguous.

**Change:** renumber the index continuously 1–21 so the index and the ticket headings match exactly.

### A2. The 13.x numbering contradicts itself 🔴

- Index says: 13 = Discover Search & Algorithm, **13.1 = Tag_Affinity_Scores**, **13.2 = User Generated Content**
- Ticket bodies say: **13.1 = Search Bar & Algorithm**, **13.2 = Tag Affinity Scores**, **13.3 = User Generated Content**

**Change:** pick one. Recommend the ticket-body version (13.1 / 13.2 / 13.3) since those are already written, and update the index. Then delete the bare "13" heading so there's no parent ticket that could be prompted by accident.

### A3. Standardize every ticket to the 4-section format 🟡

Current drift:

| Ticket | Problem |
|---|---|
| 1 | Sections are ordered User Story → **UI** → **Technical** → Acceptance (2 and 3 swapped vs. everything else) |
| 2 | Section 2 is titled "UI & Layout Requirements (Loading States)" — non-standard |
| 3 | Has a non-standard section 2, "The Privacy Dilemma," and no UI section at all |
| 4 | Has **five** sections plus a "3.2" sub-section, and puts Technical in slot 4 |
| 5 | Has six sections; adds "Required Denormalized Data Payload" as its own numbered section |
| 6–13.2 | Broadly correct (1 Story / 2 Architecture / 3 UI / 4 Acceptance) |

**Change:** rewrite all of 1–5 to the standard four:

```
1 - User Story (or Goals)
2 - The Architecture & Technical Details
3 - The UI and Layout Requirements
4 - Acceptance Criteria
```

Ticket 3's "Privacy Dilemma" and ticket 5's "Denormalized Data Payload" move *inside* section 2 as sub-bullets — don't delete the content, it's good, it's just in the wrong slot. Ticket 4's "Global Navigation Updates" and "3.2 User Profiles" fold into section 3.

### A4. Every ticket needs an explicit **Data model changes** line 🔴

Right now, most tickets imply schema changes by writing field names into prose. Claude Code will invent fields that aren't in the master schema and you won't notice until two tickets later.

**Change:** add to section 2 of every ticket, without exception:

> **Data model changes:** None. *(or: adds `field_name (Type)` to `Collection/Doc` — see master schema)*

"None" must be written out. Blank is not an acceptable answer.

### A5. Every ticket needs an explicit **Security rules changes** line 🔴

Only Project 3 mentions rules at all. This is the single most dangerous gap in the doc — it's exactly the failure mode your own ticket template was written to prevent, and the template isn't being applied.

**Change:** add to every ticket:

> **Security rules changes:** No changes needed. *(or: the exact `allow` conditions being added/modified, written out)*

### A6. Decide whether **Security and Scope** becomes a real section 5 🟡

Your ticket-spec template has In scope / Out of scope / Security rules as first-class items. The roadmap doc doesn't. Two options:

- **(a)** Add a fifth section, `5 - Security and Scope`, to every ticket. Cleanest for Claude Code — scope boundaries are the main thing that stops it over-building.
- **(b)** Keep four sections, fold in-scope/out-of-scope bullets into section 2 and the rules line into section 2 as well.

**Recommendation: (a).** The out-of-scope list is doing real work here — several of your tickets bleed into each other (8 into 11 and 12, 4 into 5 and 7), and an explicit "this ticket does NOT do X" is the cheapest fix. But this is your call, not mine — it's a permanent structural change to a doc you've kept deliberately lean.

### A7. Fix every broken cross-reference 🟡

Every internal link in the doc points to `about:blank` — the roadmap index items, "as outlined in project 8," "more details in project 4 under 3.2," "previously explained in project 8." Project 3's "Current security rules" link points at the Projects doc itself, not the schema doc.

**Change:** replace with real Google Doc heading anchors, or — better for Claude Code, which can't follow links out of a pasted prompt — replace with plain text like *"see Project 8 §2, Data Payload."* Links are useless in a pasted prompt; a section pointer isn't.

### A8. Add a dependency line to every ticket 🔴

Claude Code has no way to know that Project 12 can't be built before Project 11's data layer exists, or that Project 13.2 needs a click-tracking path that no ticket currently defines.

**Change:** add one line under each ticket heading:

> **Depends on:** 11 (feed data layer), 8 (Activity schema in code). **Blocks:** 16.

### A9. Add a status line to every ticket ⚪

**Change:** `**Status:** Not started / In progress / Done (date)`. Project 3 in particular may already be done — the rules are written and dated 5/11/26 in the schema doc. Confirm with Jonathan and mark it.

### A10. Add a **Project 0: Stack, environment & conventions** preamble 🔴

This is the biggest single thing standing between this doc and a usable Claude Code prompt. Right now nothing in the roadmap states:

- React Native version, and bare RN vs. Expo (the Dev Knowledge Base implies bare RN + `npx react-native run-android`)
- TypeScript or JavaScript
- Firebase SDK: `@react-native-firebase/*` (native modules) or the JS `firebase` web SDK — **these have completely different APIs and Claude Code will guess**
- Navigation library (React Navigation? which navigator types?)
- Styling approach — `emerald-600` and `Knect green` are Tailwind tokens, which implies NativeWind or a token file, but the doc never says which
- State management / data-fetching layer (plain hooks? Context? Zustand? React Query?)
- Folder structure and where services live (the audit notes reference `ChatService.ts` / `StatusService.ts`, so there's an existing convention)
- Testing: is there any? What does "done" mean without it?
- Minimum iOS/Android versions

**Change:** write this as Project 0 at the top of the doc, and keep a copy as a `CLAUDE.md` in the repo root so every Claude Code session picks it up automatically instead of you pasting it each time.

### A11. Add a **Design tokens & dark mode** appendix 🔴

You flagged this yourself in Project 4's closing note — that coloring and dark mode are best decided once, for the whole app, for cohesiveness. Until it's decided, every ticket that says "emerald-600" or "depending on dark mode" is an invitation for Claude Code to hardcode a different hex in each screen.

**Change:** an appendix defining, once:

- Named color tokens (primary/`emerald-600`, danger red, surface, surface-dark, text-primary, text-secondary, disabled gray) with actual values for both modes
- How dark mode is detected and switched (system preference? the toggle referenced in Project 7?)
- Type scale and spacing scale
- Where the tokens live in code (a theme file — name it)

### A12. Add a **shared component inventory** appendix 🟡

At least five tickets say "use the same error state as before" or "same as the activity card." That only works if the component is defined once and named.

**Change:** define and name these, then reference the name in tickets instead of re-describing them:

| Component | Currently described in | Used by |
|---|---|---|
| Error state (circle + `!` + message) | 6, 8, 11, 12, 13.1 | most screens |
| Skeleton loader card | 11, 13.1 | 11, 13.1 |
| Activity card | 8 §3 (misplaced — see C8) | 11, 12, 16 |
| Tag chip | 12 ("same as profile page") | 12, profile |
| Friend/action button (4 states) | 4 §3.2 **and** 5 §5, with different copy | 4, 5, 7 |
| Profile header block | 7 | 7, profile tab |

### A13. Fix terminology drift ⚪

Pick one term each and sweep the doc:

- "Planner tab" (12) vs. "Calendar" (18) vs. the tab the user lands on after signup (1, 2) — three names, possibly one screen
- "Close Friends" widget vs. `close_friend` status vs. `"close friend"` (with a space) in the schema
- "Discover tab" vs. "activities tab" (11 §4)
- "Events" vs. "Calendars" collection — see B1, this one is a real bug, not just wording

### A14. Delete the junk heading ⚪

There's a stray `# Tab 25` heading between tickets 15.1 and 16. Delete it.

### A15. The `*` legend has no matching marks ⚪

Bottom of the index reads *"\* = Delayed until after beta launch, for simplicity reasons"* but nothing in the list is actually marked with `*`. Projects 10 and 19 are the deferred ones.

**Change:** mark 10 and 19, or replace the legend with a `**Status:** Deferred` line per A9 and drop the asterisk convention.

---

# Part B — Schema and rules contradictions

These are the expensive ones. Every item here will produce code that looks correct and fails at runtime or leaks data. Resolve all 🔴 items **before** prompting any ticket that touches them.

### B1. `Events` vs `Calendars` collection name 🔴

Master schema defines **`Collection: Events`**. The published security rules protect **`match /Calendars/{eventId}`**. There is no rule covering `Events`, and the global deny at the bottom means **every read and write to `Events` is currently blocked.**

**Change:** pick one name, update both docs, and note it in Projects 16, 17, and 18.

### B2. `Liked_Activities` — subcollection or array? 🔴

- Master schema: `Subcollection: Liked_Activities`, one doc per activity, with `saved_at`
- Project 11 §2: "add that activity ID to that User's `liked_activities`"
- Project 12 §2: "check if the activity is in their `liked_activities` **array**"

Three descriptions, two data shapes. And it matters for cost: prefilling heart icons on a scrolling feed from a subcollection means one read per card.

**Change:** decide. Suggested framing for you to rule on — keep the subcollection as the record of truth (you want `saved_at`), **and** add a lightweight `liked_activity_ids (Array of Strings)` on the user doc purely for UI prefill, capped like the tag scores are. If you don't want the duplication, say so and the feed prefills from a locally cached set instead.

### B3. `creator_id` is required by the rules but doesn't exist in the schema 🔴

Published rules:

```
match /Activities/{activityId} {
  allow create: if request.auth.uid == request.resource.data.creator_id;
  allow update, delete: if request.auth.uid == resource.data.creator_id;
}
```

The Activity schema (Project 8) has no `creator_id` field. Consequences today:

- Any user-created activity is rejected (blocks 13.3 entirely)
- Any seeded/admin activity has no `creator_id`, so `update` and `delete` evaluate against a missing field and **always deny** — including the like/click counter increments in Projects 8 and 11, unless those genuinely run server-side (see B16)

**Change:** add `creator_id (String)` to the Activity schema in Project 8, and define what it holds for seeded content (a fixed system UID? `"knect_admin"`?). Then re-verify the rules against that decision.

### B4. `cold_start` timestamp doesn't exist 🔴

Project 13.1 says: *"I added a `cold_start` timestamp to the schema in the activities dataset for this."* It is not in the master schema — the Activity doc has `created_at` only.

**Change:** either add `cold_start (Timestamp)` to the schema, or (simpler, recommended) rewrite 13.1 to compute the 72-hour boost from `created_at` and delete the reference to `cold_start`. Two fields that mean "when was this made" will drift.

### B5. `profile_picture_url` vs `profile_pic_url` 🟡

- Schema and Projects 1, 2: `profile_picture_url` and `friend_profile_picture_url`
- Project 6 §2: `friend_profile_pic_url`
- Project 6 §4: "saved in the User ID doc as `profile_pic_url`"

**Change:** `profile_picture_url` / `friend_profile_picture_url` everywhere. Fix Project 6.

### B6. `email` is specced into two places, and one of them defeats Project 3 🔴

- Project 1 §3 writes `email (String)` onto the **Users document**
- Project 2 and the master schema put `email` in the **`Private_info` subcollection**
- Project 3's entire "Privacy Dilemma" section exists because all authenticated users can read the Users doc

So following Project 1 as written puts every user's email address behind a rule that reads `allow read: if request.auth != null`. That's the exact leak Project 3 was written to reason about — and the schema already solved it by moving email to `Private_info`.

**Change:** delete `email` from Project 1's field list. Then rewrite Project 3's "Privacy Dilemma" section, because it's now out of date — it describes email and `fcm_tokens` as living on the main doc and calls the separation a "future scope" item, but the schema and rules already do the separation.

### B7. Projects 1 and 2 disagree on the creation payload 🔴

| Field | Project 1 | Project 2 / Schema |
|---|---|---|
| `name` | ✅ | ✅ |
| `name_lowercase` | ✅ | ✅ |
| `email` | ✅ (on Users doc) | ❌ (in Private_info) |
| `profile_picture_url` | ✅ | ✅ |
| `interests` | ✅ | ✅ |
| `profile_info` | ❌ | ✅ |
| `current_status` | ❌ | ✅ |
| `status_visibility` | ❌ | ✅ |
| `status_expires_at` | ❌ | ✅ |

These are the two tickets most likely to be built first, and they specify different documents.

**Change:** make Project 1 stop describing the write payload entirely — it should own Auth (provider config, persistence, error messages) and hand off. Project 2 owns the Firestore document and is the single source for the field list. Add "creating the Users document" to Project 1's out-of-scope list.

### B8. `Private_info` document ID is undefined 🔴

Schema says `Document: (Private ID)`. Rules match `/Private_info/{privateId}` — any ID. So reading a user's own private info requires either knowing the ID or running a collection query, and nothing specifies which.

**Change:** fix the document ID to a constant. Recommend `Users/{uid}/Private_info/main`. Write it into the schema doc and into Project 2. Without this, every ticket that touches `Private_info` (2, 5, 7, 13.2, 19, 20) will each invent their own convention.

### B9. Friend-request acceptance is rejected by the current rules 🔴

This is a real, concrete bug, not a doc-formatting issue.

Rules:

```
match /Users/{userId}/Friends/{friendId} {
  allow create, delete: if request.auth.uid == userId || request.auth.uid == friendId;
  allow update:         if request.auth.uid == userId;   // owner only
}
```

Project 5, Action B (accepting a request) is a batched write that does:

- Write 1: update `Users/B/Friends/A` → actor is B, `userId` is B → **allowed**
- Write 2: update `Users/A/Friends/B` → actor is B, `userId` is A → **DENIED**

A batch is all-or-nothing, so **accepting a friend request fails entirely.** Same class of problem applies to any future status change written to both sides.

**Change:** amend the rule to allow the counterparty to update, but constrain what they can change — something along the lines of "`friendId` may update only the `status` field, and only to `friend`." Write the amended rule into Project 5's new Security rules line (A5), and update the rules in the schema doc. Do not let Claude Code invent this rule.

Traced the other actions for the same problem — A (send), C (decline), D (star), E (remove), F (block) all pass under the current rules. Only acceptance breaks.

### B10. The block check in Project 5 is unenforceable as written 🔴

Project 5's acceptance criteria: *"A user cannot send a friend request to someone who is in that person's `blocked_users` array."*

`blocked_users` lives in `Private_info`, which is readable only by its owner. User A physically cannot read whether B has blocked them. The client-side check can't be written.

**Change:** pick a mechanism and spec it:

- **(a)** A Cloud Function mediates friend requests and does the check server-side. Most correct, adds a Functions dependency (B16).
- **(b)** A publicly-readable `blocked_by` list on the target's Users doc. Enforceable in rules, but leaks who blocked whom.
- **(c)** Accept the gap for MVP: the request goes through, but a blocked user's request is filtered out of the recipient's pending list on read. Cheapest. Say so explicitly in out-of-scope rather than leaving the acceptance criterion in place as an untestable line.

Project 7 has the same problem — its "Relationship Check" says the app checks the other user's `private_info` for `blocked_users`. It can't.

### B11. Friend `status` values differ across three places 🔴

- Master schema: `"close friend"` (with a space), `"pending"`
- Project 4: "pending," "accepted friends"
- Project 5: `"pending"`, `"request_sent"`, `"friend"`, `"close_friend"`

**Change:** Project 5's set is the complete and correct one. Write exactly those four strings into the master schema, and make every other ticket reference them verbatim. String mismatches here silently break the UI state machine.

### B12. `tag_scores_last_dacayed` is misspelled 🟡

It's in the master schema that way, and Project 13.2 references the decay logic. Code has to match the schema exactly, so this is a "fix now or live with it forever" decision.

**Change:** rename to `tag_scores_last_decayed` in the schema and in 13.2, and note it as a rename since it may already exist in the prototype.

### B13. Nothing writes the user's `location` or `geohash` 🔴

`Private_info.location` and `Private_info.geohash` are the anchor for the entire Discover engine — Project 8's 25-mile query, Project 11's radius filter, Project 12's distance calculation, Project 13.1's proximity score. **No ticket in the roadmap captures the user's location or writes those fields.**

**Change:** this needs its own ticket. See D4.

### B14. No ticket ever populates `fcm_tokens` 🟡

Projects 1 and 2 create the field as an empty array. Project 20 (Push Notifications) is a stub. Nothing requests the token or writes it, and nothing removes it on logout — stale tokens mean notifications sent to devices that logged out.

**Change:** make token acquisition, write, refresh, and logout-cleanup explicit in-scope items on Project 20.

### B15. Nothing writes `Activity_History`, but 13.2 depends on it 🔴

Project 13.2 scores tags based on "clicked activities." The schema has an `Activity_History` subcollection for exactly this. No ticket writes to it — Projects 11 and 12 describe the click but only in terms of incrementing the activity's `click_count`.

**Change:** decide where the per-user click record is written and say so in Project 11 (feed card tap) and Project 12 (detail page open). If the tag score itself is the only record you need, then say `Activity_History` is not used at MVP and mark it deferred in the schema — don't leave a defined-but-unwritten collection sitting there.

### B16. Cloud Functions are a hard dependency with no ticket 🔴

Projects 8 and 11 both specify engagement counters "handled via a server-side Firebase Cloud Function." Options B10(a) and B3 may add more. There is no ticket for initializing Functions, no runtime/language decision, no deploy process, no rules or auth story for the callable.

**Change:** either write a Functions setup ticket (see D2), or — worth genuinely considering for MVP — drop Functions and use client-side `FieldValue.increment()` with a rule that permits incrementing only the counter fields. Cheaper, no cold starts, no Blaze plan requirement. But it needs a real rules decision, so it can't be left implicit either way.

### B17. No geohash query library is named 🟡

Projects 8, 11, and 13.1 all specify geohash radius queries. Firestore has no native geo query; this requires `geofire-common` (manual bounds, current) or `geofirestore` (wrapper, less maintained). The choice changes the query code substantially.

**Change:** name the library in Project 0 (A10) and reference it from 8, 11, 13.1.

### B18. No composite index list 🟡

Project 11's dual query + filters and Project 13.1's filtered queries will require composite indexes. Firestore fails these at runtime with an error containing a create-index link — annoying but survivable in dev, a launch blocker if it's discovered in production.

**Change:** add an "Indexes required" bullet to sections 2 of Projects 11 and 13.1, and keep `firestore.indexes.json` in the repo. Mention it in Project 0.

### B19. `participant_hash` has no defined algorithm 🟡

The schema comments it as "to prevent creating duplicate groupchats," but doesn't say how it's derived. Claude Code will invent something, and two clients inventing differently means duplicate chats.

**Change:** define it exactly in Project 15.1 — e.g. *"participant UIDs sorted ascending, joined with `_`, SHA-256 hashed, hex-encoded."* Any rule is fine; it just has to be one rule.

### B20. The Activities schema has no moderation or lifecycle fields 🟡

For 13.3 (UGC) you'll need at minimum a way to hide an activity without deleting it, and a way to see when it was last edited. Neither exists.

**Change:** when you spec 13.3, add `is_active (Boolean)` (or `moderation_status (String)`) and `updated_at (Timestamp)` to the Activity schema, and add `is_active == true` to every feed and search query in 11 and 13.1.

### B21. Nothing specs the status feature, though the schema has three fields for it 🟡

`current_status`, `status_visibility`, `status_expires_at` are in the Users doc, and `StatusService.ts` reportedly exists in the prototype. No ticket describes what a status is, who can see it, or how it expires.

**Change:** either write a ticket (D5) or explicitly mark the three fields as deferred in the schema doc.

### B22. `Free_Busy` is world-readable by design — confirm that's intended ⚪

Rules allow any authenticated user to read any user's `Free_Busy` blocks. The schema comment frames it as "public calendar blocks for UI (keeps private events safe)," so this looks deliberate. But it means a stranger — not just a friend — can see when you're busy.

**Change:** if it should be friends-only, that's a rules change and belongs in Project 18. If it's intentional, write a one-line note in the schema so nobody "fixes" it later.

---

# Part C — Per-ticket changes

### Project 1 — Firebase Auth Integration

- 🔴 Remove the Firestore write entirely (B6, B7). This ticket owns Auth only; Project 2 owns the document.
- 🔴 Add: **Data model changes:** None. **Security rules changes:** No changes needed.
- 🟡 Section 2 currently reads "The screen should be set up already." That's a note to Jonathan, not a spec. Claude Code will interpret it as "no UI work" and skip states it should build. Replace with the actual required states: idle, submitting, auth error (per-field), network error.
- 🟡 Specify: email verification — required at MVP or not? Password reset flow — in or out? Neither is mentioned, both are standard, Claude Code will either add them uninvited or omit them.
- 🟡 Specify the persistence mechanism concretely, not "usually the default in mobile frameworks." It differs between `@react-native-firebase/auth` and the JS SDK (which needs `getReactNativePersistence` + AsyncStorage wired explicitly).
- ⚪ Swap sections 2 and 3 into standard order (A3).

### Project 2 — User Profile Schema & Creation

- 🔴 This becomes the single source of truth for the creation payload. Merge in the fields from Project 1's list, minus `email` (B6).
- 🔴 Fix the `Private_info` doc ID (B8).
- 🔴 Add the Security rules line — the existing `Users/{userId}` create rule already covers this, so the honest answer is "No changes needed," but it has to be written.
- 🟡 Contradiction inside the ticket: section 3 lists the full `Private_info` / `Friends` / etc. subcollection tree as "fields to create on initialization," then the last bullet says "do not initialize the subcollections until a request is actually sent." Rewrite so the schema tree is clearly labelled *reference only*, and the initialization list is just the root document fields.
- 🔴 But `Private_info` is the exception — it holds `email` and eventually `location`/`geohash`, so it **does** need creating at signup. Say so explicitly.
- 🟡 Failure path is unspecified: if Auth succeeds and the Firestore write fails, you have an orphaned Auth user with no profile. Does the app retry, sign them out, or route them to a recovery screen? Claude Code will not handle this unless told.
- 🟡 "Route the user to the Planner tab" — which tab is that? (A13)

### Project 3 — Firebase Security Rules

- 🔴 Section 3 says *"The Code: Replace the default test mode rules with the following production rules:"* and then **there is no code.** The rules live in the schema doc. Either paste them in or replace with a hard pointer.
- 🔴 Rewrite the "Privacy Dilemma" section — it's out of date (B6). It describes the single-document approach as the current state and the `Private_info` split as future scope, but the schema and published rules already do the split.
- 🔴 Fold in the B9 fix (friend acceptance) — this ticket owns the rules file.
- 🟡 Add a UI section, or state "No UI" explicitly — a missing section reads as an oversight.
- ⚪ Confirm status with Jonathan; the rules are written and dated 5/11/26 and this may already be done.
- 🟡 Add to acceptance criteria: rules are tested in the Firebase Rules Playground for each of the deny cases, not just the allow cases. And decide whether rules live in the repo (`firestore.rules`, deployed via CLI) or are edited in the Console by hand. The doc currently says Console; that means they're not version-controlled, which for a security-critical file is worth a deliberate decision rather than a default.

### Project 4 — User Search Tab

- 🔴 Overlaps heavily with Projects 5 and 7. Section 3.2 "User Profiles" is the public profile spec — that's Project 7. The friend-request button behavior is Project 5. Right now three tickets describe the same button with **different copy**: "Send a Friend Request"/"Sent"/"Unfriend" (4) vs. "Add Friend"/"Requested"/"Friends" (5).
  - **Change:** cut 3.2 from Project 4 entirely, replace with a pointer to Project 7. Pick one set of button strings (recommend Project 4's — it's more specific) and define it once in the shared component inventory (A12).
- 🔴 Add Data model / Security rules lines. (Search reads `Users` — the existing read rule covers it. Write it down.)
- 🟡 Acceptance criteria overreach: "All friend requests sent and received update the database" and the accept/decline criteria belong to Project 5, not here. This ticket should be *search + list display + navigation*. Move them.
- 🟡 The search query as specced (`>= term`, `< term + ` on `name_lowercase`) is prefix-only — "smith" won't find "John Smith." Confirm that's acceptable for MVP, and if so put it in out-of-scope so it isn't reported as a bug later.
- 🟡 Unspecified: what does the search results row look like (avatar + name + what else)? Is there a friend-status indicator inline, or only on the profile? Empty state copy for "no results"? Loading state during the query?
- 🟡 The closing note about dark mode is a message to Jonathan sitting inside a spec. Move it to A11 and resolve it globally.
- ⚪ Fix the section numbering (currently 1, 2, 3, 3.2, 4, 5).

### Project 5 — Friend Request Logic

Best-specified ticket in the doc. Fixes needed are external:

- 🔴 B9 (acceptance is rejected by current rules) — this ticket must carry the amended rule.
- 🔴 B10 (block check is unenforceable) — pick a mechanism or move it to out-of-scope.
- 🔴 B11 (canonical status strings) — this ticket's set is the canonical one; propagate.
- 🟡 Action F (Block) is nested as a sub-bullet under Action E — formatting bug, promote it.
- 🟡 No UI states for failure: if the batch fails mid-action, does the button revert? Is there a toast? The optimistic-update rule is specced for likes in Project 11 but not for friend actions.
- 🟡 Unblocking is referenced in Project 7 ("unblock option") but there's no Action G for it here. Add it.
- 🟡 Add: what happens when a blocked user's existing chats/events are still visible? Probably out of scope for MVP — say so.

### Project 6 — Profile Picture Uploads

- 🔴 Field name fixes (B5).
- 🔴 Missing entirely: **Firebase Storage security rules.** This ticket adds Cloud Storage, which has its own separate rules file that nothing in your docs mentions. Default Storage rules are either fully open or fully closed depending on setup. Specify: users can write only to `profile_pictures/{their_uid}`, size limit enforced in-rule, content-type restricted to image.
- 🔴 The denormalization question in step 7 is still open ("not actually sure now if we need that") — and the answer changes both Project 5's write payload and this ticket's update logic. If a user changes their picture, every friend's cached `friend_profile_picture_url` is stale. Decide: accept staleness, or fan out updates (expensive), or drop the denormalized field and read the friend's doc directly. **This needs an answer before either 5 or 6 is built.**
- 🟡 "Probably easiest to make this mandatory rn" — decide. Mandatory upload during signup is a real conversion cost, and it changes the signup flow spec in Projects 1 and 2.
- 🟡 Storage path convention is unspecified. Name it.
- 🟡 Camera vs. library: section 3 says the button "navigates them to their device's camera roll," but section 2 lists camera permissions. Pick.
- ⚪ The `react-native-fast-image` install instructions are helpful but belong in Project 0 / CLAUDE.md, not in a feature ticket. Also worth verifying the package is still maintained before committing to it.

### Project 7 — Public Profile Routing

- 🔴 B10 applies — the "Relationship Check" against the other user's `private_info` is impossible under current rules. Rewrite.
- 🔴 Resolve overlap with Project 4 §3.2 (see C4). This ticket should own the public profile screen; Project 4 should own the search tab only.
- 🟡 The blocked-state logic in section 3 is the most confusing paragraph in the doc — it describes A-blocks-B and B-views-A asymmetrically, in prose, with a "hopefully they couldn't even see them in the first place" aside. Rewrite as a table: viewer relationship × what renders.
- 🟡 "The Mid-Updated State: the screen must be reloaded before those updates are viewed" — this is really "use a one-time `get()`, not a real-time listener." Say that, because Claude Code defaults to `onSnapshot` for profile screens.
- 🟡 Contradiction: section 3 says the public profile shows "Picture, Username, Bio, and interests"; Project 4 §3.2 says "Picture, name, location, interests." **Location is on one list and not the other**, and showing another user's location is a privacy decision, not a layout detail. Resolve explicitly.
- 🟡 Add Data model (None) and Security rules (likely none) lines.

### Project 8 — Define Activity Schema

- 🔴 Add `creator_id` (B3) and resolve `cold_start` (B4).
- 🔴 **This ticket is doing three jobs.** Sections 3 (Activity Card UI, Activity Page UI, image carousel, empty states) duplicate and partially contradict Projects 11 and 12. A schema ticket should have no UI section.
  - **Change:** strip section 3 down to "No UI — schema only." Move the card spec to Project 11, the detail-page spec to Project 12. Where the two versions differ, Projects 11/12 win (they're more detailed) — but read both before cutting, there's detail in 8 that isn't in 11 (the "card height slightly shorter than the screen so the next one peeks" rule, the cost string placement, the heart position).
- 🔴 The 25-mile radius is stated here as fixed, but Project 11 makes it a user-selectable 10/15/25 with a 15 default, and Project 13.1 says search reduces the pool to 25. Three different answers. Resolve: the schema ticket shouldn't specify a radius at all.
- 🟡 Define the **required-field list**. Acceptance says "if there is missing data, the event should not be able to be shown," but doesn't say which fields are required. `pictures`, `name`, `description`, `cost` presumably; `location`/`geohash` only when `is_location_based == true`. Write it out — this is the validation contract for both the CMS (9) and the feed (11).
- 🟡 `location (Map/GeoPoint)` — pick one. GeoPoint if you're doing distance math.
- 🟡 Counters need defaults. If `click_count` and `likes` are absent rather than `0`, increments and sorts behave differently.
- 🟡 Add Security rules line — this ticket is where the Activities rules should be reasoned about, given B3.

### Project 9 — Seed Data via CMS

- 🟡 This is the one ticket that's operational rather than build work, and it's fine as-is in shape. Main gap: it says "we will need to use Firebase Cloud to convert files into URLs before putting them into" — sentence is unfinished.
- 🟡 Add the required-field list from Project 8 as the validation checklist here, so the two agree.
- 🟡 The geohash instruction says to use geohash.com one at a time. A short script converts all ~150 rows at once — worth adding as an explicit sub-task, since geohash is empty across the whole sheet right now and it's the thing blocking Project 11 from having anything to fetch.
- 🟡 Specify geohash **precision** (number of characters). It has to match whatever the query code uses, or nothing matches.
- 🟡 Decide whether Rowy is actually in the plan. The roadmap index says "setting up a tool (like Rowy)"; the ticket body describes a Google Sheet → Firebase import. Those are different workflows.
- ⚪ Add `creator_id` value for seeded rows once B3 is decided.

### Project 10 — API Integration

- ⚪ Fine as-is. Add `**Status:** Deferred until after beta launch` per A9/A15 and leave it.

### Project 11 — Discover Tab Frontend Fetch

The most complex ticket in the doc, and the one where under-specification is most expensive.

- 🔴 Resolve the radius contradiction (see C8).
- 🔴 Resolve `liked_activities` shape (B2) — this ticket writes it.
- 🔴 Resolve the counter-increment mechanism (B16) — Cloud Function vs. client increment.
- 🔴 **The multi-filter problem is left as an open question in the doc** ("There are 2 solutions to this... composite indexes vs. client-side"). You already argue toward client-side. Claude Code will pick one, possibly the other, and the choice determines the whole data layer. **Decide and write one answer.** (Client-side is the right call for MVP — index-per-combination doesn't scale and you'd be regenerating them for every new filter.)
- 🟡 Pagination logic is under-specified for the merge: you load 5 at a time from Query A and interleave 1-in-4 from Query B, but nothing says whether Query B paginates too, or is fetched once and consumed. With the 1-in-4 rule, a long scroll exhausts Array B — then what?
- 🟡 The "no repeats within a week" feature is marked optional. Fine — but if it's optional, it needs a storage location if kept (locally? `Activity_History`?) and an explicit "cut for MVP" if not. "Optional" tells Claude Code nothing actionable.
- 🟡 Radius expansion is referenced in the fallback ("even after a radius expansion") but never specified anywhere. Either spec it or cut the reference.
- 🟡 Interaction between the algorithm (13.1) and this ticket's fetch is undefined: does the feed sort by heuristic score at fetch time or after the merge? 13.1 says score determines order; this ticket says interleave 1-in-4. **Those two rules conflict** — interleaving by position overrides ordering by score. Resolve.
- 🟡 Add Data model + Security rules lines.
- 🟡 Add: is the feed a real-time listener or a one-time fetch? Cost implications are large. (One-time, almost certainly.)

### Project 12 — Activity Detail Page

- 🔴 Depends on the Create Event screen, which **has no ticket** (D3). The "Make This An Event" button is half this ticket's value and it routes into an unspecified screen.
- 🟡 B2 applies (heart prefill source).
- 🟡 "The Data Handoff" — passing the full activity object through navigation params vs. passing the ID and re-fetching. The doc leans toward passing data; say so explicitly, and say what happens on a deep link where there's no card to hand off from (relevant to Project 21).
- 🟡 `geolib` is named for distance, good — add it to Project 0's dependency list so it's installed once.
- 🟡 Distance display when `is_location_based == false`: hide the row? Show "Anywhere"? Unspecified, and roughly half your seed data has no location.
- 🟡 Add Data model + Security rules lines.

### Project 13.1 — Discover Search Bar & Algorithm

- 🔴 Resolve `cold_start` (B4) and the radius conflict (C8).
- 🔴 Resolve the score-vs-interleave conflict with Project 11 (see C11).
- 🟡 Terminology: the doc says "Levenshtein score... 0.0 (exact match) to 1.0 (no match)" and mentions Fuse.js. That 0–1 scale is **Fuse.js's score**, not a Levenshtein distance. Written as-is, Claude Code may implement raw Levenshtein and the 0.5 threshold will mean something completely different. Say "Fuse.js, `threshold: 0.5`, keys: `name`, `tags`" and drop the word Levenshtein.
- 🟡 Where does scoring run — client-side over the fetched batch, or does it need the full pool? As written it scores what's fetched, which means the "best" activities are only best within the current page of 5. Worth an explicit note; it's a known and acceptable MVP limitation, but it should be a stated one.
- 🟡 The Tag Affinity term (#3) needs a defined formula, not just point values. Sum across matching tags? Average? Sum will over-favor activities with many tags. Cap is 300 — how do you get from raw tag points to a 0–300 contribution?
- 🟡 Popularity: likes 10pts, clicks 1pt, capped 400 — no time decay, so early activities accumulate permanently. The 72h cold-start boost partly offsets this. Flag as a known limitation or add decay.
- 🟡 The randomness factor is marked post-MVP — good, put it in out-of-scope explicitly.
- 🟡 Add Data model + Security rules lines.

### Project 13.2 — Tag Affinity Scores

Second-best specified ticket. Small fixes:

- 🟡 B12 (field spelling).
- 🟡 Decay is specced as ×0.9 when `tag_scores_last_decayed` > 7 days, checked on write. Missing: is decay applied once per check, or once per elapsed week (someone inactive 8 weeks gets ×0.9, or ×0.9⁸)? Compounding vs. single application changes behavior a lot for returning users.
- 🟡 The 50-tag cap: on eviction, the lowest-scored tag is removed. Ties? And decay + eviction interact — after decay, several tags may be equal.
- 🟡 "Sending an activity to their friend = +10 (delay for now)" — move to out-of-scope rather than leaving a parenthetical.
- 🟡 The write happens on the client, into `Private_info`, which only the owner can write. Correct and cheap. State that explicitly in the Security rules line so nobody later moves it server-side unnecessarily.
- 🟡 Acceptance criteria are missing tests for decay and for the "creating an event" path.

### Project 13.3 — User Generated Content

Stub — see Part E for the skeleton.

### Project 14 — AdMob Placeholders

Stub. Per the MVP assessment this should be cut from pre-launch scope entirely — it has zero value before you have users, and `tapped_ads` in `Activity_History` is the only other trace of it in the schema. **Recommend:** mark Deferred, keep the stub, don't spend time speccing it now. Skeleton in Part E anyway, in case you disagree.

### Projects 15.1 through 21

All stubs (15.1 has a heading and a single line: "Target Database Collection: Chats"). Skeletons in Part E.

---

# Part D — Tickets that don't exist and need to

These are features that existing tickets depend on, or that the master schema already has fields for, with no spec anywhere. Every one of them is something Claude Code would otherwise invent from scratch.

### D1. Project 0 — Stack, environment & conventions 🔴

Per A10. Not a feature; it's the context block that goes at the top of every prompt. Also lives in the repo as `CLAUDE.md`.

### D2. Cloud Functions setup (or the decision not to use them) 🔴

Per B16. Projects 8 and 11 both assume Functions exist. Either spec the setup — runtime, deploy, local emulator, callable auth — or make the explicit decision to do counters client-side with a scoped rule and remove the Function references from 8 and 11.

### D3. Planner tab & Create Event screen 🔴

Project 12's "Make This An Event" button routes here. Project 2 routes new users here after signup. Projects 16, 17, and 18 all revolve around events. **The screen has no ticket.** The `Events` collection is fully defined in the schema (owner, shared_with, confirmed_participants, times, activity link, status, color, all-day, location text, source, linked chat) and nothing writes any of it.

This is arguably the largest single hole in the roadmap — a core screen, referenced by four other tickets, with zero specification.

### D4. Location capture & geohash write 🔴

Per B13. Needs to cover: when permission is requested (signup? first Discover open?), what happens on denial, how coarse the stored location is, whether it refreshes, geohash precision (matching Project 9's seed data), and the rules implication (it's in `Private_info`, so owner-only — but the Discover feed only needs the user's *own* location, so that works).

Without this ticket, Projects 8, 11, 12, and 13.1 have nothing to query against.

### D5. User status feature 🟡

Per B21. `current_status`, `status_visibility`, `status_expires_at` exist in the schema and `StatusService.ts` reportedly exists in the prototype. No ticket. Either spec it or mark the fields deferred.

### D6. Own-profile tab (view + edit) 🟡

Projects 4, 6, and 7 all reference "the profile page already in place" — the close friends widget, the interests display, the settings toggles, the dark mode toggle, the calendar sync button. It exists in the prototype but has no ticket, which means under the "docs are source of truth" rule it has no spec. Editing name, bio, and interests in particular needs one (interests feed the tag affinity scores at +10/tag per 13.2).

### D7. Onboarding flow 🟡

Signup currently spans Projects 1, 2, and 6, each describing a piece ("route them to the next page in the sign up process"). Nothing owns the whole sequence, and interests selection — which the algorithm depends on — isn't in any of them.

### D8. Account settings, logout & account deletion 🟡

Logout is referenced (Project 7 lists it as something *hidden* on public profiles, implying it exists on your own). Deletion isn't mentioned anywhere and is an App Store review requirement for any app with accounts. It's also messy under your schema — deleting a user leaves orphaned docs in every friend's `Friends` subcollection, in chats, and in events.

### D9. Firebase Storage rules 🔴

Per C6. Separate rules file from Firestore, currently unmentioned in any doc. Small ticket, high risk if skipped.

### D10. Offline & error handling conventions ⚪

Half the tickets describe a "lost internet" state individually. Worth one ticket that defines the app-wide pattern (detection, banner vs. per-screen, retry, Firestore offline persistence on/off) rather than nine slightly different implementations.

---

# Part E — Skeletons for the stub tickets

These are outlines with the decisions you need to make, not filled-in drafts. The bracketed questions are the things Claude Code will otherwise answer for you, wrongly.

Every skeleton assumes A4/A5/A8 are applied — Data model changes, Security rules changes, and Depends on lines are mandatory in all of them.

---

## 13.3 — User Generated Content

**1 - User Story**
> As a User, I want to be able to create activities for people to see... *(your existing opening is fine, but it currently bundles three things: creating, discovering others' creations, and seeing engagement stats on your own. Are all three in this ticket, or is the creator-stats view a later one?)*

**2 - The Architecture & Technical Details**

- Target collection: `Activities` (same collection as seeded content, or a separate one?)
  - *If same collection: how does the feed distinguish? Is `source: "user_generated"` enough, or do you need `is_active`/`moderation_status` (B20)?*
  - *Same collection means one query. Separate means moderation is easier but every query doubles.*
- `creator_id` — this is the field the existing rules already require (B3). Confirm it's set to the author's UID.
- **Data model changes:** *(at minimum `creator_id`, `updated_at`, and a moderation/visibility field. What else — does a UGC activity need `is_location_based` set manually? Where do images go — same Storage bucket as profile pics or a separate path?)*
- Image upload: reuse Project 6's compression pipeline, or different constraints? *(activity photos aren't square 1:1)*
- **Who can edit or delete?** Rules already say creator-only. *(Do you need an admin override? How do you delete an activity that's referenced by an existing Event or a chat message?)*
- Does creating an activity write to the creator's tag affinity scores? *(13.2 doesn't list creation as a scoring action)*

**3 - The UI and Layout Requirements**

- Entry point: where does "create an activity" live? *(Discover tab header? Profile tab? A + button?)*
- Form fields and validation *(which of Project 8's required fields must the user fill? Cost picker, tag picker — free text tags or a fixed list? Free text will fragment your tag affinity scores badly)*
- Loading / empty / error / success states
- *Does the creator see their own activity's `likes` and `click_count`? Where?*

**4 - Security and Scope** *(if A6(a) is adopted)*

- Out of scope: *(reporting/flagging? editing after publish? deletion? a moderation queue?)*
- **Moderation is the real question here.** *(Is anything published instantly and visible to all users in radius? For an MVP in Utah County that's probably fine, but it should be a decision you made, not a default. What's the takedown path if something inappropriate goes up?)*

**5 - Acceptance Criteria**

- *Write these after the moderation decision — they change completely depending on it.*

---

## 14 — AdMob Placeholders

**Recommendation: mark Deferred and skip.** Zero pre-launch value.

If you disagree, the skeleton is:

- **1 - Goals** — native ad slots exist in the feed layout, unfilled, so ad integration later is a config change and not a re-layout.
- **2 - Architecture** — *slot frequency (every Nth card)? Does the slot occupy a feed position, and does that break Project 11's 1-in-4 interleave math? `tapped_ads` in `Activity_History` — is that in this ticket or deferred with it?*
- **3 - UI** — placeholder card that matches activity card dimensions exactly; what renders when no ad is loaded.
- **4 - Security and Scope** — no rules changes; explicitly out of scope: the AdMob SDK, account setup, revenue reporting, consent/GDPR flows.

---

## 15.1 — Group Chat Infrastructure (Chat Creation & Participant Management)

Your existing stub correctly identifies this as sub-ticketed. **Suggested split** — the point is to isolate the real-time listener work from the CRUD work so the risky part can be reviewed alone:

- **15.1 — Chat creation & participant management** *(this ticket: creating a chat, the participant hash, adding/removing people, the chat list screen)*
- **15.2 — Messaging & real-time listeners** *(sending, the listener, pagination, read state)*

**15.1 skeleton:**

**1 - User Story** — *(your existing opening covers both sub-tickets; narrow it to creation/management)*

**2 - The Architecture & Technical Details**

- Target: `Chats` collection
- `participant_hash` — **define the algorithm exactly** (B19)
- *Is a chat 1:1, group, or both? The hash implies "one chat per unique participant set" — does that mean you can't have two different group chats with the same people?*
- *Can participants be added to an existing chat? If yes, the hash changes and the dedup guarantee breaks. This is a real design decision, not an implementation detail.*
- *Who can remove participants — creator only, or anyone?*
- *Can you leave a chat? What happens to a chat when everyone leaves?*
- `chat_name` — *auto-generated from participant names for groups, or always user-set? What about 1:1s?*
- `recent_message` / `recent_message_timestamp` — denormalized for the chat list. *Written by the sender's client, or a Function? Client is cheaper; confirm the rules allow a participant to update the parent chat doc (they currently do).*
- **Data model changes:** *(does `Chats` need `created_at`, `created_by`, an `unread_counts` map? None of those are in the schema and a chat list usually needs at least the first two)*
- **Security rules:** existing rules cover create (must include self in participants) and read/update (participants only). *Note the gap: there's no `allow delete` on `Chats`, so chats can never be deleted. Intended?*
- Interaction with blocking: *if A blocks B, do existing shared chats survive? Can A be added to a new chat containing B?*

**3 - The UI and Layout Requirements**

- Chat list screen: rows, ordering, unread indicator, empty state, loading skeleton
- New chat flow: friend picker *(friends only, or anyone searchable?)*
- Error state, and the offline case
- *Where does the chat list live in navigation? There's no chat tab in the current 3-tab bar (Discover, ?, Search).*

**4 - Acceptance Criteria** — *(write after the participant-mutability decision)*

**Feed-to-AI note:** this is a ticket where the order matters — rules and schema first, then the hash function as an isolated pure function you can test alone, then the UI.

---

## 15.2 — Messaging & Real-Time Listeners

- **2 - Architecture:** `Messages` subcollection; `onSnapshot` listener scope and teardown; message pagination (how many on open, how many per page-back); optimistic send with a "sending" state; failed-send retry; `message_type` values enumerated exactly *(the schema has `message_type`, `activity_id`, `event_title` on messages — those are for Project 16's activity cards, so enumerate: `"text"`, `"activity"`, `"vote"`, `"system"`?)*; denormalized `sender_name` and `sender_profile_pic_url` go stale when someone changes their picture — same problem as B/C6, same decision needed.
- **3 - UI:** message bubbles, sending state, failed state, keyboard handling, scroll-to-bottom behavior, typing indicators *(in or out? out, probably)*, read receipts *(out?)*.
- **Security:** existing rules use a `get()` on the parent chat doc for every message read — **that's a billed document read per rule evaluation.** Worth flagging as a known cost, and worth considering denormalizing participants onto each message instead.

---

## 16 — Activity Proposals

**2 - Architecture**

- The mechanism: a message with `message_type: "activity"` plus `activity_id` and `event_title` — the schema already supports this.
- *Does proposing an activity create an `Events` doc immediately with `status: "proposed"`, or only after a vote passes? The schema's Event has both `status` and `linked_vote_id`, which suggests the event exists first. Confirm — this determines whether 16 or 17 owns event creation.*
- *Where can you propose from — Discover card, detail page, or both? Project 12's "Make This An Event" goes to the Planner, not a chat. Are those two different flows, or should they converge?*
- *Can you propose to multiple chats at once?*
- **Data model changes:** *(likely none if the message and event schemas hold — verify)*
- **Security rules:** *(if this writes to `Events`/`Calendars`, B1 applies and the collection name has to be settled first)*

**3 - UI** — the activity card as rendered inside a chat bubble *(a third variant of the activity card — add it to A12)*; tapping it routes where; states before/during/after a vote.

---

## 17 — The Voting System

The most complex remaining ticket. The schema's `Votes` subcollection has `change_type`, `vote_type`, `normal_votes`, `ranked_votes`, `proposed_start_time`, `proposed_end_time`, `question`, `options` — which implies a much larger feature than "tally votes on an activity."

**Decide first, before any spec:** *what can be voted on?* The schema suggests at least: which activity, what time, and changes to an existing event. That's three vote types with different UIs.

**2 - Architecture**

- *Enumerate `vote_type` exactly — `"normal"` and `"ranked"`? What triggers ranked?*
- *Enumerate `change_type` and `status` exactly.*
- *Quorum: what makes a vote conclude? All participants voted, a majority, or a timer? What happens on a tie?*
- *Who can start a vote? Who can cancel one? Can there be two open votes in one chat?*
- *`normal_votes` / `ranked_votes` as Maps keyed by UID — that means every participant writes to the same document. Firestore's ~1 write/sec per document limit is a real constraint for a group all voting at once. Acceptable at MVP group sizes; note it.*
- *When a vote passes, what writes the result to the `Events` doc — the last voter's client, or a Function? Client-side means whoever votes last does the write, and if they're offline the event never confirms.* **This is the strongest case in the whole roadmap for a Cloud Function (B16/D2).**
- **Security rules:** existing rules let any participant read/write any vote doc — including overwriting someone else's vote. Needs field-level constraints.

**3 - UI** — vote card in chat, live tally, own-vote indicator, closed state, result announcement, the "winner declared" message.

**Feed-to-AI note:** spec the state machine as a table (states × transitions × who can trigger) before writing any of this. This is the ticket you already flagged as needing a flowchart, and that instinct is right.

---

## 18 — Internal Calendar & Recurring Events

**Strong recommendation from the MVP assessment, restated:** cut recurring events from MVP. Single events only. Recurrence is the single biggest complexity multiplier in this ticket — expansion, exceptions, "delete just this one," and timezone handling — for a feature nobody needs before you have users.

**2 - Architecture**

- Collection: `Events` or `Calendars` — **B1 must be resolved first**
- Free/busy: the `Free_Busy` subcollection exists with `start_time`/`end_time`. *Written manually by the user, derived from their events, or both? B22 applies — it's currently readable by any authenticated user.*
- *Does an Event write a corresponding `Free_Busy` block automatically?*
- *`confirmed_participants` vs `shared_with` — what moves someone between them, and does declining remove them?*
- *Timezones. Everything is a Firestore Timestamp (UTC). Utah County only at MVP makes this survivable, but the display layer still needs a stated rule.*
- **Data model changes:** *(if recurrence is cut, none. If kept: an RRULE string plus an exceptions array, and it becomes a much bigger ticket)*

**3 - UI** — month/week/day views? *(pick one for MVP — month with a day drawer is usually enough)*; event creation form; event detail; color assignment; empty state.

**4 - Scope** — out of scope: recurrence, external sync (19), invitations outside a chat.

---

## 19 — External Calendar Sync

Deferred per your scope doc. Add `**Status:** Deferred` and leave the stub. `external_calendar_tokens` in `Private_info` is its only footprint; note in the schema that the field is reserved and unused at MVP.

---

## 20 — Push Notifications

**2 - Architecture**

- **B14 applies:** nothing currently writes `fcm_tokens`. This ticket owns acquisition, write, refresh, and logout cleanup.
- *Sending requires a server. FCM messages can't be sent from the client. So this ticket has a hard Cloud Functions dependency (D2) — there's no client-only version of this.*
- *Which events notify?* The MVP assessment recommends messages + friend requests only. Confirm, and put everything else in out-of-scope explicitly.
- *Deep link target per notification type — this overlaps Project 21's routing, so 21 may need to come first or they share a routing module.*
- *Badge counts — in or out? They need server-side unread state, which you don't have.*
- **Security/privacy:** notification content on a lock screen. *Does a message preview show the sender's name and text? That's a privacy decision.*

**3 - UI** — permission prompt timing *(iOS gives you one shot — asking at signup gets more denials than asking at first relevant moment)*; in-app notification handling when the app is foregrounded; a settings toggle.

---

## 21 — Deep Linking & SMS Sharing

**The MVP assessment flags this and I'd restate it: this is listed 21st but it's your entire cold-start mechanism.** SMS invite → App Store → straight into the voting chat is the growth loop. It should move ahead of 14, 18's recurrence, and 19.

**2 - Architecture**

- *Link service: Firebase Dynamic Links **was shut down in August 2025** — it no longer exists. Do not let Claude Code use it; models trained on older Firebase docs suggest it confidently. Alternatives: Branch, AppsFlyer OneLink, or hand-rolled Universal Links / App Links + a landing page. This decision needs making before the ticket is written, and it's the kind of thing an AI trained on older docs will get wrong confidently.*
- *Deferred deep linking — the hard part. User taps a link, doesn't have the app, installs it, opens it: does it still land them in the right chat? That's the whole value of the loop, and it's the feature that determines your service choice above.*
- *What's linkable — an activity, a chat invite, an event, a profile? Each needs a route and an auth-required-vs-public decision.*
- *A non-user opens a chat link: sign up first, or preview then sign up?*
- **Security:** *a chat invite link that lets anyone in is an obvious abuse vector. Expiring? Single-use? Approval required?*
- **Data model changes:** *(likely an invite token collection — nothing in the current schema supports this)*

**3 - UI** — share sheet, invite copy, the landing/branch screen, the "this link expired" state.

---

# Part F — Sequencing changes

1. **Project 0 (D1), plus the Part B blockers, come before everything.** Nothing else is safe to prompt until the schema and rules contradictions are resolved.
2. **Insert D4 (location capture) before Project 11.** The entire Discover engine queries against fields nothing writes.
3. **Insert D3 (Planner / Create Event) before Project 12** — its main CTA routes into an unspecified screen — and before 16/17/18, which all revolve around events.
4. **Move Project 21 (Deep Linking) up**, to right after the core loop (15 + 16 + 17) works. Ahead of 14, 18's recurrence, and 19.
5. **Cut Project 14 from pre-launch entirely.**
6. **Cut recurrence from Project 18.**
7. **Project 9 is unblocked right now and blocks Project 11** — the geohash column is empty across all ~150 rows and images aren't uploaded, so there's nothing for the feed to fetch even once it's built.

---

# Part G — Making this actually work with Claude Code

The change list above is most of it, but three practical notes:

**1. `CLAUDE.md` in the repo root.** Project 0 (D1) plus the master schema, the current rules, and the design tokens (A11). Claude Code reads it automatically at the start of every session, so you stop re-pasting context and stop getting a different set of invented conventions each time.

**2. One ticket per session, and feed it in the order your own template already specifies** — data model and rules first, isolated logic second, UI last. The 4-section format is already close to this; the missing pieces are the explicit Data model and Security rules lines (A4, A5), which is why those are the highest-priority changes in Part A.

**3. Out-of-scope lists do more work than anything else in the doc.** The single most common Claude Code failure on a spec like this isn't building the wrong thing — it's building four adjacent things you didn't ask for, touching files three other tickets depend on. A6(a) is the recommendation for exactly this reason.

**One thing worth saying plainly:** the doc's real problem isn't formatting. Tickets 5, 11, 13.1, and 13.2 are genuinely well-specified — better than most professional tickets. The problem is that the schema, the rules, and the tickets have drifted apart from each other, and there are load-bearing screens (Create Event, location capture) that nothing owns. Part A is a day of cleanup. Part B is the part that actually determines whether the code works.
