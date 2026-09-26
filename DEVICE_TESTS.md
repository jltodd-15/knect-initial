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
- [ ] **No flash on startup.** While signed in, fully close and reopen the app. You see a loading
  spinner, then the app. The login or signup screen **never** flashes up, even briefly.
- [ ] **Offline startup, returning user.** Use an account that has already opened the app on this
  device before. Go offline and reopen the app. It should reach the app, using the copy of the
  profile saved on the device.
  *If it sits on the spinner forever, report it: the code assumes this works.* (Accepted and
  expected: a user whose profile was **never** loaded on this device will sit on the spinner while
  offline until they reopen the app online.)

**Nothing extra written**
- [ ] **Sign-in never writes.** Signing in (with or without a profile) creates no documents in
  Firestore. Only tapping **COMPLETE PROFILE** does.

---

## 2.2: Writing the Users documents at signup

Not yet run.

- [ ] **Both documents land.** After a successful signup, the Console shows `Users/{uid}` and
  `Users/{uid}/Private_info/main` for the new account's UID.
- [ ] **They land together offline.** Covered by the **Offline doesn't hang** and **Retry works**
  checks under 2.3: after an offline attempt, either both documents exist or neither does.

## 1.2: Real sign-in

Not yet run.

- [ ] **Sign-in reaches the app.** Signing in with a real account opens the app (the tab tree).
