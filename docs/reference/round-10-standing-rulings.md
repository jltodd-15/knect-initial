# Round 10 — Standing Rulings (2026-09-03)

**Status:** Kyson's rulings from the Project 1 edit-pass session — **three passes, all 2026-09-03.** Part B covers the second and third. **Not folded into `Knect_Decision_Log.md` yet** — same holding pattern as the Project 16 ledger, and for the same reason: nothing should be lost between sessions.

**Folds into the Decision Log as Part 14** at the next Decision Log edit.

**🔴 Read this alongside the Decision Log.** Several rulings below are app-wide, and ruling 1 lifts a constraint that appears in several existing tickets.

---

## 1. ✅ Jonathan's uncommitted work is no longer a constraint — anywhere

Jonathan has signed off on Claude Code making all the edits, and he is helping run that process.

**What this supersedes.** Round 6 treated his uncommitted work as "discardable," which was a judgment about value. This is stronger and different: it is no longer a *reason to avoid touching a file at all*. Several documents currently tell a session to stop and ask him before editing something, and that instruction is now stale:

- `Knect_Project_0_1_Repair_Boot_Path.md` — out of scope, `CreateProfilePage.tsx`: *"Leave it alone… Ask him before touching it."* The file stays out of **0.1** on scope grounds, but not for that reason.
- Decision Log Round 6 — *"`CreateProfilePage`'s out-of-scope reasoning weakens but the file still stays out of 0.1."*
- Round 3 (D6/D7/D8) — *"hold until they can be walked through with Jonathan against the actual code."* See ruling 3.

**The general form:** where a ticket says leave a file alone, that is now a **scope boundary**, not a stay-off-the-grass warning. Scope boundaries still hold.

**Propagate to:** 0.1, the Decision Log Round 3 and Round 6, `START_HERE`'s "Open, waiting on people."

---

## 2. ✅ The signup credential handoff — option (a)

`CreateProfilePage` passes the email and password up through `onComplete`. Closes the 🔴 blocker raised against **1.2**.

Applied in **1.2**, deliberately narrow: the `Props.onComplete` type and the call at `CreateProfilePage.tsx:206`, and nothing else in that file. **1.3** owns the rest of the screen.

---

## 3. ✅ D7 (onboarding) becomes ticket 1.3

*"Since it has nowhere else."* D7 was held pending Jonathan; ruling 1 lifts that hold.

**One consequence worth carrying:** 1.3's number is a home, not a build position. It hands a payload to a `Users` write that **Project 2** owns, so its build order is after Project 2. Numbering it inside Project 1 would otherwise read as a dependency cycle. Doc order and implementation order are already two separate lists in the Running Order.

**Propagate to:** Running Order Wave 5 and "Held pending Jonathan"; `START_HERE`'s "Open, waiting on people." **D6 (own-profile) and D8 (settings / logout / account deletion) are still outlines** — ruling 1 unblocks them but nothing has scheduled them, and D8 carries the App Store account-deletion requirement.

---

## 4. ✅ Auth scope for MVP — three answers

| Question | Ruling | Lands in |
|---|---|---|
| Email verification | **Out** for MVP | 1.2, explicitly out of scope |
| Password reset | **In** — Firebase sends and hosts it (`sendPasswordResetEmail`) | 1.2, greenfield UI |
| Google and Apple sign-in | **In** — people can create *and* sign in with both | `*1.4`, new ticket |

**Two consequences of the third one, neither optional:**

- **App Store Guideline 4.8** means Google without an equivalent private option is a rejection. Sign in with Apple qualifies, so the two providers ship together rather than in sequence. `*1.4` is starred for this reason.
- **Sign in with Apple needs iOS, and there is no iOS Firebase integration.** "iOS Firebase setup" has been an unowned item since Round 6; it is now on the critical path. **It needs an owner and a number.**

---

## 5. ✅ Firebase Analytics is in

Installed in **1.1** (`@react-native-firebase/analytics`; `firebase-analytics` was already declared at `android/app/build.gradle:119`).

**Two things this does not settle, both now unowned:**

- `[DECISION: what gets logged?]` Installing the SDK is not an analytics plan. Nothing owns event naming, screen tracking or user properties — so a later screen ticket will invent a taxonomy unless one exists first.
- `ios/AwesomeProject/PrivacyInfo.xcprivacy` declares `NSPrivacyCollectedDataTypes` as empty and `NSPrivacyTracking` as `false`. Analytics makes both inaccurate, and an inaccurate manifest is rejected at upload. Belongs to the iOS setup ticket.

---

## 6. ✅ J6 resolved — the public repo is deliberate

Kyson: it has to be cloneable so collaborators can reach it; sharing keys was a problem without an enterprise plan.

**Three things worth separating, because they are not one risk:**

1. `android/app/google-services.json` is a **client** config, not a secret. It ships inside every APK and is designed to be readable. What stands between it and abuse is the security rules — **Project 3**, which this makes more load-bearing rather than less.
2. `.env.local`'s live `GEMINI_API_KEY` **is** a real secret and a different problem. 0.1 deletes the file, which does not remove the value from history at commit `71a7c07`. **The key still has to be revoked by hand**, and a public repo makes that urgent rather than tidy.
3. **Correction to the J6 entry:** no `.gitignore` pattern matches `google-services.json`, so "committed despite `.gitignore` patterns that should have excluded it" is not accurate — it was simply never ignored. The patterns that *do* matter are `.gitignore:78–79` (`*firebase*`, `*firestore*`), which silently exclude RNFirebase's `firebase.json` and Project 3's `firestore.rules` and `firestore.indexes.json`. Verified with `git check-ignore`. **1.1 fixes them.**

---

## 7. ✅ Project 2 owns the Firestore offline-persistence module

Closes the ownership gap flagged in this session. Round 9 ruled persistence ON at the default cache size "in one Firestore config module" and propagated it to Project 0 — a conventions doc, which writes no code. **Project 2's edit-pass session has to pick this up**, along with `@react-native-firebase/firestore`, which 1.1 deliberately does not install.

---

## 8. ✅ Review convention — no `(r)` on the split tickets

Kyson skim-reviews sub-tickets as they land and reviews starred ones properly. The Edit Pass Brief's filename format (`Knect_Project_<n>_<n>_<Title>.md`, no `(r)`) stands, and the `(r)` convention is not applied to edit-pass output.

**Reviewed 2026-09-03:** 1.1 and 1.2 (skim). **1.3 and `*1.4` are new and unreviewed** — `*1.4` is starred and wants a real read.

**Still ambiguous elsewhere:** `START_HERE` flags that 16.1, 16.2, 17.1 and 17.2 are drafted, unreviewed, and unmarked. This ruling covers naming, not those four.


---

# Part B — second ruling pass, same day

## 9. ✅ Ticket numbering settled

`*1.3` is **Google & Apple Sign-In**; `1.4` is the **Onboarding Sequence**. Switched from the first pass so the numbers match build order — onboarding has to know both entry paths, so social lands first.

**Onboarding may still move into Project 2.** Kyson's lean, and it fits the dependency: it hands a payload to a write Project 2 owns. **Deliberately deferred to Project 2's edit-pass session**, because that is where Project 2's own children get numbered — creating a `2.x` now, before Project 2 is split, is exactly the collision restructure plan §4 warns about with 13 and 15.

## 10. ✅ Two new tickets outside Project 1

- **0.2 — iOS Firebase & Xcode Project Setup.** Written. Unowned since Round 6; `*1.3` turned it into a hard blocker. Numbered into the 0.x lane because it is environment work in the same shape as 0.1.
- **D11 — Analytics Event Taxonomy & Instrumentation.** Placeholder only. **Not** 0.2 or 1.5: you cannot instrument screens that do not exist, so it belongs late. Numbered into the existing D-series.

## 11. ✅ Onboarding rulings

| Question | Ruling |
|---|---|
| Interests | **A fixed list of 35**, written out in 1.4. Free text rejected — it fragments the vocabulary 13.1 searches and 13.2 scores |
| Profile picture | **Mandatory**, with an initials avatar as the floor — **rendered on-device from the name, no image generated or uploaded**, so onboarding gains no Storage dependency. **Closes O16** |
| Failed profile write | **Retry, then sign the user out** |

**Two consequences that need owners, neither of them obvious from the rulings themselves:**

1. 🔴 **The 35 interest strings and `Activities.tags` have to be one vocabulary.** 13.2 seeds `tag_affinity_scores` at +10 per interest and matches them against activity tags. `"Board games"` against a seeded `"boardgames"` scores nothing — and nothing looks broken, every user's affinity just starts empty. **Project 9 writes the tags, so Project 9's session has to adopt this list**, or normalization needs a home. Note this is a *third* vocabulary alongside `Activities.tags` and O17's 15–20 `category` values.
2. ⚠️ **Sign-out does not free the email.** After a failed profile write the Auth account survives, so signing up again fails with `email-already-in-use` and signing *in* lands an authenticated user with no `Users` document. **The app needs one more rule: an authenticated user with no profile document is routed back into onboarding.** Project 2 owns detection, 1.4 owns the routing. Without it, "sign out" is a trap rather than a recovery.

## 12. ✅ Provider collision — prompt for the password and link, and email enumeration protection goes OFF

Recognize the collision, ask for the existing password, sign in, then `linkWithCredential`. Afterwards either method works.

**Email enumeration protection is turned off** to make that flow possible. Firebase enables it by default on newer projects and it deliberately breaks the lookup the flow depends on.

**The accepted cost:** with it off, Firebase's auth errors distinguish "this email has an account" from "it doesn't," so anyone can probe the API to learn whether an address is registered. Taken deliberately, in exchange for not stranding users who signed up one way and came back another.

⚠️ **One consequence lands in 1.2.** `sendPasswordResetEmail` now throws `auth/user-not-found` for an unknown address instead of quietly succeeding. The rule is unchanged — the reset screen shows the same confirmation either way — but **the app has to catch that error and show the confirmation anyway** rather than getting the behavior free from Firebase.

## 13. ✅ Apple button hidden on Android

No web flow, no disabled state. Guideline 4.8 is Apple's requirement for the iOS app; Android gets Google and email/password.

## 14. ✅ `GEMINI_API_KEY` revoked

Confirmed by Kyson 2026-09-03. **That exposure is closed.** 0.1 still deletes `.env.local` and `.env.example`; the value stays reachable in history at `71a7c07` but is now inert.

## 15. 📌 Clarification, not a ruling — "cancelled" is about the provider sheet only

Worth recording because it read as broader than it is. **Cancelled** in `*1.3` means: the user tapped Google or Apple, the system sheet opened, and they backed out. That is not an error and shows no error text. **It has nothing to do with the email/password form** — a mistyped email or password still shows its error, exactly as 1.2 specifies. There is no password typed in the provider flow at all.

---

## 16. ✅ Deferring `*1.3`, and the 0.2 / `*1.3` split

**These two have very different costs and should not be deferred together.**

- **0.2 needs no paid Apple account.** A free Apple ID covers the simulator and running on a personal device (7-day provisioning). It should happen early.
- **`*1.3` needs the paid membership** (~$99/yr) for the Sign in with Apple capability. It is the only part of Project 1 that costs money, and deferring it is reasonable.

**What deferring `*1.3` costs:** nothing else in the roadmap breaks — Projects 2 through 21 never touch it. There is no App Review problem while it is deferred, because Guideline 4.8 only applies once a third-party login is offered at all; **Google and Apple ship together or neither ships.** 1.4 is the only ticket affected, and the workaround is to build its sequence so it accepts a pre-filled identity even while email/password is the only thing supplying one.

**Why 0.2 should not wait.** Every ticket after it is verified on a device, and today the only device this project can build to is Android. Working Android-only means iOS breakage accumulates silently and arrives all at once. Already visible in the tree: `'Anonymous Pro'` and `'Inter'` are referenced across the screens, **there are no font files in the repo and no asset-link config**, so both platforms are quietly falling back to system fonts — and font linking is per-platform work.

---

## Still needing an answer

- **Xcode on the Mac** — confirm it's installed; 0.2 needs it and nothing else does.
- **The paid Apple Developer membership** — only gates `*1.3` and launch.
- **The password rule** — three live answers (1.4).
- **`keyChain`** — delete or leave dormant (1.2).
- **The remaining auth error copy** (1.2).

---

## Still open after this round

- **Master Schema Q1** (`name_lowercase`), **Q4** (`category`), **Q7** (🔴 the `rsvps` lock — blocks 16.2), **Q8's sub-decision**, **Q9** (Vote `status`).
- **17's stale-ballot rule.**
- **The password rule** — three live answers in `CreateProfilePage.tsx` and the original ticket. **1.4.**
- **`keyChain`** — delete it or leave it dormant. **1.2.**
- **Content reporting** (13.3, deferred) and **published contact information** — both still gate App Review.
