# Updated schema

### `Collection: Users`

* `Document: (User ID)`  
  * `name (String)`  
  * `name_lowercase (String)`  
  * `profile_info (String)`  
  * `profile_picture_url (String)`  
  * `interests (Array of Strings)`  
  * `current_status (String)`  
  * `status_visibility (String)`  
  * `status_expires_at (Timestamp)`   
* `Subcollection: Private_info`  
  * `Document: (Private ID)`  
    * `location (GeoPoint, longitude and latitude)`  
    * `geohash (String)`  
    * `email (String)`  
    * `blocked_users (Array of Strings)`  
    * `fcm_tokens (Array of Strings; for notifications)`   
    * `external_calendar_tokens (Map/Object; for API connections)`  
    * `tag_affinity_scores (Map/Object; for the Discover tab algorithm)`  
    * `tag_scores_last_decayed (Timestamp; in order to upend constant growth of the highest tag scores)`  
    * `liked_activity_ids (Array of Strings; for prefilled hearts for liked activities. )`  
* `Subcollection: Free_Busy`   
  * `Document: (Unique Block ID)`  
    * `start_time (Timestamp)`  
    * `end_time (Timestamp; so it only stays “Free” when turned on, until the end of the day)`  
* `Subcollection: Friends`  
  * `Document: (Friend's User ID)`  
    * `status (String: e.g., "pending"`, `“request_sent"`, `"friend"`, `"close_friend")`  
* `Subcollection: Activity_History`  
  * `Document: (Unique History ID)`  
    * `activity_reference (String/ID linking to the main Activity)`  
    * `tapped_ads (Array of Strings)`  
* `Subcollection: Liked_Activities`  
  * `Document: (Unique Activity ID)`  
    * `saved_at (timestamp)`  
      

### ---

### `Collection: Activities` 

* `Document: (Unique Activity ID)`  
  * `name (String)`  
  * `description (String)`  
  * `cost (String — "Free", "$", "$$", "$$$")`  
  * `source (String) — required, one of "manual_diy", "api_yelp", "user_generated"`  
  * `creator_id (String) — only on source == "user_generated".`   
  * `category (String; e.g. “Food”, “Outdoors”, “Indoors”, “Group”, “Date”, “Personalized”)`  
  * `tags (Array of Strings)`  
  * `pictures (Array of Strings) — optional; seeded activities render a category illustration instead`  
  * `location (GeoPoint)`  
  * `geohash (String)`  
  * `is_location_based (Boolean)`  
  * `click_count (Integer, default 0)`  
  * `likes (Integer, default 0)`  
  * `created_at (Timestamp)`  
  * `is_active (Boolean)`  
  * `updated_at (Timestamp)`

### ---

### `Collection: Chats`

* `Document: (Unique Chat ID)`  
  * `participants (Array of User IDs)`  
  * `participant_hash (String; To prevent creating duplicate groupchats)`  
  * `chat_origin (String)`   
  * `chat_name (String)`  
  * `recent_message (String)`  
  * `recent_message_timestamp (Timestamp)`  
  * `recent_message_sender_id (String)`  
* `Subcollection: Messages`  
  * `Document: (Unique Message ID)`  
    * `sender_id (String)`  
    * `text (String) — 2,000 character maximum, enforced in the security rule, not only in the input field`  
    * `timestamp (Timestamp)`  
    * `message_type (String; "text", "system", "activity", "event_proposal", "vote")`  
    * `activity_id (String)`  
    * `event_title (String)`  
    * `event_id (String)`  
    * `vote_id (String)`  
    * `deleted_at (Timestamp)`  
* `Subcollection: Votes`  
  * `Document: (Unique Vote ID)`  
    * `linked_event_id (String)`  
    * `vote_scope (String)Two values: "alternative" (competing versions of an event), "open" (freeform, no event).`  
    * `vote_type (String) — two values: "normal", "ranked". Ranked requires ≥3 options, normal ≥2.`  
    * `status (String; “open”, “closed”, and “cancelled”)`  
    * `created_at (Timestamp)`  
    * `resolves_at (Timestamp) — created_at + 24h. Set once and never moved, including when options are added.`  
    * `question (String)`  
    * `options (Array of Objects) — was an Array of Strings. Each option:`  
      * `option_id (String) — stable, generated at write. Both ballot maps reference these, so they are never regenerated or reordered.`  
      * `candidate_event_id (String) — the Events document this option represents. Absent on a freeform vote.`  
      * `label (String) — human-readable summary ("Friday 7pm — Bowling"). Load-bearing: losing candidates are deleted at close, so the vote must be able to render its own history after the events behind it are gone.`  
    * `options_revision (Integer) — starts at 1, increments on every option added. Ballots record the revision they were cast against; this is how a stale ranked ballot is detected.`  
    * `proposed_start_time (Timestamp) — freeform votes only; an alternative carries its times on its candidate event`  
    * `proposed_end_time (Timestamp) — same`  
    * `normal_votes (Map — keyed by UID) — value is an option_id`  
    * `ranked_votes (Map — keyed by UID) — value is { order: [option_id, ...], revision: Integer }`  
    * `winning_option_id (String) — set at close (17.2)`  
    * `closed_at (Timestamp)`  
    * `close_reason (String) — "majority" · "all_voted" · "timer"`  
    * `final_counts (Map) — option_id → count, frozen at close`

### ---

### `Collection: Events`

* `Document: (Unique Event ID)`  
  * `owner_id (String)`  
  * `shared_with (Array of User IDs)`  
  * `confirmed_participants (Array of User IDs; organizer should always automatically be in this)`  
  * `rsvps (Map — keyed by UID) — { uid: "going" | "not_going" | "pending" }`  
  * `event_time (Timestamp)`  
  * `end_time (Timestamp)`  
  * `created_at (Timestamp)`  
  * `resolves_at (Timestamp) — set once to min(created_at + 24h, event_time)`  
  * `activity_id (String)`  
  * `event_title (String)`  
  * `activity_picture_url (String)`  
  * `status (String: e.g. "proposed", "confirmed", "expired", "cancelled", "candidate")`  
  * `linked_vote_id (String)`  
  * `linked_chat_id (String)`  
  * `color (String)`  
  * `is_allday (Boolean: true/false)`  
  * `location_text (String)`  
  * `source (String; e.g. Knect or Google Calendar)`

# Current Firebase rules

## Firebase rules as of: 5/11/26

rules\_version \= '2';  
service cloud.firestore {  
  match /databases/{database}/documents {

    // \-------------------------------------------------------------------------  
    // 1\. USERS COLLECTION  
    // \-------------------------------------------------------------------------  
    match /Users/{userId} {  
      // Public profile data can be read by anyone logged in  
      allow read: if request.auth \!= null;  
      // Only the account owner can create, edit, or delete their own profile  
      allow create, update, delete: if request.auth \!= null && request.auth.uid \== userId;

      // Secure subcollection for emails, blocked users, and tokens  
      match /Private\_info/{privateId} {  
        allow read, write: if request.auth \!= null && request.auth.uid \== userId;  
      }

      // Public calendar blocks for UI (keeps private events safe)  
      match /Free\_Busy/{blockId} {  
        allow read: if request.auth \!= null;  
        allow write: if request.auth \!= null && request.auth.uid \== userId;  
      }

      // The Smart MVP Friend Request Logic  
      match /Friends/{friendId} {  
        allow read: if request.auth \!= null;  
        // Anyone involved can create or cancel/delete a request  
        allow create, delete: if request.auth \!= null && (request.auth.uid \== userId || request.auth.uid \== friendId);  
        // ONLY the profile owner can update the status (e.g., changing 'pending' to 'close friend')  
        allow update: if request.auth \!= null && request.auth.uid \== userId;  
      }

      match /Activity\_History/{historyId} {  
        allow read, write: if request.auth \!= null && request.auth.uid \== userId;  
      }  
    }

    // \-------------------------------------------------------------------------  
    // 2\. ACTIVITIES COLLECTION (The Discover Tab)  
    // \-------------------------------------------------------------------------  
    match /Activities/{activityId} {  
      allow read: if request.auth \!= null;  
        
      // Prevent Troll Activities: Creator must set themselves as the creator\_id  
      allow create: if request.auth \!= null && request.auth.uid \== request.resource.data.creator\_id;  
        
      // Only the actual creator can edit or delete the activity  
      allow update, delete: if request.auth \!= null && request.auth.uid \== resource.data.creator\_id;  
    }

    // \-------------------------------------------------------------------------  
    // 3\. CHATS COLLECTION (The Coordination Engine)  
    // \-------------------------------------------------------------------------  
    match /Chats/{chatId} {  
      // Prevent Ghost Chats: The creator MUST put their own UID in the array  
      allow create: if request.auth \!= null && request.auth.uid in request.resource.data.participants;  
        
      // Participants can read and update (this allows the frontend to manage group names)  
      allow read, update: if request.auth \!= null && request.auth.uid in resource.data.participants;

      match /Messages/{messageId} {  
        allow read, write: if request.auth \!= null && request.auth.uid in get(/databases/\$(database)/documents/Chats/\$(chatId)).data.participants;  
      }

      match /Votes/{voteId} {  
        allow read, write: if request.auth \!= null && request.auth.uid in get(/databases/\$(database)/documents/Chats/\$(chatId)).data.participants;  
      }  
    }

    // \-------------------------------------------------------------------------  
    // 4\. CALENDARS COLLECTION  
    // \-------------------------------------------------------------------------  
    match /Calendars/{eventId} {  
      // Prevent Forging: You can only create an event if you set yourself as the owner  
      allow create: if request.auth \!= null && request.auth.uid \== request.resource.data.owner\_id;  
        
      // Guests can read and update (to change status after a vote)  
      allow read, update: if request.auth \!= null && (request.auth.uid \== resource.data.owner\_id || request.auth.uid in resource.data.shared\_with);  
        
      // ONLY the owner can delete the event entirely  
      allow delete: if request.auth \!= null && request.auth.uid \== resource.data.owner\_id;  
    }

    // \-------------------------------------------------------------------------  
    // 5\. GLOBAL DENY (The Safety Net)  
    // \-------------------------------------------------------------------------  
    match /{document=\*\*} {  
      allow read, write: if false;  
    }  
  }  
}  
