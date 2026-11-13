# ICCB CRM Dashboard — Route Guide

This guide covers every dashboard page: **what it is for** and **who uses it**. All routes start with `/dashboard`.

> **The booking flow in one line:** a request comes in (**Requested**) → the representative meets the client, the advance is paid and a manager approves (**Confirmed**) → the event happens, the bill is settled and the security money is refunded (**Completed**).
> A booking can also be **closed** as Cancelled or Lost.

**Roles:** Admin · Sales Manager (SM) · Sales Executive (SE) · Marketing · Operations (Ops) · Accounts. The sidebar only shows the pages a role can use.

---

## Sign-in

| Route | Why |
|---|---|
| `/dashboard/sign-in` | Demo login. Pick a role card to see that role's view. This is not real authentication. |

## Overview

| Route | Why | Who |
|---|---|---|
| `/dashboard` | **Home page.** It changes by role. Sales staff see KPIs, the first-response timer, revenue and status charts, pending approvals, today's tasks, upcoming events, overdue items and hot leads. Marketing, Ops and Accounts each get their own widgets. | Everyone |

## Sales

| Route | Why | Who |
|---|---|---|
| `/dashboard/sales/bookings` | **All bookings** in a table or a Kanban board. Drag a card to change its status (the checklist must be complete first). Filter by hall, date, type, rep or source; bulk-assign, export, or open the Trash. | Admin, SM, SE (own) |
| `/dashboard/sales/bookings/new` | **Create a booking** for a walk-in or phone client. Same steps as the website form, plus source and representative. | Admin, SM, SE |
| `/dashboard/sales/bookings/[id]` | **Booking workspace**, where most of the work happens. See the section below. | Admin, SM, SE, read-only for Ops and Accounts |
| `/dashboard/sales/calendar` | **Availability.** Month, week and hall-timeline views. Click an empty day to book it; drag a booking to shift its date (shows the charge and needs approval). | Sales, Ops, Accounts |
| `/dashboard/sales/clients` | **Client list.** Profile drawer, bookings, total paid, documents, notes and tags. Warns about duplicate mobile numbers. | Sales, Accounts (read) |
| `/dashboard/sales/enquiries` | **Inbox** for website enquiries, Ask-a-question, contact forms and chatbot leads. Reply, assign, **convert to booking** or close. | Sales, Marketing (read) |
| `/dashboard/sales/follow-ups` | **Tasks and reminders:** calls, meetings, balance due, documents due, PPM due, refunds due and repeat events. Shown as a list or a calendar; tick done or snooze. | Sales |
| `/dashboard/sales/invoices` | **Every document:** estimates, invoices, money receipts, booking forms and refund notes. Preview, download as PDF or print. Also shows outstanding balances and refunds due. | Sales, Accounts |

### Booking workspace tabs (`/sales/bookings/[id]`)

| Tab | Why |
|---|---|
| Overview | Event, days table, guests, layout and capacity warning. Request steps: assign → call → meeting. |
| Services | Add catering menus, ICCB services, catalogue charges, an outside decorator or custom items. Request a discount; large discounts need approval. |
| Estimate & invoice | Line items and totals. Generate the estimate, booking form or invoice. Client acknowledgement and signature. Version history. |
| Payments | Money receipts (cash, cheque or pay order), the 60% advance bar, the balance due date and security money. |
| Documents | NID/Passport check and the required-documents checklist with due dates. Overdue items turn red. |
| PPM | Program Preparation Meeting minutes with the 24-item agenda (due at least 15 days before the event). |
| Event day | Program Fact Sheet. Extra hours and extra guests are added to the invoice automatically. |
| Feedback & damage | Client evaluation (14 criteria), damage claim and the security-money refund. |
| Activity | Timeline of every change, call and note. Use `@Name` to mention a colleague. |

The **status stepper** on the left lists what is still missing before the booking can move to the next status. The **right rail** holds the client contact, open tasks and quick notes.

## Marketing

| Route | Why | Who |
|---|---|---|
| `/dashboard/marketing/leads` | **Lead pipeline:** intake flow, SOP, conversion by source, hot-lead alerts and lost reasons. Includes lead CRUD. | Marketing, SM |
| `/dashboard/marketing/analytics` | **Website traffic:** visitors, sources, languages, top pages and the booking funnel (Visit → … → Confirmed). | Marketing, SM |
| `/dashboard/marketing/opportunity-radar` | **Upcoming events ICCB can pitch to.** Each card shows a score, AI summary and pitch. Convert one to a lead, write a pitch, or press Refresh to find new items. | Marketing, SM (read) |
| `/dashboard/marketing/demand` | **Demand heatmap** (hall × month) plus **Smart Pricing** suggestions. "Apply" creates a special tariff for that month. | Marketing |
| `/dashboard/marketing/content` | **Website CMS:** hero, venues, services, FAQ, testimonials and more. Edit, reorder, publish or hide. Changes show on the public site. | Marketing |

## Operations

| Route | Why | Who |
|---|---|---|
| `/dashboard/operations/events` | **Event-day board:** confirmed events for today, this week or upcoming, with document warnings. Opens the PPM, fact sheet and damage claim. | Ops |
| `/dashboard/operations/ppm` | **All PPMs** sorted by due date (due, scheduled, done). Fill in or export the minutes. | Ops |
| `/dashboard/operations/quality` | **Evaluations** (scores by criterion and by hall) and **damage claims** (by department). | Ops |

## Admin

| Route | Why | Who |
|---|---|---|
| `/dashboard/admin/pricing` | **Every rate:** hall tariff, security money, service charges, decoration, expo zones, cancellation chart, taxes, menus and services. Each rate has an "effective from" date, so new prices only apply to new estimates. | Admin |
| `/dashboard/admin/venues` | **Halls and expo zones:** facilities, generator capacity, photos and capacity by layout. | Admin |
| `/dashboard/admin/users` | **Users and roles,** active or inactive, and the order in which new requests are assigned to sales reps. | Admin |
| `/dashboard/admin/settings` | **Rules and tools:** organisation info, number formats, balance-due days (15 or 7), discount limit and holidays. Also data reset, export and import, and the **audit log**. | Admin |

## Personal

| Route | Why | Who |
|---|---|---|
| `/dashboard/profile` | Your details, password (demo), notification settings, theme and language (EN/BN). | Everyone |

---

## Shortcuts available on every page

- **⌘K / Ctrl K:** search bookings (by BF No), clients (by name or mobile) and pages; quick actions.
- **+ Create:** new booking, client, task or enquiry.
- **Bell:** notifications. Hot leads also pop up as a toast with a red bar.
- **Theme and language** toggles in the top bar.
