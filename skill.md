# ICCB Tech Stack & Skills

A reference for every technology used in this project — what it does, why it was chosen, and where it appears.

---

## Core Framework

### Next.js 16 (App Router)
**What:** React full-stack framework with file-system routing, server components, and built-in optimisation.
**Why:** App Router enables per-segment layouts (public site, dashboard, auth each have isolated shells). `generateStaticParams` pre-renders all hall/service/news detail pages.
**Key patterns used:**
- Route groups: `(publicRoute)`, `(dashboardRoute)`, `(auth)` — shared layouts without URL segments
- `page.tsx` exports default async server components; interactive parts moved to client components
- `metadata` exports for SEO on every page
- `next/image` for automatic WebP conversion, lazy loading, and `sizes` attribute
- `next/font/google` for zero-layout-shift font loading (Playfair Display, DM Sans)

### React 19
**What:** UI library. Used for all component rendering.
**Key APIs used:** `useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`, `Suspense`

### TypeScript 5
**What:** Typed JavaScript superset.
**Why:** Prevents runtime errors in data shapes (hall capacities, booking statuses, locale types). All `@/types/index.ts` interfaces are shared across data, components, and services.

---

## Styling

### Tailwind CSS v4
**What:** Utility-first CSS framework.
**Why v4:** CSS-first config via `@theme inline` — design tokens live in `globals.css` as CSS variables, not `tailwind.config.js`. Tailwind v4 reads them natively.
**Key patterns:**
- All colours reference CSS vars: `bg-[var(--accent)]`, `text-[var(--ink-muted)]`
- Fluid spacing with `clamp()` inline: `px-[clamp(1rem,4vw,3rem)]`
- `cn()` utility (clsx + tailwind-merge) for conditional class merging

### CSS Custom Properties (Design Tokens)
Semantic variables (`--bg`, `--ink`, `--accent`, etc.) declared in `:root` and `.dark`. Every component reads tokens — zero hardcoded colours except status/chart colours.

---

## Animation & Interaction

### Framer Motion 14
**What:** Production-grade React animation library.
**Where used:**
- `RevealBlock` / `RevealGroup` / `RevealItem` — scroll-triggered blur+rise entrance on all sections
- `HeroSlider` — headline reveal (`y: 100% → 0`), image crossfade, Ken Burns zoom
- `AnimatePresence` — HallSlider, HeroSlider image/text transitions
- `HallSlider` circular "NEXT HALL" button rotation
- `Toast` notifications — slide-in from right with spring physics
- `VenuesHighlight` — Embla + Framer combined for slide transitions

### Lenis 1.3
**What:** Smooth scroll library.
**Why:** Replaces native scroll with momentum-based easing. Integrates with Framer Motion's scroll progress tracking.

### Embla Carousel
**What:** Lightweight, framework-agnostic carousel engine.
**Where used:** `VenuesHighlight` (home page venue slider). Plugins: `embla-carousel-autoplay`.

---

## Internationalisation

### next-intl 4
**What:** i18n routing and translation for Next.js App Router.
**Config:** `localePrefix: "as-needed"` — English (default) omits prefix (`/`), others prefix (`/bn/`, `/ar/`, `/zh/`).
**Files:**
- `messages/en.json`, `bn.json`, `ar.json`, `zh.json` — translation strings
- `src/lib/i18n/routing.ts` — locale list, prefix strategy
- `src/lib/i18n/navigation.ts` — typed `Link`, `useRouter`, `usePathname`
- `src/lib/i18n/request.ts` — server-side locale resolution

### RTL Support
Arabic locale triggers `dir="rtl"` via `LocaleHtmlSync` client component (sets `document.documentElement.dir` after hydration). CSS handles RTL via logical properties (`start`/`end`) and `[dir="rtl"]` overrides in `globals.css`.

---

## Forms & Validation

### React Hook Form 7
**What:** Performant, uncontrolled form library.
**Where used:** `BookingForm`, `ContactForm`, `EnquiryPage`, `AskPage`.

### Zod 4
**What:** TypeScript-first schema validation.
**Where used:** Paired with `@hookform/resolvers/zod` for client-side form validation schemas.

---

## Data & State

### Zustand 5
**What:** Minimal React state management.
**Where used:**
- `auth.store.ts` — demo user session state
- `enquiry.store.ts` — cross-page enquiry prefill
- `ui.store.ts` — global UI toggles (theme, sidebar)

### TanStack Query (React Query) 5
**What:** Server-state management, caching, background refetch.
**Where used:** Wraps mock API calls via `QueryProvider`. Powers dashboard data fetching patterns.

### Mock Data Layer
All data is local TypeScript modules under `src/data/`:

| File | Contents |
|---|---|
| `halls.ts` | 6 halls with capacity, area, features |
| `bookings.ts` | Demo bookings with CRUD helpers |
| `leads.ts` | CRM leads with scoring |
| `availability.ts` | Hall availability by date/shift |
| `pricing.ts` | Catering packages, decoration tiers |
| `expo.ts` | Expo events + 18 real client org logos |
| `services.ts` | 6 ICCB service definitions |
| `news.ts` | News articles |
| `testimonials.ts` | Client testimonials |
| `faq.ts` | FAQ entries |
| `queries.ts` | Client query inbox |
| `images.ts` | Hero slide image metadata |

### Axios + Mock Adapter
`src/lib/api/axios.ts` — Axios instance.
`src/lib/api/mockAdapter.ts` — axios-mock-adapter intercepts API calls and returns demo data. Activated in `MockAdapterProvider`.

---

## Charts & Data Visualisation

### Recharts 3
**What:** Composable chart library built on D3.
**Where used:** Dashboard pages:
- `DashboardOverview` — AreaChart (revenue), PieChart (lead sources), BarChart (hall utilisation)
- `RevenuePage` — LineChart, PieChart (donut), BarChart (horizontal + vertical)

---

## UI Icons

### Phosphor Icons
**Package:** `@phosphor-icons/react`
**Why:** Consistent, multi-weight icon set (thin / light / regular / bold / fill). Used throughout — `weight="light"` for large decorative icons, `weight="fill"` for active/selected states.

---

## Dates

### date-fns 4
**What:** Modular date utility library.
**Where used:** `AvailabilityCalendar` — `format`, `addMonths`, `subMonths`, `startOfMonth`, `endOfMonth`, `eachDayOfInterval`, `isBefore`, `isToday`, `isSameDay`, `getDay`.

### date-fns-tz
**What:** Timezone-aware date formatting.
**Where used:** Available for future server-side date handling with Bangladesh Standard Time (BST, UTC+6).

---

## ID Generation

### nanoid 5
**What:** Tiny, URL-safe unique ID generator.
**Where used:** Generating booking reference numbers and new lead IDs in demo data.

---

## Theming

### next-themes 0.4
**What:** Dark/light mode management with SSR support.
**Config:** `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`.
Mounted in root layout. Dark mode toggled via `.dark` class on `<html>`.

---

## Developer Experience

### ESLint 9 + eslint-config-next
Linting with Next.js recommended rules. Config in `eslint.config.mjs`.

### Path Aliases
`@/` → `src/` via `tsconfig.json` `paths`. All imports use `@/components/...`, `@/data/...`, etc.

### Turbopack
Next.js 16 dev server uses Turbopack by default for fast HMR.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (html, body, fonts, ThemeProvider)
│   ├── globals.css                   # Design tokens, typography, animations
│   ├── [locale]/
│   │   ├── layout.tsx                # Locale context (next-intl, LocaleHtmlSync)
│   │   ├── (publicRoute)/            # Public site pages
│   │   └── (auth)/                   # Sign-in / sign-up
│   └── (dashboardRoute)/
│       └── dashboard/                # CRM dashboard pages
├── components/
│   ├── layout/                       # Header, Footer, FloatingDock, CookieBanner
│   ├── sections/                     # Home page sections (HeroSlider, ExpoZone, etc.)
│   ├── booking/                      # BookingForm, BudgetCalculator, AvailabilityCalendar
│   ├── dashboard/                    # All dashboard page components
│   ├── motion/                       # RevealBlock, AnimatedCounter
│   ├── providers/                    # ThemeProvider wrapper, LocaleHtmlSync, QueryProvider
│   └── ui/                           # Toast, Button, SampleBadge
├── data/                             # Static demo data (TypeScript modules)
├── lib/
│   ├── i18n/                         # next-intl routing, navigation, request
│   ├── api/                          # Axios instance + mock adapter
│   ├── pricing/                      # Budget estimation logic
│   └── utils/                        # cn(), formatBDT(), formatUSD()
├── services/                         # API service layer (bookings, leads, halls, etc.)
├── store/                            # Zustand stores (auth, enquiry, ui)
└── types/
    └── index.ts                      # Shared TypeScript interfaces
```

---

## Key Utility Functions

### `cn(...classes)` — `src/lib/utils/cn.ts`
Combines `clsx` and `tailwind-merge`. Merges conditional Tailwind classes safely (removes duplicates, handles conflicts).
```ts
cn("px-4 py-2", isActive && "bg-accent text-white", className)
```

### `formatBDT(amount)` / `formatUSD(amount)` — `src/lib/utils/format.ts`
Formats numbers as Bengali Taka (৳) or US Dollar with locale-aware separators.

### `calculateEstimate(input)` — `src/lib/pricing/estimate.ts`
Computes venue rental + catering + decoration + add-on cost from an `EstimateInput` object. Used by `BudgetCalculator`.

---

## Environment & Deployment

- **Runtime:** Node.js (server components) + static export capable
- **Dev server:** `npm run dev` → Turbopack on `localhost:3000`
- **Build:** `npm run build` → generates optimised production bundle
- **Env file:** `.env.local` (API base URL, feature flags)
- **Target:** Vercel / any Node.js host
