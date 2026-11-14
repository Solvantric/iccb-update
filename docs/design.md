# ICCB Design System — Single Source of Truth

> **Prompt rule for any agent or developer working in this repo:**
> The **homepage** (`src/app/[locale]/(publicRoute)/page.tsx` and `src/components/sections/*`) is the design reference.
> Every page, public or `/dashboard`, **must** use the same brand red, fonts, radii, easing curves and motion language described here.
> Do not add new brand colours, fonts or easing curves. If something is missing, add a token to `src/app/globals.css` that derives from the tokens below.

---

## 1. Brand identity

**International Convention City Bashundhara (ICCB)** is South Asia's largest convention centre, in Dhaka, Bangladesh.
The palette follows the **Bashundhara Group red/white system**. The brand should feel bold, confident, editorial and international, with crisp edges, high contrast and red used on purpose.

Visual signature (seen on the homepage):
- Red eyebrow label with a **3px red bar** under it or a 22px red dash in front of it
- **Oswald, UPPERCASE** headings, where the last word or line is coloured **brand red**
- **Square-ish corners** (4px), not pill-shaped and not very rounded
- A red top rule that **draws in** on card hover; red corner brackets on images
- Red → deep-red gradient buttons with a **light sweep** on hover

---

## 2. Colour

### 2.1 Brand red scale (`--color-brand-*`)

| Token | Hex | Use |
|---|---|---|
| `brand-50` | `#FEF2F2` | Tinted backgrounds (`--bg-tint`) |
| `brand-100` | `#FDE3E4` | Selected rows, soft chips |
| `brand-200` | `#FBCBCD` | Borders on tinted chips |
| `brand-300` | `#F7A3A6` | Disabled accent |
| `brand-400` | `#F16A6E` | Dark-mode hover |
| **`brand-500`** | **`#EB2127`** | **PRIMARY.** CTAs, highlights, active states, accent bars |
| `brand-600` | `#D11319` | Hover, accent text on light backgrounds |
| `brand-700` | `#AC090A` | Deep red, the bottom of the button gradient |
| `brand-800` | `#8C0C0F` | Pressed |
| `brand-900` | `#740F12` | Dark brand moments |
| `brand-950` | `#400405` | Darkest brand |

> ❌ `#E24F5F`, `#CF3D4E` and `#F0606F` are the **old** red. They must not appear anywhere (dashboard, charts, PDFs or the favicon).

### 2.2 Semantic tokens: use these, not raw hex

| Variable | Light | Dark | Purpose |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#0E0F11` | Page background |
| `--bg-soft` | `#F1F2F2` | `#15171A` | Section alternation; **dashboard app background** |
| `--bg-tint` | `#FEF2F2` | `#1F1213` | Red-tinted panels, icon chips, active nav item |
| `--bg-deep` | `#15171C` | `#08090A` | Hero, photo overlays, dark bands |
| `--surface` | `#FFFFFF` | `#17191C` | Cards, tables, modals, sidebar |
| `--ink` | `#000000` | `#F5F5F5` | Headings, primary text |
| `--ink-body` | `#30333F` | `#C4C6CC` | Body copy, table cells |
| `--ink-muted` | `#6D6E71` | `#8E9096` | Labels, captions, meta |
| `--line` | `#E9EAEA` | `#262A30` | Borders, dividers |
| `--accent` | `#EB2127` | `#EB2127` | Brand red |
| `--accent-hover` | `#D11319` | `#F04A4F` | Hover |
| `--accent-text` | `#D11319` | `#FF5A5F` | Red text on page backgrounds (meets AA) |
| `--accent-deep` | `#AC090A` | `#AC090A` | Gradient end, pressed |
| `--on-accent` | `#FFFFFF` | `#FFFFFF` | Text on red |
| `--accent-glow` | red at 18% | red at 28% | Button shadow |
| `--shadow-card` | `0 18px 40px -18px #30333F/28%` | `0 18px 40px -18px rgba(0,0,0,.7)` | Card hover shadow |

Tailwind aliases exist for every token: `bg-bg-soft`, `text-ink`, `text-ink-muted`, `border-line`, `bg-accent`, `text-accent-text` and so on. You can use either `bg-[var(--accent)]` or `bg-accent`.

### 2.3 Status colours (shared by the public calendar and the CRM)

| Status | Colour | Background tint |
|---|---|---|
| Requested / Reserved | `#F59E0B` | `#FEF3C7` |
| **Confirmed / Booked** | **`var(--accent)` `#EB2127`** | `var(--bg-tint)` |
| Completed / Success | `#12B76A` | `#ECFDF3` |
| Closed / Cancelled / Lost | `#98A2B3` | `#F2F4F7` |
| Info | `#2E90FA` | `#EFF8FF` |
| Warning | `#F79009` | `#FFFAEB` |
| Error / Overdue | `#B42318` | `#FEE4E2` |

Status pills: `rounded-[var(--radius-btn)]` (4px), 11–12px, bold, uppercase, `tracking-[0.08em]`, with a coloured dot in front.

### 2.4 Where red goes
- **Do** use red for: the primary CTA, the active nav item (red 3px start-border with a `--bg-tint` background), eyebrows, the highlighted last word of a heading, accent bars, focus rings, key numbers (`.num-accent`), chart series #1 and the "Confirmed" status.
- **Don't** use red for large background fills (except CTA bands and the hero highlight), body text, or more than one primary button per view.

### 2.5 Chart palette (dashboard)
In this order: `#EB2127` (accent) → `#30333F` (ink-body) → `#F59E0B` → `#12B76A` → `#2E90FA` → `#98A2B3`.
Gridlines use `var(--line)`; axis labels use `var(--ink-muted)` at 12px. Tooltips use the `.card` style.

---

## 3. Typography

| Role | Family | Variable | Weights |
|---|---|---|---|
| Display / headings | **Oswald** | `--font-display` (`font-display`) | 500 / 600 / 700 |
| Body / UI / tables | **Inter** | `--font-sans` (default) | 400 / 500 / 600 / 700 |
| bn / ar / zh fallbacks | Noto Sans Bengali / Arabic / SC | applied automatically via `[lang]` | — |

> The dashboard **must** use Inter for UI text and Oswald for page titles and KPI numbers, the same as the homepage. Noto Sans is only a glyph fallback, never the primary face.

### 3.1 Scale

| Class / pattern | Size | Weight | Notes |
|---|---|---|---|
| `.text-hero` | `clamp(2.5rem, 6vw, 5.25rem)` | 600 | Oswald, UPPERCASE, line-height 1.02 |
| `SectionHeading` h2 | `text-3xl` → `lg:text-[4.25rem]` | 700 | Oswald, UPPERCASE, line-height 1.1; the second line is red |
| `.text-h2` | `clamp(2rem, 4vw, 3.25rem)` | 700 | Inter, `-0.025em` |
| `.text-h3` | `clamp(1.375rem, 2vw, 1.75rem)` | 700 | Inter, `-0.01em` |
| `.text-eyebrow` | 12px | 700 | Red, `0.2em` tracking, UPPERCASE, red dash in front |
| `.meta-label` | 12px | 600 | Muted, `0.16em` tracking, UPPERCASE |
| `.num-accent` | any | 700 | Oswald, red, tabular numbers |
| Body (public) | 17px / 1.6 | 400 | `--ink-body` |
| Body (dashboard) | 14px / 1.5 | 400 | `--ink-body` |

**Dashboard type mapping**

| Dashboard element | Style |
|---|---|
| Page title | `font-display uppercase font-semibold text-[28px] leading-tight text-ink`, followed by `<LineGrow width={40} />` |
| Page subtitle | 14px `text-ink-muted` |
| Card title | Inter 15px 600 `text-ink` |
| Section label in a card | `.meta-label` |
| KPI value | `font-display font-semibold text-[32px] tabular-nums text-ink` (use red only for the headline KPI) |
| Table header | `.meta-label` at 11px, `bg-bg-soft` |
| Table cell | 14px `text-ink-body`, `tabular-nums` for numbers |

**RTL (`ar`):** never uppercase or letter-space: `[dir="rtl"]` resets `text-transform` and `letter-spacing`. Use `rtl:normal-case rtl:tracking-normal` on ad-hoc classes.

---

## 4. Shape, spacing and elevation

### 4.1 Radius: the homepage is crisp, so stay crisp everywhere

| Token | Value | Use |
|---|---|---|
| `--radius-btn` | `4px` | Buttons, inputs, status pills, tabs |
| `--radius-input` | `4px` | Form fields |
| `--radius-card` | `4px` | Cards, image frames |
| `--radius-card-lg` | `6px` | **Dashboard cards**, modals, drawers, popovers |
| `--radius-pill` | `9999px` | Only for avatars, slider dots, round icon buttons and progress bars |

> ❌ Retire `rounded-xl` / `rounded-2xl` / `12px` / `14px` / `16px` card radii and pill-shaped CTAs. `--radius-dash-card` should alias to `--radius-card-lg`.

### 4.2 Layout
- `.container-site`: max 1280px. `.container-wide`: max 1440px. Gutter `clamp(1rem, 4vw, 3rem)`.
- `.section-y`: vertical rhythm `clamp(4rem, 8vw, 7.5rem)`.
- Dashboard: sidebar 264px (collapsed: 72px), top bar 64px, content padding `clamp(1rem, 2.5vw, 2rem)`, card gap 16–24px.

### 4.3 Elevation
- Resting card: `1px solid var(--line)`, **no shadow**.
- Hover or raised: `var(--shadow-card)`.
- Modal / drawer / popover: `var(--shadow-card)` with a `bg-black/40` backdrop and `backdrop-blur-[2px]`.

---

## 5. Components (use the classes, don't re-invent them)

### Buttons (`.btn`)
```
.btn .btn-primary    red → deep-red vertical gradient, white text, glow shadow,
                     hover: light sweep (::after translateX -120% → 120%, 0.7s),
                     lift -1px, gap 8 → 12px (the arrow icon nudges forward)
.btn .btn-secondary  2px red outline, ink text → hover fills red, white text
.btn-sm              44px high (dashboard default: 40px high via h-10 px-4 text-[12px])
```
Every button is UPPERCASE, bold and tracked at `0.06em`, with 4px corners and a trailing Phosphor `ArrowRight weight="bold"` on CTAs.
Dashboard ghost/tertiary: `border border-line text-ink hover:border-accent hover:text-accent-text`, with the same radius and transition.

### Cards
```
.card              surface, 1px line border, 4px radius
.card-hover        hover: translateY(-4px), shadow-card, red 3px top rule scales in from the start edge (0.5s)
.card-accent       static red 3px top border + 7px red square marker
.frame-corners     red corner brackets around images
.icon-chip         52px, bg-tint, red icon → on group hover: red fill, white icon, lift -2px
```
Dashboard: `.crm-card` = `.card` + `rounded-[var(--radius-card-lg)]`. Clickable dashboard cards (KPIs, kanban cards, list rows that open something) add `.card-hover`, with the lift reduced to `-2px` for density.

### Section heading (`<SectionHeading>`)
Centred red eyebrow (0.2em tracking) → 56×3px red bar → Oswald UPPERCASE title with a **red second line** → optional body copy.
Inline alternative: `.text-eyebrow` + `TextReveal highlightLast` + `.accent-bar` / `<LineGrow>`.

### Links
`.underline-grow`: a 1.5px red underline grows from the start edge in 0.3s.

### Forms
Height 48px (public) or 40px (dashboard), 4px radius, `border-line`, `bg-surface`, 15/14px text.
Focus: `border-accent` plus a `0 0 0 3px var(--accent-glow)` ring. Labels use `.meta-label`. Errors use `#B42318` at 12px.

### Navigation
- Public header: white bar, red active underline (`.underline-grow`), and a red primary CTA.
- Dashboard sidebar: `bg-surface`, items 14px 500 `text-ink-body`. Hover: `bg-bg-soft`. **Active: `bg-bg-tint text-accent-text font-semibold` with a 3px red start-border.** Group labels use `.meta-label` at 11px.
- Tabs (dashboard workspace): text tabs with a 2px red bottom indicator that slides between tabs (`layoutId`, 0.35s, `EASE_OUT_EXPO`).

### Icons
**Phosphor (`@phosphor-icons/react`) only.** `weight="bold"` at 14–16px inline, `weight="regular"` at 20–24px in chips and nav. Accent icons use `text-[var(--accent)]`.

### Feedback
- Skeleton: `.crm-skeleton` shimmer (1.4s), using `--bg-soft` → `--line`.
- Toast: `.card` + a 3px red start-border for hot leads, green for success.
- Focus ring (global): `2px solid accent/60%`, offset 3px.
- Selection: accent at 20%.
- Scroll progress bar: 2px red, fixed at the bottom (public only).

---

## 6. Motion: one language across the whole site

### 6.1 Easing and timing tokens (from `src/components/motion/primitives.tsx`)

| Name | Curve | Use |
|---|---|---|
| `EASE_PREMIUM` | `[0.16, 1, 0.3, 1]` | Entrances (fade-up, stagger, image reveal, slide-in) |
| `EASE_OUT_EXPO` | `[0.22, 1, 0.36, 1]` (`cubic-bezier(0.22,1,0.36,1)`) | UI transitions: hover, line grow, text mask, slider, tabs, drawers, card rule |
| Spring | `stiffness 260, damping 18` | Icon pop only |

| Duration | Value |
|---|---|
| Micro (colour, border) | 0.3s `ease` |
| Hover transform / shadow | 0.4s `EASE_OUT_EXPO` |
| Card red rule / button sweep | 0.5s / 0.7s `EASE_OUT_EXPO` |
| Entrances | 0.7–0.85s desktop, ≤0.5s mobile |
| Image clip reveal | 1.1s (+1.3s inner scale 1.15 → 1) |

CSS equivalent: `transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1)`. In the dashboard it is exposed as `--crm-ease`, which must equal this curve.

### 6.2 Scroll-triggered primitives (import from `@/components/motion/primitives`)

| Primitive | Effect | Defaults |
|---|---|---|
| `FadeUp` | opacity 0 → 1, y 24 → 0 | 0.8s, `EASE_PREMIUM`, once, margin `-12%` |
| `TextReveal` | word-by-word mask slide-up; `highlightLast` makes the last word red | 0.8s, +0.04s per word, +0.08s per line |
| `Stagger` | children fade up one after another | 0.08s stagger, 0.7s each |
| `ImageReveal` | clip-path wipe (up/left/right) + inner scale 1.15 → 1 | 1.1s |
| `SlideIn` | x ±60 → 0 (desktop), y 24 on mobile | 0.85s |
| `LineGrow` | red bar scaleX 0 → 1 from the start edge | 48×3px, 0.6s |
| `Counter` | number counts up when in view | 1.6s `easeOut` |
| `IconPop` | scale 0.6 → 1 with a spring overshoot | — |
| `RevealBlock` / `RevealGroup` / `RevealItem` | opacity + y 28 + blur 4px → 0 | 0.85s, margin `-8%` (legacy, still allowed) |

Card grids on the homepage: each card fades up `y 32 → 0`, 0.65s, with a `delay: i * 0.08`; the image clip-reveals from the bottom with +0.1s; on hover the image scales to 1.06 over 700ms.

### 6.3 Hero slider
- Autoplay **6000ms**, pauses on hover; keyboard ← → works.
- Slide transition: horizontal `x ±100%` + fade, 0.9s `EASE_OUT_EXPO`.
- Ken Burns: scale `1.08 → 1.0` over the slide's duration.
- Headline lines mask-slide up (`y 105% → 0`, 0.8s, +0.12s per line); the highlight word is red.
- 120×3px progress bar that fills red; active dot `w-8 bg-accent`, others `w-2 bg-white/40`.

### 6.4 Dashboard motion: the same curves, used more lightly
The dashboard must **feel** like the homepage without slowing anyone down:

| Dashboard moment | Motion |
|---|---|
| Route / page content | `FadeUp` with `y={12}` and `duration={0.4}` on the page header, then `Stagger stagger={0.05}` on the KPI row and card grid (first paint only) |
| Page title | `<LineGrow width={40} />` under the Oswald title |
| KPI values | `<Counter>` (1.2s) |
| KPI / clickable cards | `.card-hover`: red top rule draws in, lift -2px |
| Primary buttons | `.btn-primary`: gradient + light sweep (identical to the homepage) |
| Sidebar active item | background and border colour 0.3s; active indicator slides with `layoutId` |
| Tabs | red underline `layoutId`, 0.35s `EASE_OUT_EXPO` |
| Drawers / modals | drawer x 100% → 0 / modal scale 0.97 + fade, 0.4s `EASE_OUT_EXPO`; backdrop fades in 0.2s |
| Kanban drag | lifted card: `shadow-card`, rotate 1.5°, scale 1.02 |
| Charts | bars and lines animate in once, 0.8s `EASE_OUT_EXPO` |
| Table rows | **no** entrance animation; hover `bg-bg-soft` 0.2s |
| Loading | `.crm-skeleton` shimmer |

Don't use `TextReveal`, `Parallax`, `ImageReveal` or marquees in the dashboard; they are for the marketing site only.

### 6.5 Rules for all motion
1. Animate only `transform`, `opacity`, `clip-path` and `filter`. Never animate layout properties (width/height/top).
2. Scroll entrances fire **once** (`viewport={{ once: true }}`).
3. `prefers-reduced-motion`: opacity only, with no movement, no marquee and no shimmer. The primitives already handle this, so use them rather than raw `motion.div` where possible.
4. Mobile (<768px): shorter distances (y ≤ 16) and durations (≤ 0.5s); no parallax or word-masking.
5. RTL: lines, rules and slide-ins start from the **inline-start** edge (`transform-origin: right` under `[dir="rtl"]`).

---

## 7. Dashboard alignment: required token mapping

The `.crm` scope in `globals.css` must **alias the global tokens**, not define its own palette:

```css
.crm {
  --crm-bg:          var(--bg-soft);
  --crm-surface:     var(--surface);
  --crm-surface-2:   color-mix(in srgb, var(--bg-soft) 55%, var(--surface));
  --crm-ink:         var(--ink);
  --crm-ink-2:       var(--ink-body);
  --crm-muted:       var(--ink-muted);
  --crm-line:        var(--line);
  --crm-brand:       var(--accent);        /* #EB2127 */
  --crm-brand-hover: var(--accent-hover);  /* #D11319 */
  --crm-tint:        var(--bg-tint);       /* #FEF2F2 */
  --crm-tint-2:      #FDE3E4;              /* brand-100; dark: #2A1416 */
  --crm-shadow:      none;
  --crm-shadow-lg:   var(--shadow-card);
  --crm-ease:        cubic-bezier(0.22, 1, 0.36, 1);
  font-family: var(--font-sans);           /* Inter, not Noto Sans */
}
/* dark: inherits from .dark global tokens automatically; only override --crm-tint-2 */
```
- `--color-crm-confirmed` → `var(--accent)`.
- `.crm-card` radius → `var(--radius-card-lg)` (6px).
- `.doc-a4` table header tint → `#FEF2F2`; PDFs use `#EB2127` for brand rules and accents.
- Replace every hard-coded `#E24F5F` in `components/dashboard/**` (kpi, core, status, charts, Users, Leads, Radar, DocumentView) and in `app/icon.svg` with `var(--accent)` or `#EB2127`.

---

## 8. Page structure

### Homepage order (reference)
HeroSlider → BookingCard (overlaps the hero, desktop) → ServiceStrip → VenueCards → ExpoZone → VenturesSlider → MenuBento → WhyICCB → GallerySlider → Testimonials → GettingHere → FinalCTA.

Inner public pages follow the same rhythm: a dark photo hero (`--bg-deep` + gradient overlay, Oswald title with a red last word) → `.section-y` blocks that alternate `--bg` and `--bg-soft` → a red FinalCTA band.

### Dashboard
See [dashboard.md](dashboard.md) for all routes and roles. The shell, the sign-in page and every route use the tokens and motion in this file.

---

## 9. Responsive breakpoints (Tailwind defaults, mobile-first)

`sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`
- Grids: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- Display text is fluid through `clamp()`.
- Dashboard: below `lg` the sidebar becomes an off-canvas drawer; tables scroll horizontally inside their card; kanban scrolls horizontally with snap.

---

## 10. Internationalisation

| Locale | Language | Dir |
|---|---|---|
| `en` | English | LTR (default, no URL prefix) |
| `bn` | Bengali | LTR |
| `ar` | Arabic | RTL |
| `zh` | Chinese | LTR |

`dir` is set on `<html>` by `LocaleHtmlSync`. Use logical properties (`ms-`, `me-`, `ps-`, `start-`, `end-`, `inset-inline-*`) everywhere.

---

## 11. Dark mode

`next-themes` with `attribute="class"`; default `light`. All colours come from CSS variables, and dark values live under `.dark {}`.
The dashboard reads the **same** `.dark` tokens (through the `.crm` aliases above). The brand red stays `#EB2127` in both themes; red text switches to `--accent-text` (`#FF5A5F`) for contrast.

---

## 12. Checklist before you ship a page

- [ ] No hex colours in components; only tokens (status hues and the chart palette are the exceptions)
- [ ] No `#E24F5F`, Playfair, DM Sans or Noto Sans as the primary face
- [ ] Headings use Oswald UPPERCASE, the key word is red, and an eyebrow or accent bar is present
- [ ] Buttons use `.btn-primary` / `.btn-secondary` with 4px corners
- [ ] Cards use `.card` (+ `.card-hover` if clickable), 4px corners (6px in the dashboard)
- [ ] Motion uses the primitives / `EASE_OUT_EXPO` / `EASE_PREMIUM` only, and respects reduced motion
- [ ] Phosphor icons only
- [ ] Checked in light, dark, mobile and RTL
