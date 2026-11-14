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
| `/dashboard` | **Home page.** It changes by role. Sales staff see KPIs, the first-response timer, revenue and status charts, pending approvals, today's tasks, upcoming events, overdue items and hot leads. Marketing, Ops and Accounts each get their own widgets. Every role sees **Events at risk**. Admin and SM also see **Value delivered this month** (the ROI widget). | Everyone |

## Sales

| Route | Why | Who |
|---|---|---|
| `/dashboard/sales/bookings` | **All bookings** in a table or a Kanban board. Drag a card to change its status (the checklist must be complete first). Filter by hall, date, type, rep or source; bulk-assign, export, or open the Trash. | Admin, SM, SE (own) |
| `/dashboard/sales/bookings/new` | **Create a booking** for a walk-in or phone client. Step 1 is the **Smart Hall Matchmaker** (skip it if you already know the hall). Step 2 is the same form as the website, plus source and representative. | Admin, SM, SE |
| `/dashboard/sales/bookings/[id]` | **Booking workspace**, where most of the work happens. See the section below. | Admin, SM, SE, read-only for Ops and Accounts |
| `/dashboard/sales/calendar` | **Availability.** Month, week and hall-timeline views. Click an empty day to book it; drag a booking to shift its date (shows the charge and needs approval). | Sales, Ops, Accounts |
| `/dashboard/sales/clients` | **Client list.** Profile drawer, bookings, total paid, documents, notes and tags. Warns about duplicate mobile numbers. | Sales, Accounts (read) |
| `/dashboard/sales/enquiries` | **Inbox** for website enquiries, Ask-a-question, contact forms and chatbot leads. Reply, assign, **convert to booking** or close. | Sales, Marketing (read) |
| `/dashboard/sales/follow-ups` | **Tasks and reminders:** calls, meetings, balance due, documents due, PPM due, refunds due and repeat events. Shown as a list or a calendar; tick done or snooze. | Sales |
| `/dashboard/sales/invoices` | **Every document:** estimates, invoices, money receipts, booking forms and refund notes. Preview, download as PDF or print. Also shows outstanding balances and refunds due. Extra tabs: **Collections** (Accounts, SM, Admin) and **Leakage** (the Leakage Guard report). | Sales, Accounts |

### Booking workspace tabs (`/sales/bookings/[id]`)

| Tab | Why |
|---|---|
| Overview | Event, days table, guests, layout and capacity warning. Request steps: assign → call → meeting. |
| Services & Bill | Add catering menus, ICCB services, catalogue charges, an outside decorator or custom items. Request a discount; large discounts need approval. The **Leakage Guard** card at the top lists items that are not on the bill. Pick the outside decorator from the vendor list, which shows its score. Enter an **offer code** here. |
| Estimate & invoice | Line items and totals. Generate the estimate, booking form or invoice. Client acknowledgement and signature. Version history. The final invoice is **blocked** while any leakage item is still open. |
| Payments | Money receipts (cash, cheque or pay order), the 60% advance bar, the balance due date and security money. |
| Documents | NID/Passport check and the required-documents checklist with due dates. Overdue items turn red. Files the client uploads through the portal show **Accept / Reject** buttons. |
| PPM | Program Preparation Meeting minutes with the 24-item agenda (due at least 15 days before the event). **Chargeable items agreed** (chair covers, chairs, archways, food stalls, external lighting, sound provider) feed the Leakage Guard. The client's portal answers appear here and prefill empty agenda items. |
| Event day | Program Fact Sheet. Extra hours and extra guests are added to the invoice automatically. |
| Feedback & damage | Client evaluation (14 criteria), damage claim and the security-money refund. |
| Activity | Timeline of every change, call and note. Use `@Name` to mention a colleague. |

The **status stepper** on the left lists what is still missing before the booking can move to the next status. The **right rail** holds the client contact, open tasks and quick notes.

On a **Confirmed** booking, the header also shows the **readiness ring**; hover it to see the 5 areas. A red **"N new from client"** badge appears when the client did something in the portal. **More → Client portal** opens the portal link manager.

## Marketing

| Route | Why | Who |
|---|---|---|
| `/dashboard/marketing/leads` | **Lead pipeline:** intake flow, SOP, conversion by source, hot-lead alerts and lost reasons. Includes lead CRUD. | Marketing, SM |
| `/dashboard/marketing/analytics` | **Website traffic:** visitors, sources, languages, top pages and the booking funnel (Visit → … → Confirmed). | Marketing, SM |
| `/dashboard/marketing/opportunity-radar` | **Upcoming events ICCB can pitch to.** Each card shows a score, AI summary and pitch. Convert one to a lead, write a pitch, or press Refresh to find new items. | Marketing, SM (read) |
| `/dashboard/marketing/demand` | **Demand heatmap** (hall × month) plus **Smart Pricing** suggestions. "Apply" creates a special tariff for that month. The **Idle dates** tab turns empty hall-days into offers. | Marketing, SM (approves offers) |
| `/dashboard/marketing/content` | **Website CMS:** hero, venues, services, FAQ, testimonials and more. Edit, reorder, publish or hide. Changes show on the public site. | Marketing |

## Operations

| Route | Why | Who |
|---|---|---|
| `/dashboard/operations/events` | **Event-day board:** confirmed events for today, this week or upcoming, with document warnings and a **readiness ring** on each card. Sort by "Most at risk", filter by level, and see the "Next 30 days" strip. Opens the PPM, fact sheet and damage claim. | Ops |
| `/dashboard/operations/ppm` | **All PPMs** sorted by due date (due, scheduled, done). Fill in or export the minutes. | Ops |
| `/dashboard/operations/quality` | **Evaluations** (scores by criterion and by hall), **damage claims** (by department) and the **Vendors** tab (the vendor and decorator scorecard). | Ops |

## Admin

| Route | Why | Who |
|---|---|---|
| `/dashboard/admin/pricing` | **Every rate:** hall tariff, security money, service charges, decoration, expo zones, cancellation chart, taxes, menus and services. Each rate has an "effective from" date, so new prices only apply to new estimates. | Admin |
| `/dashboard/admin/venues` | **Halls and expo zones:** facilities, generator capacity, photos and capacity by layout. | Admin |
| `/dashboard/admin/users` | **Users and roles,** active or inactive, and the order in which new requests are assigned to sales reps. | Admin |
| `/dashboard/admin/settings` | **Rules and tools:** organisation info, number formats, balance-due days (15 or 7), discount limit and holidays. **Business features:** max offer discount, portal link expiry, vendor score thresholds and readiness weights. Also data reset, export and import, and the **audit log**. | Admin |

## Public: client portal

| Route | Why | Who |
|---|---|---|
| `/portal/[token]` (also `/bn/…`, `/ar/…`, `/zh/…`) | **Client self-service page.** It opens from a secure link with no login. Search engines are told not to index it. See feature 3 below. | The client |

## Personal

| Route | Why | Who |
|---|---|---|
| `/dashboard/profile` | Your details, password (demo), notification settings, theme and language (EN/BN). | Everyone |

---

## Business features

These 7 features sit inside existing pages; there are no new dashboard routes. Every decision listed below (waive, add to bill, approvals, blacklist, portal links, document review) is written to the **audit log**.

### 1. Revenue Leakage Guard
**Problem:** extras used on the event day are not billed.
**What it does:** checks the PPM, the Program Fact Sheet and the booking for chargeable items that are missing from the bill. It covers extra hours, extra guests above 10%, service-charge gap, generator time, chair covers, extra chairs, external lighting, hall set-up, extra archway gates, outside decoration fee, outside food stalls and Food VAT. An unapproved discount is flagged, but it has no amount.
**Where:** Booking → **Services & Bill** (alert card: Add to bill, Add all, Waive) and Sales → Invoices → **Leakage** (KPIs, findings table and filters, chart of recovered amounts by rule).
**Rules:** the final invoice can't be generated while items are open. Only SM or Admin can waive, and a reason is required. Findings recalculate whenever the PPM, fact sheet or bill lines change.
**Who:** Sales add to the bill; SM and Admin waive; Accounts can view.

### 2. Event Readiness Score
**Problem:** payment, documents, the PPM or permissions are still missing close to the event.
**What it does:** gives every Confirmed event a 0–100 score from five areas: Payment 30, Documents 25, PPM 20, Permissions 15, Vendors 10. An item that is not yet due counts as half done; an overdue item counts as zero. **Ready** is 80 and above, **Attention** 50–79, **Risk** below 50.
**Automation:** at D-15, D-7 and D-3 it creates follow-up tasks for anything incomplete. If an event is at Risk 7 days or less before the date, it notifies the Sales Manager and Operations.
**Where:** the ring in the booking header, the Events board (sort by risk, filter by level, 30-day strip), and the **Events at risk** widget on the Overview.
**Who:** all staff can view it.

### 3. Client Self-Service Portal
**Problem:** paperwork, repeated phone calls and chasing documents.
**What it does:** a secure link with no login. In English, Bangla, Arabic or Chinese, the client can see their status timeline, booking details, bill and payment schedule (with a PDF download and how to pay; there is no online payment). They can also upload documents (image or PDF, up to 5 MB), answer the pre-PPM questions, accept ICCB's policies by typing their full name, give feedback after the event, and call or WhatsApp their representative.
**Staff side:** Booking → More → **Client portal** to create, copy, share on WhatsApp (EN or BN), regenerate or revoke the link. Uploads are reviewed in the Documents tab; a rejection note is shown to the client. Every client action notifies the assigned representative.
**Rules:** the link expires 30 days after the event (this can be changed in Settings). Expired, revoked and unknown links show a friendly page with ICCB's contact numbers. For now the token is only checked in the browser; this moves to the backend later.
**Who:** Sales create and revoke links.

### 4. Idle Date Recovery
**Problem:** empty halls earn nothing, especially on weekdays and from February to November.
**What it does:** shows every hall-day in the next 90 days that has no request or confirmed booking (preparation days count as used), with the rent at risk. Select cells by clicking or dragging, then use **Create offer** (3 steps):
1. Dates and discount.
2. Audience: lost leads, enquiries not converted, past clients, Opportunity Radar organizers and repeat-event organizers, with live counts. You can untick individual contacts.
3. Message: English and Bangla templates with placeholders and a live preview.

Then send the offer one by one on WhatsApp, copy the contact list, or email it.
**Tracking:** the client's offer code is entered in the booking's Services & Bill tab. It adds a discount line and links the booking to the offer. The offers table shows sent, responded, booked, revenue recovered and conversion rate.
**Rules:** a discount above the max offer discount (Settings) needs Sales Manager approval.
**Where:** Marketing → Demand → **Idle dates**.

### 5. Smart Hall Matchmaker + 2-minute quote
**Problem:** answering "Which hall, and how much?" takes too long on the phone.
**What it does:** you enter the event type, guests (or square feet for an exhibition), layout, a date or a flexible month, an optional budget, food and decoration. It checks capacity, looks for availability within ±14 days or across the whole month, prices each option with the pricing engine, and shows up to 3 options: **Best fit**, **Best value** and **Alternative date**. Each option shows utilisation, the estimated total with a breakdown, the saving (for example "Wednesday instead of Friday saves ৳50,000") and any warnings. If the guests are more than any single hall holds, it suggests combined halls or an Expo Zone.
**Actions:** **Use this option** (prefills the booking form), **Download quote** (a PDF marked Provisional) and **Share on WhatsApp**.
**Where:** Sales → New booking (step 1), and ⌘K → **Find a hall**.
**Who:** Sales.

### 6. Collections & Cash-flow Forecast
**Problem:** there is no single view of dues, overdue balances, security money held and refunds.
**What it does:** builds a due schedule for each booking. The advance (60% of the venue rent) is due at confirmation, the balance by the event minus the balance-due days, and extras within 7 days after the event. Overdue money is grouped by age: 1–7, 8–15, 16–30 and 30+ days.
**Where:** Sales → Invoices → **Collections**:
- KPIs: expected in 30, 60 and 90 days; overdue; collected this month; security held; refunds due or overdue.
- Receivables table: record a payment, send a reminder (EN or BN, logged to Activity), set a promise-to-pay date.
- Refund queue: security minus damages minus dues, due 15 working days after the event (Fri, Sat and holidays skipped). Mark "cheque prepared" or "refunded".
- 13-week chart of expected vs received, aging donut, CSV export.

**Who:** Accounts, SM, Admin.

### 7. Vendor & Decorator Scorecard
**Problem:** outside vendors cause damage and break ICCB's premises rules.
**What it does:** every vendor starts at 100. Penalties: late set-up −10, dismantling after 24 h −15, each of the 22 premises-guideline violations −10, damage up to ৳20k −10 and above −20. The rating adds or removes (rating − 3) × 5. The score is the average of the last 10 reviews. Suggested status: active at 70+, warning at 50–69, below 50 review for blacklist (Admin confirms).
**Where:** Operations → Quality → **Vendors**: vendor table, a detail drawer (history, damages chart, violations), add/edit/delete, and the review form (damage is prefilled from the Damage Claim). A "Review vendor" task is created after each completed event that used an outside vendor. In the booking's Services & Bill tab the decorator picker shows the score badge. A vendor on warning gets an amber notice; a blacklisted vendor can only be chosen by an Admin with a written override reason.
**Who:** Ops write reviews and manage vendors; only Admin can blacklist or lift a blacklist.

### ROI widget: "Value delivered this month"
**Where:** Overview, for Admin and SM. It shows five figures, each with a 6-month sparkline and a link to its report:
- Revenue recovered by the Leakage Guard
- Revenue from idle-date offers
- Average first-response time (target under 2 h)
- On-time collections %
- Events at risk prevented (Risk at D-15, Ready on the day)

### Who can do what

| Feature | Who |
|---|---|
| Leakage | Sales: add to bill · SM / Admin: waive |
| Readiness | All staff: view |
| Portal | Sales: create / revoke |
| Idle offers | Marketing: create · SM: approve above the max discount |
| Matchmaker | Sales |
| Collections | Accounts, SM, Admin |
| Vendors | Ops: reviews and records · Admin: blacklist |

> **Demo data:** sample data exists for every feature (leakage on completed events, events at each readiness level, 2 portal links such as `/portal/ICCBdemoPortalLink000001`, 3 offers, 8 vendors, overdue balances in every aging bucket and pending refunds). A browser that used the CRM before needs **Admin → Settings → Data → Reset demo data** to load them.

---

## Shortcuts available on every page

- **⌘K / Ctrl K:** search bookings (by BF No), clients (by name or mobile) and pages; quick actions, including **Find a hall (2-minute quote)**.
- **+ Create:** new booking, client, task or enquiry.
- **Bell:** notifications. Hot leads also pop up as a toast with a red bar.
- **Theme and language** toggles in the top bar.
