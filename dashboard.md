# ICCB Dashboard — Route Guide

This guide covers every dashboard page: **what it is for** and **who uses it**. All routes start with `/dashboard`.

> **The booking flow in one line:** a client fills in the website form, or staff add a walk-in, and the date is held (**Reserved**) → the representative calls, meets the client, adds add-ons and records a payment, then clicks **Confirm booking** (**Booked**) → after the event, **Close event** (**Closed**).
> **Cancel** releases the date (**Cancelled**). A hall and date can only have one Reserved or Booked record.

**Roles:** Admin · Sales · Operations · Marketing. The sidebar only shows the pages a role can use. Sign-in is a demo role picker, not real authentication.

**Data:** everything is sample data stored in the browser (`localStorage`, key prefix `iccb-crm-v4`). There is no backend. The website and the dashboard share the same browser storage.

---

## Sidebar

| Group | Pages |
|---|---|
| Overview | Overview |
| Sales | Leads · Bookings · Clients · Calendar · Enquiries · Invoices |
| Operations | PPM · Quality |
| Marketing | Analytics · Opportunity Radar · Demand & Pricing · Website content |
| Admin | Pricing · Venues · Users |
| Personal | Profile |

Settings (`/dashboard/admin/settings`) is hidden from the sidebar but still opens by URL. It holds organisation details, payment terms, record counts, **Export JSON** and **Reset demo data**.

## Sign-in and public pages

| Route | Why |
|---|---|
| `/dashboard/sign-in` | Demo login. Pick Admin, Sales, Operations or Marketing. |
| `/dashboard/review/[token]` | **Client review form**, opened from a link staff share (see Quality). It has no sidebar and needs no sign-in. Each link works once. |

## Overview

| Route | Why | Who |
|---|---|---|
| `/dashboard` | **Home page.** Period (this month / last month / this year) and hall filters. Four KPIs: new leads, booked events, money collected, meetings today. Cards for upcoming events, today's meetings, outstanding dues and the latest enquiries, plus a bookings-per-month chart. | Everyone |

## Sales

| Route | Why | Who |
|---|---|---|
| `/dashboard/leads` | **New Reserved requests**, newest first. Call or WhatsApp the client, schedule a meeting, mark them "Contacted", open the booking or cancel it (which frees the date). | Admin, Sales |
| `/dashboard/bookings` | **Every booking.** The table shows ref, client, event (with the date under it), hall, status, total and due. Filter by status, search, hall or payment, and sort. Row actions: PDF, Close event, Delete (with Undo). **New booking** opens the same form as the website. **Export PDF** prints the filtered list. | Admin, Sales, Operations |
| `/dashboard/bookings/[id]` | **Booking detail.** See the section below. | Admin, Sales, Operations |
| `/dashboard/clients` | **Client list** (Individual / Corporate / Government / NGO). The KPIs show repeat clients and outstanding due. The table shows client, type, mobile and the next or last event. The side drawer shows contact details, money, bookings, payments, **New booking** and a **statement PDF**. A client is created automatically from the mobile number when someone books. | Admin, Sales |
| `/dashboard/calendar` | **Month view.** Each date shows chips with "Name · Event" in orange (Reserved), red (Booked) or grey (Closed). Click a chip to open the booking; click an empty day to book it. On mobile it becomes an agenda list. | Admin, Sales, Operations |
| `/dashboard/enquiries` | **Every website form:** booking form, contact, ask-a-question, enquiry and chatbot. A "New" dot shows until the item is opened. The drawer shows the full message, call / WhatsApp buttons and a link to the booking. | Admin, Sales |
| `/dashboard/invoices` | **Every payment recorded by staff.** The table shows receipt, client, event (with the payment date under it), amount, method (with the payment type under it) and received by. Filter by date range, type, method or search. Shows "Total collected" and security money held. Receipt PDF for each row, and the filtered list exports as PDF. | Admin, Sales |

### Booking detail tabs (`/bookings/[id]`)

The header shows the client, event, status, hall, date, slot and guests, with **Confirm booking** (when Reserved) or **Close event** (when Booked), **Download PDF**, and a ⋯ menu (Schedule meeting, Cancel, Delete). Below the header is a strip showing **Total · Paid · Due · Security**.

| Tab | Why |
|---|---|
| Details | Event card: name, type, hall, date, time slot, layout, guests, cars, coordinator, source and note. Client card: name, mobile, email, organisation, client no and a link to the client. Both are edited inline. Also shows the booking's meetings and its history (last 6 changes). |
| Add-ons & Bill | **Venue:** extra hours. **Decoration:** ICCB Basic / Standard / Premium, or an outside firm in category A/B/C (fee) with the firm name. **Food:** breakfast, lunch, snacks and dinner, each with a menu package and number of persons. **ICCB services** from the catalogue, with quantity. **Other items** (custom lines). **Discount** (an amount, or 5/10/15%). The bill updates live, grouped as Venue / Decoration / Food / Services / Other, then subtotal, discount, VAT on food, total, paid and due, plus the 60% advance and the security money. Buttons: **View invoice** (opens the PDF in the page) and download bill. |
| Payments | Paid-vs-total progress bar, the advance, security required / held / damages. List of payments with type (Advance, Installment, Final, Security deposit, Security refund), method, reference, received by and **View receipt**. **View invoice** and **Add payment** (offline record only, with no online gateway). |

## Operations

| Route | Why | Who |
|---|---|---|
| `/dashboard/operations/ppm` | **Meetings:** PPM, site visits, follow-up calls and final briefings, grouped as Today / Upcoming / Past. The status (Scheduled / Done / Cancelled) changes right in the list. Edit to add an outcome. Meeting PDF. KPIs: today, next 7 days, PPMs, done. Meetings come from the website form checkbox, from Leads, or from **New meeting**. | Admin, Sales, Operations |
| `/dashboard/operations/quality` | **Quality after events.** KPIs: average rating, feedback collected, happy clients, damages claimed. One chart of the score by area. Table of past events with staff-entered feedback (5 areas, 1–5 stars) and **damage claims**, which are deducted from security money. **Client reviews** button: see below. | Admin, Operations |

### Client reviews (Quality → "Client reviews")

- A side panel with **10 questions** (booking, sales help, cleanliness, set-up, food quality, food service, sound and light, parking, value, booking again). Each is rated **Bad · Normal · Good · Excellent**, followed by a written review.
- **Create & copy link** for a booking, or as a general link. Share it by copying, by WhatsApp (the message is pre-filled) or by opening it.
- **Who reviewed:** each link belongs to one booking (client and event). The form asks for the name and mobile, pre-filled from the booking, and records the time. A link can be used only once, and the booking history gets "Client review submitted".
- Answered links show the overall rating and every answer. The Quality page also shows the 3 latest reviews.
- **Limitation:** data is stored in the browser, so a link only works in the same browser until a backend is connected.

## Marketing

| Route | Why | Who |
|---|---|---|
| `/dashboard/marketing/analytics` | **Website traffic.** Range (7 / 30 / 90 days), source and device filters. KPIs: visitors, form submissions, conversion and average daily visitors. **Daily visitors** strip. **Visitors by source** chart and the **funnel** (Visit → Venue page → Form opened → Form submitted). **Source performance** table (visitors, share, forms and conversion per channel). **Venue interest** (venue page views compared with real booking requests per hall). **Website leads → bookings** (forms received, still reserved, confirmed, cancelled, the form-to-booking rate and the latest requests). Visitors by device and top pages. | Admin, Marketing |
| `/dashboard/marketing/opportunity-radar` | **Events that could come to ICCB.** KPIs: open opportunities (and how many were added as leads), National, International and hot leads (80+). National / International tabs with counts. Each card shows the score ring, date, location, guests, organiser, **best hall** (the smallest one that fits), **estimated value** (weekday rent plus lunch for every guest) and the days until the event. **Add as lead** opens the New booking form prefilled and marks the card "Lead added". Dismiss or Restore. **Refresh** adds a new sample idea; live AI comes later. Below the cards: **Coming up** (the nearest dates) and **By category**. | Admin, Marketing |
| `/dashboard/marketing/demand` | **Demand & Pricing.** Heat-map calendar of requests per date (3 or 6 months), with filters for hall, event type and request status. Suggestions: "Increase price by 10%" for busy dates and "Offer 10% off" for quiet weekdays. **Apply** adds a special price in Pricing. | Admin, Marketing |
| `/dashboard/marketing/content` | **Website content:** hero slides, venues, gallery, FAQ and testimonials. Add, edit, delete, publish or hide, and drag to reorder. Changes show on the website right away. | Admin, Marketing |

## Admin

| Route | Why | Who |
|---|---|---|
| `/dashboard/admin/pricing` | Tabs: **Add-ons & food** (decoration prices, default meal rates, service charge, VAT %), **Menu packages** (CRUD), **ICCB services** (CRUD, with how many bookings use each), **Security & weekends** (security money by event type, weekend days, refund period) and **Special prices** (date ranges ±%). | Admin |
| `/dashboard/admin/venues` | **Halls:** code, capacity, area, weekday / weekend / extra-hour rates, facilities, active toggle and upcoming bookings. Inactive halls are hidden from the booking form. | Admin |
| `/dashboard/admin/users` | **Users:** name, email, phone, role and active status, with a workload count (meetings, payments, events coordinated). | Admin |

## Personal

| Route | Why | Who |
|---|---|---|
| `/dashboard/profile` | Your name and email, a role switch, and **My activity**: upcoming meetings, payments you received and events you coordinate. | Everyone |

---

## PDFs

All PDFs use one shared A4 template: the ICCB logo and name, a red accent line, and the address and phone in the footer. Money prints as "Tk" because the PDF font has no ৳ sign.

| PDF | Where |
|---|---|
| Booking | Bookings table, booking header |
| Bill | Add-ons & Bill tab |
| **Invoice** (bill + all payments) | **View invoice** on the Add-ons & Bill and Payments tabs. It opens in the page, with Download and Open-in-new-tab buttons. |
| Payment receipt | Payments tab (**View receipt**), Invoices |
| Meeting note | PPM |
| Client statement | Clients |
| Bookings list / Payments list | **Export PDF** on Bookings and Invoices |

## Filters

Every list page has a short filter row (at most 4–5 controls: search, a few dropdowns and sort), a result count and a "Clear filters" chip.

## Website ↔ dashboard

- The website **booking form** creates a Reserved booking, an enquiry and a client, plus a meeting if the visitor asks for one. The form's date picker hides dates that are already taken.
- The **contact, ask, enquiry and chatbot** forms create question enquiries.
- **Website content** (hero, venues, gallery, FAQ, testimonials) is read by the homepage and the FAQ page.
- Website visits feed **Analytics**.

## For developers

- Pages live in `src/app/(dashboardRoute)/dashboard/(app)/…`, and their components are in `src/components/dashboard/pages/*`.
- Data: `src/types/crm`, `src/data/crm/seed.ts`, `src/lib/crm/{db,repository,bill,hooks,format,permissions}.ts`, `src/services/crm/index.ts` (all actions).
- The bill is the pure function `calcBill()` in `src/lib/crm/bill.ts`; run the tests with `npx vitest run`.
- PDFs: `src/lib/pdf/*` and `src/components/dashboard/ui/PdfViewer.tsx`.
- Check your work with `npx tsc --noEmit` and `npx eslint .`.
