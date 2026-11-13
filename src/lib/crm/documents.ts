/**
 * ICCB document builders → one generic DocModel rendered by both the HTML
 * (print-ready A4) template and the PDF template. Pure functions.
 */
import type { Booking, DocKind, Hall, Payment, Settings, User } from "@/types/crm";
import { CLIENT_TYPE_LABELS, DOC_KIND_LABELS, PAYMENT_METHOD_LABELS } from "@/types/crm";
import type { Estimate } from "./pricing";
import { firstEventDate } from "./pricing";
import { amountInWords, fmtDate, fmtDateTime, fmtTime, taka } from "./format";
import { EVALUATION_CRITERIA, PPM_AGENDA, RATING_LABELS, balanceDueDate } from "./rules";
import { LAYOUT_OPTIONS } from "@/data/crm/capacities";

export type DocBlock =
  | { type: "heading"; text: string }
  | { type: "kv"; items: [string, string][]; cols?: 2 | 3 }
  | { type: "table"; columns: { label: string; align?: "start" | "end" | "center"; width?: string }[]; rows: string[][]; foot?: { label: string; value: string; strong?: boolean }[] }
  | { type: "text"; text: string; muted?: boolean }
  | { type: "amount"; label: string; value: string; words?: string }
  | { type: "image"; src: string; caption: string };

export interface DocModel {
  kind: DocKind;
  title: string;
  number: string;
  version?: number;
  date: string;
  meta: [string, string][];
  blocks: DocBlock[];
  signatures: string[];
  official?: string;
  watermark?: string;
}

export interface DocInput {
  b: Booking;
  est: Estimate;
  payments: Payment[];
  halls: Hall[];
  users: User[];
  settings: Settings;
  number: string;
  version?: number;
  paymentId?: string;
  generatedAt?: string;
  clientNo?: string;
}

export const ICCB_FOOTER = "next to 300 ft. Purbachal Express Highway, Dhaka-1229, Bangladesh";

const t = (n: number, grouping?: Settings["digitGrouping"]) => taka(n, { decimals: true, grouping });
const hallName = (halls: Hall[], id: string) => halls.find((h) => h.id === id);

function lineTable(i: DocInput, includeDamage = false): DocBlock {
  const g = i.settings.digitGrouping;
  const rows = i.est.lines
    .filter((l) => includeDamage || l.group !== "damage")
    .map((l) => [l.hall ?? "ICCB", l.date ? fmtDate(l.date, "dd/MM/yy") : "—", l.time ?? "—", l.particular, l.unit, l.qty.toLocaleString("en-US"), t(l.amount, g)]);
  return {
    type: "table",
    columns: [
      { label: "Center", width: "13%" },
      { label: "Date", width: "9%" },
      { label: "Time", width: "10%" },
      { label: "Particular", width: "34%" },
      { label: "Unit", width: "9%" },
      { label: "Qty", align: "end", width: "8%" },
      { label: "Amount (BDT)", align: "end", width: "17%" },
    ],
    rows,
  };
}

function totals(i: DocInput, extra: { label: string; value: string; strong?: boolean }[] = []): DocBlock {
  const g = i.settings.digitGrouping;
  const e = i.est;
  return {
    type: "table",
    columns: [{ label: "Summary" }, { label: "Amount (BDT)", align: "end", width: "30%" }],
    rows: [
      ["Venue total (rent & venue charges)", t(e.lines.filter((l) => l.group === "venue").reduce((s, l) => s + l.amount, 0), g)],
      ["Event total (services, food & add-ons)", t(e.subtotal - e.lines.filter((l) => l.group === "venue").reduce((s, l) => s + l.amount, 0), g)],
      ["Subtotal", t(e.subtotal, g)],
      [`Food VAT ${e.vatPct}%`, t(e.vat, g)],
      ...(e.ait ? [[`AIT ${e.aitPct}%`, t(e.ait, g)]] : []),
    ],
    foot: [
      { label: "Total", value: t(e.total, g), strong: true },
      { label: "+ Security money (refundable)", value: t(e.security, g) },
      { label: "− Discount", value: t(e.discount, g) },
      { label: "Grand total", value: t(e.grandTotal, g), strong: true },
      ...extra,
    ],
  };
}

function mrTable(i: DocInput): DocBlock {
  const g = i.settings.digitGrouping;
  return {
    type: "table",
    columns: [{ label: "MR No" }, { label: "Date" }, { label: "Method" }, { label: "Purpose" }, { label: "Amount (BDT)", align: "end" }],
    rows: i.payments.length
      ? i.payments.map((p) => [p.mrNo, fmtDate(p.date), `${PAYMENT_METHOD_LABELS[p.method]}${p.chequeNo ? ` #${p.chequeNo}` : ""}`, p.purpose, t(p.amount, g)])
      : [["—", "—", "—", "No payments yet", t(0, g)]],
    foot: [
      { label: "Total received", value: t(i.est.received, g), strong: true },
      { label: "Balance", value: t(i.est.balance, g), strong: true },
    ],
  };
}

function headerMeta(i: DocInput): [string, string][] {
  const b = i.b;
  const halls = [...new Set(b.days.map((d) => hallName(i.halls, d.hallId)?.name))].filter(Boolean).join(", ");
  return [
    ["BF No", b.bfNo],
    ["Client", `${b.contact.name}${b.contact.organization ? ` (${b.contact.organization})` : ""}`],
    ["Event", b.eventTitle],
    ["Center code / name", halls],
    ["Event date", fmtDate(firstEventDate(b))],
    ["Guests (optimum / max)", `${b.guests.optimum} / ${b.guests.maximum}`],
    ["Cars (optimum / max)", `${b.cars.optimum} / ${b.cars.maximum}`],
    ["Mobile", b.contact.mobile],
  ];
}

export function buildDocModel(kind: DocKind, i: DocInput): DocModel {
  const { b, est, settings } = i;
  const g = settings.digitGrouping;
  const date = fmtDate(i.generatedAt ?? new Date().toISOString());
  const base = { kind, title: DOC_KIND_LABELS[kind], number: i.number, version: i.version, date };
  const rep = i.users.find((u) => u.id === b.assignedTo);

  switch (kind) {
    case "estimate":
      return {
        ...base,
        meta: headerMeta(i),
        blocks: [lineTable(i), totals(i), { type: "heading", text: "Money receipts" }, mrTable(i), { type: "text", muted: true, text: `This is a provisional estimate. Rates exclude VAT unless stated. 60% of venue rent as advance confirms the booking; the balance is due at least ${settings.balanceDueDays} days before the event. Payment by cash, pay order or cheque only.` }],
        signatures: ["Prepared by", "Checked by", "Client"],
      };

    case "invoice": {
      const dmg = b.damage?.rows ?? [];
      const dmgTotal = dmg.reduce((s, r) => s + r.qty * r.rate, 0);
      return {
        ...base,
        meta: headerMeta(i),
        blocks: [
          lineTable(i),
          totals(i),
          ...(dmg.length
            ? [
                { type: "heading", text: "Damages (deducted from security money)" } as DocBlock,
                { type: "table", columns: [{ label: "Department" }, { label: "Item" }, { label: "Qty", align: "end" }, { label: "Rate", align: "end" }, { label: "Amount", align: "end" }], rows: dmg.map((r) => [r.department, r.item, `${r.qty} ${r.uom}`, t(r.rate, g), t(r.qty * r.rate, g)]), foot: [{ label: "Total damages", value: t(dmgTotal, g), strong: true }] } as DocBlock,
              ]
            : []),
          { type: "heading", text: "Payments" },
          mrTable(i),
        ],
        signatures: ["Accounts", "Sales Manager", "Client"],
        official: est.balance <= est.security ? "Settled" : undefined,
      };
    }

    case "money_receipt": {
      const p = i.payments.find((x) => x.id === i.paymentId) ?? i.payments[i.payments.length - 1];
      if (!p) return { ...base, meta: [], blocks: [{ type: "text", text: "No payment found." }], signatures: [] };
      return {
        ...base,
        number: p.mrNo,
        date: fmtDate(p.date),
        meta: [
          ["MR No", p.mrNo],
          ["Date", fmtDate(p.date)],
          ["Received from", `${b.contact.name}${b.contact.organization ? ` (${b.contact.organization})` : ""}`],
          ["Booking No", b.bfNo],
          ["Event", b.eventTitle],
          ["Purpose", p.purpose[0].toUpperCase() + p.purpose.slice(1)],
        ],
        blocks: [
          { type: "amount", label: "Amount received", value: t(p.amount, g), words: amountInWords(p.amount) },
          { type: "kv", items: [["Payment method", PAYMENT_METHOD_LABELS[p.method]], ["Cheque / pay order no", p.chequeNo ?? "—"], ["Bank", p.bank ?? "—"], ["Received by", p.receivedBy]], cols: 2 },
          { type: "text", muted: true, text: "Subject to realisation of cheque / pay order. ICCB does not accept online payment." },
        ],
        signatures: ["Received by", "Accounts"],
      };
    }

    case "booking_form": {
      const daysRows = [...b.days].sort((a, c) => a.date.localeCompare(c.date)).map((d) => [d.dayType === "program" ? "Program" : "Preparation", hallName(i.halls, d.hallId)?.name ?? "—", fmtDate(d.date), `${fmtTime(d.start)} – ${fmtTime(d.end)}`]);
      const advance = Math.round((est.venueRent * settings.advancePct) / 100);
      return {
        ...base,
        number: b.bfNo,
        meta: [
          ["BF No", b.bfNo],
          ["Ref No", b.refNo],
          ["Program Reg. No", b.programRegNo || "—"],
          ["Booking date", fmtDate(b.bookingDate)],
          ["Client ID", i.clientNo ?? "—"],
          ["Client type", CLIENT_TYPE_LABELS[b.clientType]],
        ],
        blocks: [
          { type: "heading", text: "Client" },
          { type: "kv", cols: 2, items: [["Name", b.contact.name], ["Organization", b.contact.organization ?? "—"], ["Event title", b.eventTitle], ["Event nature", b.eventNature], ["Address", b.contact.address ?? "—"], ["Mobile", b.contact.mobile], ["Phone", b.contact.phone ?? "—"], ["Fax", b.contact.fax ?? "—"], ["Email", b.contact.email ?? "—"], ["NID / Passport", b.idVerified ? `Verified (${b.idVerified.mode})` : "To verify at meeting"]] },
          { type: "heading", text: "Emergency contact & refund" },
          { type: "kv", cols: 2, items: [["Emergency contact", b.emergency.name ?? "—"], ["Emergency mobile", b.emergency.mobile ?? "—"], ["Refund account holder", b.refundAccountName ?? b.contact.name], ["Referred by", b.referredBy?.name ?? "—"]] },
          { type: "heading", text: "Hall-wise days" },
          { type: "table", columns: [{ label: "Day type" }, { label: "Hall" }, { label: "Date" }, { label: "Time" }], rows: daysRows },
          { type: "heading", text: "Guests & food" },
          { type: "kv", cols: 3, items: [["Guests (optimum / max)", `${b.guests.optimum} / ${b.guests.maximum}`], ["Cars (optimum / max)", `${b.cars.optimum} / ${b.cars.maximum}`], ["Layout", LAYOUT_OPTIONS.find((l) => l.value === b.layout)?.label ?? b.layout], ["Food requirement", Object.entries(b.food).filter(([, v]) => v).map(([k]) => k).join(", ") || "None"], ["Menu", b.menus.map((m) => `${m.name} × ${m.guests}`).join("; ") || "—"], ["Decoration", b.decoration.provider === "outside" ? `Outside (Cat. ${b.decoration.category ?? "?"})` : b.decoration.provider === "iccb" ? "ICCB Events" : "None"]] },
          { type: "heading", text: "Hall rent" },
          { type: "table", columns: [{ label: "Item" }, { label: "Amount (BDT)", align: "end", width: "30%" }], rows: [["Total hall rent", t(est.venueRent, g)], [`Advance (${settings.advancePct}%)`, t(advance, g)], ["Balance hall rent", t(Math.max(0, est.venueRent - advance), g)], ["Security money (refundable)", t(est.security, g)]] },
          { type: "heading", text: "Payment procedure" },
          { type: "text", text: `${settings.advancePct}% of the venue rent must be paid as advance to confirm the booking. The rest must be paid at least ${settings.balanceDueDays} days before the event (due ${fmtDate(balanceDueDate(firstEventDate(b), settings.balanceDueDays))}). Payment by cash, pay order or cheque only, in favour of ICCB. Security money is refunded within 15 working days after the event, less any damages or dues.` },
          { type: "heading", text: "Declaration" },
          { type: "text", text: "I/We have read and agree to ICCB's terms and conditions, including the cancellation/shift chart, required documents (to be submitted at least 5 days before the event), the Program Preparation Meeting (at least 15 days before), and that outside catering is prohibited." },
          ...(b.acknowledgement?.signature ? [{ type: "image", src: b.acknowledgement.signature, caption: `Client signature · ${fmtDateTime(b.acknowledgement.at)}` } as DocBlock] : []),
        ],
        signatures: ["Client", `Sales officer${rep ? ` (${rep.name})` : ""}`, "Sales Manager"],
        official: b.approvedBy ? `Approved — ${b.approvedBy}` : undefined,
      };
    }

    case "refund_note": {
      const dmg = (b.damage?.rows ?? []).reduce((s, r) => s + r.qty * r.rate, 0);
      const dues = Math.max(0, est.grandTotal - est.received);
      const held = Math.min(est.security, est.received);
      const amount = b.refund?.amount ?? Math.max(0, held - dmg - dues);
      return {
        ...base,
        meta: [["Booking No", b.bfNo], ["Client", b.contact.name], ["Event", b.eventTitle], ["Event date", fmtDate(firstEventDate(b))], ["Account holder", b.refundAccountName ?? b.contact.name], ["Refund due", fmtDate(b.refund?.dueDate)]],
        blocks: [
          { type: "table", columns: [{ label: "Particular" }, { label: "Amount (BDT)", align: "end", width: "30%" }], rows: [["Security money held", t(held, g)], ["Less: damages", t(dmg, g)], ["Less: outstanding dues", t(dues, g)]], foot: [{ label: "Refund amount", value: t(amount, g), strong: true }] },
          { type: "amount", label: "Refund amount", value: t(amount, g), words: amountInWords(amount) },
          { type: "kv", cols: 2, items: [["Cheque no", b.refund?.chequeNo ?? "—"], ["Refunded on", b.refund?.refundedAt ? fmtDate(b.refund.refundedAt) : "Pending"]] },
        ],
        signatures: ["Accounts", "Operations", "Client"],
      };
    }

    case "ppm": {
      const p = b.ppm;
      return {
        ...base,
        meta: [["Booking No", b.bfNo], ["Event", b.eventTitle], ["Event date", fmtDate(firstEventDate(b))], ["PPM date", p ? `${fmtDate(p.date)} ${p.time ?? ""}` : "—"], ["Venue", p?.venue ?? "—"], ["Attendance", p?.attendees ?? "—"]],
        blocks: [
          { type: "table", columns: [{ label: "#", width: "6%" }, { label: "Agenda", width: "40%" }, { label: "Decision" }], rows: PPM_AGENDA.map((a, k) => [String(k + 1), a, p?.agenda[k + 1] || "—"]) },
          { type: "heading", text: "Key notes" },
          { type: "text", text: p?.notes || "—" },
          { type: "text", muted: true, text: "Anything not agreed in the PPM can be refused or charged extra." },
        ],
        signatures: ["Client", "Sales", "Operations"],
      };
    }

    case "fact_sheet": {
      const f = b.factSheet;
      if (!f) return { ...base, meta: headerMeta(i), blocks: [{ type: "text", text: "Fact sheet not filled yet." }], signatures: [] };
      return {
        ...base,
        meta: headerMeta(i),
        blocks: [
          { type: "kv", cols: 3, items: [["Hall opened by", f.hallOpenedBy], ["Preparation hours", String(f.preparationHours)], ["Business hours", String(f.businessHours)], ["Actual guests", String(f.actualGuests)], ["Extra hours", String(f.extraHours)], ["Hall closed by", f.hallClosedBy]] },
          { type: "heading", text: "AC running log" },
          { type: "table", columns: [{ label: "Start" }, { label: "End" }], rows: f.acLog.map((r) => [r.start, r.end]) },
          { type: "heading", text: "Generator log" },
          { type: "table", columns: [{ label: "Date" }, { label: "Hours", align: "end" }, { label: "Minutes", align: "end" }], rows: f.generatorLog.map((r) => [fmtDate(r.date), String(r.hours), String(r.minutes)]) },
          { type: "heading", text: "Food & service" },
          { type: "kv", cols: 3, items: [["Food provider", f.foodProvider], ["Kitchen used", f.kitchenUsedTime], ["Driver packets", String(f.driverPackets)], ["Food stalls", String(f.foodStallQty)], ["Service boys", String(f.serviceBoys)], ["At-a-time set-up", String(f.atATimeSetup)], ["Table per set-up", String(f.tablePerSetup)], ["Head table", String(f.headTable)], ["Waiting", String(f.waiting)], ["Hygiene", `${f.hygiene}/5`], ["Service dress", `${f.serviceDress}/5`], ["Mannerism", `${f.mannerism}/5`]] },
          { type: "heading", text: "Cleaning visits" },
          { type: "table", columns: [{ label: "Time" }, { label: "Rating", align: "end" }], rows: f.cleaningLog.map((c) => [c.time, `${c.rating}/5`]) },
          { type: "heading", text: "Program summary" },
          { type: "text", text: f.summary || "—" },
        ],
        signatures: ["Operations", "Hall in-charge"],
      };
    }

    case "evaluation": {
      const e = b.evaluation;
      return {
        ...base,
        meta: [["Booking No", b.bfNo], ["Client", b.contact.name], ["Event", b.eventTitle], ["Submitted", e ? fmtDateTime(e.submittedAt) : "—"], ["Score", e ? `${e.score}/100` : "—"]],
        blocks: [
          { type: "table", columns: [{ label: "#", width: "6%" }, { label: "Criteria" }, { label: "Rating", width: "22%" }], rows: EVALUATION_CRITERIA.map((c, k) => [String(k + 1), c, e && e.ratings[k + 1] !== undefined ? RATING_LABELS[e.ratings[k + 1]] : "—"]) },
          { type: "heading", text: "Suggestion" },
          { type: "text", text: e?.suggestion || "—" },
        ],
        signatures: ["Client"],
      };
    }

    case "damage_claim": {
      const d = b.damage;
      const rows = d?.rows ?? [];
      const total = rows.reduce((s, r) => s + r.qty * r.rate, 0);
      return {
        ...base,
        meta: headerMeta(i).slice(0, 5),
        blocks: d?.noDamage
          ? [{ type: "text", text: "No damage recorded for this event." }]
          : [{ type: "table", columns: [{ label: "Department" }, { label: "Item" }, { label: "Time" }, { label: "UOM" }, { label: "Qty", align: "end" }, { label: "Rate", align: "end" }, { label: "Amount", align: "end" }], rows: rows.map((r) => [r.department, r.item, r.time, r.uom, String(r.qty), t(r.rate, g), t(r.qty * r.rate, g)]), foot: [{ label: "Total (deducted from security money)", value: t(total, g), strong: true }] }],
        signatures: [`Certified by${d?.certifiedBy ? ` (${d.certifiedBy})` : ""}`, "Client"],
      };
    }
  }
}
