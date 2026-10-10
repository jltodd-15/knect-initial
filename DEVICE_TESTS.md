# Device tests

Checks that can only be done by running the app on a real device or emulator, with the Firebase
Console open. The automated tests (`npm test`) use a fake Firebase, so they can't prove that the
real one behaves as expected, that the Console shows the right data, or that screens look right.

**Paused since 2026-10-09.** Device testing waits until the app is connected and its layout is
sound; the reasons, and everything seen on a phone so far, are in `DEVICE_FINDINGS.md`. The boxes
already ticked below come from one video and two screenshots, and say so.

Each ticket adds its own section here as part of that ticket. Tick a box only after watching it
happen. If something doesn't match "you should see", note what you saw instead. That's the useful
part.

**Before you start**
- Open the Firebase Console in a browser: **Authentication → Users** and **Firestore Database → Data**.
- Use throwaway test emails (e.g. `test1@example.com`, `test2@example.com`). Delete them from both
  places in the Console when you're done.
- "Go offline" means turning on airplane mode on the device or emulator.
- The tab crashes were fixed in ticket 0.1. If any screen turns pink and says **"Something went
  wrong"**, that's a real bug: screenshot it (the message under the title matters) and note which
  tab and what you tapped.
- Expected, not bugs: the tabs show sample data (friends, chats, activities, and "Alex Rivera" on
  the Profile tab), not what you typed at signup, and changes there are only saved on that phone.
  Later tickets connect them to Firebase.

---

## 4.6: Friends box and the friends list screen

Not yet run. `npm test` proves the Search tab asks only for the pending requests and two counts,
what the box says for each count, and that the list screen shows 4.4's list; `npm run test:rules`
proves the rules allow the count queries. Whether the real counts are right, and how the box and
the new screen look, is only checkable here.

**This changes where 4.4's friends checks happen.** Every 4.4 check below about friend rows, order,
stars, pages and pulling down the friends list is now done on the friends list screen (Search tab →
tap the Friends box), not on the Search tab. The pending-request checks are unchanged.

**Setup.** As for 4.4: account A plus four others, Friends documents added by hand in the Console.

**Screenshots wanted.** For every line marked 📸, one in light mode and one in dark mode.

**The box**
- [ ] 📸 With no Friends documents under A, open the Search tab. You should see: under the search
  bar, one rounded box with a thin outline reading "Friends" and, under it in smaller gray text,
  "No friends yet", with a gray arrow pointing right at its right edge. No list of people.
- [ ] Set Ana = `friend`, bob = `close_friend`, Carol = `friend`, Dave = `close_friend`. Leave the
  tab and come back. 📸 You should see: the box reads "4 friends · 2 close friends".
- [ ] Delete Dave's and bob's documents. Leave and come back. You should see: "2 friends", with
  nothing after it.
- [ ] Delete Carol's. Leave and come back. You should see: "1 friend".
- [ ] Add a document with `status` = `pending` and one with `request_sent`. Leave and come back.
  You should see: the count does not change. The pending one shows in Pending Requests, above the box.
- [ ] Press and hold the box. You should see: it turns slightly gray while held.

**Opening the list**
- [ ] Tap the box. 📸 You should see: a new screen slides in with a left-pointing arrow, the title
  "Friends" and a gray number beside it matching how many friends are listed. Below, the friends,
  close friends first with filled green stars. The tab bar at the bottom is not visible.
- [ ] Tap the arrow. You should see: the Search tab again, with the box.
- [ ] On Android, press the system back button on the list screen. You should see: the Search tab.
- [ ] With no friends, tap the box. You should see: the title "Friends" with "0", the gray text
  "No friends yet" and a green "Find friends" button. Tap it. You should see: the Search tab.

**Pulling down**
- [ ] On the Search tab, change a count in the Console (add a `friend` document), then pull down.
  You should see: a green spinner for a moment, then the new number in the box.
- [ ] On the list screen, rename a friend in the Console (`name` and `name_lowercase`), then pull
  down. You should see: the new name, in its new alphabetical place.

**While searching**
- [ ] Type `zed` in the bar. You should see: the box and the pending section disappear. Clear the
  bar. You should see: both come back.

**Offline**
- [ ] Go offline, then open the Search tab. You should see: the box reads "Friends" with no line
  under it. No red circle, no "Try again" for the box. Tap it. You should see: the list screen
  opens (showing either the friends from last time or the red circle with "Try again"; note which).

**Read cost (Console)**
- [ ] With 12 or more friends under A, open the Search tab a few times, then check **Firestore →
  Usage**. You should see: reads go up by a handful per visit, not by a dozen or more.

**Expected, not bugs**
- The box briefly shows as a gray placeholder row while the counts load.
- The fonts and icons are still the old ones; ticket 4.5 changes them.
- The list screen hides the tab bar. The design board shows it; say so if you want it kept.

---

## 4.4: Friends list and pending requests

**Since ticket 4.6 the friends are on their own screen.** Where a check below says to look at the
Friends section or its rows on the Search tab, open the Search tab and tap the Friends box first.
The "No friends, no requests" check's Search-tab wording is replaced by 4.6's "The box" checks.

Not yet run. `npm test` proves which section a person lands in, the order, the stars, the badge's
number and when each read happens, against a fake Firebase; `npm run test:rules` proves the rules
allow both queries. Whether the real queries return the real documents, and how the two sections
look, is only checkable here.

**Nothing in the app creates a friendship yet** (that is Project 5), so every Friends document
here is added by hand in the Console.

**Setup.** Sign up account A (`Zed Tester`) and at least four more accounts with different names,
say `Ana Diaz`, `bob Ray`, `Carol Lee`, `Dave Poe`. Do the checks signed in as A. In the Console,
under **Firestore Database → Data → Users**, copy each other account's document ID (its uid). To
add a Friends document: open A's `Users` document → **Start collection** (or open the existing
`Friends` collection → **Add document**) → collection ID `Friends`, **document ID = the other
person's uid**, one field `status` of type **string**.

**Screenshots wanted.** For every line marked 📸, take one with the phone in light mode and one in
dark mode.

**No friends, no requests**
- [ ] 📸 With no Friends documents under A, open the Search tab. You should see: under the search
  bar, the small gray heading "Friends", the gray text "No friends yet" and a green "Find friends"
  button. The words "Pending Requests" are nowhere on the screen.
- [ ] Tap "Find friends". You should see: the cursor lands in the search bar and the keyboard opens.

**Pending requests**
- [ ] Add three Friends documents under A with `status` = `pending` (for Ana, bob and Carol). Leave
  the Search tab and come back. 📸 You should see: the heading "Pending Requests" with a small red
  pill beside it reading "3" in white, then three rows (green circle with initials, then the name)
  in the order Ana Diaz, bob Ray, Carol Lee. Below them, the Friends section, still empty.
- [ ] Delete the three documents, leave the tab and come back. You should see: the "Pending
  Requests" heading, the badge and the rows are all gone, not left as an empty section.

**Friends, order and stars**
- [ ] Set these under A: Ana = `friend`, bob = `close_friend`, Carol = `friend`, Dave =
  `close_friend`. Leave the tab and come back. 📸 You should see, top to bottom: bob Ray, Dave Poe
  (each with a filled green star at the right edge), then Ana Diaz, Carol Lee (each with an
  outline green star). Capital letters make no difference to the order.
- [ ] Add one more with `status` = `request_sent`. Leave and come back. You should see: that person
  appears in neither section.
- [ ] Tap a row, then tap a star. You should see: nothing happens. No highlight, no new screen, the
  star does not change.
- [ ] Open the Profile tab. You should see: it is unchanged, sample data and all.

**Coming back, and pulling down**
- [ ] In the Console, change Ana's `status` from `friend` to `close_friend`. Without pulling down,
  go to another tab and come back to Search. You should see: Ana now has a filled star and has
  moved up among the close friends.
- [ ] In the Console, open Ana's own `Users` document and change both `name` and `name_lowercase`
  (e.g. `Zoe Diaz` / `zoe diaz`). Leave the tab and come back. You should see: still "Ana Diaz".
  This is expected: names are remembered until you pull down or sign out.
- [ ] Pull the list down and let go. You should see: a green spinner at the top for a moment, then
  the row reads "Zoe Diaz" and has moved to its new alphabetical place.

**Deleted user**
- [ ] 📸 Add a Friends document whose document ID is a made-up uid (e.g. `nobody123`) with
  `status` = `friend`, and another (`nobody456`) with `status` = `pending`. Leave and come back.
  You should see: in each section a row reading "Deleted user" with a green circle holding a plain
  person outline, at the bottom of its section. The pending badge counts it.

**More than one page**
- [ ] Give A more than 10 friends (made-up uids are fine: 12 documents with `status` = `friend`).
  Open the tab. You should see: about 10 rows. Scroll to the bottom. You should see: the rest
  appear as you reach the end.

**While searching**
- [ ] With friends and a pending request showing, type `zed` in the bar. 📸 You should see: both
  sections disappear and only the search's rows are on screen. Clear the bar. You should see: both
  sections come back.
- [ ] Type just `ze`. You should see: both sections stay where they are.

**Offline**
- [ ] Go offline, then open the Search tab. Note what you see in each section (the lists from last
  time, or the red circle with "Try again"). Either is acceptable for now; write down which.

**Expected, not bugs**
- While the tab loads, three gray rows flash above "Friends" and then vanish when there are no
  pending requests. If that looks wrong on the phone, say so: the alternative is showing nothing
  there until a request exists.
- A close friend's star shows your own copy of the status. The other person may only have you as a
  plain friend.
- Accepting, declining, unfriending and starring are Project 5. Nothing here writes anything.

---

## 4.3: The Search tab and user search

Not yet run. `npm test` proves when a search fires and which state the screen shows, against a
fake Firebase; `npm run test:rules` proves the rules allow the query. Whether the real query finds
real people, and how the screen looks, is only checkable here.

**Needs two test accounts.** Sign up account A with the name `Zed Tester` and account B with the
name `zed OTHER` (the odd capitals are deliberate). Do the checks signed in as A.

**Screenshots wanted.** For every line marked 📸, take one with the phone in light mode and one in
dark mode.

**The bar**
- [ ] 📸 Open the Search tab. You should see: the green "Search" title, and under it a rounded
  gray bar reading "Search for friends...". Below it are the two sections from 4.4 (see above).
- [ ] Tap the bar. You should see: the "Search for friends..." text disappears straight away,
  before you type. Tap away with the bar still empty and it comes back.

**Searching**
- [ ] Type `ze`. You should see: no search results appear. No "No one found", and the sections
  from 4.4 stay as they were.
- [ ] 📸 Type one more letter: `zed`. You should see: three gray placeholder rows for a moment,
  then one row, a green circle with "ZO" and the name `zed OTHER`. Your own account (`Zed Tester`)
  is not in the list.
- [ ] Clear the bar and type `ZED` in capitals. You should see: the same one row.
- [ ] Clear the bar and type `oth`. You should see: "No one found". This is expected: the search
  matches the start of the name only, so a last name finds nobody.
- [ ] 📸 Type `qqq`. You should see: "No one found" in gray text, with no red circle and no
  "Try again" button.
- [ ] Tap the `zed OTHER` row. You should see: nothing happens. No highlight, no new screen.
- [ ] Type `zed`, then delete one letter. You should see: the row disappears and the sections from
  4.4 come back.

**Never more than 10 rows**
- [ ] In the Console, under **Firestore Database → Data → Users**, check how many documents have a
  `name_lowercase` starting with the same three letters. If you have 11 or more (sign up extra
  throwaway accounts named `Zed 1`, `Zed 2`... if you want to check this), search those letters.
  You should see: at most 10 rows, or 9 if your own account was one of the 10 fetched.

**Expected, not bugs**
- Offline, a search shows "No one found" instead of an error. Search isn't built to work offline.
- A row shows initials and a name only. Pictures, bios and friend markers come in later tickets.

---

## 4.2: Theme, tokens, shared components and the full sweep

Not yet run. The code is finished; every group below is ready to check. The groups follow the
order the screens were moved onto the theme.

**Screenshots wanted.** Kyson can't run the app, so this ticket's look is judged from your
screenshots. For every line marked 📸, take one with the phone in light mode and one in dark mode.

**How to switch modes.** Change the phone's own setting (iOS: Settings → Display & Brightness.
Android: Settings → Display → Dark theme), then come back to the app. It should change without a
restart. Before the first check, leave the Profile tab's dark-mode switch alone: once it has been
used, the app stops following the phone (that is the override, checked below).

**Expected everywhere, not bugs:** text is a slightly softer black (and a slightly off white in
dark mode), bold text is a little less heavy than before, and some gaps and corner curves have
moved by a point or two.

### Session C: the shell and small pieces — ready

**Following the phone**
- [ ] **Dark phone, dark app.** With a fresh install and the phone in dark mode, open the app. The
  sign-in screen is dark: near-black background, a dark card, light text. 📸
- [ ] **Light phone, light app.** Same in light mode: warm off-white background, white card. 📸
- [ ] **Changes live.** With the app open on the sign-in screen, switch the phone's mode. The app
  follows without being restarted.

**Launch**
- [ ] **Logo, not a spinner.** While signed in, fully close and reopen the app. For a moment you see
  the green "Kn" square, centered, on the app's background; then the app. No spinning circle. 📸
  (it is brief; a screen recording is fine).
- [ ] **No flash of the wrong mode.** With the phone in dark mode, reopen the app a few times. It
  never shows a light screen first.

**The Profile tab's switch**
- [ ] **It overrides the phone.** With the phone in light mode, turn the Profile tab's dark-mode
  switch on. Every tab and the tab bar go dark straight away.
- [ ] **It sticks.** Fully close and reopen the app. It is still dark, with the phone still light.
- [ ] **And back.** Turn the switch off. The app is light, and stays light after a restart even if
  the phone is then put in dark mode. (Going back to "follow the phone" has no control yet; that
  is a later ticket. To reset it, delete and reinstall the app.)

**Each piece, in both modes**
- [ ] **Sign-in screen.** Logo, "Knect", the two inputs, SIGN IN (green), CREATE ACCOUNT (outlined),
  "Forgot password?". The card's corners are less round than before. Error text is red. 📸
- [ ] **Forgot-password and reset-sent screens.** Same card, readable in both modes. 📸
- [ ] **Tab bar.** A solid bar (no longer slightly see-through) with a thin line above it. The
  active tab is green; the others are gray. Labels are readable in both modes. 📸
- [ ] **Search tab.** Just the green "Search" title on the app's background, now in the heaviest
  weight. 📸
- [ ] **Events on the Planner.** Colored event blocks have white text for the title, time and
  "with N others". 📸
- [ ] **Status box on Circle.** "MY STATUS" in green, the switch, and when on: the text field and
  the two pills (**All Friends** / **Close Friends**), the chosen one green. Tap the small **?**:
  a card appears over a dimmed screen. 📸 of both.
- [ ] **Ranking a vote.** In a chat with a ranked vote, the draggable rows are readable and lift
  with a shadow while dragged. 📸

### Session D: onboarding, Profile, Discover — ready

**Onboarding (tap CREATE ACCOUNT on the sign-in screen)**
- [ ] **Step one, email and password.** Green "Create Profile"-style title, gray labels, the two
  inputs, the password rules (gray, turning green as each is met), the round eye button, the green
  arrow button. Type a bad password and tap the arrow: the error under it is red. 📸
- [ ] **Step two, profile.** The initials circle (green, white letters), name and bio inputs, the
  interest chips (white or dark with a thin outline; green with white text once picked), the green
  COMPLETE PROFILE button. 📸 with two or three interests picked.
- [ ] **Saving.** Tap COMPLETE PROFILE: the button still shows its small spinner and "SAVING
  PROFILE...". This spinner is meant to stay.
- [ ] **Failed save.** Go offline and tap COMPLETE PROFILE; after the wait the button turns into a
  red outline reading TRY AGAIN. 📸

**Profile tab**
- [ ] **The whole tab.** Name in green, the gray line under it, the friends button, INTERESTS chips,
  the calendar button, and the SETTINGS card with **Dark Mode** and a red **Log Out**. Cards are
  white on the off-white background in light mode, dark gray on near-black in dark mode. 📸
- [ ] **The Dark Mode switch.** It is on when the app is dark and off when it is light, and
  flipping it changes the **whole Profile tab** at once (not just the tab bar, as in Session C).
- [ ] **Editing.** Tap the pencil badge on the photo: the name and the line under it become
  underlined inputs, the photo dims with a camera icon, and each interest chip shows a small ✕. 📸
- [ ] **Adding an interest.** Tap **+**: a rounded input and a green ADD button appear. 📸
- [ ] **Friends list.** Tap the friends button. A sheet opens with a gray hint box and the list.
  Tap a star: it fills **green** (it was amber before this ticket). Unpicked stars are gray
  outlines. 📸

**Discover tab**
- [ ] **Skeleton, not a spinner.** Open Discover. For an instant, before the cards, you see gray
  placeholder cards (a block and two bars) instead of a spinning circle. It is very brief on
  sample data; a screen recording is the way to catch it. If you can't catch it at all, say so.
- [ ] **The feed.** Green "Discover" title, gray subtitle, and two filter chips. **The chips
  changed the most:** they were dark with white text in both modes; now they are light gray with
  dark text in light mode and dark gray with light text in dark mode. 📸
- [ ] **A card.** The photo with its darkened lower half, a green tag, the title and description
  in white (in both modes), and the VIEW SPOT button: white with dark text in light mode, dark
  gray with light text in dark mode. Card corners are less round than before. 📸
- [ ] **Scrolled.** Scroll down: the small "Discover ↑" bar at the top is solid, with a thin line
  under it. 📸
- [ ] **A spot's detail sheet.** Tap VIEW SPOT: photo, round dark ✕ button, title, description,
  LOCATION and PRICE rows, and the green PLAN THIS ACTIVITY button. 📸

### Session E: Planner, create-event modal — ready

**Planner tab**
- [ ] **Week view.** Green "Planner"-style title, the gray line under it, the view button and the
  green **+** square. The week strip: today's number in a green square with white text, the rest
  in outlined squares. The hour grid with faint lines and gray hour labels, and the green "now"
  line. 📸
- [ ] **Events on the grid.** A confirmed event is a solid block in its own color with white text. A
  proposed one is a dashed outline in its color. 📸 with at least one of each if you can.
- [ ] **View menu.** Tap the view button: a small card drops down with WEEKLY VIEW / MONTHLY VIEW,
  the current one in green. 📸
- [ ] **Month view.** Month titles, weekday letters, dates; the selected date in a green rounded
  square with white text; green dots under days that have events. 📸
- [ ] **Event popup.** Tap an event: a card over a dimmed screen, with a header band in the
  event's color (white icons), the title, time, location, attendees and description in gray. 📸
- [ ] **Toast.** Try to drag a multi-day event: a small dark message appears near the bottom. It
  is **more see-through than before** (50% black instead of 80%). Say if the white text is hard
  to read over the screen behind it. 📸

**Create-event modal (tap +)**
- [ ] **Main step.** Big title field, then cards for friends, all-day, start/end, location and
  color. Cards are white on off-white (light) or dark gray on near-black (dark). 📸
- [ ] **The six colors.** The color row shows the same six as before, in the same order: green,
  blue, purple, pink, orange, yellow. The picked one has a ring and a white tick. Pick blue, save,
  and the event on the Planner is blue. 📸
- [ ] **All-day switch.** Off: gray track. On: the track takes the event's color. White thumb.
- [ ] **Save button.** With no title it is gray with dim text; with a title and a time it takes
  the event's color with white text. 📸 of both.
- [ ] **Friends step.** Search box, friend rows; a picked friend's row is green with white text
  and a white tick circle; a busy friend's row is pale red (light) or deep red (dark) with red
  text. 📸
- [ ] **Date step.** Month header with arrows, the grid of dates, the picked date in green. 📸
- [ ] **Time step.** Hour rows; the open one is green with white text and shows the minute
  buttons under it; a clashing hour is pale/deep red with a small red "conflict" badge. 📸

### Session F: Circle and the chat thread — ready

**Circle tab**
- [ ] **The list.** Green "Circle"-style title (now in the heaviest weight), the status box, the
  search box, and the conversation rows with thin dividers. Names in the main text color, the
  last message and time in gray. 📸
- [ ] **No iOS-gray leftovers.** In dark mode nothing on this tab looks bluish-gray against the
  rest of the app; the search box and rows use the same grays as the other tabs.

**Chat thread (tap a conversation)**
- [ ] **The thread.** A solid header bar with the avatar, name and gray subtitle. Your messages are
  green with white text; other people's are light gray (light) or dark gray (dark) with normal
  text. The input bar at the bottom is solid, with a rounded outlined field and the green round
  send button. The tab bar is hidden. 📸
- [ ] **Grouped bubbles.** Two messages in a row from the same person sit close together, with
  the touching corners slightly less round.
- [ ] **Event card in a chat.** A card in the event's own color with white text and avatars;
  **GOING** turns green with a **white** tick and white text when picked (it was black text on
  light green before); **NO** turns red. 📸 with GOING picked.
- [ ] **Manage Event.** Open an event's menu: a card over a dimmed screen with two pale-green
  (light) or deep-green (dark) buttons outlined in green. 📸
- [ ] **A normal vote.** A gray card with the question, option rows, and the picked option tinted
  green with its percentage in green. 📸
- [ ] **A ranked vote.** The draggable rows from Session C inside the gray card, and after voting,
  the results with the winner tinted green and ticked. 📸
- [ ] **The + menu.** Tap **+** next to the input: a sheet with outlined round icons (Vote, Ranked
  Vote, Plan Activity, Photos…) and labels in the main text color. 📸
- [ ] **Create Vote.** From the + menu: a card with a green header band and white title, the
  Normal / Ranked toggle (the picked side is a raised lighter pill), the question and option
  fields, the dashed green **Add Option** row, and the create button. 📸
- [ ] **Toast.** "Full results breakdown coming soon!" (tap **View Full Results** on a finished
  ranked vote) shows as a small dark message with white text. Same note as the Planner toast: say
  if it is hard to read.

### Whole-app pass, once every group above is ticked

- [ ] **Light mode, every tab in turn.** Planner, Discover, Search, Circle, Profile: the same
  off-white background, the same white cards, the same green, the same grays. Nothing looks like
  it belongs to a different app.
- [ ] **Dark mode, every tab in turn.** Same check: one near-black background, one dark-gray card
  color, no pure-white or pure-black panels.
- [ ] **Nothing unreadable.** In either mode, no text disappears into its background. Screenshot
  anything that does and say which screen and mode.

---

## 4.1: React Navigation migration

Not yet run. The tabs now run on React Navigation. `npm test` proves which tab shows which screen
against a stand-in for that library; everything below is what only the real library on a real
device can show.

**When to do this.** Nothing here is needed until the app can be built onto a phone or emulator.
There is no step to do before then, and the code doesn't wait on any of it. All of it, including
the install step below, is done in one sitting once a device is available.

**First, a fresh build.** The new libraries have native parts, so reloading the JavaScript is not
enough. On iOS run `cd ios && pod install`, then do a fresh build. On Android do a fresh
`npm run android`. `pod install` will change `ios/Podfile.lock`; commit that change with this
ticket.

**Screenshots wanted.** Kyson can't run the app, so this ticket's look is judged from your
screenshots. Please send one of each: the Planner tab (whole screen, bar included), the Discover
tab, the Search tab, the Circle tab, the Profile tab, and an open chat in Circle. If you have a
screenshot of any tab from before this ticket, send it alongside for comparison.

- [x] **The app builds and opens.** After the fresh build, sign in. You should see the Planner tab
  with the tab bar at the bottom, and no pink "Something went wrong" screen. *(Seen: video 2026-10-08, iPhone, dark mode.)*
- [x] **Five tabs, in order.** The bar reads Planner, Discover, Search, Circle, Profile, left to
  right. All five labels fit on one line each, none cut off. *(Seen: video 2026-10-08, iPhone, dark mode.)*
- [ ] **The icons.** Planner is a calendar. Discover is a compass (a circle with a diamond-shaped
  needle). Search is a magnifying glass. Circle is two people. Profile is one person. The tab you
  are on is green and slightly larger; the others are gray.
- [ ] **The bar looks the way it did.** Same height, same white background with a thin line above
  it, same small capital labels. The only differences from before are the fifth tab, the compass,
  and each tab being a little narrower.
- [ ] **Nothing new around the screens.** No title bar has appeared at the top of any tab, and no
  gray strip or gap has appeared above the tab bar or at the edges. The background behind each
  screen is the same off-white as before.
- [ ] **Planner, Discover, Circle and Profile show what they showed before.** Open each. The
  content is the same sample data as before this ticket, and the last items in each list can be
  scrolled clear of the tab bar.
- [ ] **Search is a placeholder.** The Search tab shows the word "Search" in large green text at
  the top left, on a white background, and nothing else.
- [ ] **A chat hides the bar.** In Circle, open any chat. The tab bar disappears. Go back to the
  chat list. The bar comes back.
- [ ] **"Plan this" from Discover.** In Discover, open an activity and tap the button that plans
  it. You land on Planner with the create-event sheet open and the activity's title filled in. The
  Planner tab is the green one.
- [ ] **Planning from a chat.** In Circle, open a chat and start a plan from it. You land on
  Planner with the create-event sheet open, and the tab bar is showing.
- [ ] **Circle after planning from a chat.** After the step above, tap Circle. You should see the
  chat list with the tab bar showing, not the chat you left.
- [x] **A fresh signup lands on Planner.** Go to Profile and sign out. Create a new account. When
  signup finishes you are on Planner, not Profile. *(Seen: video 2026-10-08, iPhone, dark mode.)*
- [x] **Sign out and back in.** From Profile, sign out. You see the sign-in screen with no tab bar.
  Sign in again. The tabs are back, on Planner. *(Reported by Kyson with a screenshot, 2026-10-09. The layout changed after doing it: `DEVICE_FINDINGS.md`, issue 2.)*
- [ ] **Android back button.** On any tab other than Planner, press the system back button. The app
  closes, as it did before; it does not jump to another tab.
- [ ] **Android, returning from the background.** With the app open on Circle, press home, open a
  few other apps, then come back to Knect. It opens without crashing.

---

## 3.2: Rules for the user tree and activities

Not yet run. The rules themselves are covered by `npm run test:rules`; these checks are the parts
only the Console and a real signup can show.

- [ ] **The new rules are live.** In the Console, **Firestore Database → Rules** shows blocks for
  `Users`, `Private_info/main`, `Free_Busy`, `Friends`, `Activity_History`, `Liked_Activities` and
  `Activities`, below the Rowy rules. The timestamp on the newest version matches the last
  `npm run rules:deploy`.
- [ ] **Signup is no longer rejected.** Run **Both documents land** under 2.2 with a new throwaway
  account. Both documents appear in the Console.

---

## 3.3: Rules for chats, messages, votes and events

Run 2026-10-02. The rules themselves are covered by `npm run test:rules`; this check is the part
only the Console can show. Nothing in the app reads or writes these collections yet.

- [x] **The new rules are live.** In the Console, **Firestore Database → Rules** shows blocks for
  `Chats` (with `Messages` and `Votes` inside it) and `Events`, and no `Calendars` block. The
  timestamp on the newest version matches the last `npm run rules:deploy`.
  *2026-10-02: the Console's rules, copied out, match `firestore.rules` at `ticket/3.3` exactly.
  The version timestamp itself wasn't looked at; the content match stands in for it.*

---

## 1.4: Onboarding sequence

Not yet run. Sign up from scratch on a real Android device or emulator.

**Screenshots wanted.** Kyson can't run the app, so this ticket's look is judged from your
screenshots. Please send one of each: the login screen, the email/password step (empty, then with
the password partly typed), the profile step (with no name, then with a name and a few interests
picked), the button while saving, the TRY AGAIN state, and the "Email already in use" message.

**Before you start:** in the Firebase Console, check **Authentication → Settings → Password policy**
is set to: minimum 8, maximum 24 characters, require an uppercase letter, require a number. If it
says anything else, write down what it says. The app and the Console have to match.

**The two steps**
- [x] **One step at a time.** Tap **CREATE ACCOUNT**. Only the email and password step shows. Fill it
  in, tap the **→** arrow. The email and password step is **gone**, not just scrolled away, and only the
  profile step shows. *(Seen: video 2026-10-08, iPhone, dark mode.)*
- [ ] **Back fixes a typo.** On the profile step tap the **←** arrow. The email you typed is still there.
  Change it, tap the **→** arrow, finish signing up. In the Console, Authentication shows the **changed**
  email.
- [ ] **Back locks once the account exists.** Go offline, reach the profile step, tap **COMPLETE
  PROFILE**, wait for **TRY AGAIN**. The **←** arrow is grayed out and does nothing when tapped.

- [x] **No Google or Apple buttons.** The login screen has no Google or Apple button and no "OR"
  line. (Hidden until ticket 1.3.) *(Seen: video 2026-10-08, iPhone, dark mode.)*

**Password rule**
- [ ] **Show/hide password.** Inside the right end of the password field there's a plain eye icon.
  Tapping it shows what you typed; tapping again hides it.
- [x] **Requirements show up front.** Before typing anything, the password field shows
  *8–24 characters*, *A capital letter* and *A number* underneath it. Each one turns green as you
  meet it. *(Seen: video 2026-10-08, iPhone, dark mode.)*
- [ ] **Accepted and rejected.** `Passw0rd` moves on to the profile step. Each of these stays on the
  first step and shows *"Password must be at least 8 characters and include a capital letter and a
  number"*: `Passw0r`, `password1`, `Password`, and a 25-character one like `Passw0rdPassw0rdPassw0rdP`.
- [ ] **Firebase agrees.** Finish a signup with `Passw0rd`. The account is created. If instead the
  password message appears after tapping **COMPLETE PROFILE**, the Console policy and the app disagree:
  note what the Console says.
- [ ] **Sign-in isn't checked.** On the login screen, sign in to any existing account. No password
  rule message appears before the sign-in attempt.

**Profile step**
- [ ] **Picture from your name.** With the name empty, the circle shows a plain person icon. Type a
  name: the circle shows its initials and updates as you type (`Alex` → **A**, `Alex Rivera` → **AR**).
  There's no camera button and nothing happens when you tap the circle.
- [ ] **Bio is optional.** With a name and no bio, **COMPLETE PROFILE** can be tapped. With no name,
  it can't.
- [ ] **Interests.** There are exactly 35 options to tap, no text box to type your own. Tapping one
  turns it green, tapping again turns it back. Pick `Board games` and `Musicals & Theater`, finish
  signing up. In the Console, `Users/{uid}` → `interests` is exactly `Board games`,
  `Musicals & Theater`, **not** in capitals.
- [ ] **No interests is fine.** Sign up with none picked. It lands in the app, and `interests` in the
  Console is an empty list.
- [ ] **Bio saved.** The bio you typed is in `Users/{uid}` → `profile_info`. `profile_picture_url`
  is empty (`""`).

**Loading and errors**
- [x] **Spinner.** Tap **COMPLETE PROFILE**. The button shows a spinning indicator with **SAVING
  PROFILE...** until it lands in the app. *(Seen: video 2026-10-08, iPhone, dark mode.)*
- [ ] **Email already in use.** Sign up with an email that already has an account. You're taken back
  to the email step, the message *"Email already in use"* is under the email, and you are **not**
  thrown back to the login screen. Change the email and finish: it works.
- [x] **Lands on Planner.** A finished signup opens the app on the **Planner** tab. *(Seen: video 2026-10-08, iPhone, dark mode.)*

**Coming back after a failed save**
- [ ] **Resumes at the profile step.** Go offline, sign up, tap **COMPLETE PROFILE**, wait for **TRY
  AGAIN**, tap it, wait again. You're signed out with the explanation. Go online and sign in with the
  same email and password. You land on the **profile step** (name, bio, interests), with no email or
  password step and no **←** arrow. Finish it: the app opens, and the Console shows one account, now
  with a `Users` document.

**Not checkable yet:** the Google/Apple path (arriving with or without a name) can't be tried on a
device until ticket 1.3 is built. It's covered by automated tests only.

---

## 2.3: Signup states and missing-profile detection

Not yet run.

**Creating an account**
- [ ] **Saving state.** Create an account and tap **COMPLETE PROFILE**. The button reads
  **SAVING PROFILE...** and can't be tapped again until it finishes.
- [ ] **Rapid taps.** Tap **COMPLETE PROFILE** several times as fast as you can. In the Console there
  is exactly **one** new user in Authentication and exactly **one** `Users` document for their UID
  (with a `Private_info/main` document inside it).
- [ ] **Lands on Planner.** After a successful signup the app opens on the **Planner** tab, and both
  documents already exist in the Console.
- [ ] **Lands on Planner after a logout.** Sign in, switch to the **Profile** tab, log out, then create a
  new account. It lands on **Planner**, not Profile.

**When saving fails**
- [ ] **Offline doesn't hang.** Go offline, then tap **COMPLETE PROFILE**. Within about **15 seconds**
  the button gets a red outline and reads **TRY AGAIN**, and everything you typed is still there.
  *Also note how long it took:* if it failed straight away instead of after ~15 seconds, still tick it
  but write that down. The code assumes an offline save waits rather than failing, and this is
  how we find out.
- [ ] **Retry works.** From the **TRY AGAIN** state, go back online and tap it. The app lands on
  **Planner**. The Console shows one account and one `Users` document.
- [ ] **Edited email isn't saved.** Fail once while offline, change the email field, go back online,
  tap **TRY AGAIN**. In the Console, `Private_info/main` → `email` is the **original** email, the same
  one shown in Authentication.
- [ ] **Two failures sign you out.** Stay offline: tap **COMPLETE PROFILE**, wait for **TRY AGAIN**, tap
  it, wait again. You're returned to the login screen with the message *"Your account was created,
  but saving your profile failed…"*. In the Console the account **still exists** in Authentication,
  with **no** `Users` document.

**Signing in without a profile**
- [ ] **Caught on sign-in.** Sign in as the account from the previous check (online). You see the
  create-profile screen, not the app.
- [ ] **Recovering saves to the same account.** On that screen, fill in the form. (Since 1.4 it opens
  on the profile step; there's no email or password step.) Tap **COMPLETE PROFILE**. The app
  lands on **Planner**. In the Console that account now has a `Users` document, `Private_info/main` →
  `email` matches the account's email, and **no second account** appeared in Authentication.
- [ ] **Closing the app mid-signup.** Go offline, create an account, tap **COMPLETE PROFILE**, wait for
  **TRY AGAIN**, then fully close the app. Go online and reopen it. You see the create-profile screen.
  Completing it lands on Planner with no second account created.
- [ ] **Deleted profile.** In the Console, delete a test user's `Users/{uid}` document, then sign in
  as them. You see the create-profile screen, not the app.
- [ ] **Existing profile.** Sign in as a user whose `Users` document exists. The app opens normally.

**Opening the app**
- [ ] **No flash on startup.** While signed in, fully close and reopen the app. You see the "Kn"
  logo (a spinner before ticket 4.2), then the app. The login or signup screen **never** flashes up, even briefly.
- [ ] **Offline startup, returning user.** Use an account that has already opened the app on this
  device before. Go offline and reopen the app. It should reach the app, using the copy of the
  profile saved on the device.
  *If it sits on the logo forever, report it: the code assumes this works.* (Accepted and
  expected: a user whose profile was **never** loaded on this device will sit on the logo while
  offline until they reopen the app online.)

**Nothing extra written**
- [ ] **Sign-in never writes.** Signing in (with or without a profile) creates no documents in
  Firestore. Only tapping **COMPLETE PROFILE** does.

---

## 2.2: Writing the Users documents at signup

Not yet run.

- [ ] **Both documents land.** After a successful signup, the Console shows `Users/{uid}` and
  `Users/{uid}/Private_info/main` for the new account's UID.
  This needs ticket 3.2's rules to be live (see **The new rules are live** under 3.2). Before
  that deploy the live rules only let `ADMIN`/`OWNER` accounts write, and an ordinary signup's
  write is rejected.
- [ ] **They land together offline.** Covered by the **Offline doesn't hang** and **Retry works**
  checks under 2.3: after an offline attempt, either both documents exist or neither does.

## 1.2: Real sign-in

Not yet run.

- [x] **Sign-in reaches the app.** Signing in with a real account opens the app (the tab tree). *(Seen: video 2026-10-08, iPhone, dark mode.)*
