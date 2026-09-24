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
- Known, unrelated: switching to some tabs crashes the app (ticket 0.1). That isn't a failure of
  any check below. Stay on the Planner tab unless a check says otherwise.

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
- [ ] **Recovering saves to the same account.** On that screen, fill in the form. The first step asks
  for an email and password again: type anything valid, it's ignored. Tap **COMPLETE PROFILE**. The app
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
