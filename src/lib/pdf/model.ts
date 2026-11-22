/**
 * PDF documents are described as a small, renderer-agnostic model; the shared
 * A4 template (`template.tsx`) draws every one of them the same way.
 */
import type { Booking, Client, Hall, Meeting, Payment } from "@/types/crm";
import { DECORATION_LABELS, MEAL_LABELS, MEALS, MEETING_STATUS_LABELS, RUN_STEPS, STATUS_LABELS } from "@/types/crm";
import type { Bill } from "@/lib/crm/bill";
import { amountInWords, fmtDate, fmtTime, num, shortNo } from "@/lib/crm/format";

export type DocBlock =
  | { type: "heading"; text: string }
  | { type: "kv"; items: [string, string][]; cols?: 2 | 3 }
  | { type: "table"; columns: { label: string; align?: "right"; width?: string }[]; rows: string[][]; foot?: string[] }
  | { type: "totals"; rows: { label: string; value: string; strong?: boolean }[] }
  | { type: "amount"; label: string; value: string; words?: string }
  | { type: "text"; text: string; muted?: boolean }
  | { type: "signature"; labels: string[] };

export interface DocModel {
  fileName: string;
  title: string;
  /** Short right-aligned facts under the title, e.g. Ref no and date. */
  meta: [string, string][];
  blocks: DocBlock[];
  landscape?: boolean;
}

/** Money in PDFs: "Tk 1,25,000" (the PDF font has no ৳ glyph). */
export const tk = (n: number) => `Tk ${num(n)}`;

const today = () => fmtDate(new Date().toISOString());

function billBlocks(bill: Bill): DocBlock[] {
  return [
    { type: "heading", text: "Bill" },
    {
      type: "table",
      columns: [{ label: "Group", width: "13%" }, { label: "Item" }, { label: "Detail" }, { label: "Qty", align: "right", width: "9%" }, { label: "Rate", align: "right", width: "13%" }, { label: "Amount", align: "right", width: "16%" }],
      rows: bill.lines.map((l) => [l.group, l.label, l.detail ?? "", l.qty != null ? num(l.qty) : "", l.rate != null ? num(l.rate) : "", tk(l.amount)]),
    },
    {
      type: "totals",
      rows: [
        { label: "Subtotal", value: tk(bill.subtotal) },
        ...(bill.discount ? [{ label: "Discount", value: `- ${tk(bill.discount)}` }] : []),
        ...(bill.vat ? [{ label: "VAT on food", value: tk(bill.vat) }] : []),
        { label: "Total", value: tk(bill.total), strong: true },
        { label: "Paid", value: tk(bill.paid) },
        { label: "Unpaid", value: tk(bill.due), strong: true },
        ...(bill.security ? [{ label: "Security money (refundable)", value: tk(bill.security) }] : []),
      ],
    },
  ];
}

const addOnText = (b: Booking) =>
  [
    b.addOns.decoration !== "none" ? `${DECORATION_LABELS[b.addOns.decoration]}${b.addOns.decorationFirm ? ` (${b.addOns.decorationFirm})` : ""}` : "",
    ...MEALS.map((m) => (b.addOns[m]?.persons ? `${MEAL_LABELS[m]} × ${b.addOns[m]!.persons}` : "")),
    b.addOns.extraHours ? `Extra hours × ${b.addOns.extraHours}` : "",
    b.addOns.services?.length ? `${b.addOns.services.length} service(s)` : "",
  ]
    .filter(Boolean)
    .join(", ") || "None";

export function bookingDoc(b: Booking, hall: Hall | undefined, bill: Bill): DocModel {
  return {
    fileName: `ICCB-Booking-${shortNo(b.ref)}.pdf`,
    title: "Booking",
    meta: [
      ["Ref no", b.ref],
      ["Status", STATUS_LABELS[b.status]],
      ["Printed", today()],
    ],
    blocks: [
      { type: "heading", text: "Client" },
      { type: "kv", items: [["Name", b.name], ["Mobile", b.mobile], ["Email", b.email ?? "—"], ["Organisation", b.organization ?? "—"]], cols: 3 },
      { type: "heading", text: "Event" },
      {
        type: "kv",
        items: [
          ["Event name", b.eventName],
          ["Event type", b.eventType],
          ["Hall", hall?.name ?? "—"],
          ["Date", fmtDate(b.date, "EEEE, d MMMM yyyy")],
          ["Slot", b.slot],
          ["Layout", b.layout],
          ["Guests", num(b.guests)],
          ["Cars", b.cars ? num(b.cars) : "—"],
          ["Coordinator", b.coordinator ?? "—"],
          ["Add-ons", addOnText(b)],
        ],
        cols: 3,
      },
      ...(b.note ? [{ type: "text", text: `Note: ${b.note}`, muted: true } as DocBlock] : []),
      ...billBlocks(bill),
    ],
  };
}

export function billDoc(b: Booking, hall: Hall | undefined, bill: Bill): DocModel {
  return {
    fileName: `ICCB-Bill-${shortNo(b.ref)}.pdf`,
    title: "Bill",
    meta: [
      ["Ref no", b.ref],
      ["Date", today()],
    ],
    blocks: [
      { type: "kv", items: [["Client", b.name], ["Event", b.eventName], ["Hall · Date", `${hall?.name ?? "—"} · ${fmtDate(b.date)}`]], cols: 3 },
      ...billBlocks(bill),
      { type: "signature", labels: ["Client", "For ICCB"] },
    ],
  };
}

/** Invoice: the bill plus every payment recorded against it. */
export function invoiceDoc(b: Booking, hall: Hall | undefined, bill: Bill, payments: Payment[]): DocModel {
  return {
    fileName: `ICCB-Invoice-${shortNo(b.ref)}.pdf`,
    title: "Invoice",
    meta: [
      ["Invoice no", `INV-${shortNo(b.ref)}`],
      ["Ref no", b.ref],
      ["Date", today()],
    ],
    blocks: [
      {
        type: "kv",
        items: [
          ["Bill to", b.organization ? `${b.name} · ${b.organization}` : b.name],
          ["Mobile", b.mobile],
          ["Email", b.email ?? "—"],
          ["Event", b.eventName],
          ["Hall · Date", `${hall?.name ?? "—"} · ${fmtDate(b.date)}`],
          ["Slot · Guests", `${b.slot} · ${num(b.guests)}`],
        ],
        cols: 3,
      },
      ...billBlocks(bill),
      { type: "heading", text: "Payments received" },
      payments.length
        ? {
            type: "table",
            columns: [{ label: "Receipt", width: "12%" }, { label: "Date", width: "15%" }, { label: "Type" }, { label: "Method" }, { label: "Reference" }, { label: "Amount", align: "right", width: "16%" }],
            rows: payments.map((p) => [p.receiptNo, fmtDate(p.date), p.kind, p.method, p.reference ?? "—", p.kind === "Security refund" ? `- ${tk(p.amount)}` : tk(p.amount)]),
          }
        : { type: "text", text: "No payments recorded yet.", muted: true },
      { type: "signature", labels: ["Client", "For ICCB"] },
    ],
  };
}

export function receiptDoc(p: Payment, b: Booking | undefined, hall: Hall | undefined): DocModel {
  return {
    fileName: `ICCB-Receipt-${p.receiptNo}.pdf`,
    title: p.kind === "Security refund" ? "Security refund" : "Payment receipt",
    meta: [
      ["Receipt no", p.receiptNo],
      ["Date", fmtDate(p.date)],
    ],
    blocks: [
      {
        type: "kv",
        items: [
          ["Received from", b?.name ?? "—"],
          ["Mobile", b?.mobile ?? "—"],
          ["Booking ref", b?.ref ?? "—"],
          ["Event", b?.eventName ?? "—"],
          ["Hall · Date", b ? `${hall?.name ?? "—"} · ${fmtDate(b.date)}` : "—"],
          ["Payment type", p.kind],
          ["Method", p.method],
          ["Reference", p.reference ?? "—"],
        ],
        cols: 3,
      },
      { type: "amount", label: p.kind === "Security refund" ? "Amount refunded" : "Amount received", value: tk(p.amount), words: amountInWords(p.amount) },
      ...(p.note ? [{ type: "text", text: `Note: ${p.note}`, muted: true } as DocBlock] : []),
      { type: "kv", items: [["Received by", p.receivedBy]], cols: 3 },
      { type: "signature", labels: ["Client", "Received by"] },
    ],
  };
}

export function meetingDoc(mt: Meeting, b: Booking | undefined, hall: Hall | undefined): DocModel {
  return {
    fileName: `ICCB-Meeting-${fmtDate(mt.date, "yyyyMMdd")}-${mt.clientName.split(" ")[0]}.pdf`,
    title: "Meeting note",
    meta: [
      ["Date", fmtDate(mt.date)],
      ["Time", fmtTime(mt.time)],
    ],
    blocks: [
      {
        type: "kv",
        items: [
          ["Client", mt.clientName],
          ["Mobile", mt.mobile],
          ["Representative", mt.rep],
          ["Event", b?.eventName ?? "—"],
          ["Hall · Date", b ? `${hall?.name ?? "—"} · ${fmtDate(b.date)}` : "—"],
          ["Type", mt.type],
          ["Location", mt.location ?? "—"],
          ["Status", MEETING_STATUS_LABELS[mt.status]],
        ],
        cols: 3,
      },
      { type: "heading", text: "Agenda / note" },
      { type: "text", text: mt.note || "—" },
      { type: "heading", text: "Outcome" },
      { type: "text", text: mt.outcome || "—" },
      { type: "signature", labels: ["Client", "Representative"] },
    ],
  };
}

export function bookingsListDoc(rows: { b: Booking; hall?: Hall; bill: Bill }[], filterText: string): DocModel {
  return {
    fileName: `ICCB-Bookings-${fmtDate(new Date().toISOString(), "yyyyMMdd")}.pdf`,
    title: "Bookings",
    landscape: true,
    meta: [
      ["Printed", today()],
      ["Records", String(rows.length)],
    ],
    blocks: [
      { type: "text", text: filterText, muted: true },
      {
        type: "table",
        columns: [{ label: "Ref no", width: "13%" }, { label: "Name" }, { label: "Event" }, { label: "Hall", width: "11%" }, { label: "Date", width: "11%" }, { label: "Status", width: "9%" }, { label: "Total", align: "right", width: "11%" }, { label: "Unpaid", align: "right", width: "11%" }],
        rows: rows.map(({ b, hall, bill }) => [b.ref, b.name, b.eventName, hall?.name ?? "—", fmtDate(b.date), STATUS_LABELS[b.status], tk(bill.total), tk(bill.due)]),
        foot: ["", "", "", "", "", "Total", tk(rows.reduce((s, r) => s + r.bill.total, 0)), tk(rows.reduce((s, r) => s + r.bill.due, 0))],
      },
    ],
  };
}

export function invoicesListDoc(rows: { p: Payment; b?: Booking }[], filterText: string): DocModel {
  return {
    fileName: `ICCB-Payments-${fmtDate(new Date().toISOString(), "yyyyMMdd")}.pdf`,
    title: "Payments",
    landscape: true,
    meta: [
      ["Printed", today()],
      ["Records", String(rows.length)],
    ],
    blocks: [
      { type: "text", text: filterText, muted: true },
      {
        type: "table",
        columns: [{ label: "Receipt", width: "8%" }, { label: "Date", width: "10%" }, { label: "Client" }, { label: "Event" }, { label: "Type", width: "11%" }, { label: "Method", width: "11%" }, { label: "Received by", width: "12%" }, { label: "Amount", align: "right", width: "12%" }],
        rows: rows.map(({ p, b }) => [p.receiptNo, fmtDate(p.date), b?.name ?? "—", b?.eventName ?? "—", p.kind, p.method, p.receivedBy, tk(p.amount)]),
        foot: ["", "", "", "", "", "", "Total", tk(rows.reduce((s, r) => s + (r.p.kind === "Security refund" ? -r.p.amount : r.p.amount), 0))],
      },
    ],
  };
}


/** Operations: one-page event sheet for the floor team. */
export function eventSheetDoc(b: Booking, hall: Hall | undefined, menuName: (id?: string) => string | undefined, serviceName: (id: string) => string | undefined): DocModel {
  return {
    fileName: `ICCB-EventSheet-${shortNo(b.ref)}.pdf`,
    title: "Event sheet",
    meta: [
      ["Ref no", b.ref],
      ["Event date", fmtDate(b.date)],
    ],
    blocks: [
      {
        type: "kv",
        items: [
          ["Event", b.eventName],
          ["Client", `${b.name} · ${b.mobile}`],
          ["Hall", hall ? `${hall.name} (${hall.code})` : "—"],
          ["Slot", b.slot],
          ["Layout", b.layout],
          ["Guests / cars", `${num(b.guests)} / ${b.cars ? num(b.cars) : "—"}`],
          ["Coordinator", b.coordinator ?? "—"],
          ["Decoration", `${DECORATION_LABELS[b.addOns.decoration]}${b.addOns.decorationFirm ? ` · ${b.addOns.decorationFirm}` : ""}`],
          ["Extra hours", String(b.addOns.extraHours ?? 0)],
        ],
        cols: 3,
      },
      { type: "heading", text: "Food" },
      {
        type: "table",
        columns: [{ label: "Meal" }, { label: "Menu" }, { label: "Persons", align: "right", width: "18%" }],
        rows: MEALS.filter((m) => b.addOns[m]?.persons).map((m) => [MEAL_LABELS[m], menuName(b.addOns[m]!.menuId) ?? "Standard menu", num(b.addOns[m]!.persons)]),
      },
      { type: "heading", text: "Services" },
      {
        type: "table",
        columns: [{ label: "Service" }, { label: "Qty", align: "right", width: "18%" }],
        rows: [...(b.addOns.services ?? []).map((s) => [serviceName(s.serviceId) ?? "—", num(s.qty)]), ...(b.addOns.custom ?? []).map((c) => [c.name, num(c.qty)])],
      },
      { type: "heading", text: "Run sheet" },
      { type: "table", columns: [{ label: "Step" }, { label: "Done", width: "18%" }], rows: RUN_STEPS.map((s) => [s, b.runSheet?.[s] ? "Yes" : "—"]) },
      ...(b.note ? [{ type: "text", text: `Note: ${b.note}`, muted: true } as DocBlock] : []),
      { type: "signature", labels: ["Coordinator", "Client"] },
    ],
  };
}

/** Client statement: every booking with totals. */
export function clientStatementDoc(c: Client, rows: { b: Booking; hall?: Hall; bill: Bill }[]): DocModel {
  return {
    fileName: `ICCB-Client-${c.clientNo}.pdf`,
    title: "Client statement",
    meta: [
      ["Client no", c.clientNo],
      ["Printed", today()],
    ],
    blocks: [
      { type: "kv", items: [["Name", c.name], ["Type", c.type], ["Organisation", c.organization ?? "—"], ["Mobile", c.mobile], ["Email", c.email ?? "—"], ["Address", c.address ?? "—"]], cols: 3 },
      { type: "heading", text: "Bookings" },
      {
        type: "table",
        columns: [{ label: "Ref no", width: "15%" }, { label: "Event" }, { label: "Hall", width: "13%" }, { label: "Date", width: "12%" }, { label: "Status", width: "10%" }, { label: "Total", align: "right", width: "13%" }, { label: "Unpaid", align: "right", width: "12%" }],
        rows: rows.map(({ b, hall, bill }) => [b.ref, b.eventName, hall?.name ?? "—", fmtDate(b.date), STATUS_LABELS[b.status], tk(bill.total), tk(b.status === "cancelled" ? 0 : bill.due)]),
        foot: ["", "", "", "", "Total", tk(rows.filter((r) => r.b.status !== "cancelled").reduce((s, r) => s + r.bill.total, 0)), tk(rows.filter((r) => r.b.status !== "cancelled").reduce((s, r) => s + r.bill.due, 0))],
      },
    ],
  };
}
