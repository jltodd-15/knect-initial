# Device findings

What was seen running the app on a real phone, and what Kyson wants changed. This is a list to
write tickets from, not a list of tickets: nothing here is scheduled or decided until it has one.

`DEVICE_TESTS.md` is the other half: the step-by-step checks each ticket asks for. A box ticked
there is something seen working. This file is for what was seen *not* working, or wanted different.

## Device testing is paused, on purpose (decided 2026-10-09)

Every tab except Search still runs on sample data, so a change made in one place doesn't show up in
another, and most device checks would be judging screens that are about to be replaced. Kyson's
call: get the app connected and the layout sound first, then run the device checks in one pass,
instead of reinstalling after every ticket.

Until then, a ticket still writes its section in `DEVICE_TESTS.md`; it just isn't run yet.

**Worth one try before the big pass:** the build on the phone showed "Connect to Metro to develop
JavaScript". With Metro running on the Mac and the phone on the same Wi-Fi, most code changes reach
the phone without a reinstall. Untried on this Mac.

## What the evidence is

- **Video, 2026-10-08 14:05**, iPhone, dark mode, a debug build made at 14:01 from `ticket/4.2`
  (before ticket 4.3's Search screen existed). Sign-in, all five tabs, Profile, a full signup.
- **Screenshot A, 2026-10-09 1:47**, Planner right after opening the app.
- **Screenshot B, 2026-10-09 1:58**, Planner after logging out and back in.

## Issues seen

Numbered so a ticket can point at one. "Likely cause" is a guess from reading the code, not a
diagnosis.

**The frame around every screen**

1. **The top of the screen is drawn under the clock and the Dynamic Island.** In screenshot A the
   "Planner" title, the WEEK button and the + button sit underneath the status bar. The video shows
   the same on Search and Circle.
2. **The layout is different after logging out and back in.** In screenshot B the title sits well
   below the status bar, with more empty space above it than looks intended, and there is a black
   strip under the tab bar. Same screen, same phone, two layouts.
   *Likely cause of 1 and 2:* the signed-in screens are the only ones in `App.tsx` not wrapped in a
   `SafeAreaProvider`, and the tab bar adds its own bottom spacing on top of the app's.
3. **The tab bar has a tall empty band under its labels** (both screenshots, and the video).
4. **Text cut off or poorly spaced in several places.** Kyson's observation across the app; the one
   pinned down so far is the Planner's "12 AM" label, cut off at the top of the grid. The rest
   need listing screen by screen.

**Tabs that don't agree with each other**

5. **Profile shows "Alex Rivera"** and five sample friends, not the account that is signed in.
   (Known: D6.)
6. **Profile lists five friends while Circle says "No conversations found."** What you do in one
   part of the app doesn't carry to the others. (Known: Projects 5, 9, 11 and 15.)
7. **"Connect External Calendar" opens a placeholder message**: "This would open OAuth flow for
   Google/Apple Calendar."

**Planner**

8. **Monthly view has a lot of spacing problems.** Needs listing in detail.
9. **Opening the Planner doesn't put you at the current time.** It opens at 12 AM and you scroll.

**Not yet seen on a device**

10. **Search (ticket 4.3).** Built and passing its automated tests, but the build in the video
    predates it, so the tab there is still the placeholder.

## Changes wanted

Kyson's list, 2026-10-09. These are design decisions to make, not bugs.

- **The top and bottom of every screen should fit the phone well.** (Fixing issues 1 to 3 is the
  start of this.)
- **Each hour on the Planner is too tall.** You scroll a long way and can't see most of a day at a
  glance. (An hour is 80 points tall today.)
- **Open the Planner centered on the current time.** (Issue 9.)
- **Scroll to the next week from the row of dates at the top of the Planner**, to add something
  further out. Today the row only shows the current week.
- **Show which other days of the week have events.** Nothing marks them today.
- **Mark today when picking a date or time in the create-event flow.** Nothing shows what "now" is.
- **Fix the monthly view's spacing.** (Issue 8.)
- **Decide about the create-event button taking the event's color.** It changes when you pick a
  color. That wasn't asked for; it might be worth keeping. Not a big deal either way.
- *Kyson's message ended mid-sentence after the next-week item ("; it"). Anything that followed is
  not recorded here.*

## Suggested order (Claude's recommendation, not a decision)

1. Issues 1 to 3 first. They are on every screen, and any design work done before them is judged
   against a broken frame.
2. Then make the tabs agree, starting with Profile showing the signed-in person (issue 5).
3. Then the Planner changes, as one design pass, with screenshots.
4. Then the full device pass through `DEVICE_TESTS.md`.
