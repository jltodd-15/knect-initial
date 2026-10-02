# Master Schema

A repo copy of the Firestore Master Schema, kept here so every session reads the same thing.

**It is close, but not guaranteed to be 100% current.** The source of truth is the "Firebase Master
Schemas" doc; this file can lag it. If the schema disagrees with a ticket, or looks wrong against the
code, flag the mismatch and ask. Don't silently pick a side. Update this file whenever the schema
changes.

The schema itself is below, as written. Notes that come from tickets rather than the schema are
kept separately, under [Repo notes](#repo-notes).

---

**Collection: Users**

* Document: (User ID)
   * name (String)
   * name_lowercase (String)
   * profile_info (String)
   * profile_picture_url (String)
   * interests (Array of Strings)
   * current_status (String)
   * status_visibility (String)
   * status_expires_at (Timestamp)
* Subcollection: Private_info
   * Document: (Private ID)
      * location (GeoPoint, longitude and latitude)
      * geohash (String)
      * email (String)
      * blocked_users (Array of Strings)
      * fcm_tokens (Array of Strings; for notifications)
      * external_calendar_tokens (Map/Object; for API connections)
      * tag_affinity_scores (Map/Object; for the Discover tab algorithm)
      * tag_scores_last_decayed (Timestamp; in order to upend constant growth of the highest tag scores)
      * liked_activity_ids (Array of Strings; for prefilled hearts for liked activities.)
* Subcollection: Free_Busy
   * Document: (Unique Block ID)
      * start_time (Timestamp)
      * end_time (Timestamp; so it only stays "Free" when turned on, until the end of the day)
* Subcollection: Friends
   * Document: (Friend's User ID)
      * status (String: e.g., "pending", "request_sent", "friend", "close_friend")
* Subcollection: Activity_History
   * Document: (Unique History ID)
      * activity_reference (String/ID linking to the main Activity)
      * tapped_ads (Array of Strings)
* Subcollection: Liked_Activities
   * Document: (Unique Activity ID)
      * saved_at (timestamp)

**Collection: Activities**

* Document: (Unique Activity ID)
   * name (String)
   * description (String)
   * cost (String — "Free", "$", "$$", "$$$")
   * source (String) — required, one of "manual_diy", "api_yelp", "user_generated"
   * creator_id (String) — only on source == "user_generated".
   * category (String; e.g. "Food", "Outdoors", "Indoors", "Group", "Date", "Personalized")
   * tags (Array of Strings)
   * pictures (Array of Strings) — optional; seeded activities render a category illustration instead
   * location (GeoPoint)
   * geohash (String)
   * is_location_based (Boolean)
   * click_count (Integer, default 0)
   * likes (Integer, default 0)
   * created_at (Timestamp)
   * is_active (Boolean)
   * updated_at (Timestamp)

**Collection: Chats**

* Document: (Unique Chat ID)
   * participants (Array of User IDs)
   * participant_hash (String; To prevent creating duplicate groupchats)
   * chat_origin (String)
   * chat_name (String)
   * recent_message (String)
   * recent_message_timestamp (Timestamp)
   * recent_message_sender_id (String)
* Subcollection: Messages
   * Document: (Unique Message ID)
      * sender_id (String)
      * text (String) — 2,000 character maximum, enforced in the security rule, not only in the input field
      * timestamp (Timestamp)
      * message_type (String; "text", "system", "activity", "event_proposal", "vote")
      * activity_id (String)
      * event_title (String)
      * event_id (String)
      * vote_id (String)
      * deleted_at (Timestamp)
* Subcollection: Votes
   * Document: (Unique Vote ID)
      * created_by (String) — UID of whoever opened the vote. Written at creation by 17.1; the rules require it to equal the creator, and only this user may cancel the vote. Added 2026-09-09 (ticket 3.3).
      * linked_event_id (String)
      * vote_scope (String) Two values: "alternative" (competing versions of an event), "open" (freeform, no event).
      * vote_type (String) — two values: "normal", "ranked". Ranked requires ≥3 options, normal ≥2.
      * status (String; "open", "closed", and "cancelled")
      * created_at (Timestamp)
      * resolves_at (Timestamp) — created_at + 24h. Set once and never moved, including when options are added.
      * question (String)
      * options (Array of Objects) — was an Array of Strings. Each option:
         * option_id (String) — stable, generated at write. Both ballot maps reference these, so they are never regenerated or reordered.
         * candidate_event_id (String) — the Events document this option represents. Absent on a freeform vote.
         * label (String) — human-readable summary ("Friday 7pm — Bowling"). Load-bearing: losing candidates are deleted at close, so the vote must be able to render its own history after the events behind it are gone.
      * options_revision (Integer) — starts at 1, increments on every option added. Ballots record the revision they were cast against; this is how a stale ranked ballot is detected.
      * proposed_start_time (Timestamp) — freeform votes only; an alternative carries its times on its candidate event
      * proposed_end_time (Timestamp) — same
      * normal_votes (Map — keyed by UID) — value is an option_id
      * ranked_votes (Map — keyed by UID) — value is { order: [option_id, ...], revision: Integer }
      * winning_option_id (String) — set at close (17.2)
      * closed_at (Timestamp)
      * close_reason (String) — "majority" · "all_voted" · "timer"
      * final_counts (Map) — option_id → count, frozen at close

**Collection: Events**

* Document: (Unique Event ID)
   * owner_id (String)
   * shared_with (Array of User IDs)
   * confirmed_participants (Array of User IDs; organizer should always automatically be in this)
   * rsvps (Map — keyed by UID) — { uid: "going" | "not_going" | "pending" }
   * event_time (Timestamp)
   * end_time (Timestamp)
   * created_at (Timestamp)
   * resolves_at (Timestamp) — set once to min(created_at + 24h, event_time)
   * activity_id (String)
   * event_title (String)
   * activity_picture_url (String)
   * status (String: e.g. "proposed", "confirmed", "expired", "cancelled", "candidate")
   * linked_vote_id (String)
   * linked_chat_id (String)
   * color (String)
   * is_allday (Boolean: true/false)
   * location_text (String)
   * source (String; e.g. Knect or Google Calendar)

---

## Repo notes

Decisions from tickets that the schema above doesn't spell out. Not part of the schema copy.

* `Users/{uid}/Private_info/main`: the schema calls the document "(Private ID)"; the ID is the literal
  string `main`, never generated (ticket 2.2, Decision Log R13).
* `Friends.status` is exactly one of `request_sent`, `pending`, `friend`, `close_friend`. The "e.g."
  above is not an invitation to add values.
* `current_status`, `status_visibility` and `status_expires_at` are not written when a user signs up
  (ticket 2.2). The status feature owns their first write, so anything reading them must handle
  `undefined`.
* Signup writes exactly these fields: `Users/{uid}`: `name`, `name_lowercase`, `profile_info`,
  `profile_picture_url` (`""`), `interests`. `Private_info/main`: `email`, `blocked_users` (`[]`),
  `fcm_tokens` (`[]`). Nothing else.
* `interests` values are exactly the 35 fixed strings in `components/CreateProfilePage.tsx`
  (`INTERESTS`), stored verbatim: no uppercasing or reformatting (ticket 1.4). Project 9's
  `Activities.tags` has to use the same strings, or 13.2's affinity seeding matches nothing.
* `profile_info` is the user's optional bio line (ticket 1.4). It can be `""`.
* `profile_picture_url` stays `""` until the user uploads (Project 6). Screens show
  `components/InitialsAvatar.tsx` instead (ticket 1.4).
