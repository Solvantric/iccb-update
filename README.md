# ICCB — International Convention City Bashundhara

Official website and CRM dashboard for **International Convention City Bashundhara (ICCB)**, South Asia's largest convention and exhibition complex, located in Dhaka, Bangladesh.

---

## Overview

This is a full-stack Next.js 16 application combining a **multilingual public website** and an **internal CRM dashboard**. All data is demo/sample — no live backend is connected.

| Part | URL | Description |
|---|---|---|
| Public Site | `/` | Homepage, venues, services, booking, expo zone |
| CRM Dashboard | `/dashboard` | Leads, bookings, revenue, tasks, documents |
| Auth Pages | `/sign-in` | Demo login (no real auth) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Other Commands

```bash
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                   # Root layout — html, body, fonts, ThemeProvider
│   ├── globals.css                  # Design tokens, typography, animations
│   ├── [locale]/
│   │   ├── layout.tsx               # Locale context (next-intl)
│   │   ├── (publicRoute)/           # All public pages
│   │   └── (auth)/                  # Sign-in, sign-up
│   └── (dashboardRoute)/
│       └── dashboard/               # CRM dashboard pages
├── components/
│   ├── layout/                      # Header, Footer, FloatingDock
│   ├── sections/                    # Home page sections
│   ├── booking/                     # Booking form, calendar, calculator
│   ├── dashboard/                   # Dashboard page components
│   ├── motion/                      # RevealBlock scroll animations
│   ├── providers/                   # Theme, locale, query providers
│   └── ui/                          # Toast, Button, badges
├── data/                            # Static demo data (TypeScript)
├── lib/
│   ├── i18n/                        # next-intl routing & navigation
│   ├── api/                         # Axios + mock adapter
│   ├── pricing/                     # Budget estimation logic
│   └── utils/                       # cn(), formatBDT(), formatUSD()
├── services/                        # API service layer
├── store/                           # Zustand state (auth, ui, enquiry)
└── types/index.ts                   # Shared TypeScript interfaces
```

---

## Public Pages

| Route | Page |
|---|---|
| `/` | Home |
| `/venues` | Hall listing |
| `/venues/[slug]` | Hall detail |
| `/services` | Services overview |
| `/services/[slug]` | Service detail |
| `/expo-zone` | Expo Village |
| `/booking` | Availability calendar + budget calculator |
| `/enquiry` | General enquiry |
| `/contact` | Contact |
| `/about` | About ICCB |
| `/why-iccb` | Why choose ICCB |
| `/gallery` | Photo gallery |
| `/news` | News & events |
| `/menu` | Heritage Restaurant menu |
| `/faq` | FAQ |

## Dashboard Pages

| Route | Page |
|---|---|
| `/dashboard` | Overview — KPIs, charts |
| `/dashboard/leads` | Lead pipeline |
| `/dashboard/bookings` | Booking management |
| `/dashboard/calendar` | Monthly event calendar |
| `/dashboard/revenue` | Financial analytics |
| `/dashboard/tasks` | Event preparation tasks |
| `/dashboard/documents` | Contracts & proposals |
| `/dashboard/notifications` | Alert centre |
| `/dashboard/queries` | Client queries |
| `/dashboard/analytics` | Traffic & conversion |
| `/dashboard/radar` | Lead radar / scoring |
| `/dashboard/chats` | Chat inbox |
| `/dashboard/content` | CMS content |
| `/dashboard/settings` | System settings |

---

## Internationalisation

4 locales supported via `next-intl`:

| Code | Language | Direction |
|---|---|---|
| `en` | English (default) | LTR |
| `bn` | Bengali | LTR |
| `ar` | Arabic | RTL |
| `zh` | Chinese | LTR |

The default locale (`en`) renders without a URL prefix — `/` not `/en/`. Other locales prefix: `/bn/`, `/ar/`, `/zh/`.

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion 14, Lenis |
| Carousel | Embla Carousel |
| Forms | React Hook Form + Zod |
| State | Zustand 5 |
| Data fetching | TanStack Query 5 |
| Charts | Recharts 3 |
| Icons | Phosphor Icons |
| i18n | next-intl 4 |
| Theming | next-themes |
| Dates | date-fns 4 |

See [`skill.md`](./skill.md) for the full tech breakdown.
See [`design.md`](./design.md) for the design system reference.

---

## Design System

- **Fonts:** Playfair Display (headings) + DM Sans (body)
- **Primary colour:** `#E24F5F` (brand red)
- **Theming:** Light / Dark via CSS custom properties
- **Motion:** Scroll-triggered blur+rise entrance on all sections
- **Layout:** Max 1440px, fluid padding `clamp(1rem, 4vw, 3rem)`

Full reference → [`design.md`](./design.md)

---

## Notes

- All data is **demo/sample** — no real database or API
- Authentication is **UI-only** — no real session management
- Images from Unsplash (4K, `w=3840&q=95`)
- Built for presentation and development purposes

---

## Repository

**GitHub:** [https://github.com/Solvantric/iccb-update](https://github.com/Solvantric/iccb-update)
