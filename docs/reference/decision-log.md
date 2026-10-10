# Knect — Roadmap Decision Log

**Purpose:** every contradiction, gap, and open question from the Roadmap Change List, sorted by *who has to rule on it*. This is the document that unblocks both writing the stub tickets and editing the existing ones — nothing else in the roadmap is safe to finalize until the 🟠 items below have answers.

**Status:** in progress. Started 2026-08-25.

**How to read it:**

- ✅ **Settled** — already answered somewhere in the existing docs. No decision needed; it just has to be propagated to the places that contradict it.
- 🔵 **Recommended** — one side is obviously right (a typo, a contradiction where one version is simply newer, or a spec that names a field that doesn't exist). Confirm as a batch; don't spend thought on these individually.
- 🟠 **Open — Kyson's call** — a real tradeoff with a product consequence. These are the ones that need actual thought.
- 🟣 **Open — Jonathan's call** — technical feasibility or current-state-of-the-code questions Kyson can't answer alone.

---

## Part 1 — ✅ Settled by existing docs (propagate only)

### S1. The ticket format is five sections, not four

Change List A6 asks whether **Security and Scope** should become a real numbered section. **Project 15.1 is already written with it as section 4**, with Acceptance Criteria as section 5. That's the answer, arrived at in practice rather than in principle.

```
1 - User Story (or Goals)
2 - The Architecture & Technical Details
3 - The UI and Layout Requirements
4 - Security and Scope
5 - Acceptance Criteria
```

**Why it matters:** the out-of-scope list is the single cheapest defense against Claude Code building four adjacent things you didn't ask for. Section 4 also gives the mandatory Security rules line (A5) a home that isn't buried in Architecture.

**Propagate to:** every ticket 1–13.2. Tickets 1–5 need real restructuring; 6–13.2 mostly need section 4 inserted.

### S2. `participant_hash` is already defined

Change List B19 says the algorithm is undefined. **15.1 defines it**: participant UIDs sorted in ascending byte order, joined with a single underscore, computed only inside a callable Cloud Function, never client-side. Despite the field name nothing is cryptographically hashed.

**Propagate to:** the Firebase Master Schemas doc, which still carries only the "to prevent creating duplicate groupchats" comment.

### S3. Cloud Functions are in the stack

Change List B16 frames Functions as an open question. **15.1 commits to a callable Function** for chat find-or-create, and gives a good reason — three entry points calling one recipe so it can't drift. So the D2 Cloud Functions setup ticket is **required**, not optional, and it becomes a dependency of 15.1.

**What's still open** is narrower and moved to O6 below: whether *engagement counters* also go through a Function, or run client-side.

### S4. Project 5 gains a responsibility it doesn't know about

15.1 specifies that accepting a friend request auto-creates a 1-on-1 chat, and flags this as "an addition needed to Project 5, not just this ticket." Project 5's Action B batch write currently doesn't mention it.

**Propagate to:** Project 5, Action B — and note the ordering problem it creates (see F1 in Part 5).

---

## Part 2 — 🔵 Recommended (confirm as a batch)

These are contradictions where one side is a typo, a stale draft, or names a field that doesn't exist. Reasoning is one line each because there isn't more than one line of thought in them.

| # | Item | Recommendation | Why |
|---|---|---|---|
| R1 | A1 — index restarts each phase | Renumber the index continuously 1–21 to match the ticket headings | "Project 13" is currently ambiguous; every cross-reference inherits the ambiguity |
| R2 | A2 — 13.x numbering conflict | Use the ticket-body version (13.1 / 13.2 / 13.3); delete the bare "13" heading | The bodies are written and the index isn't; a parent "13" invites an accidental prompt |
| R3 | A4 — implicit schema changes | **Data model changes:** line mandatory in section 2, "None" written out | Blank reads as "not thought about"; Claude Code invents fields to fill the gap |
| R4 | A5 — implicit rules changes | **Security rules changes:** line mandatory in section 4, "No changes needed" written out | Same failure mode, worse consequences |
| R5 | A7 — every link is `about:blank` | Replace with plain-text pointers: "see Project 8 §2, Data Payload" | Links can't be followed out of a pasted prompt; a section pointer can |
| R6 | A8 — no dependency info | **Depends on:** / **Blocks:** line under every heading | Claude Code has no way to know 12 needs a screen that doesn't exist yet |
| R7 | A9/A15 — no status, orphan `*` legend | **Status:** line per ticket; delete the asterisk convention | One mechanism, not two, and the `*` currently marks nothing |
| R8 | A14 — stray `# Tab 25` heading | Delete | Junk between 15.1 and 16 |
| R9 | B4 — `cold_start` doesn't exist | Delete the reference; compute the 72h boost from `created_at` | Two fields meaning "when was this made" will drift apart |
| R10 | B5 — `profile_pic_url` vs `profile_picture_url` | `profile_picture_url` / `friend_profile_picture_url` everywhere; fix Project 6 §2 and §4 | Schema and four other tickets already agree |
| R11 | B6 — `email` on the Users doc | Delete `email` from Project 1's field list | Users docs are readable by every authenticated user; email belongs in `Private_info`, and the schema already puts it there |
| R12 | B7 — Projects 1 and 2 disagree on the payload | Project 1 owns Auth only (provider config, persistence, error states). Project 2 owns the Firestore document and is the single source for the field list | These are the two tickets most likely to be built first and they currently specify different documents |
| R13 | B8 — `Private_info` doc ID undefined | Fix it to `Users/{uid}/Private_info/main` | Six tickets touch this subcollection; without a constant each invents its own convention |
| R14 | B11 — friend status strings differ 3 ways | Project 5's set is canonical: `"pending"`, `"request_sent"`, `"friend"`, `"close_friend"` | String mismatches silently break the UI state machine |
| R15 | B12 — `tag_scores_last_dacayed` misspelled | Rename to `tag_scores_last_decayed`, note it as a rename in 13.2 | Code has to match the schema exactly — fix now or live with it forever |
| R16 | B14 — nothing writes `fcm_tokens` | Project 20 owns acquisition, write, refresh, and logout cleanup, explicitly | Stale tokens mean notifications sent to logged-out devices |
| R17 | B18 — no composite index list | `firestore.indexes.json` version-controlled; "Indexes required" bullet in 11 and 13.1 | Firestore fails these at runtime — survivable in dev, a launch blocker in production |
| R18 | C8 — Project 8 is doing three jobs | Strip Project 8's UI section to "No UI — schema only." Card spec moves to 11, detail-page spec to 12. Remove the fixed 25-mile radius from the schema ticket entirely | A schema ticket with a UI section will get built as a UI ticket. Radius is specified three different ways across 8, 11, and 13.1 — the schema shouldn't specify it at all |
| R19 | C11 — multi-filter approach left open | Client-side filtering over a Firestore query on the widest dimension | You already argue toward this in the doc. Index-per-combination doesn't scale and breaks every time a filter is added |
| R20 | C4/C7 — 4, 5, and 7 all spec the same button | Define it once in the component inventory; Project 4's copy wins ("Send a Friend Request" / "Sent" / "Accept Request" + "Decline" / "Unfriend") | Project 4's version is more specific and already has dark-mode states written |

**One batch answer covers all twenty.** If you disagree with any individually, say which numbers.

---

## Part 3 — Kyson's decisions

**Batch of 20 (Part 2): ✅ all confirmed 2026-08-25.**

Resolved items below carry their ruling inline. Items still marked 🟠 are outstanding.

### O1. `Events` vs `Calendars` — collection name

**✅ RESOLVED 2026-08-25 — `Events`.** The security rules get rewritten from `match /Calendars/{eventId}` to `match /Events/{eventId}`. Propagate to the rules file and Projects 16, 17, 18.

The master schema defines `Events`. The published security rules protect `match /Calendars/{eventId}`. There is no rule covering `Events`, and the global deny at the bottom means **every read and write to `Events` is blocked today.**

*Consequence:* blocks Projects 16, 17, and 18 completely, and it's invisible — the code looks right and fails at runtime with a permissions error.

*Leaning:* `Events`. "Calendars" describes a container; the documents are individual events. But it's a coin flip on the merits — what matters is picking one.

### O2. `Liked_Activities` — subcollection, array, or both

**✅ RESOLVED 2026-08-25 — option (a).** `Liked_Activities` subcollection stays the record of truth with `saved_at`. Add `liked_activity_ids (Array of Strings)` to `Private_info` (**not** the Users doc), loaded once per session for heart prefill. One duplicate write per like. Propagate to Project 2 (field list), 11 (like write), 12 (heart prefill source).

Three descriptions across the schema, Project 11, and Project 12; two different data shapes. It matters for cost: prefilling heart icons on a scrolling feed from a subcollection is one read per card.

*Options:*
- **(a)** Subcollection stays the record of truth (it has `saved_at`, which you want for a Saved list), **plus** a `liked_activity_ids` array on `Private_info` loaded once per session for UI prefill. Costs one duplicate write per like.
- **(b)** Subcollection only; the feed prefills from a client-side cached set built at app start.
- **(c)** Array only; drop `saved_at` and the Saved-list ordering with it.

*Note on (a):* the change list suggested putting the array on the Users root doc. **Don't** — that document is readable by every authenticated user, so your like history would be public. `Private_info` is owner-only.

### O3. `creator_id` for seeded content

**✅ RESOLVED 2026-08-25 — omit on seeded rows, gate the rule on `source`.** Seeded activities carry no `creator_id` at all. **Condition that makes this safe:** `source` becomes a *required* field on every Activity with an enumerated value set — `"manual_diy"`, `"api_yelp"`, `"user_generated"` — so the rule evaluates a field that is always present rather than the absence of one. Rule shape:

```
match /Activities/{activityId} {
  allow read: if request.auth != null;
  allow create: if request.resource.data.source == "user_generated"
                && request.auth.uid == request.resource.data.creator_id;
  allow update, delete: if resource.data.source == "user_generated"
                && request.auth.uid == resource.data.creator_id;
  allow update: if <diff touches only click_count and likes>;
}
```

Practical effect: seeded activities can never be edited or deleted from inside the app. CMS and Console edits use admin credentials, which bypass rules entirely. Propagate to Project 8 (required `source` enum + `creator_id`), Project 3 (rules), Project 9 (seed validation), Project 13.3.

The published rules require `creator_id` on every Activity for create/update/delete. The Activity schema has no such field, which means **seeded activities can't be updated or deleted at all**, and user-created activities can't be created — blocking 13.3 entirely.

Adding the field is settled. The question is what seeded rows carry: a fixed system UID like `"knect_admin"`, a real admin account's UID, or a `source`-based exemption in the rules instead.

*Interacts with O6* — if counters increment client-side, the rules need to permit counter-only updates by anyone regardless of `creator_id`.

### O4. Block enforcement — the check you specced can't be written

**✅ RESOLVED 2026-08-25 — option (b), Cloud Function mediates friend requests.** The Function reads the target's `Private_info` server-side and rejects blocked senders before any write occurs. **Consequence: Project 5 now hard-depends on the Cloud Functions setup ticket (D2).** Combined with F1 below, Project 5 cannot stay a Phase 2 ticket. Project 7's Relationship Check resolves the same way — it asks the Function, it does not read `blocked_users` directly.

Project 5's acceptance criterion says a user cannot send a request to someone whose `blocked_users` array contains them. `blocked_users` lives in `Private_info`, readable only by its owner. **User A physically cannot read whether B blocked them.** Project 7's "Relationship Check" has the same problem.

*Options:*
- **(a)** A Cloud Function mediates friend requests and checks server-side. Most correct, and cheaper than it was now that Functions are already in the stack (S3).
- **(b)** A publicly-readable `blocked_by` list on the target's Users doc. Enforceable in rules, but leaks who blocked whom.
- **(c)** Accept the gap for MVP: the request goes through, and a blocked user's request is filtered out of the recipient's pending list on read. Cheapest, and invisible to both parties in practice.

*Leaning:* (c) for MVP, stated explicitly in out-of-scope rather than left as an untestable acceptance criterion. Revisit at (a) once Functions are established.

### O5. `Activity_History` — write it or defer it

**✅ RESOLVED 2026-08-25 — write it.** Project 11 writes a history doc on feed-card tap; Project 12 writes one on detail-page open. **Consequence:** 13.2's 2-second debounce buffer now has to cover history writes too, not just tag scores — rapid repeated taps must produce one history record, not five. Also makes Project 11's 'no repeats within a week' feature genuinely implementable rather than optional.

13.2 scores tags from "clicked activities." The schema has an `Activity_History` subcollection for exactly this. **No ticket writes to it.** Projects 11 and 12 describe the click only as incrementing the activity's counter.

*Options:*
- **(a)** Spec the write in 11 (card tap) and 12 (detail open). One extra write per tap — meaningful cost on a scrolling feed.
- **(b)** Mark `Activity_History` deferred in the schema. `tag_affinity_scores` becomes the only record, which is all 13.2 actually needs.

*Leaning:* (b). But note it kills Project 11's optional "no repeats within a week" feature unless that state lives locally on the device — which is fine, and probably what you want anyway.

### O6. Engagement counters — Cloud Function or client-side increment

**✅ RESOLVED 2026-08-25 — client-side `FieldValue.increment()` behind a single shared service module.** Every call site routes through one file, so it can be swapped to a Function later without touching the feed, the detail page, or anywhere else. Requires the counter-only `allow update` clause in O3's rule. Remove the Cloud Function language from Projects 8 and 11.

Projects 8 and 11 both say counters are "handled via a server-side Firebase Cloud Function."

*Options:*
- **(a)** Callable Function per increment. Consistent with 15.1's find-or-create pattern. Adds a cold-start latency on every card tap and a Function invocation per like.
- **(b)** Client-side `FieldValue.increment()` with a rule permitting updates that touch *only* `click_count` and `likes`. No cold start, no invocation cost, and the rule is writable — but it has to actually be written, and it's the same rule that has to coexist with O3's `creator_id` requirement.

*Leaning:* (b). A tap on a feed card is the most frequent write in the app; routing it through a Function is the most expensive place to be consistent.

### O7. Activity moderation fields — now or at 13.3

**✅ RESOLVED 2026-08-25 — add at 13.3, not now.** Project 8's schema stays minimal. **Accepted cost, recorded so it isn't a surprise:** when 13.3 lands, `is_active == true` has to be retrofitted into Project 11's dual query and Project 13.1's filtered queries, and the composite indexes those depend on have to be rebuilt. Note this in 13.3's Depends-on / scope section.

For user-generated content you'll need a way to hide an activity without deleting it (`is_active` or `moderation_status`) and a way to see when it changed (`updated_at`). Neither exists.

*The real question is timing:* adding `is_active` **now** means every feed and search query in 11 and 13.1 includes `is_active == true` from the start. Adding it at 13.3 means retrofitting those queries and re-testing indexes.

*Leaning:* add both fields to the Activity schema in Project 8 now, default `is_active: true`, even though nothing sets them false until 13.3.

### O8. The user status feature — spec it or defer it

**✅ RESOLVED 2026-08-25 — keep it, spec it as a light ticket (D5).** What it is, in Kyson's framing: a way for a user to mark whether they're available to hang out or currently unavailable. Deliberately small and out of the way — the goal at MVP is to ship it and learn whether anyone uses it, not to build it out. Spec accordingly: minimal surface, no notifications, no status feed.

`current_status`, `status_visibility`, `status_expires_at` are in the Users doc and `StatusService.ts` exists in the prototype. **No ticket describes what a status is, who sees it, or how it expires.**

*Options:* write it as a new ticket (D5), or mark the three fields deferred in the schema and leave `StatusService.ts` unwired at MVP.

### O9. `Free_Busy` visibility

The rules let any authenticated user read any user's free/busy blocks. The schema comment frames this as deliberate ("public calendar blocks for UI, keeps private events safe"). But it means a stranger — not just a friend — can see when you're busy.

*Worth knowing before you decide:* restricting this to friends requires a `get()` on the friend document inside the rule, which is **a billed document read on every single evaluation.** Friends-only is not free here.

*Leaning:* keep authenticated-read for MVP and write a one-line note in the schema saying it's intentional, so nobody "fixes" it later.

### O10. Profile picture denormalization — the staleness problem

`friend_profile_picture_url` is copied into each friend's `Friends` subcollection. When a user changes their picture, **every friend's cached copy is stale.** Project 6 §2 step 7 flags this as unresolved ("not actually sure now if we need that").

*Options:*
- **(a)** Accept staleness. Friends see the old picture until something else rewrites the doc.
- **(b)** Fan out updates to every friend's document on change. Expensive and unbounded.
- **(c)** Drop the denormalized field; read the friend's live `profile_picture_url` when rendering.

*Note:* 15.1 already chose **(c)** for chat avatars — "1-on-1 avatars resolve at render time from the other participant's live `profile_picture_url`." Choosing (a) or (b) here would put two different answers in the same app.

*This same decision applies to* `sender_name` *and* `sender_profile_pic_url` *on messages in 15.2, and to* `friend_name`.

### O11. Feed ordering — 11 and 13.1 contradict each other

**✅ RESOLVED 2026-08-25 — score decides order; drop the positional interleave.** The interleave came from an earlier design where the feed was randomly assembled; the heuristic score replaced that, and the 150-point flat proximity score for location-less activities already balances the two categories. **What survives:** the dual query still exists (Firestore can't OR), and Project 11's fallback state still applies — if Array A returns zero results, render Array B in its entirety. What changes is only the merge: concatenate and sort by score, rather than injecting 1-in-4 by position. See F6 for the pagination consequence.

Project 13.1 says the heuristic score determines feed order. Project 11 says inject one non-location activity every 4 cards. **Interleaving by position overrides ordering by score** — they can't both be true.

*Options:* score determines order and the interleave is dropped; interleave is applied and score orders *within* each stream; or the interleave becomes a soft rule (inject only when the next Array B item's score is within some band).

### O12. Terminology — three names, possibly one screen

"Planner tab" (12), "Calendar" (18), and the tab a user lands on after signup (1, 2). Also "Discover tab" vs "activities tab" (11 §4).

*Needed:* the canonical name for each tab, and the full tab list. 15.1 notes there's no chat tab in the current three-tab bar (Discover, ?, Search) — so the navigation structure itself is unspecified.

### O13. Recurrence in Project 18

The MVP assessment recommends cutting it. Recurrence brings expansion, exceptions, "delete just this one," and timezone handling — the single biggest complexity multiplier in the roadmap.

*Confirm:* single events only for MVP, recurrence explicitly out of scope in 18.

### O14. Project 21 sequencing

Deep Linking & SMS Sharing is listed 21st but it's the entire cold-start mechanism — SMS invite → App Store → straight into the voting chat is the growth loop.

*Confirm:* move it ahead of 14, 18's recurrence, and 19 — to right after the core loop (15 + 16 + 17) works.

### O15. Design tokens and dark mode — needs actual values

You flagged this yourself in Project 4's closing note. Until it's decided, every ticket that says "emerald-600" or "depending on dark mode" invites a different hardcoded hex per screen.

*Needed from you:* the named color set with real values for both modes (primary, danger, surface, surface-dark, text-primary, text-secondary, disabled), how dark mode is detected and switched (system preference, or the toggle referenced in Project 7 — or both), and the type and spacing scales.

### O16. Mandatory profile picture at signup

Project 6 says "probably easiest to make this mandatory rn." Mandatory upload during signup is a real conversion cost and it changes the signup flow spec in Projects 1, 2, and the onboarding ticket that doesn't exist yet (D7).

---

## Part 4 — 🟣 Open: Jonathan's call

### J1. Firebase SDK path — `react-native-firebase` vs. hand-written native bridges

The one decision with the widest blast radius. Every Firebase-touching ticket in the roadmap runs fast or slow depending on it, and iOS has **zero** Firebase integration today either way.

*Blocks:* Project 0's Firebase line, and 15.2's offline/connectivity section — which can't be written at all without it, because the two paths produce almost entirely different implementations.

*Framing for Jonathan:* the recommendation and reasoning are yours to bring; his input is feasibility and whether he'd rather own the native code. Not an open question to hand him cold.

### J2. Geohash query library

Firestore has no native geo query. `geofire-common` (manual bounds, current) or `geofirestore` (wrapper, less maintained). The choice changes the query code in 8, 11, and 13.1 substantially.

*Leaning:* `geofire-common`. Needs naming in Project 0 either way.

### J3. Is Project 3 already done?

The rules are written and dated 5/11/26 in the schema doc. Project 3 may be complete. Needs confirming before it's rewritten.

### J4. Where do the security rules live?

The doc says Firebase Console. That means the app's most security-critical file **is not version-controlled.** Recommend `firestore.rules` in the repo, deployed via CLI, with the Rules Playground deny-case tests as part of Project 3's acceptance criteria.

### J5. Current state of `FirebaseModule.kt`

Eight auth bugs per an earlier audit, and a `runBlocking` call forcing an async Firestore read to behave synchronously across the bridge. Jonathan's local tree may be ahead of what's committed — needs confirming before Project 1 is finalized.

### J6. Repo visibility and `google-services.json`

`google-services.json` is committed despite `.gitignore` patterns that should have excluded it, and the repo was publicly cloneable as of the July 2026 audit. **This needs checking regardless of every other decision on this page.**

---

## Part 5 — Flags: things worth noticing that the change list didn't catch

### F1. 15.1's friend-accept trigger creates a circular dependency

15.1 says accepting a friend request auto-creates a 1-on-1 chat, via a callable Cloud Function. That makes **Project 5 depend on the Cloud Functions setup ticket (D2) and on 15.1** — but Project 5 sits in Phase 2 and 15.1 in Phase 4.

*Why this matters:* if you build Project 5 first as written, you build it twice. Either the chat creation is explicitly deferred out of Project 5 (and 15.1 backfills chats for existing friendships), or Project 5 moves after 15.1. This is a sequencing decision, and it's easy to miss because each ticket reads fine alone.

### F2. `Private_info` is doing two contradictory jobs

It holds owner-only secrets (`email`, `fcm_tokens`, `blocked_users`, `external_calendar_tokens`) **and** data the app reads constantly on the hot path (`location`, `geohash`, `tag_affinity_scores`, and possibly `liked_activity_ids` per O2).

That's fine — the owner reads their own document — but it means **one document is read on nearly every app open and written on nearly every interaction** (13.2 writes tag scores on every click and like). Firestore's ~1 write/sec per document limit is a real ceiling, and 13.2's 2-second buffer is currently the only thing keeping you under it.

*Worth considering:* splitting the hot-path fields into a second owner-only document, so a rapid-fire tag score write can't contend with anything else. Not urgent at MVP scale — but it's a schema decision, which means it's expensive later.

### F3. The `ChatService.ts` / `StatusService.ts` missing-`await` bug is a pattern, not two bugs

Both call `localStorage.getItem/setItem` without `await`. Right now that's harmless because AsyncStorage returns fast enough to look synchronous. **The moment those become real Firestore calls, they break** — and they break intermittently, which is the worst kind.

*Why it matters as a flag:* this will resurface in whichever ticket rewrites those services, regardless of the SDK decision. Worth a standing line in Project 0 rather than a note in one ticket.

### F4. Nothing in the roadmap defines what "done" means

No ticket mentions tests. The acceptance criteria are good — they're specific and testable — but nothing says whether they're verified by hand, by a test suite, or at all.

*Why it matters for Claude Code specifically:* an AI implementer with no test target will report a ticket complete when the code compiles. Project 0 should state the minimum bar, even if that bar is "manual verification against the acceptance criteria, no automated tests at MVP."

### F5. Firebase Dynamic Links no longer exists

Shut down August 2025. Project 21 has no ticket yet, so nothing references it — but models trained on older Firebase docs suggest it confidently, and it's exactly the kind of thing that gets written into a spec and then into code. Alternatives: Branch, AppsFlyer OneLink, or hand-rolled Universal Links / App Links with a landing page.

*Deferred deep linking* — user taps a link, doesn't have the app, installs it, and still lands in the right chat — is the hard part and the whole value of the growth loop. It's also what determines which service you pick.


### F6. Dropping the interleave exposes a pagination problem

With the interleave gone, feed order is decided *entirely* by client-side scoring — and you can only sort what you've fetched. Project 11 currently fetches 5 at a time. Scoring 5 nearby plus a sample of at-home activities and sorting those means "highest scored first" is only true *within each page of ten*, which across a long scroll produces an order that looks close to arbitrary.

13.1 already half-acknowledges this ("it scores what's fetched"), but it was survivable when position-based interleaving was imposing a visible structure on top. Now it isn't.

**The fix is a fetch-size decision, and it belongs in Project 11:** fetch a larger initial pool (say 50 nearby + 25 at-home), score and sort the whole pool client-side once, then paginate through the *sorted result* five cards at a time — fetching the next pool only when the sorted one runs out. Costs more reads per pool but far fewer pools, and it's the only way score-based ordering actually produces a scored feed.

*Why it matters:* this is the kind of thing that looks fine in testing with 20 seeded activities and falls apart at 200. Worth deciding now, while Project 11 is being edited anyway.

### F7. Two decisions now point at the same Cloud Function

O4 routes friend requests through a Function. S3/15.1 routes chat find-or-create through a Function. Both fire on the *same user action* — accepting a friend request creates the friendship **and** the 1-on-1 chat.

Worth speccing them as one callable (`acceptFriendRequest`) that does the block check, the batched friendship write, and the chat find-or-create in a single server-side transaction — rather than two callables the client has to sequence and handle partial failure between. That's a Project 5 architecture decision, and it's much cheaper to make now than after both exist.


---

## Part 7 — Round 3 resolutions (2026-08-25)

### O11 follow-up — pagination approach ✅ RESOLVED

**Fetch a pool, sort it, paginate the sorted result.** Project 11 fetches roughly 50 location-based + 25 at-home activities in one pass, scores and sorts the whole pool client-side once, then feeds it out five cards at a time via `onEndReached`. The next pool is fetched only when the sorted one is exhausted. More reads per pool, far fewer pools — and it's the only version in which a score-ordered feed is actually score-ordered.

### D6 / D7 / D8 — unclaimed screens ⏸️ DEFERRED PENDING JONATHAN

Own-profile tab, onboarding flow, and settings/logout/deletion. Kyson's read: onboarding likely already exists, and Jonathan has uncommitted local work that isn't visible in the repo. **Action: write a short outline of what each should cover — not a full ticket — and hold until they can be walked through with Jonathan against the actual code.**

**One exception worth not deferring silently:** account deletion is an **App Store review requirement** for any app with accounts, and it's structurally messy under this schema. Deleting a user leaves orphans in every friend's `Friends` subcollection, in every chat's `participants` array, and in every event's `shared_with` and `confirmed_participants`. The cleanup strategy (cascade via Function, tombstone the user doc, or soft-delete) is a **schema decision**, which makes it far cheaper to settle now than after 15.x and 18 are built on top of it.

### D10 — offline & error conventions ✅ FOLDED INTO PROJECT 0

Not its own ticket. Becomes a section of Project 0 defining the app-wide pattern once: connectivity detection, banner vs. per-screen error, retry behavior, and whether Firestore offline persistence is enabled. **Note: the persistence half of that answer depends on J1** — the SDK decision determines whether persistence is a config flag or hand-built.

### Write-line scope ✅ RESOLVED

**Through Project 21 — everything not already deferred.** Deferred and receiving a Status line only: Projects 10 (API integration), 14 (AdMob), 19 (external calendar sync), and recurrence within 18.

---

## Part 8 — Round 4 resolutions (2026-08-25)

| Item | Ruling |
|---|---|
| iOS minimum | **15.1** |
| iOS system grays | **Phased out entirely** (22 usages). Replaced opportunistically as tickets touch those screens — no dedicated sweep ticket |
| `geminiService.ts` + `@google/genai` | **Delete both.** Google AI Studio built it to populate the Discover tab with placeholder content |
| Testing bar | **Confirmed as drafted** — pure logic unit-tested, UI and Firestore manually verified. Revisit and raise once there's a read on how well Claude Code performs and how much Jonathan trusts it |
| Tab bar | **Five tabs:** Planner, Discover, Search, Circle, Profile. Circle = chats **and** status, not chat-only |
| Navigation library | **Adopt React Navigation.** Needs its own migration ticket — it touches every screen transition |
| Primary green | `#10b981` (emerald-500). Sweep the docs, not the code |
| Gray scale | Tailwind zinc |
| Feed pagination | Fetch a pool (~50 near + ~25 at-home), sort once, paginate the sorted result |

### O17. Discover card imagery ✅ RESOLVED — category illustration set

**Ruling:** 15–20 illustrations (or patterned color fields) covering the tag groups. Every activity maps to one. No per-activity photography or stock sourcing at MVP.

**Correction to the premise:** stock photos aren't necessarily a cost — Unsplash and Pexels are free for commercial use with no attribution required, and `constants.ts` already uses Unsplash URLs. The reason not to use them is fit, not price: a generic dinner-party photo for "murder mystery party" reads worse than no photo.

**Why illustrations win here:** one design effort instead of 150 sourcing decisions, always fits because it's generic by design, and it upgrades cleanly — when UGC and the Places API bring real photos, a card swaps its illustration for an image rather than needing a redesign.

**Consequences to carry into tickets:**

- **Project 8** — needs a `category (String)` field with a fixed enum mapping 1:1 to the illustration set, **distinct from free-form `tags`.** Deriving the illustration from `tags` is fragile when an activity carries five of them. `pictures` stays in the schema but becomes optional. **[DECISION when we write Project 8: confirm `category` as a new required field.]**
- **Project 9** — acceptance criterion "at least one picture for each activity" is replaced by "every activity has a valid category." The sheet gains a category column. **And the scope grows:** per Kyson, the current AI-generated activity list is low quality and needs rewriting, so this ticket becomes *write the content*, not *format the sheet*.
- **Projects 11 / 12** — card and detail page render the category illustration when `pictures` is empty. The image carousel in 12 only appears when there's more than one real photo.
- **Project 13.3** — UGC activities carry real user photos, so both paths have to render.

### Dark mode — current state is broken

`App.tsx` holds `useState(false)` drilled as an `isDarkMode` prop. `useColorScheme` is never called, so the system setting is ignored, and the value isn't persisted, so it resets every launch. Appendix A §A.1 proposes a three-state toggle (System / Light / Dark) read from one Context hook. **Open.**

### `users` vs `Users` — open, one question for Jonathan

Provenance supports following his code (`FirebaseModule.kt` is hand-written, not generated). But the cost is asymmetric: uppercase is a one-string change in one file, lowercase means rewriting the security rules, the schema doc, and every ticket. And the published rules only protect `Users` with a catch-all deny beneath — so **lowercase writes are denied in production today**, and only appear to work because `debug = true` routes to a rule-less emulator. **Ask whether the lowercase was deliberate.**

### 🔴 `.env.local` — live credential in a public repo

Committed in `71a7c07` (3/5/26), **still tracked**. Contains a live `GEMINI_API_KEY`. Revoke the key — removing the file leaves the value reachable in history.

---

## Part 9 — Round 5 resolutions (2026-08-26)

### O18. RSVPs — where they live ✅ RESOLVED

**Ruling:** a map on the `Events` document, keyed by uid — `rsvps: { uid: "going" | "not_going" | "pending" }`.

**Why:** it's the same shape the schema already chose for `normal_votes` and `ranked_votes`, so the app has one pattern instead of two. Each user writes exactly one field they own, which makes dedup structural and the security rule a single line. `confirmed_participants` becomes derived from the map rather than separately maintained — one source of truth instead of two that can disagree.

**What this replaces:** the prototype stores RSVPs inside a chat message (`Message.eventDetails.rsvps`), mutated by `ChatService.updateMessageRSVP`. That can't be secured — there's no rule that lets user B set their own RSVP without also letting them edit A's.

**Propagate to:** the master schema (`Events` gains `rsvps`), Project 16, Project 12.2/Planner, and Project 15.2 (messages carry a pointer, not the RSVP state).

### First implementation task ✅ RESOLVED

**Project 0.1 — Repair the Boot Path** goes to Claude Code first, ahead of any feature ticket. Rationale: three of four tabs crash on load, so nothing else can be verified on a device. Also a low-risk trial — every acceptance criterion is verifiable by whether the app stops red-screening.

### Voting tally must run server-side — forced by the code

Not a preference. Both tally functions in `votingLogic.ts` break ties with `Math.random()`, so **two devices tallying identical ballot data produce different winners.** Client-side tallying is not viable in a multi-user vote. Project 17 must put the tally in a Cloud Function, or use a deterministic tie-break seeded by the vote document id.

Related, and also for Project 17: the IRV implementation batch-eliminates every option tied for last, which inverts the winner in a concrete case (A=2, B=2, C=3 with A/B second choices → this code returns C; standard IRV returns B with a 4/7 majority). And there are **four tally implementations across the codebase using three tie policies** — one of them Borda while the orphaned module is IRV. All four collapse to one, server-side.

---

## Part 10 — Round 6: Jonathan decisions + process change (2026-08-26)

### J1 ✅ RESOLVED — `react-native-firebase`

**Consequence, and it's larger than filling in one line of Project 0:** the Kotlin bridge gets **deleted, not fixed.** Most of the audit's ten-bug inventory disappears with the file — the inverted existence guard, empty `mergeFields()`, double promise resolve, error-resolved-as-success, empty `getActiveUser`, `runBlocking`, the lowercase `users` collection, the wrong emulator port, the discarded emulator config. Don't spend a ticket on them.

- **Project 1 becomes:** install RNFirebase, delete `FirebaseModule.kt` / `FirebasePackage.kt` / `DBService.kt`, wire auth in TypeScript.
- **New unowned work:** iOS setup from zero — `GoogleService-Info.plist`, pod install, and the Xcode project is still named `AwesomeProject`. Needs a ticket.
- **Resolves** Project 0 §9's offline-persistence bracket (RNFirebase provides it as config) and unblocks 15.2's offline section.
- **Moots** the `users` vs `Users` casing question — the file that writes lowercase is being deleted.

### J2 ✅ RESOLVED — `geofire-common`

### Process change — Jonathan and Jonah review rather than build in parallel

New order: Kyson writes and edits every ticket → Jonathan and Jonah review and add → Kyson runs them through Claude Code → the team reviews the code.

**Consequences:**

1. **Tickets become load-bearing.** Claude Code implements from the ticket, not from a conversation. Three additions to the format, confirmed: a **files-to-touch allowlist**, **verification commands**, and a **stop-and-ask clause**. Applied to `Knect_Ticket_Spec_Template.md`.
2. **Jonathan's uncommitted work is treated as discardable** — the SDK decision supersedes most of it. Baseline is commit `8493a36`. Noted as a lesson rather than a loss.
3. **`CreateProfilePage`'s out-of-scope reasoning weakens** but the file still stays out of 0.1 — its state is unknown and the ticket doesn't need it.

### Schema maintenance mechanism ✅ RESOLVED

`Knect_Master_Schema.md` in the project is the **working copy**; the Google Doc is the published mirror. Claude cannot write to Google Docs — `update_file` only changes titles and folders — so changes land in the project doc with a dated change log, and Kyson syncs by hand.

### Session structure ✅ RESOLVED

Continue in this session for the foundation work, with `Knect_START_HERE.md` carrying context and process forward to future sessions. Project 0 gets its redraft **last**, after the tickets are settled.

### ❓ NEW OPEN — `name_lowercase`

Jonathan suggested handling it in JavaScript rather than in the schema. Two readings, and they land differently — see Master Schema Q1. One is correct and changes nothing; the other breaks Project 4's search, because the range query is evaluated server-side against stored data and Firestore has no case-insensitive mode. **Needs one clarifying round with him.**

### Rules: the friend-acceptance problem may resolve itself

The current `Friends` rule allows `update` only when `request.auth.uid == userId`, which breaks acceptance (the batch's second write is denied). But acceptance now runs through the `acceptFriendRequest` Cloud Function, which uses the Admin SDK and bypasses rules entirely — so no amendment is needed. **Confirm rather than assume:** if any acceptance path stays client-side, the rule still has to be fixed.

---

## Part 11 — Round 7 (2026-08-30)

### Review convention ✅ ADOPTED

Docs needing Kyson's review carry **`(r)`** in the filename. It marks documents containing something Claude decided or restructured, where an error propagates into code. Docs without it are ledgers of Kyson's own decisions, derived status views, or verified facts — reference, not sign-off. **The `(r)` comes off when reviewed.**

Currently marked: Master Schema, Ticket Spec Template, Project 0.1, Appendix A/B, START_HERE.
Not marked: Decision Log, Running Order, Codebase Audit, Codebase Reconciliation.

### Friends list read cost ✅ RESOLVED — accept it

Removing `friend_profile_picture_url` means the friends list reads N user documents per render rather than one subcollection query. **Ruled acceptable.** Kyson's reasoning: keeping the denormalized copy creates a visibility and quality problem (stale pictures), and the read cost is minimal at realistic friend counts. Consistent with 15.1's live-read decision for chat avatars.

### Friend-acceptance rule ✅ RESOLVED — the rules overhaul owns it

Not resolved by the Cloud Function bypassing rules. **The security rules are getting a full realignment with additional hardening**, and that work owns this gap along with the others. Project 3.

Corollary worth holding: don't treat a rule gap as fixed because a Function with Admin SDK credentials happens to bypass it. That removes the second line of defense rather than fixing the first.

### Appendix A/B ✅ RESOLVED — stays standalone, folds into Project 0 later

Remains its own doc for now. Gets folded into Project 0 at that document's redraft, and reviewed then. My earlier proposal to cut A to colors only and B to a naming list is **not adopted** — revisit at the redraft.

---

## Part 12 — Round 8 (2026-08-30)

### Reviewed and cleared

`Knect_START_HERE`, `Knect_Master_Schema`, `Knect_Ticket_Spec_Template`, `Knect_Project_0_1_Repair_Boot_Path` — all reviewed by Kyson; `(r)` removed. **Appendix A/B keeps its `(r)`** — deliberately deferred to the Project 0 redraft.

Kyson's note on 0.1, worth carrying into the code review: *"I am less versed in some of the technicalities in this project... not as well as some of the other projects."* The ticket is structural rather than product logic, so the spec is sound — but **Jonathan should review Claude Code's output on this one more closely than usual**, since it's the ticket Kyson is least equipped to catch a subtle error in.

### Q2 — `Free_Busy` visibility ✅ RESOLVED

**Rules stay permissive; visibility is enforced by the UI.** Free/busy is only surfaced between friends anywhere in the app, so in practice nobody sees a stranger's blocks — regardless of what the rules permit.

Recorded honestly: **this is UI-gating, not security.** Someone hitting the API directly could read anyone's blocks. Accepted because a free/busy block reveals *that* you're busy and nothing about what you're doing. **If that ever changes** — a title, a location, a linked event — this decision has to be revisited.

### Q3 — remaining denormalized fields ✅ RESOLVED — remove them all

Kyson's instinct was to treat names differently from pictures and check them occasionally, "maybe through the same pathway without raising costs." The same pathway turns out to make the denormalized copy unnecessary entirely:

Removing `friend_profile_picture_url` already forces a read of the friend's Users document for the live picture. **Once that read is happening, the name is in the same document at no additional cost.** A denormalized `friend_name` saves nothing and adds a field that goes stale.

Verified against every screen that shows a friend's name — friends list, close-friends widget, chat list, search results, pending requests — and all show name and picture together. No path pays for a read it wasn't already making.

Messages resolve the same way, deduped by sender: a 200-message chat from 5 people reads 5 user documents, not 200. Cache per sender per session.

**Removed:** `Friends.friend_name`, `Friends.friend_profile_picture_url`, `Messages.sender_name`, `Messages.sender_profile_pic_url`. `Friends` now holds only `status`.

⚠️ **Consequence to design for:** with no cached copy, a deleted user resolves to nothing. Every screen showing a person needs a "Deleted user" fallback with a placeholder avatar. Ties directly to the account-deletion ticket, whose cleanup strategy is still undecided.

---

## Part 13 — Round 9: writing 15.2 (2026-08-30)

Every ruling below came out of drafting **15.2 — Messaging & Real-Time Listeners**. Most of them touch other tickets, so each carries an explicit propagation line for the edit pass. 15.2 itself was reviewed and cleared the same day.

### Schema additions ✅ RESOLVED

| Field | Where | Why |
|---|---|---|
| `deleted_at` (Timestamp) | `Chats/{chatId}/Messages` | Message delete is a **tombstone**, not a removal — `text` set to `""`, `deleted_at` set, document kept. Renders "Message deleted" in place so the thread and its consecutive-sender grouping don't break around a hole. It's an `update`, so there is still no `allow delete` on Messages |
| `recent_message_sender_id` (String) | `Chats` | Written by the preview Function alongside the other two preview fields |

**`recent_message_sender_id` closes a hole in 15.1, not just a need in 15.2.** 15.1's acceptance criterion asks for a group-chat subtitle in the form `Jordan: sounds good`, but the `Chats` document stores the message text and **nothing about who sent it** — there is no name to prefix. The block filter (below) has the same requirement: it can't decide whether to hide a preview without knowing who wrote it. Without this field both features need a read of the last message per chat row, on every chat-list render.

**Propagate to:** Master Schema (`Chats`, `Messages`), 15.1 §2, Project 3 (the Messages update rule has to permit the tombstone shape and nothing else).

### `message_type` enumerated ✅ RESOLVED — closes half of Q5

**Five values, snake_case:** `"text"` · `"system"` · `"activity"` · `"event_proposal"` · `"vote"`. The prototype's kebab-case `event-proposal` is dropped; nothing else in the schema uses kebab-case.

**15.2 writes only `"text"`,** and its create rule permits only `"text"` — 16 and 17 widen it when they need to. `"system"` is reserved and nothing writes it yet.

⚠️ **Worth re-checking at Project 16:** `"event_proposal"` and `"activity"` are only both worth having if 16 turns out to have two genuinely different message renderings — a plain shared activity card versus a formal proposal carrying a vote. If it has one, shrink the enum **before** anything ships, not after two implementations disagree about which value means what.

**Propagate to:** Master Schema (Q5 partially closed — 17 still owns `vote_type`, `change_type`, and Vote `status`), Projects 16 and 17.

### Offline persistence ✅ RESOLVED — closes Project 0 §3 and §9

**ON, at the SDK's default cache size, set explicitly in one Firestore config module.** The native SDKs likely default to this already; setting it by hand makes it a decision rather than an inherited default, and gives the next person one file to look at.

This fills the last `[DECISION]` bracket left over from D10 and J1. Everything in 15.2's send path assumes it — the optimistic bubble is only honest because the write lands in the local cache immediately.

**Propagate to:** Project 0 §3 and §9 at its redraft.

### The chat-list preview is written by a Cloud Function ✅ RESOLVED

The client writes **only** the message document and never touches the parent chat. A Function on `Chats/{chatId}/Messages/{messageId}` writes `recent_message`, `recent_message_timestamp`, and `recent_message_sender_id`.

**It fires on create *and* on update.** Create-only would be cheaper, but tombstoning the newest message would leave the chat list displaying the exact text the user just deleted — that reads as a privacy failure, not as lag.

**Two consequences:**

1. **D2 is now a hard dependency of 15.2.** The Running Order's implementation graph currently feeds D2 into Projects 5 and 15.1 only; it needs an edge to 15.2.
2. **Project 20 hangs push notifications off the create half of the same trigger,** so it isn't built twice.

Accepted trade-off: the sender's own chat-list row lags their message by the Function's round trip. The thread is the screen they're looking at, and the UI is optimistic there.

**Propagate to:** Running Order Part 2 graph, D2, Project 20.

### Listener architecture — this ticket sets the app-wide pattern ✅ RESOLVED

There is not one `onSnapshot` in the repo today, so 15.2 establishes the convention rather than following one.

- **Two listeners, never more:** the chat list, and the open thread. One thread listener at a time.
- **Teardown is part of the spec:** unsubscribe on unmount *and* on app background; resubscribe on foreground. An un-torn-down listener keeps billing reads while the app is closed.
- **Pagination:** 25 on open, live. Scroll-back fetches 25 more with a one-time `get()` and a `startAfter` cursor, appended as static data. **The listener's `limit` never grows** — re-subscribing with a larger limit re-delivers everything already loaded, so cost grows roughly quadratically down a long thread.

**Propagate to:** Project 0 at its redraft, as a standing convention rather than a 15.2 detail.

### Unread state ✅ RESOLVED — device-local

A last-read timestamp per chat stored on the device; the chat list shows a **dot, not a count**, when `recent_message_timestamp` is newer. No schema field, no shared-document writes.

An `unread_counts` map would mean every participant writing the same document on every message — straight into Firestore's ~1 write/sec per-document ceiling in an active group chat (the same ceiling F2 flags for `Private_info`).

Known and accepted: it does not sync across devices, and a reinstall clears it.

**Pattern note, worth naming so it stays deliberate:** this is the second ruling in a week that puts enforcement or state outside the server where the cheap version is good enough — Q2 (`Free_Busy` visibility is UI-gated) was the first, and the blocking decision below is the third. That's a defensible MVP posture, but it should be a posture rather than three unrelated shortcuts. **Anything in this class gets written down as UI/device-level, never described as enforced.**

### Blocking ✅ RESOLVED — and O4's answer was protecting the wrong person

**The problem, stated plainly:** `blocked_users` lives in `Private_info`, which only its owner can read. So a send-side gate can only ever act on blocks **you** made. If A blocks B, A's input bar goes dark and B's does not — B keeps sending and A keeps receiving. That is backwards from what blocking is for, and **Apple's Guideline 1.2 requires "the ability to block abusive users from the service"** for any app with user-generated content. A reviewer tests exactly this.

**Ruling — three layers, in three different tickets:**

1. **15.2 — the receive-side filter is the real protection.** You do not see messages from anyone in your own `blocked_users`, filtered on `sender_id` at render time in the thread, the conversation-list preview, and the unread dot. Because it filters per sender it covers group chats too. **This is client-side and that's fine here:** unlike a send-side gate, the only person who can bypass a receive-side filter is the person it protects. It's how iMessage behaves.
2. **15.2 — the send-side gate stays, as a courtesy.** Blocked the other person in a 1-on-1? Your input bar is disabled. Not a protection; see above.
3. **Project 3 — the actual rule.** None of the above stops the write; a blocked user's messages are still created, stored, and delivered before being filtered out. Real denial needs a readable block record and a rule, and the rules realignment owns it. **Do not describe blocking as enforced anywhere until that lands.**

### Blocking removes the friendship ✅ RESOLVED — Project 5 implements it

Blocking deletes the `Friends` entries on both sides. 15.2 assumes it and does not touch `Friends`.

**Consequences to carry into the edit pass:**

- **Free/busy visibility drops with it, for free.** Q2 gates free/busy to friends in the UI, so removing the friend edge removes the visibility. Good outcome — recorded here so it's a decision rather than an accident of two unrelated rulings.
- **Same for the close-friends widget (Project 4) and anywhere `Friends` is read.**
- **It is destructive.** Unblocking does not restore the friendship, and the other person watches you disappear from their friends list — which tells them they've been blocked. Both are acceptable, both should be stated in Project 5 rather than discovered.
- **Chat history survives.** If the pair later unblock and re-friend, 15.1's find-or-create returns the *same* chat with its full history. Right behavior; worth saying out loud.

**Propagate to:** Project 5, Project 4, the `Free_Busy` note in the Master Schema.

### Smaller 15.2 rulings, recorded for consistency

- **Message content is text only, with a 2,000 character cap enforced in the security rule as well as the input.** A cap enforced only in the UI is not enforced.
- **Sends are fully optimistic** — the bubble renders as sent with no "sending" state. A permanently rejected write flips to a failed treatment with tap-to-retry. **Telling a user about a failure they've navigated away from is Project 20's**, not 15.2's.
- **Typing indicators and read receipts are out.** Both need per-keystroke or per-view writes to a shared document — the contention pattern F2 already warns about.
- **In-chat message search is cut entirely**, from both the conversation list and the thread. Firestore has no substring search; a search box that silently misses everything past your scroll position is worse than none, because users trust a zero-result as an answer.
- **System messages are out of 15.2.** Rename and leave (15.1) stay silent for now.
- **`services/ChatService.ts` is deleted and replaced by a Firestore repository module.** It's a local-blob-store API with no concept of a listener or a cursor. **Project 0.1 converts that same file to proper async first and 15.2 then throws it away — that overlap is accepted, not an oversight:** 0.1 is what stops the Circle tab red-screening so anything is testable in the meantime, and it forces the call sites async, which they have to be either way.

### ❓ NEW OPEN — content reporting has no owner, and it's a launch blocker

Guideline 1.2 has four requirements. Blocking is handled above; **"a mechanism to report offensive content and timely responses to concerns" is not owned by any ticket.** It appears once in the roadmap, as a parenthetical question inside 13.3 — which is deferred.

**Ruling on where it goes: 13.3, because it's about content and not users** — 1.2 pairs content-reporting with user-blocking, and blocking covers the user half.

**Two conditions on that, or it won't actually satisfy the guideline:**

1. **13.3's scope has to widen past activities.** Knect has three UGC surfaces — user-created activities, chat messages, and profile fields (`name`, `profile_info`, `profile_picture_url`, `interests`, `current_status`). 13.3 owns the *mechanism* (where a report lands, and who looks at it); each surface adds its own report entry point when its ticket is edited.
2. **13.3 cannot stay deferred through launch.** It is currently on the deferred list, which means the thing standing between Knect and App Review is parked.

Also unresolved from the same guideline: **"published contact information"** — a support address in the app and in the App Store listing. Not a ticket, a launch-checklist item, and it has no home yet.

### ⚠️ FLAG — `firestore.indexes.json` has no owner in the implementation order

15.2's chat-list query (`participants array-contains` + `orderBy recent_message_timestamp`) needs a composite index. R17 says the file is version-controlled and the Running Order's Wave 7 says to write it, but **nothing in the *implementation* graph creates it before 15.2 needs it.** Firestore fails a missing composite at runtime with a create-index link — survivable in dev, a launch blocker in production. Same exposure applies to Projects 11 and 13.1.

### Running Order correction

Wave 4 still says 15.2 is "genuinely blocked by J1." **That is stale** — J1 resolved to `react-native-firebase` in Round 6, so offline persistence and listener reconnection come from the native SDK and the ticket is writable end to end. Remove the note; add the D2 edge described above.
