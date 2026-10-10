# Appendix A & B — Design Tokens and Shared Components

**Status:** Draft 2026-08-25. **Accepted by Kyson 2026-10-07.** **Updated 2026-10-09 to match the redesign's final token sheet** (`docs/design/tokens.json` and `docs/design/brand/TokenSheet`). Values may still be adjusted once the app can be seen on a device. Built into code by **4.2**.
**Depends on:** Project 0. **Blocks:** the UI section of every ticket.

> Tickets reference token and component **names**, never hex values or re-descriptions. If a ticket needs a color that isn't named here, the token doesn't exist yet and gets added here first.
>
> **`docs/design/tokens.json` is the machine-readable copy of this appendix.** If the two ever disagree, stop and ask Kyson rather than picking one.

---

# Appendix A — Design Tokens

Most values were **extracted from the existing code**. Tokens marked 🆕 were proposed before any screen existed. Tokens marked ➕ were added by the 2026-10-09 redesign.

## A.1 — How dark mode works

**Current state, and it's broken in two ways.** `App.tsx` holds `const [isDarkMode, setIsDarkMode] = useState(false)`, drilled down as a prop, with each component calling `getStyles(isDarkMode)`. So:

1. **`useColorScheme` is never called.** The system light/dark setting is ignored completely.
2. **The choice isn't persisted.** It's component state — it resets to light on every app launch.

**The mechanism:**

- Default to the **system preference** via `useColorScheme()`.
- An override persists to AsyncStorage and is read on launch.
- Theme is read from **one Context hook** (`useTheme()`), not drilled as a prop through every component.
- **For now, the Profile tab's existing switch sets Light or Dark** (4.2). A three-state System / Light / Dark control — so someone can go back to "follow my phone" — is **D6's**, with the rest of the Profile tab.

**Light mode has no separate boards.** Every design board is drawn dark. A screen built from token names gets its light version from the Light column below.

## A.2 — Color tokens

| Token | Light | Dark | Notes |
|---|---|---|---|
| `primary` | `#10b981` | `#10b981` | emerald-500. **Not emerald-600** |
| `primary-pressed` | `#059669` | `#059669` | emerald-600. 🆕 |
| `primary-surface` | `#ecfdf5` | `#064e3b` | emerald-50 / emerald-900 |
| `on-primary` | `#052e22` | `#052e22` | ✏️ **Changed 2026-10-09 from `#FFFFFF`.** White on emerald is 2.54:1 and fails contrast; `#052e22` is 5.83:1 |
| `danger` | `#ef4444` | `#ef4444` | red-500. Destructive fills, error icon, badge |
| `on-danger` ➕ | `#ffffff` | `#ffffff` | Text and icons on a `danger` fill. Ruled by Kyson 2026-10-09, added by 4.5 |
| `danger-text` ➕ | `#dc2626` | `#f87171` | Red text: Delete, "Can't make it" |
| `danger-surface` | `#fee2e2` | `#450a0a` | Error banner background |
| `danger-border` ➕ | `#fca5a5` | `#7f1d1d` | Error banner border |
| `warning` ➕ | `#eab308` | `#eab308` | Busy-conflict icon |
| `warning-text` ➕ | `#854d0e` | `#fde68a` | Busy-conflict text |
| `warning-surface` ➕ | `#fef9c3` | `#2b2410` | Busy-conflict banner |
| `warning-border` ➕ | `#fde047` | `#a16207` | Busy-conflict border |
| `background` | `#FDFCFB` | `#121212` | App background. The light value is a warm off-white, deliberate |
| `surface` | `#FFFFFF` | `#1E1E1E` | Cards, grouped rows, sheets |
| `surface-alt` | `#f4f4f5` | `#27272a` | Chips, inset areas, skeleton loaders, others' chat bubbles |
| `backdrop` ➕ | black at 35% | `#000000` | Behind a sheet |
| `tab-bar` ➕ | `#FFFFFF` | `#1a1a1a` | Bottom tab bar |
| `border` | `#e4e4e7` | `#3f3f46` | Input outlines, ghost buttons |
| `divider` ➕ | `#e4e4e7` | `#27272a` | Hairlines between rows, hour lines |
| `text-strong` ➕ | `#18181b` | `#ffffff` | Titles, selected values |
| `text-primary` | `#27272a` | `#f4f4f5` | Body text |
| `text-secondary` | `#71717a` | `#a1a1aa` | Labels, sublines, timestamps |
| `text-disabled` | `#a1a1aa` | `#52525b` | Disabled, other-month days, "Sent" / "Requested" |
| `placeholder` | `#a1a1aa` | `#71717a` | ✏️ Dark changed from `#52525b`, which was too faint on `surface` |
| `busy-stripe-a` ➕ | `#e4e4e7` | `#2a2a2e` | Friends' busy hatch, 135°, 6px stripes |
| `busy-stripe-b` ➕ | `#f4f4f5` | `#1f1f22` | Friends' busy hatch, second stripe |
| `busy-initials` ➕ | `#a1a1aa` | `#52525b` | Initials chip on a busy block |

**Being retired:** the iOS system grays — `#8e8e93`, `#1c1c1e`, `#2c2c2e`, `#f2f2f7`, 22 usages total. **4.2's full sweep removes them.**

**Stray off-palette colors** (`#dc2626`, `#fca5a5`, `#fef2f2`, `#ff8080`, `#4ade80`, and the amber star `#fbbf24`) fold into `danger`, `danger-text`, `danger-border`, `danger-surface` and `primary`.

### A.2.1 — Event colors

**Event colors are a separate palette, not theme tokens.** These are the six colors from `CreateEventModal.tsx`. The chosen **base** hex is stored on the event. They live in `theme/tokens.ts` as `eventColors` and are **the same in light and dark**.

| Name | Base | Solid (700) | Text on base | Text on solid |
|---|---|---|---|---|
| emerald | `#10b981` | `#047857` | `#0d0d12` | `#ffffff` (5.5:1) |
| blue | `#3b82f6` | `#1d4ed8` | `#0d0d12` | `#ffffff` (6.7:1) |
| violet | `#8b5cf6` | `#6d28d9` | `#0d0d12` | `#ffffff` (7.1:1) |
| pink | `#ec4899` | `#be185d` | `#0d0d12` | `#ffffff` (6.0:1) |
| orange | `#f97316` | `#c2410c` | `#0d0d12` | `#ffffff` (5.2:1) |
| yellow | `#eab308` | `#a16207` | `#0d0d12` | `#ffffff` (4.9:1) |

➕ **Rendering rules (Kyson, 2026-10-09):**
- **Confirmed and personal events:** solid fill with white text.
- **Proposed events:** 2px dashed border in base, fill in base at 8%, `text-strong` text.
- **Cancelled and expired events:** `surface` with `border`, `text-secondary`, title struck through, plus a tag.
- **Free events** (not counting as busy) look the same as busy ones. "Free" shows only in the detail view.
- **Swatches** in the color picker use base.
- **Discover posters** for activities with no photo use solid with white text.

## A.3 — Type scale

✏️ **Replaced 2026-10-09.**
- **Font family: Manrope**, bundled from `docs/design/fonts/` (weights 400–800, SIL Open Font License, OK to bundle).
- **Manrope has no 900 weight**, so the old `display: 900` becomes 800.
- The scale gains the sizes the designs actually use (17, 15, 13, 11).

| Token | Size | Weight | Letter spacing | Used for |
|---|---|---|---|---|
| `display` | 32 | 800 | -0.8 | Screen titles: Planner, Discover |
| `title` | 24 | 800 | -0.4 | Event detail title |
| `headline` | 20 | 800 | -0.3 | Title input, big card names |
| `nav-title` ➕ | 17 | 800 | 0 | Sheet and nav titles, card titles |
| `button` ➕ | 16 | 800 | 0 | Primary buttons |
| `body` | 16 | 400 | 0 | Inputs, message text |
| `body-sm` ➕ | 15 | 500 | 0 | Row labels and values |
| `label` | 14 | 700 | 0 | Chips, small buttons, day numbers |
| `caption` | 13 | 500 | 0 | ✏️ was 12/400. Sublines, event block titles |
| `footnote` ➕ | 12 | 500 | 0 | Timestamps, hour labels, legends |
| `micro` | 11 | 800 | 0 | ✏️ was 10/600. Tags ("Vote open"), event sublines |
| `avatar` ➕ | 10 | 800 | 0 | Initials in small avatars, badge numbers |

## A.4 — Spacing

4pt grid, unchanged.

`xs: 4` · `sm: 8` · `md: 12` · `base: 16` · `lg: 20` · `xl: 24` · `2xl: 32`

## A.5 — Radius and fixed sizes

**Radius:** `sm: 8` (chips, all-day chips, tags) · ➕ `event: 10` (event blocks) · `md: 12` (buttons, inputs, the + button) · `lg: 16` (cards, grouped rows, sheet top corners) · `xl: 24` · `pill: 999`

➕ **Fixed sizes:**

| Size | Value | What |
|---|---|---|
| `hour-height` | 48 | Planner hour row |
| `button-height` | 52 | Primary button |
| `row-height` | 52 | Minimum grouped row |
| `touch-min` | 44 | Smallest tap target |
| `tab-bar-height` | 84 | Includes the home indicator |
| `avatar-sm` | 26 | |
| `avatar-md` | 32 | |
| `snap-minutes` | 15 | Drag and resize snap |

## A.6 — Icons ➕

- **Library:** Lucide, via `lucide-react-native` (ISC license). Use `strokeWidth={2.4}`.
- **Sizes:** 24 for tabs and nav, 18 inline, 16 small.
- **Files:** every icon the designs use is in `docs/design/icons/` and named on the token sheet.
- **Tab bar:**

| Tab | Icon |
|---|---|
| Planner | `calendar` |
| Discover | `compass` |
| Search | `search` |
| Circle | `users` |
| Profile | `user` |

## A.7 — Where this lives in code

- `theme/tokens.ts` — the values above, as a typed object with `light` and `dark` variants, plus `eventColors`, `type`, `space`, `radius` and `size`. Generate it from `docs/design/tokens.json`.
- `theme/ThemeProvider.tsx` — Context provider; reads the system preference plus the persisted override.
- `theme/useTheme.ts` — the hook every component calls.
- **Fonts** — the five Manrope `.ttf` files are registered with the native projects (iOS `Info.plist` `UIAppFonts`, Android `assets/fonts`).

**No component takes an `isDarkMode` prop.** That pattern is what produced the current situation, where each file re-derives its own styles and the grays drift apart.

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
| Already friends | "Unfriend" | `danger` bg, `on-danger` text |
| Blocked (viewer is the blocker) | "Unblock" | `surface-alt` bg, `text-primary` text |

**Failure behavior:** the button updates optimistically and reverts on write failure, matching the heart-icon rule in Project 11. Projects 4, 5, and 7 currently don't specify this at all.

> **Resolved 2026-10-09 (Kyson): text on a `danger` fill is white.** No existing token is white in both themes, so 4.5 added `on-danger: #ffffff` (A.2). The "Decline" button uses it too.

## B.2 — Error vs. empty — the distinction tickets keep blurring

Worth stating once, because several tickets use the same visual for both and they aren't the same thing:

- **`ErrorState`** — something went wrong. Lost connection, failed query, missing document. The circle-and-`!` visual, and a retry affordance where retrying makes sense.
- **`EmptyState`** — nothing went wrong, there's just nothing to show. No search results, end of the feed, no conversations yet. No error icon, no alarm, and usually a suggested action ("Find a friend").

Project 11 currently uses the error visual for both "no internet" and "you've reached the end of the activities," which tells a user something is broken when they've simply scrolled to the bottom.
