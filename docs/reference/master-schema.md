# Knect — Master Schema (Working Copy)

**This is the working copy.** The Google Doc ("Firebase Master Schemas") is the published mirror. I can read that doc but not write to it, so changes land here first and get synced by hand.

**How to use it:** Part 1 is the schema — fields only, with a short note where a field would otherwise get built wrong. Part 2 is the rules. Part 3 is the change log you copy into the Google Doc. Part 4 is what's still undecided. If you only need a field name, Part 1 is the whole answer.

**To sync:** copy Part 1 and Part 2 into the Google Doc, then move everything above the line in Part 3's log into "Applied."

**Last synced to Google Doc: 2026-09-08** — Kyson applied all four pending blocks (8/30, 8/31 ×2, 9/07) by hand. **Two sync gaps found on read-back**, both listed at the top of Part 3. **Two blocks are now pending** — Projects 16/17 and Project 3.

**Marks:** ➕ new · ✏️ changed · ⏸️ deferred · ❓ open, needs a ruling before it's built

---

# Part 1 — Collections

## Users

**Document: (User ID — must equal the Firebase Auth UID)**

- `name` (String)
- `name_lowercase` (String) — **a stored field**, computed with `.toLowerCase()` at write time and written to the document. Firestore has no case-insensitive mode and orders by raw bytes, so Project 4's search reads this field directly. **Never derive it at query time.**
- `profile_info` (String) — the signup screen's `role` input maps here; there is no `role` field
- `profile_picture_url` (String) — written as `""` at creation; Project 6 owns the first real upload
- `interests` (Array of Strings)
- `current_status` (String)
- `status_visibility` (String) ❓ — *see Q11. No defined value set.*
- `status_expires_at` (Timestamp)

> **No `email` here.** It lives in `Private_info`. The Users document is readable by every authenticated user, so anything on it is effectively public to logged-in users.
>
> **The three status fields are not written at signup.** `*2.2` creates the document without them, because **D5** owns the status feature and `status_visibility` has no defined value set yet. Anything reading them must handle undefined.
>
> ➕ **These eight field names are the `hasOnly` allowlist in `*3.2`'s rule.** Adding a field to this document now means editing the rule too, or the write is denied.

### Subcollection: Private_info

**Document ID: `main`**

- `location` (GeoPoint)
- `geohash` (String)
- `email` (String)
- `blocked_users` (Array of Strings)
- `fcm_tokens` (Array of Strings)
- `external_calendar_tokens` (Map)
- `tag_affinity_scores` (Map)
- `tag_scores_last_decayed` (Timestamp)
- `liked_activity_ids` (Array of Strings) — heart-icon prefill for feed cards, loaded once per session. Deliberately **not** on the Users doc, which would make your like history public.

> **Two warnings on this subcollection.**
>
> 1. It holds owner-only secrets *and* hot-path data read on nearly every app open and written on nearly every interaction. Firestore's ~1 write/sec per document limit is a real ceiling, and 13.2's 2-second debounce is the only thing keeping us under it. If contention shows up, split the hot-path fields into a second owner-only document.
> 2. **`blocked_users` is owner-only, and a sender physically cannot read whether the recipient blocked them.** So no client and no security rule can check the recipient's block list directly. 15.2 filters on the *receiving* side. ✏️ **This is now the decision rather than an interim** — see Part 2 item 9.
>
> **At signup (`*2.2`) this document is created with `email`, `blocked_users: []` and `fcm_tokens: []` only.** `location` and `geohash` have no ticket writing them at all (Q10); `tag_affinity_scores` and `tag_scores_last_decayed` are 13.2's; `liked_activity_ids` is Project 11's; `external_calendar_tokens` is Project 19's and deferred.
>
> ✅ ➕ **RULED 2026-09-09 — the rule pins the document ID to the literal `main`**, rather than the published `{privateId}` wildcard. A stray write to any other name is denied instead of quietly creating a second document nothing reads. **Warning 1 above is the one thing that reopens it:** if F2's hot-path split ever happens, that second document's path has to be added to the rule. *[Likely] not before launch.*

### Subcollection: Free_Busy

**Document: (Unique Block ID — for blocks written by a confirmed event, this is the Event's ID)**

- `start_time` (Timestamp)
- `end_time` (Timestamp)

> **Rules stay permissive; visibility is enforced by the UI.** Free/busy is only surfaced between friends anywhere in the app, so in practice nobody sees a stranger's. **This is UI-gating, not security** — someone hitting the API directly could read anyone's blocks. Accepted because a block reveals *that* you're busy and nothing about what you're doing. If that ever changes — a title, a location, a linked event — revisit it.
>
> **Blocking removes the friendship, so it also removes free/busy visibility.**
>
> **Written by a Cloud Function when an event confirms (16.2).** A `going` RSVP by itself writes nothing; the block exists because the event became real. **The document ID is the Event's ID** — the only way cancellation can find and remove the block without querying every block a user has. Cleanup depends on it.
>
> ⚠️ **Q7's resolution means this write is no longer one-shot.** A late `going` from someone who was still `pending` at confirmation has to produce a `Free_Busy` block too — see the Events note below.

### Subcollection: Friends

**Document: (Friend's User ID)**

- `status` (String) — exactly one of `"pending"`, `"request_sent"`, `"friend"`, `"close_friend"`

> **This subcollection holds only `status`.** Name and picture come from the friend's live Users document, and every screen that shows a friend shows both together, so one read covers both.
>
> **Blocking deletes both sides' entries.** Project 5 implements it. Unblocking does not restore the friendship; the other person can infer the block from their own friends list.
>
> ➕ **The four values are checked in-rule** by `*3.2` — one of only two value checks in the whole rules file.
>
> ➕ **`create` is constrained by direction, and this closes a real hole.** The published rule lets either party create the entry with **no constraint on the value**, so anyone could create `Users/{someone_else}/Friends/{themselves}` carrying `"close_friend"` and appear in that person's list unbidden. `*3.2` splits it: in **your own** doc the only creatable value is `"request_sent"`; in **someone else's** doc the only creatable value is `"pending"`.
>
> ➕ **`update` is owner-only, permanently — ruled 2026-09-09.** Acceptance runs through `acceptFriendRequest`, which has to run anyway for O4's block check (the recipient's `blocked_users` is unreadable by any client) and S4/15.1's chat find-or-create. Owner-only is therefore the *tightest* available rule rather than a broken one. **Condition: if Project 5 ever adds a client-side acceptance path, this needs a narrow counterparty clause** — `friendId` may update, `status` only, to `"friend"` only, from `"request_sent"` only. `*3.4` re-checks it.
>
> ➕ **`close_friend` is one-sided and needs no schema change.** The two documents are independent, so `Users/A/Friends/B == "close_friend"` while `Users/B/Friends/A == "friend"` is already valid. Starring is a write to your own document. **Do not treat it as requiring the other party.**

### Subcollection: Activity_History

**Document: (Unique History ID)**

- `activity_reference` (String — Activity ID)
- `tapped_ads` (Array of Strings) — ⏸️ *unused while Project 14 is deferred*

> Written by Project 11 on feed-card tap and Project 12 on detail-page open. 13.2's debounce covers these too — rapid taps produce one record, not five.

### Subcollection: Liked_Activities

**Document: (Activity ID)**

- `saved_at` (Timestamp)

> Record of truth for the Saved list. `Private_info.liked_activity_ids` is the cheap read-side mirror.
>
> ✅ **This subcollection now has a rule** — `*3.2`, written 2026-09-09. Until then it had none at all and fell to the catch-all deny, which blocked Project 11's like write and Project 12's Saved list.

> **None of the four subcollections above are created at signup** — only `Private_info` is. Firestore has no empty subcollections, and each of these gets its first document when the feature that owns it writes one.

---

## Activities

**Document: (Unique Activity ID)**

- `name` (String)
- `description` (String)
- `cost` (String — `"Free"`, `"$"`, `"$$"`, `"$$$"`)
- `source` (String) — **required**, one of `"manual_diy"` · `"api_yelp"` · `"user_generated"`
- `creator_id` (String) — **only** on `source == "user_generated"`. Seeded rows omit it entirely.
- `category` (String) ✏️ — **required.** Starting value set: `"Food"` · `"Outdoors"` · `"Indoors"` · `"Group"` · `"Date"` · `"Personalized"`. *See Q4 — the set is confirmed as a concept but not yet closed.*
- `tags` (Array of Strings)
- `pictures` (Array of Strings) — optional; seeded activities render a category illustration instead
- `location` (GeoPoint)
- `geohash` (String)
- `is_location_based` (Boolean)
- `click_count` (Integer, default `0`)
- `likes` (Integer, default `0`)
- `created_at` (Timestamp)
- ⏸️ `is_active` (Boolean) and `updated_at` (Timestamp) — **added at 13.3, not now.** Confirmed still deferred 2026-09-08. Accepted cost: `is_active == true` gets retrofitted into Project 11's dual query and 13.1's filtered queries, and those indexes rebuilt. **The Google Doc currently lists them without a deferral mark — that is a transcription gap, not a reversal.** ➕ **`*3.2`'s create allowlist omits both, and carries a deny case**, so the deferral is enforced rather than merely documented.

> **`source` is load-bearing.** The security rule gates on it rather than on the absence of `creator_id`, so it must be present on every document.
>
> **No `cold_start` field.** The 72-hour boost in 13.1 computes from `created_at`.
>
> **`category` and `tags` are different things and neither replaces the other.** `category` is a single required value that maps 1:1 to an illustration (O17); `tags` is free-form and feeds 13.1's search and 13.2's affinity scoring. Deriving the illustration from `tags` was rejected because an activity carrying five tags has no obvious primary.
>
> ⚠️ **`tags` and the onboarding interests list have to be one vocabulary.** 1.4 fixes 35 interest strings, `*2.2` stores them verbatim without normalizing, and 13.2 matches them against these tags. A mismatch zeroes every user's tag affinity and nothing looks broken. **Project 9 writes the tags and has to adopt that list**, or normalization needs an owner. Note this is a *third* vocabulary alongside `category`.

---

## Chats

**Document: (Unique Chat ID)**

- `participants` (Array of User IDs)
- `participant_hash` (String)
- `chat_origin` (String) — `"direct"` (friend-accept) or `"group"` (event creation). Never changes after creation.
- `chat_name` (String)
- `recent_message` (String)
- `recent_message_timestamp` (Timestamp)
- `recent_message_sender_id` (String)

> **`participant_hash` algorithm, exactly:** participant UIDs sorted in ascending byte order, joined with a single underscore — `AbC123_Xy9Zqq_m4Nop7`. Firebase Auth UIDs are ASCII alphanumeric, so the sort is unambiguous and `_` can't appear inside a UID. **Nothing is cryptographically hashed** despite the name. Computed only inside the Cloud Function, never client-side. Recomputed when someone leaves.
>
> **All three `recent_message*` fields are written by a Cloud Function, never by a client.** It fires on message create *and* update — the update half matters because tombstoning the newest message has to clear the preview rather than leave deleted text on display. Project 20's push notifications hang off the create half of the same trigger.
>
> ➕ **`*3.3`'s update allowlist is `chat_name` and `participants` only**, so `participant_hash`, `chat_origin` and all three `recent_message*` fields have no client clause at all. That is what makes "written by a Function, never by a client" true rather than aspirational.
>
> **`recent_message_sender_id` exists because two features need it:** 15.1's group subtitle (`Jordan: sounds good`) has no name to prefix without it, and 15.2's block filter can't hide a preview without knowing who wrote it.
>
> **Chat membership has a second consumer (16.1):** `Events.shared_with` mirrors `participants`, so **15.1's add/remove-member has to write `Events.shared_with` and the `rsvps` map for every open proposal in that chat.** Scope 15.1 does not currently have.
>
> **Composite index:** `participants array-contains` + `orderBy recent_message_timestamp`.

### Subcollection: Messages

**Document: (Unique Message ID)**

- `sender_id` (String)
- `text` (String) — **2,000 character maximum, enforced in the security rule**, not only in the input field
- `timestamp` (Timestamp)
- `message_type` (String) — exactly five values, snake_case: `"text"` · `"system"` · `"activity"` · `"event_proposal"` · `"vote"`
- `activity_id` (String)
- `event_title` (String)
- `event_id` (String) — the pointer from a proposal message to its Event (16.1)
- `vote_id` (String) — the pointer from a vote message to its Vote (17.1)
- `deleted_at` (Timestamp) — present only on a tombstone

> **`sender_name` and `sender_profile_pic_url` were removed.** Resolve live from `Users/{sender_id}`, deduped by sender and cached per session.
>
> **Who writes which `message_type`:** 15.2 writes `"text"`; 16.1 writes `"activity"` and `"event_proposal"`; 17.1 writes `"vote"`. `"system"` is reserved and nothing writes it yet. The prototype's kebab-case `"event-proposal"` is dropped.
> ✅ **The Project 16 re-check is closed: the enum does not shrink.** `"activity"` is sending an activity from Discover into a chat — no Event, no RSVPs. `"event_proposal"` is a real proposal with an Event behind it. Two different cards.
> ➕ **`*3.3`'s create rule permits four of the five values** — `"system"` is excluded because nothing writes it. Whichever ticket writes a system message widens the rule.
>
> **A proposal message carries display text:** `📅 Event Proposed: {event_title}`. Not cosmetic — the preview Function copies `text`, so an empty one produces a blank chat-list row and an unread dot pointing at nothing. **A vote message needs the same treatment.**
>
> **Deleting a message is a tombstone, not a removal:** sender-only, `text` set to `""`, `deleted_at` set, document kept, "Message deleted" rendered in place. It's an `update`, so there is **no `allow delete` on Messages**. ➕ **`deleted_at` is also excluded from the create allowlist**, so a message cannot be born a tombstone.

### Subcollection: Votes

**Document: (Unique Vote ID)**

- `created_by` (String — UID) ➕ — **who opened the vote.** Written at creation by 17.1; the security rule requires it to equal the writer's own UID, and it is the only thing that can identify who may cancel.
- `linked_event_id` (String) — absent on a freeform vote
- `vote_scope` (String) — two values: `"alternative"` (competing versions of an event) · `"open"` (freeform, no event)
- `vote_type` (String) — two values: `"normal"` · `"ranked"`. Ranked requires ≥3 options, normal ≥2.
- `status` (String) ✏️ — **three values:** `"open"` · `"closed"` · `"cancelled"`
- `created_at` (Timestamp)
- `resolves_at` (Timestamp) — `created_at + 24h`. **Set once and never moved**, including when options are added.
- `question` (String)
- `options` (Array of **Objects**). Each option:
  - `option_id` (String) — stable, generated at write. **Both ballot maps reference these**, so they are never regenerated or reordered.
  - `candidate_event_id` (String) — the `Events` document this option represents. Absent on a freeform vote.
  - `label` (String) — human-readable summary ("Friday 7pm — Bowling"). **Load-bearing:** losing candidates are deleted at close, so the vote must be able to render its own history after the events behind it are gone.
- `options_revision` (Integer) — starts at 1, increments on every option added. Ballots record the revision they were cast against; this is how a stale ranked ballot is detected.
- `proposed_start_time` (Timestamp) — freeform votes only; an alternative carries its times on its candidate event
- `proposed_end_time` (Timestamp) — same
- `normal_votes` (Map — keyed by UID) — value is an `option_id`
- `ranked_votes` (Map — keyed by UID) — value is `{ order: [option_id, ...], revision: Integer }`
- `winning_option_id` (String) — set at close (17.2)
- `closed_at` (Timestamp)
- `close_reason` (String) — `"majority"` · `"all_voted"` · `"timer"`
- `final_counts` (Map) — `option_id` → count, frozen at close

> **The Map keying is the point, not an implementation detail.** Each user writes exactly one field they own, so dedup is structural and the rule is one line. The prototype's per-option `votes[]` arrays make both impossible — which is why its tally double-counts.
>
> **One vote per event, and it grows.** The first alternative creates the vote with two options — the original plan and the alternative. Later alternatives **append an option to the same vote**; they never open a second one.
>
> **Options may be appended but never edited or removed.** Every `option_id` is referenced by ballots already cast.
>
> **Closing conditions, whichever comes first:** a majority of **invitees** on one option · every invitee has voted · `resolves_at` passes.
>
> ➕ **`"cancelled"` exists so the originator can call a vote off.** Only the person who created it, and only while it is `"open"`. **Deferred for MVP unless it turns out to be cheap** — the value is reserved in the enum now so adding the behavior later is additive rather than a migration. A cancelled vote has no winner and no `final_counts`; the event it was attached to returns to its own clock. **17.2's session decides whether to build it.**
>
> ✅ ➕ **RESOLVED 2026-09-09 — `created_by` exists because the cancel rule cannot be written without it.** The document had no field naming its creator, so "only the person who created it" was unenforceable. Reading the creator off the linked event's `owner_id` fails twice: **the person who opens a vote is usually not the event's owner** — any chat participant may raise an alternative, and the first alternative is what creates the vote — and **a freeform vote has no linked event at all.** `created_by` is the only thing that works for both. 17.1 writes it; `*3.3`'s create rule requires it to equal the writer's own UID, so a vote cannot be created attributed to someone else.
>
> ⚠️ **`close_reason` has no value for a cancellation.** If cancellation is built, either it gains a fourth value or a `"cancelled"` vote carries no `close_reason` at all. **17.2 decides; do not invent one.**
>
> **Ties resolve to the earliest option** — which in an alternative vote is the original plan. Deterministic and biased toward the plan that already exists, which is the right default.
>
> **The tally is server-side and non-negotiable.** `votingLogic.ts` breaks ties with `Math.random()`, so two devices tallying identical ballots produce different winners. 17.2 deletes it.
>
> **An alternative can only be raised while its event is `"proposed"`.** Once an event confirms, expires, or is cancelled, nothing reopens it — that is what keeps the Events lifecycle forward-only.

---

## Events

**The collection is `Events`.** The published rules protect `/Calendars/` and there is no `/Events/` rule, so with the catch-all deny beneath it, **every Events read and write is blocked today.** ✏️ **`*3.3` fixes it** — it deletes the `Calendars` block and writes `/Events/`. **Nothing in 16.1, 16.2 or 17 runs until that ticket lands.**

**Document: (Unique Event ID)**

- `owner_id` (String)
- `shared_with` (Array of User IDs) — **mirrors the linked chat's `participants`**
- `confirmed_participants` (Array of User IDs) — **derived** from `rsvps`; never written by a client
- `rsvps` (Map — keyed by UID) — `{ uid: "going" | "not_going" | "pending" }`
- `event_time` (Timestamp)
- `end_time` (Timestamp)
- `created_at` (Timestamp)
- `resolves_at` (Timestamp) — set once to `min(created_at + 24h, event_time)`
- `activity_id` (String) — **optional.** A freeform proposal is the same document with no activity behind it.
- `event_title` (String)
- `activity_picture_url` (String)
- `status` (String) — **five values:** `"proposed"` · `"confirmed"` · `"expired"` · `"cancelled"` · `"candidate"`
- `linked_vote_id` (String) — **also the "an alternative is open" pointer.** See the note below.
- `linked_chat_id` (String) — **singular, deliberately.** One chat per proposal; not an array.
- `color` (String)
- `is_allday` (Boolean)
- `location_text` (String)
- `source` (String)

> **`rsvps` seeding (16.1):** every chat participant as `"pending"`, the proposer as `"going"`.
>
> ✏️ **When `rsvps` locks — Q7, resolved.** Three windows, and they are not the same moment:
>
> | Window | A participant may… |
> |---|---|
> | `status == "proposed"` | Write their own key freely, and change it as often as they like |
> | Resolved (`confirmed` / `expired`), `event_time` not yet passed | Set their own key **once**, and only if it currently holds `"pending"`. An existing `"going"` or `"not_going"` is frozen |
> | `event_time` has passed | Nothing. The map is closed |
>
> **Why the middle window exists:** an event confirms on the first non-owner yes, which can be days before it happens. Freezing the whole map there would stop a slow responder joining a plan that is still in the future — and "no one should be able to say yes or no after the event is over" is the actual intent.
>
> ➕ **All three windows are one rule clause in `*3.3`**, and the third window is self-limiting: writing `"going"` means the key is no longer `"pending"`, so the same clause denies the next attempt. "Set it once" with no extra state.
>
> ⚠️ **This has two consequences that are easy to miss, and both land in 16.2.** `confirmed_participants` keeps moving after confirmation, so it cannot be derived once and forgotten. And a late `going` has to write a `Free_Busy` block, so that write is not a one-shot at confirmation either.
>
> **`resolves_at` can never go stale, by design:** 16.1 disables drag/resize on proposed events specifically so `event_time` cannot change while a proposal is open. Anyone who re-enables dragging there silently breaks the sweep — **and now also breaks the `rsvps` rule clause, which reads `event_time`.**
>
> **`"candidate"` is a competing version of a plan, not a stage a plan passes through (17.1).** Candidates are real Events documents that may never become anything. **The planner must filter them out**, and 16.2's sweep excludes them by construction because it queries `status == "proposed"`. Losing candidates are deleted when the vote closes.
> Recorded honestly: this puts a non-lifecycle state into a lifecycle enum. Accepted because one field carrying all of it beats a parallel flag every query has to remember.
> ➕ **A candidate event still needs `linked_chat_id`** — `*3.3`'s `shared_with` clause does a `get()` on it and denies when it's absent. **Flag for 17.1.**
>
> **`linked_vote_id` doubles as the alternative-open pointer, so no separate field is needed (closes Q8).** One vote per event means "an alternative is open" is exactly *`linked_vote_id` is set and that vote's `status` is `"open"`*. While that is true, 16.2's sweep skips the event entirely; the event's clock restarts when the vote closes.
>
> **The three-way link:** a proposal message points at its Event via `Messages.event_id`; a vote message points at its Vote via `Messages.vote_id`; an Event points at its vote via `linked_vote_id`; a Vote points back via `linked_event_id`.
>
> **Composite indexes:** `status` + `resolves_at` (16.2's sweep) · `shared_with array-contains`, excluding candidates, plus a date bound (16.1's listener). ➕ **Both are added by the ticket that queries them**, to the `firestore.indexes.json` that `*3.1` creates empty.

> ### The Events lifecycle — this table is the spec
>
> | From | Trigger | To |
> |---|---|---|
> | `proposed` | ≥1 `going` from someone other than `owner_id`, **and** no open alternative | `confirmed` |
> | `proposed` | `resolves_at` passes with ≥1 non-owner `going` and no open alternative | `confirmed` |
> | `proposed` | `resolves_at` passes with **zero** non-owner `going` | `expired` |
> | `proposed` or `confirmed` | The proposer cancels | `cancelled` |
>
> **Forward-only.** `confirmed`, `expired` and `cancelled` are terminal; nothing returns to `proposed`. `"candidate"` is outside this table entirely — a candidate either replaces the original's fields or is deleted.
>
> ⚠️ **An `expired` event is not immune to a late yes.** Under Q7's middle window a `pending` invitee can still answer an expired event before `event_time`. That does **not** un-expire it — the lifecycle is forward-only and `expired` is terminal. 16.2 decides whether that late `going` still earns a `Free_Busy` block on a plan that nobody is running.
>
> **Why one non-owner yes and not consensus:** requiring everyone kills a plan on one non-responder. Requiring nobody means the proposer is talking to themselves. One other person is the smallest number that makes it a plan.
>
> **Known and accepted:** someone can say yes (confirming the event) and then change to no, leaving a confirmed event with only the proposer going. Rare, and the fix is social rather than structural — Project 20 notifies the group on an RSVP change, and whoever's left cancels manually. **Same reasoning covers a winning alternative:** `rsvps` are preserved when a vote changes the plan, so a `going` on mini golf stays `going` on bowling.

---

# Part 2 — Security Rules

**Current published version is dated 5/11/26.** It lives in the Firebase Console and is **mirrored in the Google Doc under "Current Firebase rules"** — so it is readable, just not version-controlled.

✏️ **Moving it into the repo is now four tickets, not one.** `*3.1` (CLI, emulator, test harness, and a transcription of what's live) → `*3.2` (the `/Users/` tree + `Activities`) → `*3.3` (`Chats`, `Messages`, `Votes`, `Events`) → `*3.4` (the realignment and deny-case audit, run last). **Every reference to `*3.1` written before 2026-09-09 may mean any of the first three.**

**Read the mirrored copy before writing any ticket that touches Firestore.** It was assumed unreadable during Project 2's session and it is not; that assumption produced one wrong flag.

⚠️ **Readable is not the same as live.** The mirror is dated 5/11/26, and `*2.2`'s session recorded that "testing currently runs against open rules" — a database created in test mode carries a 30-day open rule instead. **`*3.1` reads the Console and transcribes whatever is actually published there**, and says which one it was.

## Four rulings that govern the whole file — 2026-09-09

1. **The rules are verified by the Firebase Emulator Suite plus `@firebase/rules-unit-testing`**, not the Console Rules Playground. The Playground tests one request by hand and forgets; this file is edited by at least five tickets and needs a regression check. Requires a Java JDK 11+ on the Mac. `*3.1` builds the harness.
2. **`*3.x` writes the whole file — every collection — rather than leaving blocks to 16.1, 15.2 and 17.1.** The decisions for all eleven items below already exist, so writing them once means one coherent file and one review instead of four. **Only possible because of ruling 1:** rules for collections no client code touches yet can still be tested. 🔴 **Consequence: restructure plan §§10–11 give `*16.1` and `*17.1` their own rule blocks — those become verify-and-extend, not write.**
3. **Rules constrain ownership plus a field allowlist (`hasOnly`) and nothing more.** Not types, not required fields, not enum values — except the two already ruled independently (`Friends.status`, `Activities.source`). Full validation is the longest version, the biggest source of confusing false denials, and has to be re-edited every time Part 1 moves.
4. **Blocking stays receive-side.** See item 9.

## What the published rules already permit

Worth stating, because two tickets were written around not knowing it:

- **`Users/{userId}`** — read by any authenticated user; create, update and delete only when `request.auth.uid == userId`.
- **`Users/{userId}/Private_info/{privateId}`** — read and write, owner only, at any document ID.
- **`Free_Busy`** — read by any authenticated user, write by the owner.
- **`Friends`** — read by anyone authenticated; create and delete by either party; update **by the profile owner only**.
- **`Activity_History`** — owner only.
- **`Activities`** — read by anyone authenticated; create/update/delete gated on `creator_id`.
- **`Chats`** — create if you include yourself; read and update by participants. `Messages` and `Votes` are both `read, write` for participants of the parent chat.
- **`Calendars`** — create by owner; read and update by owner or `shared_with`; delete by owner.
- Everything else falls to `allow read, write: if false`.

**So `*2.2`'s two-document creation write is already permitted** — the `Users` create clause is satisfied because the document ID is the Auth UID, and `Private_info` is owner-only at any ID. Firestore evaluates each write in a batch independently, so the batch passes as a whole. ➕ **`*3.2` carries an acceptance test reproducing that exact batch**, because tightening these two rules is the one thing that could silently break signup.

## Changes decided but not yet written

**1. `/Calendars/` becomes `/Events/`** — the block is deleted and rewritten, not renamed. **Blocking for 16.1.** `*3.3`.

**2. Activities gets rewritten** — the current rule requires `creator_id` on every document, which the schema doesn't have. Today that means seeded activities can't be updated or deleted, and user-created ones can't be created at all. `*3.2`.

```
match /Activities/{activityId} {
  allow read: if request.auth != null;

  allow create: if request.resource.data.source == "user_generated"
                && request.auth.uid == request.resource.data.creator_id;

  allow update, delete: if resource.data.source == "user_generated"
                && request.auth.uid == resource.data.creator_id;

  // Any authenticated user may increment engagement counters, and nothing else.
  allow update: if request.auth != null
                && request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['click_count', 'likes']);
}
```

> Gating on `source` rather than on a missing `creator_id` is what makes this safe. Practical effect: seeded activities can't be edited from inside the app at all. CMS and Console edits use admin credentials, which bypass rules.

**3. Events gets a full rule block** ➕ *— `*3.3`.*

- **create:** `request.auth != null && request.resource.data.owner_id == request.auth.uid`
- **read:** `request.auth.uid in resource.data.shared_with`. ⚠️ **No owner fallback** — the published `Calendars` rule had one and this drops it, so an owner absent from their own `shared_with` cannot read their own event. Shouldn't happen; `*3.3` carries a commented deny case for it.
- **update — `rsvps`:** ✏️ **three windows, per Q7.** A participant may write **only their own key**, always. While `status == "proposed"` they may change it. Once the event has resolved, they may write their key only if it currently holds `"pending"` — an existing answer is frozen. Once `event_time` has passed, no write to `rsvps` is permitted at all. **All three are one clause; the middle one is self-limiting.**
- **update — `shared_with`:** any participant of `linked_chat_id` may write it, verified with a `get()` on the chat. Denies when `linked_chat_id` is absent.
  > *Known and accepted:* one participant can remove another from a plan, and nothing records who did it. Bounded — it can only be someone already in that chat.
- **update — `status`:** `"confirmed"` and `"expired"` come from the Admin SDK only, **no client allowance at all**. `"cancelled"` may be written by a client when `request.auth.uid == resource.data.owner_id`, affected keys are `status` alone, the value is exactly `"cancelled"`, and the current status is `"proposed"` or `"confirmed"`.
- **update — applying a winning alternative:** Admin SDK only.
- **delete:** no clause. An event is cancelled, never deleted. **Losing candidates are deleted by the Admin SDK, which bypasses rules — do not add a client `allow delete` for them.**
  > **Note the published `Calendars` rule has `allow delete` for the owner and `allow update` for every participant, unconstrained.** Both go.

**4. Votes gets its rule block rewritten** ✏️ *— `*3.3`.* A rule already exists and is `allow read, write` for any chat participant, which permits overwriting someone else's ballot and forging a result.

- **create / read:** participant of the parent chat.
- **update — ballots:** a participant may write **only their own key** in `normal_votes` or `ranked_votes`, while `status == "open"`.
- **update — options:** a participant may append to `options` and increment `options_revision`, while `status == "open"`. **Existing options may not be edited or removed.** ⚠️ *[Likely] the append-only check uses list slicing (`options[0:n]`) — the single most likely thing in Project 3 to not compile. The fallback is materially weaker; `*3.3` says stop and ask rather than take it silently.*
- **update — `status` to `"cancelled"`:** ✅ `request.auth.uid == resource.data.created_by`, affected keys are `status` alone, the value is exactly `"cancelled"`, and the current status is `"open"`. **The field was added for this.** Written now even though Q9 still defers whether the cancel *button* ships — it is additive, and it is safe with nothing behind it, because 16.2's sweep skips an event only while its linked vote is `"open"`, so a cancelled vote un-skips the event automatically.
- **update — `status` to `"closed"`, `winning_option_id`, `closed_at`, `close_reason`, `final_counts`:** **Admin SDK only, no client allowance at all.** This single omission is what makes every result in the app trustworthy.

**5. ✅ The friend-acceptance problem is resolved — `update` stays owner-only.** The published rule is `allow update: if request.auth.uid == userId`, so a client-side batched acceptance is denied on its second write. **Ruled 2026-09-09 that this is correct rather than broken**, because acceptance cannot be client-side regardless: O4 requires a block check against the recipient's `blocked_users`, which **no client can read**, and S4/15.1 requires acceptance to find-or-create the 1-on-1 chat. `acceptFriendRequest` has to run either way, so owner-only is the tightest rule available and Round 7's corollary is satisfied on the merits rather than bypassed.

⚠️ **One condition, carried into `*3.4` as a check rather than a bracket: Project 5's edit pass must confirm no client-side acceptance path is added.** If one is, the rule needs a narrow counterparty clause — `friendId` may update, `status` only, to `"friend"` only, from `"request_sent"` only.

➕ **Separately, `Friends` `create` had a real hole and `*3.2` closes it** — see the `Friends` note in Part 1.

**6. Chats `update` needs tightening** — the current rule lets any participant modify any field, including removing someone else from `participants`, which contradicts 15.1's self-only leave. ➕ **`*3.3` narrows the allowlist to `chat_name` and `participants`, and constrains `participants` so that anyone removed must be the caller.** Additions stay unconstrained, which is what 15.1's add-member needs.

**7. Storage rules don't exist** ➕ — a separate file. Users write only to their own path, with a size cap and an image content-type restriction enforced in-rule. Project 6 / D9. 🔴 **Explicitly out of scope in all four Project 3 tickets and still unowned. `*3.4` names it as a launch blocker if it doesn't exist by then.**

**8. Messages gets its rule block rewritten** ✏️ *— `*3.3`.* A rule already exists and is `allow read, write` for any chat participant — no sender check, no length cap, no type constraint, and it permits deleting anyone's message.

- **read:** requester's UID must be in the parent chat's `participants`, via a `get()` on `Chats/{chatId}`. **Keep the parent `get()`** rather than denormalizing `participants` onto every message. *[Likely] Firestore caches identical `get()` calls within one rule evaluation, so a 25-message page costs about one extra read rather than 25.* ➕ **`*3.3` makes measuring this in the emulator an acceptance criterion — the number replaces the [Likely].**
- **create:** requester is a participant, `sender_id == request.auth.uid`, `text.size() <= 2000`, **`message_type` in `["text", "activity", "event_proposal", "vote"]`**, and a field allowlist that excludes `deleted_at`.
  > *Known and accepted:* values only, not shape. Nothing stops a malformed proposal or vote message pointing at nothing; it renders as a broken card rather than being rejected.
- **update:** sender only, tombstone shape only — `text` becomes `""` and `deleted_at` is stamped, and nothing else may change.
- **delete:** no clause at all.

**9. ✏️ Blocking is not enforced by any rule, and that is the decision — 2026-09-09.**

Round 9 gave Project 3 "the durable fix." `*3.3`'s session looked at what that fix costs and ruled the other way:

- **`blocked_users` is owner-only**, so no client and no rule can check whether the *recipient* blocked the sender. Server-side denial needs a new readable block record, a Project 5 write to maintain it, and a billed `get()` on every message sent.
- **15.2's receive-side filter is the real protection**, and the only person who can bypass a receive-side filter is the person it protects. This is how iMessage behaves.
- *[Likely] Apple Guideline 1.2's "ability to block abusive users" is satisfied by that filter* — a reviewer tests whether a blocked user's messages stop appearing, and they do.

**Accepted cost, written down: a blocked user's messages are still created, stored and delivered before being filtered out. Blocking is UI/device-level and must never be described as enforced.** Same class as `Free_Busy` visibility (Q2) and device-local unread — three deliberate decisions to put protection outside the server where the cheap version is good enough, not three unrelated shortcuts. **Revisit if 13.3's content reporting needs a server-side record of who blocked whom.**

**10. ✏️ `Users` / `Private_info` shape — now answered.** Ownership was already correct; what a user could write *into* their own document was not constrained at all. **Ruled 2026-09-09: a `hasOnly` field allowlist, and nothing beyond it.** `*3.2` writes it. `hasOnly` permits a subset, which is what keeps it compatible with `*2.2` writing five of eight `Users` fields.

**11. ✅ `Liked_Activities` now has a rule** ➕ *— `*3.2`, written 2026-09-09.* There were rule blocks under `/Users/{userId}` for `Private_info`, `Free_Busy`, `Friends` and `Activity_History` — and none for this one, so it fell to the catch-all deny. **Project 11's like write and Project 12's Saved list were both blocked**, the same way Events is. Found 2026-09-08 reading the mirrored rules; no ticket had it.

**12. ➕ `allow write` cannot carry a `request.resource.data` check.** On a delete, `request.resource` is null, so a single `allow write` with a field allowlist denies every delete with a null-reference error rather than an obvious permission error. **Every block in `*3.2` and `*3.3` splits `create, update` from `delete` for this reason.** Worth keeping visible — it is the kind of thing the emulator suite catches and the Playground would not.

---

# Part 3 — Change Log

## 🔴 Sync gaps found on read-back — 2026-09-08

Two things from the applied blocks did not make it into the Google Doc. Neither is a decision; both are transcription:

| Gap | Why it matters |
|---|---|
| **`Private_info` document ID still reads `(Private ID)`** in the Doc | R13 fixed it to the literal `main`, and `*2.2` writes that path. A reviewer reading the Doc will think the ID is undefined |
| **`Activities.is_active` and `updated_at` appear with no deferral mark** | ✅ **Confirmed 2026-09-08 that they are still deferred to 13.3.** As the Doc reads now, Projects 8, 9, 11 and 13.1 would all gain scope they don't have. **Add the ⏸️ marks back in the Doc** |

## Pending sync — 2026-09-09 (Project 3 rulings)

| Change | Why | Ticket |
|---|---|---|
| **Rules are verified by the Firebase Emulator Suite, not the Console Playground** | ~30 deny cases across nine collections, re-checked every time a later ticket edits the file. The Playground can't be re-run. Needs a Java JDK 11+ | **`*3.1`** |
| **The rules move into the repo as `firestore.rules`, deployed by CLI**, and the first deploy is a **no-op transcription** | Deploying a file you wrote is not a test of the pipeline; deploying one that changes nothing is | **`*3.1`** |
| **`*3.x` writes the whole file, every collection** | All eleven items are already decided. One coherent file, one review. **Supersedes restructure plan §§10–11 giving 16.1 and 17.1 their own rule blocks** | **`*3.2`, `*3.3`, 16.1, 17.1, 15.2** |
| **Rules constrain ownership + a `hasOnly` field allowlist, nothing more** ➕ | Closes item 10. Not types, not required fields — those are the longest version and the biggest source of false denials | **`*3.2`, `*3.3`** |
| **Blocking stays receive-side; Project 3 closes the item rather than owning a fix** ✏️ | Rewrites item 9 and supersedes Decision Log Part 13's layer 3. Layers 1 and 2 stand | **`*3.3`, 15.2, 5** |
| **➕ `Votes.created_by` (String — UID) added** ✅ | The cancel rule needs a creator and there was no field for one. The event owner does not work — the vote's opener is usually not the event's owner, and a freeform vote has no event. **The only schema addition in all of Project 3** | **17.1, 17.2, `*3.3`** |
| **`Friends` `create` is constrained by direction** ➕ | The published rule let either party create the entry with any value, so anyone could forge a `"close_friend"` entry in someone else's list | **`*3.2`, 5** |
| **`Friends` `update` stays owner-only — acceptance is Function-only** ✅ | Not a deferral. Acceptance needs the block check and the chat creation, both server-side, so owner-only is the tightest rule rather than a broken one. Closes B9 | **`*3.2`, `*3.4`, 5** |
| **`Private_info`'s rule pins the document ID to `main`** ✅ | Denies a stray write to a second document nothing reads. F2's hot-path split is the one thing that reopens it | **`*3.2`** |
| **`Liked_Activities` gets its first rule** ✅ | Closes item 11 | **`*3.2`, 11, 12** |
| **`allow write` + a field check denies every delete** ➕ | Null `request.resource` on delete. Every block splits `create, update` from `delete` | **`*3.2`, `*3.3`** |
| **`Events` read has no owner fallback** ⚠️ | The decided text dropped the `Calendars` rule's `owner_id ==` half. Commented deny case rather than a silent change | **`*3.3`, 16.1** |
| **A candidate event still needs `linked_chat_id`** ⚠️ | The `shared_with` clause `get()`s it and denies when absent | **17.1** |

## Pending sync — 2026-09-08 (Projects 16, 17 rulings)

| Change | Why | Ticket |
|---|---|---|
| **`Activities.category` confirmed required**, with a six-value starting set | O17's illustration set needs a stable key that `tags` can't provide. **Closes Q4's main question**; whether the set stays at six is a sub-decision for Project 8 | 8, 9, 11, 12 |
| **`Events.rsvps` locks in three windows, not one — closes Q7** | Freezing at resolution would stop a slow responder joining a plan that hasn't happened yet. Freezing never leaves a dead event with live buttons | **16.1, 16.2, `*3.3`** |
| **`confirmed_participants` and the `Free_Busy` write are no longer one-shot** | Direct consequence of Q7 — a late `going` after confirmation has to move both | **16.2** |
| **`Votes.status` gains `"cancelled"` — closes Q9** | The vote's originator can call it off. Value reserved now; the behavior is deferred for MVP unless cheap | **17.1, 17.2** |
| **Rules: `Votes` and `Messages` blocks are rewrites, not additions** ✏️ | Correction. Both already exist as `allow read, write` for any chat participant, which is far more permissive than "no rule" | **`*3.3`, 15.2, 17.1** |

## Applied to the Google Doc — 2026-09-08

All four previously-pending blocks were applied by Kyson on 2026-09-08. Kept here as a record of what the Doc now reflects.

- **2026-08-30** — `Private_info` doc ID fixed to `main` *(see the sync gap above)*; `liked_activity_ids` added; `Friends` stripped to `status` only; `Activities.source` required with a fixed value set; `creator_id` user-generated only; `pictures` optional; `Events.rsvps` map; `confirmed_participants` derived; `participant_hash` algorithm written out; `Activity_History` confirmed in use; rules `/Calendars/` → `/Events/`; Activities rules rewritten; `Chats.recent_message_sender_id`; preview fields Function-written on create and update; `message_type` enumerated to five values; `Messages.deleted_at` and the tombstone model; the 2,000-character cap in-rule; `Friends` entries deleted on block; a full `Messages` rule block.
- **2026-08-31 (Project 16)** — `Events.created_at`; `resolves_at`; `status` gains `expired` and `cancelled`; the forward-only lifecycle; `activity_id` optional; `shared_with` mirrors chat participants; `linked_chat_id` singular; `Messages.event_id`; the full Events rule block; the widened Messages create rule; proposal messages carry display text; `Free_Busy` keyed by Event ID; `message_type` does not shrink.
- **2026-08-31 (Project 17)** — `Votes.options` becomes an Array of Objects; `change_type` renamed `vote_scope`; `vote_type` enumerated; `resolves_at`, `options_revision`, `status`; `winning_option_id`, `closed_at`, `close_reason`, `final_counts`; `ranked_votes` becomes `{ order, revision }`; `Messages.vote_id`; `Events.status` gains `candidate`; `linked_vote_id` doubles as the alternative-open pointer; one vote per event with append-only options; ties to the earliest option; losing candidates deleted; `rsvps` preserved on a winning alternative.
- **2026-09-07 (Project 2)** — `name_lowercase` confirmed as a stored field (closes Q1); `profile_info` receives the signup screen's `role`; `profile_picture_url` written `""`; the three status fields absent at signup; `Private_info/main` created with `email` + two empty arrays; the other four subcollections not created; both documents in one batch.

## Already correct in the Doc — no action

- Friend `status` values are the canonical four.
- `tag_scores_last_decayed` is spelled correctly.
- `Chats.chat_origin` is present.

---

# Part 4 — Open Schema Questions

**Q1 — `name_lowercase`.** ✅ **RESOLVED — a stored field, computed with `.toLowerCase()` at write time.** Jonathan's suggestion to "handle it in JavaScript" resolves to the compute half only; the field itself stays on the document.

The reading that would have dropped the stored field is the one that breaks search, and it is worth keeping the reason on the page: Project 4's search is a Firestore range query evaluated **server-side against stored data**. Firestore has no `LOWER()` and no case-insensitive mode, and its ordering is byte-order — `"John Smith"` sorts before `"joh"` because `J` is `0x4A` and `j` is `0x6A`. The only alternatives are downloading every user to filter locally, or a search service like Algolia. **`*2.2` writes the field; Project 4 reads it.**

**Q2 — `Free_Busy` visibility.** ✅ **RESOLVED** — rules stay permissive, UI enforces. Restated in both `*3.2` and `*3.3`, because 16.2 writes those blocks from an Event and it is easy to assume the visibility tightened alongside. It did not.

**Q3 — the denormalized name and picture fields.** ✅ **RESOLVED — remove them all.** Removing `friend_profile_picture_url` already forces a read of the friend's Users document, and **the name comes back in that same read for free.**

⚠️ **Consequence:** a deleted user resolves to nothing, so every screen showing a person needs a "Deleted user" fallback. Ties to the account-deletion ticket, whose cleanup strategy is still undecided.

**Q4 — `category` on Activities.** ✅ **RESOLVED — the field is in and required.** Starting values: `"Food"`, `"Outdoors"`, `"Indoors"`, `"Group"`, `"Date"`, `"Personalized"`.

⚠️ **One sub-decision left, and it belongs to Project 8's session: is that set closed?** O17 called for **15–20 illustrations mapping 1:1 to categories**, and six is well short of that. Either the illustration set shrinks to six, or the category list grows — and the two have to end up the same length, because the whole point of `category` is that it picks an illustration. **Project 8 pins the final list; Project 9 validates seed rows against it.** Until then, treat six as a starting point rather than an enum. ➕ **`*3.2` allowlists the field without constraining its value**, so pinning the set later is not a rules change.

**Q5 — the four enumerated value sets.** ✅ **ALL RESOLVED.** `message_type` (five values), `vote_type` and `vote_scope` (two each), and Vote `status` (three, see Q9).

**Q6 — the proposal message → Event pointer.** ✅ **RESOLVED — `event_id` on Messages**, with `vote_id` added alongside it for votes.

**Q7 — when `rsvps` locks.** ✅ **RESOLVED — the map closes when `event_time` has passed, not when the event resolves.** Three windows, written out in the Events note in Part 1 and expressed as one rule clause in `*3.3`:

- **Proposed** — write and change your own key freely.
- **Resolved, event still in the future** — set your own key once, only from `"pending"`. Existing answers are frozen.
- **Event has passed** — nothing.

**Why not the simpler rule.** An event confirms on the first non-owner yes, which can be days ahead of the event itself. Locking there would tell someone they can't join a plan that hasn't happened. Locking never would leave dead events with live buttons.

⚠️ **Two consequences for 16.2, both easy to miss:** `confirmed_participants` cannot be derived once and forgotten, and the `Free_Busy` write is not a one-shot at confirmation. A late `going` moves both. **16.2 also has to decide whether a late `going` on an `expired` event earns a `Free_Busy` block** — the lifecycle is forward-only so it does not un-expire, but the RSVP is still permitted.

**Q8 — the "an alternative is open" field.** ✅ **RESOLVED — no new field.** One vote per event means `linked_vote_id` plus that vote's `status` already answers it. **One sub-decision left in 17.1:** whether to keep it derived (costs the sweep one read per event, can never disagree with itself) or denormalize a boolean onto the Event (saves the read, can go stale).

**Q9 — the Vote `status` value set.** ✅ **RESOLVED — three values: `"open"`, `"closed"`, `"cancelled"`.** The vote's originator can cancel it, and only while it is open.

**Deferred for MVP unless it turns out cheap.** The value is reserved in the enum now so that adding the behavior later is additive rather than a migration. **17.2's session decides whether to build the cancel path**, and if it does, `close_reason` needs a fourth value or a cancelled vote carries none.

✅ ➕ **Sub-question resolved 2026-09-09: `Votes.created_by` (String — UID) is added, and 17.1 writes it.** There was no field naming the creator, so "the originator can cancel" was unenforceable. The event owner was rejected as a substitute — the vote's opener is usually not the event's owner, and a freeform vote has no event to read. **The rule is written now even though the button is still 17.2's call**, because it is additive and safe with nothing behind it. **Still 17.2's:** whether the button ships, and whether `close_reason` gains a fourth value or a cancelled vote carries none.

**Q10 — ❓ nothing writes `Private_info.location` or `Private_info.geohash`.** Both fields are defined, and they are the anchor for the entire Discover engine — Project 8's radius query, Project 11's filter, Project 12's distance calculation, Project 13.1's proximity score. **`*2.2` confirmed it does not write them at signup**, and no other ticket writes them either. Change List D4 called for a location-capture ticket and one was never created.

Not purely a schema question — it needs a permission-request moment, a denial path, a decision on how coarse the stored location is, whether it refreshes, and a geohash precision that matches Project 9's seed data. **But it belongs here because until it has an owner, four tickets query against fields that are always absent.** ➕ **`*3.2` allowlists both fields, so the rule is ready whenever a writer exists.**

**Q11 — ❓ `status_visibility` has no defined value set.** `*2.2` had to omit the three status fields at creation for exactly this reason. Reconciliation §5.3 also flags a name collision — the prototype's `Friend.status` is a boolean meaning *availability*, while the schema's `Friends.status` is the four-state relationship enum. **D5 owns both.** ➕ **`*3.2` allowlists the field without constraining its value**, so D5 can define the set without touching the rules.

**Q12 — `Activities.is_active` and `updated_at`.** ✅ **RESOLVED 2026-09-08 — still deferred to 13.3.** The synced Google Doc lists both with no deferral mark; that is a transcription gap, not a reversal, and the Doc needs the ⏸️ marks restored.

O7's accepted cost stands and is worth keeping visible, because it is paid later rather than avoided: when 13.3 lands, `is_active == true` has to be retrofitted into Project 11's dual query and 13.1's filtered queries, and the composite indexes behind them rebuilt. **Projects 8, 9, 11 and 13.1 are all written without these fields.** ➕ **`*3.2` omits both from the `Activities` create allowlist and carries a deny case**, so the deferral is enforced rather than merely documented.
