# Project 16 — Phase 1 Decision Ledger

**Status:** Phase 1 **complete and closed**, 2026-08-31. No open decisions. Drafting not started.
**Folds into:** `Knect_Decision_Log.md` once 16.1 and 16.2 are written and reviewed. Kept standalone until then so nothing is lost between sessions.

All rulings below are Kyson's, made in a Phase 1 pass against the live `auth` branch.

---

## The headline: 16 splits into 16.1 and 16.2

| | Scope |
|---|---|
| **16.1 — Activity Proposals** | Propose from three entry points, write the `Events` document, seed and collect RSVPs, render the proposal card in chat and the ghost on the planner |
| **16.2 — Proposal Resolution** | The confirmation rule, `resolves_at`, the scheduled sweep Function, expiry, cancel, and the `Free_Busy` write on confirmation |

**Why:** the two halves fail in completely different ways — 16.1 fails visibly on a screen, 16.2 fails silently in a Function — so they review differently. Accepted cost: 16.1 ships a proposal that never resolves on its own until 16.2 lands.

---

## Rulings

### Message types — both survive

`"activity"` = sending an activity from the Discover tab into a group chat. No Event, no RSVPs. `"event_proposal"` = a real proposal with an Event behind it and yes/no on the card. Two genuinely different renderings, so the five-value `message_type` enum stands as 15.2 wrote it. **Q5's "shrink the enum" warning is closed — it does not shrink.**

### An Event is created at proposal time, and a time is required

`status: "proposed"` from the moment you propose. A time is required to create one, enforced at least in the UI. The event renders as a ghost on the planner *and* as a yes/no card in the chat simultaneously.

### The lifecycle — forward-only

An event **stops being a proposal** when at least one person **other than the originator** says yes, *and* there is no open alternative proposal for the same activity.

- Confirmed → solid for the people who said yes, gone for the people who said no.
- Someone who never answered keeps a live ghost and live buttons, indefinitely. Silence is not read as a no. (The wife case: doesn't respond, is coming.)
- If the window passes with **zero** non-originator yes, the event **expires** — a new `status` value.
- The window is **`min(created_at + 24h, event_time)`**, so a proposal for tonight resolves tonight rather than waiting a day it doesn't have.

**`proposed → confirmed | expired | cancelled`, and those three are terminal.** No transition ever goes backwards.

### Alternatives can only be raised while it is still proposed

Once an event confirms, **no alternative can be raised against it.** If someone wants a different plan after that, they start a separate one and cancel the old one by hand.

**Why this matters more than it looks:** it makes the state machine forward-only, which removes the single most expensive thing that was left in 16.2 — a confirmed event that can revert to proposed and restart its own window.

### Who runs the clock

A **scheduled Cloud Function sweep**. Nothing client-side can flip a state while the app is closed. `resolves_at` is **stored at write**, so the sweep is one indexed query — `status == "proposed" and resolves_at <= now` — rather than two queries or a multi-inequality.

### The alternative gate — 16 defines it, 17 fills it

16 adds the field representing "an alternative is open" and writes the confirmation rule against it, treating it as always-empty until Project 17 exists. 16 ships complete; 17 doesn't have to reopen it. Because alternatives are only possible pre-confirmation, the gate only ever needs to be read during the proposed window.

### Drag and resize — personal events only

Drag and resize stay available on **personal** events, as a way to move your own calendar around. They are **disabled on proposed events**, because changing the time is meant to be an alternative proposal and that route belongs to 17. Confirmed group events don't drag either — the owner cancels and re-proposes.

**Write the reason into the ticket, not just the rule:** with the time locked while a proposal is open, `event_time` is immutable, so **`resolves_at` can never go stale.** If someone re-enables dragging later without knowing that, they silently break the sweep.

### RSVPs

- Seeded exactly as the prototype does it (`ChatService.ts:148`): every participant `pending`, proposer `going`.
- Changeable freely while the event is still a proposal; **locked once it resolves.**
- `confirmed_participants` stays derived — the uids whose `rsvps` value is `going`.

### `shared_with` tracks chat membership

Anyone in the chat is an invitee. Adding someone mid-proposal seeds them `pending` and puts a ghost on their calendar; removing them drops their RSVP. **Consequence: 15.1's add/remove-member now has to write to `Events`.**

### Free/busy

A `going` RSVP writes nothing. The `Free_Busy` block is written **when the event confirms**, which means it belongs to 16.2's resolution Function, not to the RSVP tap.

### Cancel

The proposer can cancel. `status` becomes `"cancelled"`, the event drops off every planner, and the chat card renders as cancelled in place — the message is *not* tombstoned.

### Security rules

- **Events `create`:** any authenticated user, with `owner_id == request.auth.uid` so an event can't be created in someone else's name.
- **Events `shared_with`:** **any participant of `linked_chat_id` may write it**, verified by a `get()` on the chat. Bounded by chat membership rather than open to the whole app.
  - *Known and accepted:* one participant can remove another person from a plan, and nothing records who did it. Bounded exposure — it can only ever be someone already in that chat.
- **Messages `create` widens to values only:** `"text"`, `"activity"`, `"event_proposal"`. No shape or ownership checks in-rule. 15.2's rule as written today permits only `"text"`, so **without this change every proposal message 16 sends is denied.**
  - *Known and accepted:* nothing stops a malformed proposal message that points at no event. It renders as a broken card rather than being rejected.

### Scope boundaries

- **One chat per proposal.** `linked_chat_id` stays singular; multi-send is a later feature.
- **`activity_id` is optional** — freeform proposals ("dinner at my place Friday") work the same way, matching what `EventPlanner.tsx` already builds.
- **Propose from all three entry points**, and Project 12's "Make This An Event" reroutes to a chooser rather than going straight to the Planner. Note: there is no share affordance on the Discover tab today, so that part is greenfield.
- **The Propose Change route stays as built and unpersisted.** The button, the event menu and the vote creator all exist and work locally; 16's doc states plainly that this path does not persist until 17. 16 writes no `Votes` document.
- The `"activity"` share card gaining a "propose this" action is agreed in principle and low priority.

### Live state — one app-wide Events listener

`Events where shared_with array-contains uid`, in a shared repository module, feeding both the planner ghosts and the chat cards. **This is a third app-wide listener where 15.2 committed to two** — a deliberate exception, made because both screens need the same data and the alternative is two separate sources of truth for one document. Needs a date bound so it doesn't load an entire event history.

---

## Schema deltas this produces

| Change | Collection |
|---|---|
| ➕ `created_at` (Timestamp) | `Events` |
| ➕ `resolves_at` (Timestamp) — `min(created_at + 24h, event_time)`, set at write | `Events` |
| ✏️ `status` gains `"expired"` and `"cancelled"` — four values, up from two | `Events` |
| ➕ a field expressing "an alternative is open" — exact shape TBD with 17 | `Events` |
| ✏️ `confirmed_participants` confirmed derived from `rsvps` | `Events` |
| ✏️ `activity_id` explicitly optional | `Events` |
| ➕ Composite index: `status` + `resolves_at` | `firestore.indexes.json` |
| ➕ Composite index: `shared_with array-contains` + a date bound | `firestore.indexes.json` |

---

## New, unowned — surfaced by this pass

- **Joining a group chat has no UI and no ticket.** 15.1 owns add/remove member, but a self-join path (invite link, request to join) isn't in 15.1 or anywhere else. It's a prerequisite for the `shared_with` rule above to mean much.
- **15.1 gains scope:** add/remove-member has to write `Events.shared_with`, which is not in that ticket today.
- **Project 12 gains scope:** "Make This An Event" becomes a chooser rather than a direct route to the Planner.
- **Project 0 at its redraft:** the listener convention is now "three app-wide listeners, and here is what each is for," not 15.2's two. That belongs in the conventions doc, not as a footnote in 16.1.

---

## Verified against the `auth` branch during this pass

- `EventPlanner.tsx:139` — the proposal flow is **Planner-first**: creating an event with participants calls `findOrCreateConversation` then sends an `event-proposal` message. The chat card is an output of the create-event flow.
- `EventPlanner.tsx:111` — `status: participants.length > 0 ? 'proposed' : 'confirmed'`. Participants already decide proposal vs. personal event.
- `DraggableEvent.tsx:242` — the ghost render exists, at 20% opacity (`${event.color}33`).
- `ChatService.ts:161` — the chat-list preview for a proposal is already `📅 Event Proposed: ${title}`. The Function-written preview needs the same string on the message's `text`, or a proposal produces an empty preview row.
- `SocialDashboard.tsx:708` — "Propose a change instead" renders **only** when `rsvps[me] === 'not_going'`. Saying no is what unlocks proposing an alternative, which matches the intended social logic exactly.
- `SocialDashboard.tsx:865` — `// In real app: ChatService.sendVote(...)`. The vote path is built end to end in the UI and persists nothing.
- **The live vote UI is in `SocialDashboard.tsx`, not `ChatEventWidget.tsx`.** `ChatEventWidget.tsx` and `utils/votingLogic.ts` are dead — nothing imports either. `DraggableVoteList` *is* imported and live. 17 inherits working vote-card and ranked-drag UI, plus two files to delete.
- `ChatEventWidget.tsx` carries a third RSVP vocabulary (`'yes' | 'no'`) disagreeing with the live card's `'going' | 'not_going'`. Dead code — a deletion, not a reconciliation.
