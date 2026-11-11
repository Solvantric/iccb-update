"use client";
import { useState, useEffect } from "react";
import { CalendarBlank, ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { getAllBookings, updateBooking } from "@/data/bookings";
import { getAllLeads } from "@/data/leads";
import { halls } from "@/data/halls";
import { formatBDT } from "@/lib/utils/format";
import type { Booking } from "@/types";

const STATUS_COLOR: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-600 dark:text-green-400",
  on_hold: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  pending_hold: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [leads, setLeads] = useState<ReturnType<typeof getAllLeads>>([]);

  useEffect(() => {
    setBookings(getAllBookings());
    setLeads(getAllLeads());
  }, []);

  const changeStatus = (id: string, status: string) => {
    updateBooking(id, { status: status as Booking["status"] });
    setBookings(getAllBookings());
  };

  const getLead = (leadId?: string) => leads.find((l) => l.id === leadId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Bookings</h1>
        <p className="text-[var(--ink-muted)] text-[13px] mt-0.5">{bookings.length} total bookings</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Confirmed", count: bookings.filter((b) => b.status === "confirmed").length, color: "text-green-600 dark:text-green-400" },
          { label: "On Hold", count: bookings.filter((b) => b.status === "on_hold").length, color: "text-yellow-600 dark:text-yellow-400" },
          { label: "Pending Hold", count: bookings.filter((b) => b.status === "pending_hold").length, color: "text-blue-600 dark:text-blue-400" },
          { label: "Cancelled", count: bookings.filter((b) => b.status === "cancelled").length, color: "text-red-600 dark:text-red-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 text-center">
            <p className={cn("font-display text-3xl font-light", s.color)}>{s.count}</p>
            <p className="text-[var(--ink-muted)] text-[12px] mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bookings table */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--bg-soft)]">
          <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase">All Bookings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--line)]">
                {["Reference", "Client", "Hall", "Date / Shift", "Event", "Guests", "Est. Total", "Status", ""].map((h) => (
                  <th key={h} className="text-start px-4 py-3 text-[var(--ink-muted)] text-[11px] uppercase tracking-wider font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[var(--ink-muted)] text-[13px]">
                    No bookings yet. Submit requests from the booking page.
                  </td>
                </tr>
              ) : (
                bookings.map((bk) => {
                  const lead = getLead(bk.leadId);
                  return (
                    <tr key={bk.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg-soft)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--accent-text)]">{bk.referenceNumber}</td>
                      <td className="px-4 py-3 text-[var(--ink)]">{lead?.name || "—"}</td>
                      <td className="px-4 py-3 text-[var(--ink)]">
                        {halls.find((h) => h.id === bk.hallId)?.name.en || bk.hallId}
                      </td>
                      <td className="px-4 py-3 text-[var(--ink-muted)]">
                        <p>{bk.date}</p>
                        <p className="text-[11px] capitalize">{bk.shift}</p>
                      </td>
                      <td className="px-4 py-3 text-[var(--ink)] capitalize">{bk.eventType}</td>
                      <td className="px-4 py-3 text-[var(--ink-muted)]">{bk.guests?.toLocaleString() || "—"}</td>
                      <td className="px-4 py-3 text-[var(--ink)]">
                        {bk.estimatedTotal ? formatBDT(bk.estimatedTotal) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={bk.status}
                          onChange={(e) => changeStatus(bk.id, e.target.value)}
                          className={cn(
                            "text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none",
                            STATUS_COLOR[bk.status] || "bg-[var(--bg-soft)] text-[var(--ink-muted)]"
                          )}
                        >
                          {["confirmed", "on_hold", "pending_hold", "cancelled"].map((s) => (
                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                      </td>
                      <td className="px-4 py-3">
                        {bk.isSample && (
                          <span className="text-[9px] text-[var(--ink-muted)] uppercase tracking-wider">sample</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
