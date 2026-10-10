# Knect design handoff

Exported from the Knect Design canvas on 2026-10-09. Direction A, "Refined Emerald", dark theme.

## How to use this folder (for Claude Code)

- **Each board has two files with the same name.** The `.html` is the source of truth for exact values: hex colors, sizes, spacing, font weights and copy. The `.png` (2x) is how it should look. Read both.
- **The HTML is a picture of the screen, not app code.** Rebuild it in React Native using the tokens and shared components from 4.2 (Appendix A/B). Do not copy inline styles or web-only CSS.
- **Status matters.** `approved` boards can be built. `potential` boards are **not approved**: treat them as missing and ask Kyson before building from them.
- **Ask when something is missing.** If a ticket needs a screen or state that isn't in this folder, stop and send Kyson the full list of what's missing. Never guess a design.
- **Logo files are in `assets/`.** Use those SVGs; never rebuild the logo from a font. The activity photo in `assets/` is placeholder content only.
- **Fixed rules across every screen:**
  - Primary buttons are emerald `#10b981` with dark text `#052e22` (not white).
  - Confirmed and personal events are solid in their color's 700 shade with white text.
  - Proposed events are a dashed outline.
  - Friends' busy times are gray stripes with initials.
  - Activities with no photo use their event color (700 shade) with white text.

## Index


### brand/

| File | What it is | Ticket | Status |
|---|---|---|---|
| `VectorMasters` | Vector masters (final files) | brand | approved |
| `Lockups` | Logo on every background | brand | approved |
| `AppIcon` | App icon | brand | approved |
| `LaunchAnimated` | Launch screen · A2 springy (plays once) | brand (launch) | approved |

### app-screens/

| File | What it is | Ticket | Status |
|---|---|---|---|
| `SignIn` | Sign in | 1.2 | approved |
| `ForgotPassword` | Reset password | 1.2 | approved |
| `CreateAccount` | Create account | 1.2 | approved |
| `CreateProfile` | Create profile · step 1 | 1.4 | approved |
| `Interests` | Create profile · step 2 (interests) | 1.4 | approved |
| `Discover` | Discover | 11 | approved |
| `ActivityDetail` | Activity detail | 12 | approved |
| `Search` | Search | 4.3 | approved |
| `FriendsList` | Friends list (tapped from Search) | 4.4 | approved |
| `Circle` | Circle | — | approved |
| `Profile` | Profile | 4 / 6 / 7 | approved |

### planner-and-plans/

| File | What it is | Ticket | Status |
|---|---|---|---|
| `Planner` | Planner · day | 18 | approved |
| `PlannerScrolled` | Planner · scrolled (header collapsed) | 18 | approved |
| `PlannerOverlaps` | Planner · overlaps, proposals, free events | 18 | approved |
| `TimeDrag` | Tap & drag to create | 18 | approved |
| `PlanFlowMap` | Plan flow map | 18 | approved |
| `CreateFromPlanner` | From the Planner · just me | 18 | approved |
| `CreateFromDiscover` | From Discover · with friends | 18 | approved |
| `CreateFromChat` | From a group chat | 18 | approved |
| `CreateAllDay` | All-day, multi-day trip | 18 | approved |
| `CreateConflict` | Sending into someone's busy time | 18 | approved |
| `SuggestTime` | Suggest a new time → vote | 18.5 | approved |
| `PickFriends` | Who's coming (from the Who row) | 18.2 | approved |
| `PlannerMonth` | Month view | 18 | approved |
| `PlannerCancelled` | Cancelled & expired | 18 | approved |
| `PlannerEmpty` | Empty day | 18 | approved |
| `PlannerLoading` | Loading | 18 | approved |
| `PlannerError` | Error (cached plans stay) | 18 | approved |
| `PlannerDrag` | Dragging your own plan | 18 | approved |
| `PlannerLocked` | Long-press a group plan | 18 | approved |
| `EventPersonal` | Tap your plan | 18 | approved |
| `EventConfirmed` | Tap a confirmed group plan | 18 | approved |
| `EventProposed` | Tap a friend’s proposal (vote open) | 18 | approved |
| `EditPlan` | Edit / delete your plan | 18 | approved |
| `CreateTimedMultiDay` | Timed multi-day plan | 18 | approved |
| `FriendsBusyFilter` | Choose whose busy to show | 18 | approved |
| `MultiDayPlanner` | Multi-day plan across its days | 18 | approved |
| `VoteCards` | Vote card states (with 17.5) | 17 (17.5) | approved |
| `ChatProposal` | Chat: plan card + open vote | 15–17 | potential |
| `ChatVoteClosed` | Chat: vote closed, plan moved | 15–17 | potential |

## Spec notes per board

These are the canvas notes that sit under each board. They are the "what changed and why" for each screen.

### app-screens/SignIn

SIGN IN
• No box around the form; stacked Kn logo + wordmark, tagline in sentence case
• Labels above fields, 'Forgot?' next to Password
• One primary button; 'Create an account' becomes a link at the bottom
• Apple / Google hidden until integrated

### app-screens/ForgotPassword

RESET PASSWORD
• Back arrow instead of a link inside a box
• Says what will happen ('we'll send you a link')
• Button: 'Send reset link'
• Confirmation stays on screen after sending. Wording never confirms an account exists (privacy)

### app-screens/CreateAccount

CREATE ACCOUNT — what changed
• Kn logo + Knect wordmark at the top
• Email only for now: Apple / Google stay hidden until they're integrated (then official buttons with their logos go above the email form)
• Labels above fields in sentence case
• Password rules → checklist with check icons that fill as met
• Button says 'Create account' and stays gray until every rule passes (today it lights up early)
• Back button + 'Already have an account? Sign in'

### app-screens/CreateProfile

CREATE PROFILE · STEP 1
• Step 1 of 2 progress; interests move to step 2
• Photo slot says 'Add a photo' (Project 6) instead of a green person icon
• Bio marked Optional, multi-line
• Continue stays gray until a name is entered
• Title white, not green

### app-screens/Interests

CREATE PROFILE — what changed
• Split into 2 steps: (1) photo, name, bio (2) interests — progress bar shows which
• 45-chip wall → grouped by category
• Overlaps removed (Sports vs Football etc., Outdoors vs Hiking)
• Selected chips get a check, not just color
• 'Pick at least 3' + live counter
• Button pinned to the bottom so it's always reachable
• The full interest list is a product decision — this is a sample

### app-screens/Discover

DISCOVER — what changed
• Photo on top, text on a solid card below (no hard dark band over the photo)
• No photo? Header fills with the activity's event color + a faint category icon (2nd card)
• Filters are real chips with a dropdown arrow; active one is tinted
• Added a 'This weekend' time filter (placeholder — your call)
• Meta line: place · cost · group size
• 'VIEW SPOT' → tap the card to open; main button is 'Plan this'
• Save (bookmark) button on each card
• No sticky 'Discover ↑' bar that overlapped the title

### app-screens/ActivityDetail

ACTIVITY DETAIL
• Close / send / save float on the photo below the status bar (no 'Discover' title peeking through)
• Photo count '1 / 4' for the pictures carousel (Project 12)
• Details as rows with icons, not spaced-caps labels
• Sticky 'Plan this' at the bottom (was 'PLAN THIS ACTIVITY')
• Send button = Project 16, sending an activity into a chat

### app-screens/Search

SEARCH — now matches tickets 4.3 + 4.4
• Was blank; 'Search for friends...' bar under the banner (4.3)
• Pending requests: red count badge, whole section hidden at 0 (4.4)
• Friends is one tap-in box (counts only); the list lives on its own screen (below), so opening Search doesn't read every friend — CHANGES 4.4
• Friends list: alphabetical, star filled = close friend, outline = friend (4.4)
• Both sections hide while search results show; clearing brings them back
• Rows and stars are display-only until Projects 5 and 7
• Rows are grouped in a card, 60pt tall, star has a 44pt tap target
• Removed: People/Activities toggle, suggested friends, popular chips (not in plan)

### app-screens/Circle

CIRCLE — what changed
• Unlabeled toggle → 'Share my status' row with a labeled switch
• Status input + audience (All friends / Close friends) + Post button
• Removed the second search bar above an empty list
• 'No conversations found.' → empty state with 'Start a chat'
• New-chat button in the header

### app-screens/Profile

PROFILE — matches Projects 4, 6, 7
• Centered header: profile picture with camera badge (tap to change, Project 6), name, location, bio, Edit profile
• Friends row removed: the friends widget moves to Search (Project 4 / 4.4)
• Settings gear removed: no settings page is planned
• Calendar sync is now a card: what it does + Apple / Google buttons
• Appearance: phone / sun / moon icons instead of words (3-way is D6's; 4.2 can ship light/dark first)
• Text is white throughout; avatar is emerald-700 so white initials pass contrast
• Log out sits under Appearance, in red
• Another person's profile (Project 7) = this minus Edit, calendar, appearance and log out, plus the friend-status button

### planner-and-plans/Planner

PLANNER — what changed
• Header sits below the status bar (safe area)
• Title white; date in sentence case, not spaced caps
• + is a 44pt rounded square, not a big green block
• View picker stays a dropdown ('Day ▾'), compact, next to + in the header
• Date pills lose their borders; only the selected day is filled
• Opens scrolled to now, with a current-time line
• Hour height 64 → 48pt, compact event blocks (short events are one line) — ~10 hours visible
• Views: Day + Month only. No Week view — the date strip IS the week; swipe it sideways to change weeks
• Scroll down → header collapses (board to the left)
• Events tinted with the event colors you already store
• Tab labels in sentence case, brighter inactive gray, no extra band under the bar
• All-day plans get a slim row above the timeline (was a big full-width bar)

### planner-and-plans/PlannerScrolled

PLANNER, SCROLLED — what changes on scroll
• Big 'Planner' title + date fold into one 'Fri, Oct 9' line
• Date strip shrinks to a single 44pt row (letter + number stacked)
• Day ▾ and + stay put, so actions never move
• Gains ~110pt of timeline: 2 PM → midnight visible, 4 events without scrolling
• Scrolling back to the top restores the full header

### planner-and-plans/PlannerOverlaps

EVENTS ON THE PLANNER
• Confirmed and personal events: SOLID color (the darker 700 shade, white text)
• Proposed (yours or a friend's): dashed outline in the event's color
• Overlapping events split the width side by side
• A proposal that collides with something you're going to gets an 'Overlaps Dinner' tag
• 'Vote open' tag while a new time is being voted on
• Free (doesn't count as busy) events look the same as busy ones; Free shows only when you tap in

### planner-and-plans/TimeDrag

TAP & DRAG ON THE PLANNER
• Tap a free spot to drop a 1-hour plan, drag the top/bottom handles to set start and end
• Tapping the block opens the create sheet, prefilled
• Personal events only; group plans don't drag (long-press explains, offers 'Suggest a new time')

### planner-and-plans/CreateFromPlanner

CREATE SHEET — one screen for every way in
• Pre-filled by where you came from: tapped time (Planner), activity + usual length (Discover), chat members (group chat)
• Time is set by dragging the block on the mini day; friends' busy = gray stripes with initials
• All day → Starts/Ends days with a range calendar
• 'Counts as busy' switch: timed defaults on, all-day defaults off; sender's choice applies to everyone
• Color row on every sheet
• No friends → Save · friends → Send

### planner-and-plans/CreateConflict

BUSY NEVER BLOCKS SENDING
• Friends' busy is information, not a lock
• If the plan lands on someone's busy time, a yellow heads-up names who and when
• Same Send button: they can still say yes, no, or suggest a time
• No new feature or data needed; it's a check inside the sheet

### planner-and-plans/PickFriends

WHO'S COMING
• Selected friends show as removable chips up top
• Checkmarks on the right instead of nothing
• Close friends first, then everyone
• Button counts: 'Add 2 friends'
• Initials until profile pictures ship (Project 6)

### planner-and-plans/EventPersonal

TAPPING AN EVENT
• Your plan: details incl. Busy / Free, Edit, Invite friends, Delete
• Confirmed group plan: who's coming with statuses, Open chat, Suggest a new time, Can't make it
• Friend's proposal: Going / Can't make it, plus a 'Vote open' banner when a new time is being voted on
