# Knect — Running Order

**What this is:** the single place that answers "what am I working on next, and what's blocking it." Two orders live here, and they are *not* the same list: the order the **docs** get written, and the order the **code** gets built.

**Last updated:** 2026-08-31 — after 17.1 and 17.2 were drafted.

> **New session? Read `Knect_START_HERE.md` first.**

---

## Where things stand

**Every ticket is now written.** 15.2 landed 8/30. 16 split into 16.1 / 16.2 and 17 split into 17.1 / 17.2, all four drafted 8/31 and **awaiting Kyson's review.** What remains is the edit pass and the Project 0 redraft.

| | Which |
|---|---|
| ✅ Written and substantive | 1, 2, 4, 5, 6, 7, 8, 9, 11, 12, 13.1, 13.2, 15.1, 15.2 |
| ✅ Drafted earlier | **0** (stack & conventions), **0.1** (repair the boot path), **Appendix A & B**, **Master Schema**, **START_HERE** |
| 🆕 Drafted 8/31, **awaiting review** | **16.1** · **16.2** · **17.1** · **17.2** · the Project 16 Phase 1 ledger |
| ➕ New, unowned | **iOS Firebase setup** · **`firestore.indexes.json`** · **content reporting** · **group-chat self-join** |
| ⚠️ Partial | 3 (rules code missing) — **and a hard blocker for 16.1, 16.2 and 17** |
| ✍️ Still to write | **nothing** |
| ⏸️ Deferred by Kyson | 10, 13.3, 14, 18, 19, 20, 21 |
| ⏸️ Pending Jonathan | own-profile tab, onboarding, settings/deletion |

**So the remaining doc work is: review the four new tickets, then the edit pass, then Project 0.**

---

## Part 1 — Doc writing order

### Wave 1 — Foundation *(blocks literally everything)*

1. **Project 0 — Stack, environment & conventions.** RN version, bare-RN confirmation, TypeScript, navigation library, styling, state layer, folder structure, services convention, testing bar, min OS versions, geohash library, dependency list, **and the offline/error conventions folded in from D10**. Also becomes `CLAUDE.md`.
   - ✅ *No longer blocked.* J1 resolved to `react-native-firebase`; 15.2 settled offline persistence — **on, default cache, one config module.**
   - ➕ **New at the redraft:** the listener convention is **three** app-wide listeners, not 15.2's two — chat list, open thread, and 16.1's Events listener. Write it as "three, and here is what each is for."
   - ➕ **Also new:** there is now **one scheduled sweep Function serving two tickets** (16.2's proposals and 17.2's votes). That's a convention, not an implementation detail — a second scheduler is the wrong answer next time too.
2. **Appendix A — Design tokens & dark mode.** Needs real color values from Kyson.
3. **Appendix B — Shared component inventory.** ➕ Add the in-chat activity card variant (16.1's share card) and the vote card variants.

### Wave 2 — Infrastructure

4. **D2 — Cloud Functions setup.** Runtime, deploy, local emulator, callable auth pattern, **and scheduled functions**. A hard dependency of 5, 15.1, 15.2, **16.2 and 17.2**.
5. **D4 — Location capture & geohash write.** Blocks 8, 11, 12, 13.1.
6. **D9 — Firebase Storage rules.** Small ticket, high risk if skipped.

### Wave 3

7. **D3 — Planner tab & Create Event screen.** ✏️ **Shrunk.** 16.1 defines the `Events` write, the data model, and the create flow's data layer. **D3 inherits that** — it is the Planner *screen* ticket, not the Events ticket. It also has to filter `status: "candidate"` events out of the planner.

### Wave 4 — Core loop *(all written)*

8. ~~**15.2 — Messaging & real-time listeners.**~~ ✅ Written and reviewed 8/30.
9. ~~**16 — Activity Proposals.**~~ ✅ Split and drafted 8/31 as **16.1** (propose, Events write, RSVPs, card, planner ghost) and **16.2** (confirmation, the 24h sweep, expiry, cancel, Free_Busy). Awaiting review.
10. ~~**17 — The Voting System.**~~ ✅ Split and drafted 8/31 as **17.1** (create a vote, candidate events, cast ballots, the card) and **17.2** (server-side tally, close conditions, write-back, cleanup). Awaiting review.
    - What it produced: `Votes.options` becomes objects, `change_type` renamed `vote_scope`, `vote_type` enumerated, `Events.status` gains `"candidate"`, `Messages` gains `vote_id`, and **Q8 closed with no new field** — `linked_vote_id` already is the alternative-open pointer.

### Wave 5 — Remaining undeferred

11. **18 — Internal Calendar.** Single events only. ➕ Inherits the five-value `Events.status` — it renders cancelled and expired, and must **never** render `"candidate"`.
12. **21 — Deep Linking & SMS Sharing.** Needs a link-service decision first (Firebase Dynamic Links is dead).
13. **20 — Push Notifications.** ➕ Now owns four things, all hanging off existing triggers so nothing is built twice: message notifications (15.2's create trigger), send-failure notices, **"your plan is on" / "your plan expired"** (16.2's resolution write), and **RSVP-change and vote-closed notices** (17.2's write). That last one is load-bearing rather than nice-to-have — it is what makes a late RSVP flip and a changed plan survivable.
14. **13.3 — User Generated Content.** Carries the `is_active` / `updated_at` retrofit — **and owns content reporting. Can't stay deferred through launch.**
15. **D5 — User status.** Deliberately light.

### Wave 6 — Edit pass

16. Rewrite **1–5** to the five-section format; insert section 4 into **6–13.2** and **15.1**; apply every ruling; add Data model / Security rules / Depends on / Status lines; fix index numbering and cross-references.

    **Specific edits Projects 16 and 17 created:**

    - **15.1** — add/remove-member has to write `Events.shared_with` and the `rsvps` map for every open proposal in that chat. New scope.
    - **12** — "Make This An Event" becomes a chooser (Planner or chat).
    - **11** — a share affordance on the Discover card, which does not exist today.
    - **3** — the full `Events` rule block, the full `Votes` rule block, and the Messages `create` rule widened to four `message_type` values. All written out in Master Schema Part 2.
    - **Project 0** — three listeners; one shared scheduled sweep; `Events` timestamps as another instance of the epoch-ms → `Timestamp` rule.
    - **Appendix B** — the in-chat activity card and the vote card variants.
    - **18 and D3** — inherit the five-value status, the derived `confirmed_participants`, and the candidate filter.
    - **20** — the four notification paths listed above.

### Wave 7 — Propagate outward

17. Update the **Firebase Master Schemas** Google Doc. **Three dated blocks are pending: 8/30, 8/31 (16), 8/31 (17).**
18. Rewrite the **security rules** and move them into the repo as `firestore.rules`.
19. Write **`CLAUDE.md`** and `firestore.indexes.json`.

### ⏸️ Held pending Jonathan

- **D6** own-profile tab, **D7** onboarding, **D8** settings / logout / account deletion.

---

## Part 1b — What the reconciliation changed

Full detail in `Knect_Codebase_Reconciliation.md`. The short version: **the app has never written a field to Firestore**, and three of four tabs crash on load. But a great deal of UI is finished and keepable.

| Ticket | Verdict | Note |
|---|---|---|
| 1 Auth | KEEP, full size | ~20% done |
| 2 Profile creation | KEEP — the lynchpin | 4 and 7 both block on it |
| 4 Search | KEEP, greenfield | Needs `name_lowercase`, which nothing writes |
| 6 Profile pictures | KEEP, greenfield | No image picker, no Firebase Storage in build.gradle |
| 7 Public profile | KEEP, **grew** | No navigation library exists to route with |
| 11 Discover fetch | SHRINK | UI works; becomes a data-layer ticket |
| 12 Detail page | SHRINK, hard | The modal already exists and works |
| Planner / Create Event | SHRINK | ~1,800 lines of working UI; 16.1 defines the model layer |
| 15.1 Chat creation | SHRINK, ~60% left | Add/remove member doesn't exist — and now has to write Events |
| 15.2 Messaging | SHRINK heavily | UI done; listeners 100% greenfield |
| 16.1 Proposals | SHRINK | Best-built feature in the prototype. Keep the UI, rebuild the data layer |
| 16.2 Resolution | **KEEP, greenfield** | Nothing in the prototype resolves anything |
| 17.1 Vote creation | SHRINK | ~500 lines of finished vote UI, creator modal and drag list. Data layer greenfield |
| 17.2 Tally | **KEEP, greenfield, highest risk** | Four tally implementations across three tie policies all get deleted. The replacement is one server-side function |
| Own-profile tab | SHRINK to a bug-fix ticket | Its loader is a dead IIFE; the save is write-only |
| Onboarding | KEEP, medium | Step machine is broken; creates no auth user |
| User status | KEEP | `StatusService` is non-functional, not partly built |

---

## Part 2 — Implementation order

**0.1 — Repair the Boot Path goes first.** Three of four tabs crash on load, so nothing else can be verified on a device until it lands.

```
0    Stack & conventions        ── read once, applies to all
0.1  Repair the boot path       ── FIRST. Nothing is testable before this
│
├─ 1  Auth ─── 2  User document ─── 3  Security rules
│                                    │   ▲ 16.1, 16.2 and 17 all hard-block here
│                                    ├─ D2  Cloud Functions setup (incl. scheduled)
│                                    └─ D9  Storage rules
│                                        │
│                                        └─ 6  Profile pictures
│
├─ 4  Search tab ─── 5  Friend requests ─── 7  Public profile
│                    (needs D2 and 15.1 — see F1)
│
├─ 8  Activity schema ─── 9  Seed data ─── D4  Location capture
│                                           │
│                                           └─ 11  Discover feed
│                                               ├─ 12  Detail page
│                                               ├─ 13.1  Search & algorithm
│                                               └─ 13.2  Tag affinity
│
├─ D3  Planner & Create Event   ── screen only; 16.1 owns the Events write
│   └─ 15.1  Chat infrastructure ─── 15.2  Messaging  ◄── needs D2
│       └─ 16.1  Proposals ─── 16.2  Resolution ─── 17.1  Votes ─── 17.2  Tally ─── 18  Calendar
│                                  ▲ 16.2 and 17.2 share one scheduled sweep. Both need D2
│
├─ 21  Deep linking          ── the growth loop
├─ 20  Push notifications    ── hangs off 15.2, 16.2 and 17.2's writes
├─ 13.3  User generated content  ── carries content reporting; not optional for launch
└─ D5  User status
```

**Deferred, Status line only:** 10, 14, 19, recurrence within 18.

---

## Part 3 — The sequencing traps

**F1 — Project 5 can no longer be a Phase 2 ticket.** The block check runs through a Cloud Function (O4), and 15.1 auto-creates a 1-on-1 chat on friend-accept. So Project 5 depends on **D2** *and* **15.1**. Building it as written means building it twice.

**F7 — Two decisions point at the same Function.** Spec `acceptFriendRequest` as a single callable doing the block check, the batched friendship write, and the chat creation in one transaction.

**F8 — `firestore.indexes.json` has no owner, and six tickets now need it.** 15.2's chat list; 16.1's `shared_with` listener (now excluding candidates); 16.2's `status` + `resolves_at` sweep; 17.2's votes sweep; 11 and 13.1. Firestore fails a missing composite at runtime — survivable in dev, a launch blocker in production. **Either it joins Project 3's scope or it becomes a one-line ticket. This is past due.**

**F9 — content reporting is deferred and it gates App Review.** Guideline 1.2 needs filtering, a report mechanism with timely responses, blocking, and published contact info. Blocking is handled. Reporting is owned by **13.3, which is deferred.** Published contact information has no home at all.

**F10 — Project 3 is a hard blocker, not a parallel workstream.** No `/Events/` rule exists and the catch-all deny sits beneath it, so **every Events read and write is blocked today.** 16.1, 16.2, 17.1 and 17.2 all sit behind it. "⚠️ Partial — rules code missing" understates what that now costs.

**F11 — 🔴 Two Project 16 rulings contradict each other.** "RSVPs lock once the event resolves" and "someone who never answered keeps live buttons indefinitely" cannot both be true. See Master Schema Q7. **16.2 can't be built until one gives.**

**F12 — group-chat self-join has no ticket anywhere.** 15.1 owns add/remove member, but nothing covers a person joining a chat themselves. Surfaced because 16.1's `shared_with` rule assumes joining is a thing people can do.

**F13 — ❓ Can a vote be cancelled, and by whom?** ➕ *New 8/31.* Nothing has decided, and the Vote `status` value set can't be finalized without it (Master Schema Q9). Small, but it's a schema value set, which makes it expensive after the fact.

**F14 — 17.2 is the highest-risk ticket in the roadmap, and it fails silently.** ➕ *New 8/31.* A wrong tally returns a plausible winner nobody questions. The prototype's IRV inverts winners in a concrete reproducible case, and both of its tally functions break ties with `Math.random()`. **The tally gets unit tests against seeded fixtures before it is wired to anything** — it is the one place in this roadmap where "manual verification against the acceptance criteria" is not a sufficient bar.
