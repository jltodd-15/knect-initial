# Device tests

Checks that can only be done by running the app on a real device or emulator, with the Firebase
Console open. The automated tests (`npm test`) use a fake Firebase, so they can't prove that the
real one behaves as expected, that the Console shows the right data, or that screens look right.

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

## 4.2: Theme, tokens, shared components and the full sweep

Not yet run, and not finished: the sweep lands a few screens at a time. Each group below says
which session of the ticket it belongs to. Only the groups marked **ready** can be checked yet.

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

### Session E: Planner, create-event modal — not built yet

### Session F: Circle and the chat thread — not built yet

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

- [ ] **The app builds and opens.** After the fresh build, sign in. You should see the Planner tab
  with the tab bar at the bottom, and no pink "Something went wrong" screen.
- [ ] **Five tabs, in order.** The bar reads Planner, Discover, Search, Circle, Profile, left to
  right. All five labels fit on one line each, none cut off.
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
- [ ] **A fresh signup lands on Planner.** Go to Profile and sign out. Create a new account. When
  signup finishes you are on Planner, not Profile.
- [ ] **Sign out and back in.** From Profile, sign out. You see the sign-in screen with no tab bar.
  Sign in again. The tabs are back, on Planner.
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
- [ ] **One step at a time.** Tap **CREATE ACCOUNT**. Only the email and password step shows. Fill it
  in, tap the **→** arrow. The email and password step is **gone**, not just scrolled away, and only the
  profile step shows.
- [ ] **Back fixes a typo.** On the profile step tap the **←** arrow. The email you typed is still there.
  Change it, tap the **→** arrow, finish signing up. In the Console, Authentication shows the **changed**
  email.
- [ ] **Back locks once the account exists.** Go offline, reach the profile step, tap **COMPLETE
  PROFILE**, wait for **TRY AGAIN**. The **←** arrow is grayed out and does nothing when tapped.

- [ ] **No Google or Apple buttons.** The login screen has no Google or Apple button and no "OR"
  line. (Hidden until ticket 1.3.)

**Password rule**
- [ ] **Show/hide password.** Inside the right end of the password field there's a plain eye icon.
  Tapping it shows what you typed; tapping again hides it.
- [ ] **Requirements show up front.** Before typing anything, the password field shows
  *8–24 characters*, *A capital letter* and *A number* underneath it. Each one turns green as you
  meet it.
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
- [ ] **Spinner.** Tap **COMPLETE PROFILE**. The button shows a spinning indicator with **SAVING
  PROFILE...** until it lands in the app.
- [ ] **Email already in use.** Sign up with an email that already has an account. You're taken back
  to the email step, the message *"Email already in use"* is under the email, and you are **not**
  thrown back to the login screen. Change the email and finish: it works.
- [ ] **Lands on Planner.** A finished signup opens the app on the **Planner** tab.

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

- [ ] **Sign-in reaches the app.** Signing in with a real account opens the app (the tab tree).
