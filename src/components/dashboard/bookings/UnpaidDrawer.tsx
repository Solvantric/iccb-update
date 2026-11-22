"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { CaretDown, Phone, WhatsappLogo } from "@phosphor-icons/react";
import { useBills, useBookings, useHallMap } from "@/lib/crm/hooks";
import { fmtDate, money, telHref, todayYmd, waHref } from "@/lib/crm/format";
import { cn } from "@/lib/utils/cn";
import { Segmented } from "../ui/core";
import { Drawer } from "../ui/overlay";
import { StatusPill } from "../ui/status";

type When = "all" | "held" | "upcoming";

/**
 * Who still owes money: every confirmed (Booked or Closed) booking with an unpaid amount, grouped by
 * client. Red = event already held and still unpaid, amber = event coming up.
 */
export function UnpaidDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const bookings = useBookings();
  const bills = useBills(bookings);
  const hallMap = useHallMap();
  const today = todayYmd();
  const [when, setWhen] = useState<When>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      bookings
        .filter((b) => (b.status === "booked" || b.status === "closed") && (bills.get(b.id)?.due ?? 0) > 0)
        .map((b) => {
          const bill = bills.get(b.id)!;
          return { b, total: bill.total, paid: bill.paid, due: bill.due, held: b.date < today };
        }),
    [bookings, bills, today]
  );

  const held = rows.filter((r) => r.held);
  const upcoming = rows.filter((r) => !r.held);
  const sumDue = (list: typeof rows) => list.reduce((t, r) => t + r.due, 0);
  const shown = when === "held" ? held : when === "upcoming" ? upcoming : rows;

  const clients = useMemo(() => {
    const m = new Map<string, { key: string; name: string; mobile: string; org?: string; due: number; total: number; paid: number; held: boolean; items: typeof rows }>();
    for (const r of shown) {
      const key = r.b.clientId ?? `${r.b.name}|${r.b.mobile}`;
      const c = m.get(key) ?? { key, name: r.b.name, mobile: r.b.mobile, org: r.b.organization, due: 0, total: 0, paid: 0, held: false, items: [] };
      c.due += r.due;
      c.total += r.total;
      c.paid += r.paid;
      c.held ||= r.held;
      c.items.push(r);
      m.set(key, c);
    }
    return [...m.values()].sort((a, b) => b.due - a.due);
  }, [shown]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Unpaid amount" description="Clients who still owe money, biggest first">
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-crm-line bg-crm-line">
          <div className="col-span-2 bg-crm-surface px-4 py-3">
            <p className="text-[12px] text-crm-muted">Total unpaid</p>
            <p className="text-[24px] font-semibold text-crm-danger tabular">{money(sumDue(rows))}</p>
            <p className="text-[12px] text-crm-muted">
              {new Set(rows.map((r) => r.b.clientId ?? r.b.mobile)).size} clients · {rows.length} bookings
            </p>
          </div>
          <div className="bg-crm-surface px-4 py-3">
            <p className="flex items-center gap-1.5 text-[12px] text-crm-muted">
              <span className="h-2 w-2 rounded-full bg-crm-danger" /> Event already held
            </p>
            <p className="text-[16px] font-semibold text-crm-danger tabular">{money(sumDue(held))}</p>
            <p className="text-[11.5px] text-crm-muted">{held.length} bookings · collect now</p>
          </div>
          <div className="bg-crm-surface px-4 py-3">
            <p className="flex items-center gap-1.5 text-[12px] text-crm-muted">
              <span className="h-2 w-2 rounded-full bg-crm-reserved" /> Event coming up
            </p>
            <p className="text-[16px] font-semibold text-crm-reserved-ink tabular">{money(sumDue(upcoming))}</p>
            <p className="text-[11.5px] text-crm-muted">{upcoming.length} bookings · before the event</p>
          </div>
        </div>

        <Segmented
          id="unpaid-when"
          value={when}
          onChange={setWhen}
          options={[
            { value: "all", label: `All (${rows.length})` },
            { value: "held", label: `Event held (${held.length})` },
            { value: "upcoming", label: `Coming up (${upcoming.length})` },
          ]}
        />

        {clients.length === 0 ? (
          <p className="py-8 text-center text-[13.5px] text-crm-success">Nothing unpaid here. Every booking is fully paid.</p>
        ) : (
          <ul className="space-y-2.5">
            {clients.map((c) => {
              const isOpen = expanded === c.key;
              const paidPct = c.total ? Math.round((c.paid / c.total) * 100) : 0;
              return (
                <li key={c.key} className={cn("overflow-hidden rounded-[10px] border border-crm-line border-s-[3px]", c.held ? "border-s-crm-danger" : "border-s-crm-reserved")}>
                  <button type="button" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : c.key)} className="flex w-full items-start gap-3 px-3.5 py-3 text-start transition-colors hover:bg-crm-surface-2">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-crm-ink">{c.org ?? c.name}</span>
                      <span className="block truncate text-[12px] text-crm-muted">
                        {c.org ? `${c.name} · ` : ""}
                        {c.items.length} booking{c.items.length === 1 ? "" : "s"}
                      </span>
                      <span className="mt-2 flex items-center gap-2">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-crm-danger-bg">
                          <span className="block h-full rounded-full bg-crm-success" style={{ width: `${paidPct}%` }} />
                        </span>
                        <span className="tabular text-[11.5px] text-crm-muted">{paidPct}% paid</span>
                      </span>
                    </span>
                    <span className="shrink-0 text-end">
                      <span className="block text-[15px] font-semibold text-crm-danger tabular">{money(c.due)}</span>
                      <span className="block text-[11.5px] text-crm-muted tabular">of {money(c.total)}</span>
                    </span>
                    <CaretDown size={14} className={cn("mt-1 shrink-0 text-crm-muted transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen && (
                    <div className="space-y-2 border-t border-crm-line bg-crm-surface-2/50 px-3.5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <a href={telHref(c.mobile)} className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-crm-line bg-crm-surface px-2.5 text-[12.5px] text-crm-ink hover:bg-crm-surface-2">
                          <Phone size={13} /> {c.mobile}
                        </a>
                        <a href={waHref(c.mobile, `Hello ${c.name}, this is ICCB. A friendly reminder that ${money(c.due)} is still unpaid for your booking.`)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-crm-line bg-crm-surface px-2.5 text-[12.5px] text-crm-ink hover:bg-crm-surface-2">
                          <WhatsappLogo size={13} className="text-crm-whatsapp" /> Send reminder
                        </a>
                      </div>
                      {c.items
                        .sort((a, b) => a.b.date.localeCompare(b.b.date))
                        .map((r) => (
                          <Link key={r.b.id} href={`/dashboard/bookings/${r.b.id}`} className="block rounded-[8px] border border-crm-line bg-crm-surface px-3 py-2.5 transition-colors hover:border-crm-muted/50">
                            <span className="flex items-start justify-between gap-2">
                              <span className="min-w-0">
                                <span className="block truncate text-[13.5px] font-medium text-crm-ink">{r.b.eventName}</span>
                                <span className="block text-[12px] text-crm-muted">
                                  {r.b.ref} · {hallMap.get(r.b.hallId)?.name} · {fmtDate(r.b.date)}
                                </span>
                              </span>
                              <StatusPill status={r.b.status} />
                            </span>
                            <span className="mt-2 grid grid-cols-3 gap-2 text-[12px]">
                              <span>
                                <span className="block text-crm-muted">Total bill</span>
                                <span className="tabular text-crm-ink">{money(r.total)}</span>
                              </span>
                              <span>
                                <span className="block text-crm-muted">Paid</span>
                                <span className="tabular text-crm-success">{money(r.paid)}</span>
                              </span>
                              <span>
                                <span className="block text-crm-muted">Unpaid</span>
                                <span className="tabular font-semibold text-crm-danger">{money(r.due)}</span>
                              </span>
                            </span>
                            <span className={cn("mt-2 inline-flex h-5 items-center rounded-full px-2 text-[11px] font-medium", r.held ? "bg-crm-danger-bg text-crm-danger" : "bg-crm-reserved-bg text-crm-reserved-ink")}>{r.held ? "Event held · collect now" : "Event coming up"}</span>
                          </Link>
                        ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Drawer>
  );
}
