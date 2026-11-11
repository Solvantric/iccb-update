# ICCB Design System

## Brand Identity

**International Convention City Bashundhara (ICCB)** — South Asia's largest convention centre, Dhaka, Bangladesh.
Brand personality: prestigious, international, warm, authoritative.

---

## Color Palette

### Brand Red (Primary Accent)

| Token | Hex | Usage |
|---|---|---|
| `brand-50` | `#FEF2F3` | Tinted backgrounds |
| `brand-500` | `#E24F5F` | Primary accent, CTAs |
| `brand-700` | `#AD2739` | Accent text, links |
| `brand-950` | `#450D18` | Dark brand moments |

### Semantic Tokens (CSS Variables)

| Variable | Light | Dark | Purpose |
|---|---|---|---|
| `--bg` | `#FFFFFF` | `#0F0D0E` | Page background |
| `--bg-soft` | `#FAF7F7` | `#151213` | Section alternation |
| `--bg-deep` | `#141113` | `#1B1718` | Dark panels (dashboard) |
| `--surface` | `#FFFFFF` | `#1B1718` | Card/surface backgrounds |
| `--ink` | `#141113` | `#F5F1F1` | Primary text |
| `--ink-muted` | `#5E5759` | `#A69EA0` | Secondary text, labels |
| `--line` | `#E9E4E4` | `#2C2628` | Borders, dividers |
| `--accent` | `#E24F5F` | `#E24F5F` | Buttons, highlights |
| `--accent-hover` | `#CE3447` | `#EE7483` | Hover state |
| `--accent-text` | `#AD2739` | `#EE7483` | Inline accent text |

### Status Colors

| Variable | Hex | Use |
|---|---|---|
| `--status-reserved-bg` | `#FEF3C7` | Calendar hold |
| `--status-reserved-color` | `#F59E0B` | Reserved indicator |
| `--status-booked-bg` | `#FEE4E2` | Calendar booked |
| `--status-booked-color` | `#B42318` | Booked indicator |
| `--status-success` | `#12B76A` | Confirmed |
| `--status-info` | `#2E90FA` | Informational |
| `--status-warning` | `#F79009` | Warning |

---

## Typography

### Typefaces

| Role | Family | Variable |
|---|---|---|
| Display / Headings | Playfair Display | `--font-display` |
| Body / UI | DM Sans | `--font-sans` |

**Why these fonts:** Playfair Display conveys heritage, elegance, and prestige — right for a premium convention venue. DM Sans provides warm, non-geometric body text with numerals that feel editorial rather than mechanical.

### Display Scale (Utility Classes)

| Class | Size | Weight | Use |
|---|---|---|---|
| `.display-xl` | `clamp(3rem, 8vw, 8.5rem)` | 300 | Hero headlines |
| `.display-lg` | `clamp(2.5rem, 6vw, 6rem)` | 300 | Page heroes |
| `.display-md` | `clamp(2rem, 4vw, 3.5rem)` | 400 | Section headers |
| `.meta-label` | `11px` | 500 | Section tags, eyebrows |

All display classes are `uppercase` with `letter-spacing: -0.01em`. RTL locales (`ar`) override to `text-transform: none; letter-spacing: 0`.

---

## Spacing & Layout

- **Max content width:** `1440px`
- **Page padding:** `clamp(1rem, 4vw, 3rem)` (scales with viewport)
- **Section vertical rhythm:** `clamp(4rem, 10vw, 9rem)`

### Border Radius Tokens

| Token | Value | Use |
|---|---|---|
| `--radius-pill` | `9999px` | Buttons, badges |
| `--radius-card` | `16px` | Cards, modals |
| `--radius-input` | `12px` | Form inputs |
| `--radius-dash-card` | `14px` | Dashboard cards |

---

## Component Patterns

### Buttons

```
Primary:   bg-[var(--accent)]  text-white  rounded-full  px-8 py-4  text-[12px] tracking-[0.12em] uppercase
Secondary: border border-[var(--ink)]  text-[var(--ink)]  rounded-full  — hover: invert
Ghost:     border border-[var(--line)]  — hover: border-[var(--accent)] text-[var(--accent)]
```

### Cards

```
bg-[var(--surface)]  border border-[var(--line)]  rounded-[var(--radius-card)]
hover: shadow-lg  transition-all duration-500
```

### Section Structure

```
(META LABEL)        ← .meta-label class, text-[var(--ink-muted)], e.g. "(VENUES)"
DISPLAY HEADING     ← .display-md or .display-lg
Body text           ← text-[16px] text-[var(--ink-muted)] max-w-xl
```

---

## Motion

### RevealBlock (Scroll Entrance)

All content sections use the `<RevealBlock>` component for scroll-triggered entrance animations.

| Property | Value |
|---|---|
| Initial state | `opacity: 0`, `y: 48`, `filter: blur(6px)` |
| Final state | `opacity: 1`, `y: 0`, `filter: blur(0px)` |
| Duration | `0.85s` |
| Easing | `[0.16, 1, 0.3, 1]` (expo-out) |
| Trigger margin | `-8% 0px` |

### Hero Slider

- Autoplay interval: `4200ms`
- Transition: Framer Motion opacity fade `1.2s` + Ken Burns scale `1 → 1.06` over `8s`
- Pauses on hover

### Marquee (Logo Rows)

```css
.logo-marquee         { animation: marquee-ltr linear infinite; }
.logo-marquee-reverse { animation: marquee-rtl linear infinite; }
```
Respects `prefers-reduced-motion`.

---

## Page Structure

### Public Routes

```
/              Home (HeroSlider → Stats → Services → Venues → Expo → Video → Halls → Gallery → Testimonials → CTA)
/venues        Hall listing
/venues/[slug] Hall detail
/services      Services overview
/services/[slug] Service detail
/expo-zone     Expo Village
/booking       Availability calendar + budget calculator + booking form
/enquiry       General enquiry form
/contact       Contact page
/about         About ICCB
/why-iccb      Why choose ICCB
/gallery       Photo gallery
/news          News & events
/menu          Heritage Restaurant menu
/faq           FAQ accordion
```

### Dashboard Routes

```
/dashboard               Overview (KPIs, charts)
/dashboard/leads         Lead pipeline
/dashboard/bookings      Booking management
/dashboard/calendar      Monthly event calendar
/dashboard/revenue       Financial analytics
/dashboard/tasks         Event preparation tasks
/dashboard/documents     Contracts & proposals
/dashboard/notifications Alert centre
/dashboard/queries       Client queries
/dashboard/analytics     Traffic & conversion analytics
/dashboard/radar         Lead radar / scoring
/dashboard/chats         Chat inbox
/dashboard/content       CMS content
/dashboard/settings      System settings
```

---

## Responsive Breakpoints (Tailwind defaults)

| Breakpoint | Min-width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

**Mobile-first approach.** Key patterns:
- Calendar: `rounded-none sm:rounded-[var(--radius-card)]` — edge-to-edge on mobile
- Grid layouts: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Display text: fluid via `clamp()`, no breakpoint overrides needed

---

## Internationalisation

| Locale | Language | Dir |
|---|---|---|
| `en` | English | LTR |
| `bn` | Bengali | LTR |
| `ar` | Arabic | RTL |
| `zh` | Chinese | LTR |

Default locale (`en`) renders without URL prefix (`/` not `/en/`). Other locales: `/bn/`, `/ar/`, `/zh/`.
RTL handled via `dir="rtl"` on `<html>` — set by `LocaleHtmlSync` client component.

---

## Dark Mode

Toggled via `next-themes` with `attribute="class"`. Dark class applied to `<html>`.
Default: `light`. No system preference override.
All colors reference CSS variables — dark values declared under `.dark {}` in `globals.css`.
