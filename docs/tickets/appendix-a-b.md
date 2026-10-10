# Appendix A & B — Design Tokens and Shared Components

**Status:** Draft 2026-08-25. **Accepted by Kyson 2026-10-07** — values may still be adjusted once the app can be seen on a device. Built into code by **4.2**.
**Depends on:** Project 0. **Blocks:** the UI section of every ticket.

> Tickets reference token and component **names**, never hex values or re-descriptions. If a ticket needs a color that isn't named here, the token doesn't exist yet and gets added here first.

---

# Appendix A — Design Tokens

Almost everything below is **extracted from the existing code**, not invented — these are the values the app has actually been using. Where I've proposed something new (a dark-mode counterpart that never existed, mostly), it's marked 🆕 so you know which values have never been looked at on a screen.

## A.1 — How dark mode works

**Current state, and it's broken in two ways.** `App.tsx` holds `const [isDarkMode, setIsDarkMode] = useState(false)`, drilled down as a prop, with each component calling `getStyles(isDarkMode)`. So:

1. **`useColorScheme` is never called.** The system light/dark setting is ignored completely.
2. **The choice isn't persisted.** It's component state — it resets to light on every app launch.

**The mechanism:**

- Default to the **system preference** via `useColorScheme()`.
- An override persists to AsyncStorage and is read on launch.
- Theme is read from **one Context hook** (`useTheme()`), not drilled as a prop through every component.
- **For now, the Profile tab's existing switch sets Light or Dark** (4.2). A three-state System / Light / Dark control — so someone can go back to "follow my phone" — is **D6's**, with the rest of the Profile tab.

## A.2 — Color tokens

| Token | Light | Dark | Notes |
|---|---|---|---|
| `primary` | `#10b981` | `#10b981` | emerald-500. 87 uses. **Not emerald-600** — sweep the docs. Also the Close Friends star |
| `primary-pressed` | `#059669` | `#059669` | emerald-600. 🆕 Gives us a pressed state we don't currently have |
| `primary-surface` | `#ecfdf5` | `#064e3b` | emerald-50 / emerald-900. Both already in use |
| `on-primary` | `#FFFFFF` | `#FFFFFF` | Text on a primary button |
| `danger` | `#ef4444` | `#ef4444` | red-500. Unfriend, block, error icon, notification badge |
| `danger-surface` | `#fee2e2` | `#450a0a` | red-100 / 🆕 red-950 — the dark counterpart has never been on a screen |
| `background` | `#FDFCFB` | `#121212` | App background. The light value is a warm off-white, deliberate, 12 uses |
| `surface` | `#FFFFFF` | `#1E1E1E` | Cards, sheets, the activity card body |
| `surface-alt` | `#f4f4f5` | `#27272a` | zinc-100 / zinc-800. Inset areas, skeleton loaders, chat bubbles |
| `border` | `#e4e4e7` | `#3f3f46` | zinc-200 / 🆕 zinc-700 |
| `text-primary` | `#27272a` | `#f4f4f5` | zinc-800 / zinc-100 |
| `text-secondary` | `#71717a` | `#a1a1aa` | zinc-500 / zinc-400. Descriptions, timestamps, the chat subtitle |
| `text-disabled` | `#a1a1aa` | `#52525b` | zinc-400 / zinc-600. Also the "Sent" / "Requested" button state |
| `placeholder` | `#a1a1aa` | `#52525b` | Replaces the hardcoded `#999` / `#666` currently inline in `App.tsx` and `CreateProfilePage.tsx` |

**Being retired:** the iOS system grays — `#8e8e93`, `#1c1c1e`, `#2c2c2e`, `#f2f2f7`, 22 usages total. **4.2's full sweep removes them.**

**Event colors are a separate palette, not theme tokens.** `#3b82f6` (blue-500) turned out to be one of six colors a user picks for an event in `CreateEventModal.tsx` — `#10b981`, `#3b82f6`, `#8b5cf6`, `#ec4899`, `#f97316`, `#eab308` — and the chosen value is stored on the event. They live in `theme/tokens.ts` as `eventColors`, unchanged and the same in light and dark. Kept.

**Stray off-palette colors** (`#dc2626`, `#fca5a5`, `#fef2f2`, `#ff8080`, `#4ade80`, and the amber star `#fbbf24`) fold into `danger`, `danger-surface` and `primary`.

## A.3 — Type scale

Extracted by frequency. The app is already close to a clean scale — this just names it and drops the one-off sizes (9, 11, 13, 15, 17, 18, 22).

| Token | Size | Weight | Used for |
|---|---|---|---|
| `display` | 32 | 900 | Screen headers — "Discover", "Search" |
| `title` | 24 | 700 | Activity name on the detail page, section headers |
| `headline` | 20 | 700 | Activity card name, chat name |
| `body` | 16 | 400 | Descriptions, message text, input fields |
| `label` | 14 | 600 | Buttons, tab labels, tag chips |
| `caption` | 12 | 400 | Timestamps, cost strings, helper text |
| `micro` | 10 | 600 | Badge numbers, the notification count |

*Note:* `fontWeight: '900'` appears 49 times, which is heavier than most apps use. Kept for `display` because it's clearly the intended look, and pulled back to 700 below that — 900 on a 16pt body line is where it starts to read as shouty rather than confident.

## A.4 — Spacing

4pt grid. These are already the dominant values in the code (16, 8, 12, 24, 4, 20, 32) — nothing here is new.

`xs: 4` · `sm: 8` · `md: 12` · `base: 16` · `lg: 20` · `xl: 24` · `2xl: 32`

## A.5 — Radius

`sm: 8` · `md: 12` · `lg: 16` · `xl: 24` · `pill: 999`

Extracted from actual usage (24, 16, 12, 8 are the top four). `pill: 999` replaces the ad-hoc `40` and `60` currently used for avatars and rounded buttons.

## A.6 — Where this lives in code

- `theme/tokens.ts` — the values above, as a typed object with `light` and `dark` variants, plus `eventColors`.
- `theme/ThemeProvider.tsx` — Context provider, reads system preference plus the persisted override.
- `theme/useTheme.ts` — the hook every component calls.

**No component takes an `isDarkMode` prop.** That pattern is what produced the current situation where each file re-derives its own styles and the grays drift apart.

---

# Appendix B — Shared Components

At least five tickets currently say "use the same error state as before" or "same as the activity card." That only works once the component is defined once and has a name. These are the names.

Each of these is a **real component in `components/shared/`**, not a description to re-implement per screen. **4.2 builds `ErrorState`, `SkeletonCard` and `EmptyState`;** the rest are built by the first ticket that needs them.

| Component | Currently described in | Used by | What it is |
|---|---|---|---|
| `<ErrorState />` | 6, 8, 11, 12, 13.1 | Nearly every screen | Circle with `!` inside, in `danger`, plus a message. Message text is a prop. Default copy: "Sorry, we couldn't load anything right now." |
| `<SkeletonCard />` | 11, 13.1, 15.1 | 4.3, 4.4, 11, 13.1, 15.1 | Grayed-out placeholder in `surface-alt`. Takes a shape variant: `activity` (image block + two text lines) or `list-row` (avatar circle + two text lines). **App-wide standard per 15.1 — never a spinner.** Two exceptions, ruled 2026-10-07: the launch-time waits show the "Kn" logo, and a button's own submitting spinner stays |
| `<ActivityCard />` | 8 §3 (being moved to 11) | 11, 12, 16 | The feed card. Height deliberately just under the screen so the next card peeks. Category illustration on top, `surface` on the bottom 2/5, name in `headline`, description in `caption` with ellipsis, cost string to the side, heart bottom-right |
| `<TagChip />` | 12 ("same as profile page") | 12, 13.3, Profile | `pill` radius, `surface-alt` background, `label` type. Horizontally scrolling when they overflow |
| `<FriendActionButton />` | 4 §3.2 **and** 5 §5, with different copy | 5, 7 | Four states — see below. **Project 4's copy is canonical** |
| `<ProfileHeader />` | 7 | 7, Profile tab | Picture, name, bio, interests. Same block on your own profile and a public one; the action slot differs |
| `<EmptyState />` | 11, 13.1, 15.1 | Several | Distinct from `ErrorState` — nothing is broken, there's just nothing here. Message plus an optional action button |

## B.1 — `<FriendActionButton />` states

Three tickets currently describe this button with three different sets of copy. This is the one set.

| State | Copy | Style |
|---|---|---|
| Not friends | "Send a Friend Request" | `primary` bg, `on-primary` text |
| Request sent | "Sent" | `text-disabled` bg, `text-secondary` text. Disabled |
| Request received | "Accept Request" + "Decline" | Two buttons: `primary`, and `danger` |
| Already friends | "Unfriend" | `danger` bg, `on-primary` text |
| Blocked (viewer is the blocker) | "Unblock" | `surface-alt` bg, `text-primary` text |

**Failure behavior:** the button updates optimistically and reverts on write failure, matching the heart-icon rule in Project 11. Projects 4, 5, and 7 currently don't specify this at all.

## B.2 — Error vs. empty — the distinction tickets keep blurring

Worth stating once, because several tickets use the same visual for both and they aren't the same thing:

- **`ErrorState`** — something went wrong. Lost connection, failed query, missing document. The circle-and-`!` visual, and a retry affordance where retrying makes sense.
- **`EmptyState`** — nothing went wrong, there's just nothing to show. No search results, end of the feed, no conversations yet. No error icon, no alarm, and usually a suggested action ("Find a friend").

Project 11 currently uses the error visual for both "no internet" and "you've reached the end of the activities," which tells a user something is broken when they've simply scrolled to the bottom.
