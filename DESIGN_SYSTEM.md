# SagaySync Design System

Source of truth: `src/lib/theme.ts`. Reference tokens, never raw numbers or hex values.

## Principles
- Calm and quiet. If an element can go without losing meaning, remove it.
- **Yellow means "act here / look here".** Allowed on: the + button, Follow, NEXT, "N new" badges, Postponed / Pinned / Scheduled tags. Nowhere else.
- One card surface for the whole app (`CARD`): white, hairline border, soft shadow. Tinted surfaces (`C.soft`) are for secondary groupings only.
- Every tappable thing gives touch feedback (`PRESSED`, or `PRESSED_ROW` for full-width rows) and is at least `MIN_TAP` (44) tall.

## Color (`C`)
| Token | Use |
|---|---|
| `navy` / `navy2` | Primary text, buttons, selected states / secondary navy, icons |
| `yellow` | Action and attention only (see above) |
| `bg` / `card` / `soft` | Page / card surface / tinted surface and badges |
| `text` / `muted` / `grayText` | Body / secondary / text on gray tags |
| `border` / `divider` | Hairlines / dashed and in-card dividers |
| `danger` / `dangerSoft` | Errors, Deadline, Cancelled |
| `ok` / `okSoft` / `okText` | Published status |
| `warnSoft` | Postponed banner |

Pure white (`#fff`) is still written inline for switch thumbs, button text and the toast icon.

## Type (`TYPE`)
`caption 12` · `small 14` · `body 16` · `title 18` · `h3 22` · `h2 26` · `h1 30`
- Weights: **600** and **700** only. **800** is reserved for tags and badges.
- Headings use `SERIF` (system serif for now; Fraunces is the intended face).

## Spacing (`SP`)
`xs 4` · `sm 8` · `md 12` · `lg 16` · `xl 20` · `xxl 24` · `xxxl 32`
- Screen side padding is `PAD` (= `SP.xl`).
- Gaps under 4px are optical tweaks and exempt.

## Radius (`R`)
`sm 8` (tags) · `md 14` (buttons, fields, tiles) · `lg 20` (cards) · `xl 24` (hero cards, toast) · `pill`
- A nested radius is the parent's radius minus its padding (e.g. Segmented items: `R.md - SP.xs`).

## Icons (`ICON`)
`sm 16` inline · `md 20` rows and fields · `lg 24` navigation and header actions
- Exceptions: empty/error illustrations (40), the + glyph (32), rating stars (32).

## Components
- `Card`, `Tag`, `Pill`, `Segmented`, `Button` (primary / yellow / ghost / danger), `Input` (pass `right` for a control inside the field), `AppSwitch` and `SwitchRow` (the only switch styling), `Monogram` (soft badge; `inverted` = white on soft surfaces), `Eyebrow`, `PageTitle`, `Empty`, `Skeleton`, `Gate`, `Toast`.
- `Empty` always gets an icon, and an action when there is a next step (for example "Browse groups" on an empty Following feed).
- `Screen` caps content at `CONTENT_MAX` (640) and centers it, so tablets show a phone-width column.
- Loading uses `SkeletonScreen`, shaped like Home (date line, pinned card, event cards, list rows).
- Pinned cards share a minimum height and stretch to the tallest in the carousel; their decorative ring is the one place yellow is used as decoration.
- Category tags show only for Reminder and Deadline; Announcement is the default and stays unlabeled.
- Tabs other than Home use `PageTitle` as their header; Home keeps `AppHeader`.
- Calendar day states: today = navy fill; selected = navy ring; holiday = soft gray tile with a bold gray number; event = one dot.

## Naming
Use **Groups** for student organizations everywhere in the UI.

## Not yet designed
Dark mode (the app is light-only; `userInterfaceStyle` is set to `light`), branded splash screen and app icon (still the Expo template), remaining empty-state illustrations.

## Accessibility
- Tap targets are at least 44px.
- Cards and event rows carry a spoken label (title, group, and for events the date and time) so screen readers don't read every tag and icon.
- The toast is a polite live region; switches have labels.
