# ICCB — International Convention City Bashundhara

Website and CRM dashboard for **International Convention City Bashundhara (ICCB)**, Dhaka, Bangladesh.

The app has two parts:

| Part | URL | What it is |
|---|---|---|
| Public website | `/` | Multilingual site: venues, services, booking request, enquiries, chatbot |
| CRM dashboard | `/dashboard` | Bookings, sales, marketing, operations and admin for ICCB staff |

**There is no backend.** All data is sample data stored in the browser (localStorage). The public website and the dashboard share that data, so a booking request sent on the website appears in the dashboard straight away, in the same browser.

Every dashboard route is explained in [`dashboard.md`](./dashboard.md).

---

## Getting started

Requirements: Node.js 18+ and npm 9+.

```bash
npm install
npm run dev        # http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (vitest) — ICCB pricing engine and seed data |
| `npx tsc --noEmit` | Type check |

### Trying the dashboard

1. Open `/dashboard/sign-in`.
2. Pick a role card: Admin, Sales Manager, Sales Executive, Marketing, Operations or Accounts. If you skip this step, you are signed in as Admin.
3. To see another role's view, use **Switch role** in the avatar menu (top right).
4. To start over, go to **Admin → Settings → Data → Reset demo data**.

Sign-in is a demo role picker, not real authentication.

---

## Public website

The default language (`en`) has no URL prefix. Other languages use `/bn/`, `/ar/` (right-to-left) and `/zh/`.

| Route | Page | Connected to the CRM? |
|---|---|---|
| `/` | Home | Testimonials come from the website CMS |
| `/venues`, `/venues/[slug]` | Halls | Venue views are recorded in Analytics |
| `/services`, `/services/[slug]` | Services | — |
| `/expo-zone` | Expo Zone | — |
| `/booking` | Multi-step booking request with live availability and estimate | Creates a client, a booking (Requested), an estimate and a notification |
| `/enquiry` | General enquiry | Goes to the Enquiries inbox and Leads |
| `/ask` | Ask a question | Goes to the Enquiries inbox |
| `/contact` | Contact form | Goes to the Enquiries inbox |
| `/evaluation?b=<bookingId>` | Client "Evaluation of Service" form | Saved to the booking's feedback |
| `/faq` | FAQ | Comes from the website CMS |
| `/about`, `/why-iccb`, `/gallery`, `/news`, `/menu`, `/ventures` | Content pages | — |
| `/privacy`, `/terms`, `/thank-you` | Legal and thank-you pages | — |

The **chatbot** creates a lead whenever a visitor types a Bangladeshi mobile number. Every page view is recorded for **Marketing → Analytics**.

---

## Project structure

```
src/
├── app/
│   ├── [locale]/(publicRoute)/        # Public pages (next-intl)
│   └── (dashboardRoute)/dashboard/
│       ├── sign-in/                   # Demo role picker
│       └── (app)/…                    # 22 dashboard routes (inside the shell)
├── components/
│   ├── dashboard/                     # CRM: ui/, shell/, bookings/, workspace/, documents/, …
│   ├── booking/                       # Public booking + evaluation forms
│   ├── providers/                     # CrmProvider, PublicCrm (data hydration)
│   └── layout/, sections/, …          # Public site
├── data/crm/                          # CRM seed data (tariffs, bookings, radar, …)
├── lib/crm/                           # Repository, pricing engine, workflow, rules, documents, permissions
├── services/crm/                      # Async services + TanStack Query hooks
└── types/crm/                         # CRM types
```

### How the data works

- **Storage:** one zustand store per table, saved in localStorage under `iccb-crm-v1:<table>`.
- **Services:** they add 150–350 ms of simulated delay, so loading states look real. They can later be swapped for real API calls without changing the UI.
- **TanStack Query:** wraps the services, with optimistic updates. Queries refresh automatically whenever a store changes.
- **Pricing engine:** `src/lib/crm/pricing.ts` contains pure functions built on ICCB's real tariffs: hall rent, security money, estimate, cancellation charge and capacity check.
- **Validation:** kept minimal. Forms only require a name and a phone number.

---

## Tech stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS v4, `next-themes` (light / dark) |
| State and data | Zustand 5 (persist), TanStack Query 5 |
| Animation | Framer Motion, Lenis |
| Dashboard UI | Radix Dialog, cmdk (⌘K), dnd-kit (Kanban and calendar), sonner (toasts), Recharts |
| Documents | `@react-pdf/renderer` (PDF), print-ready A4 HTML |
| i18n | next-intl 4 (en, bn, ar, zh) |
| Icons | Phosphor Icons |
| Tests | Vitest |

---

## Design

- **Public site:** Inter + Oswald, brand red, light and dark mode. See [`design.md`](./design.md).
- **Dashboard:** Noto Sans, brand `#E24F5F` on white, and no black in light mode. Its tokens are scoped to the `.crm` class in `globals.css`.

---

## Notes

- All names, phone numbers and companies in the sample data are fake and marked `isSample`.
- There is no online payment anywhere. Money receipts are recorded offline in the dashboard.
- PDFs use a built-in font, so the Taka sign prints as "Tk". The on-screen preview shows "৳".

**GitHub:** [Solvantric/iccb-update](https://github.com/Solvantric/iccb-update)
