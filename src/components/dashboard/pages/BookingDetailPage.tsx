"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarPlus, CheckCircle, CheckSquareOffset, FilePdf, Prohibit, Ticket, Trash } from "@phosphor-icons/react";
import { useBookings, useHallMap } from "@/lib/crm/hooks";
import { fmtDate, num } from "@/lib/crm/format";
import { pdfBooking } from "@/lib/pdf/actions";
import { Button, EmptyState } from "../ui/core";
import { Menu } from "../ui/overlay";
import { Tabs } from "../ui/data";
import { StatusPill } from "../ui/status";
import { m } from "../ui/motion";
import { useBookingActions } from "../bookings/useBookingActions";
import { MeetingModal } from "../meetings/MeetingModal";
import { DetailsTab } from "../bookings/DetailsTab";
import { BillTab } from "../bookings/BillTab";
import { PaymentsTab } from "../bookings/PaymentsTab";
import { useBill } from "@/lib/crm/hooks";
import type { Booking } from "@/types/crm";
import { money } from "@/lib/crm/format";

type Tab = "details" | "bill" | "payments";

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const booking = useBookings().find((b) => b.id === id);
  const halls = useHallMap();
  const actions = useBookingActions();
  const [tab, setTab] = useState<Tab>("details");
  const [meeting, setMeeting] = useState(false);

  if (!booking)
    return (
      <div className="crm-card mx-auto mt-6 max-w-lg">
        <EmptyState
          icon={Ticket}
          text="This booking doesn't exist or was deleted."
          action={
            <Link href="/dashboard/bookings">
              <Button>Back to bookings</Button>
            </Link>
          }
        />
      </div>
    );

  const b = booking;
  const hall = halls.get(b.hallId);

  return (
    <>
      <Link href="/dashboard/bookings" className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-crm-muted transition-colors hover:text-crm-ink">
        <ArrowLeft size={14} className="rtl:rotate-180" /> Bookings
      </Link>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[24px] font-semibold leading-tight text-crm-ink">{b.name}</h1>
            <StatusPill status={b.status} />
          </div>
          <p className="mt-1 text-[15px] text-crm-ink-2">{b.eventName}</p>
          <p className="mt-1 text-[13.5px] text-crm-muted">
            {b.ref} · {hall?.name ?? "—"} · {fmtDate(b.date, "EEEE, d MMM yyyy")} · {b.slot} · {num(b.guests)} guests
            {b.organization ? ` · ${b.organization}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {b.status === "reserved" && (
            <Button variant="primary" icon={CheckCircle} onClick={() => actions.confirm(b)}>
              Confirm booking
            </Button>
          )}
          {b.status === "booked" && (
            <Button variant="primary" icon={CheckSquareOffset} onClick={() => actions.close(b)}>
              Close event
            </Button>
          )}
          <Button icon={FilePdf} onClick={() => pdfBooking(b)}>
            Download PDF
          </Button>
          <Menu
            items={[
              { label: "Schedule meeting", icon: CalendarPlus, onClick: () => setMeeting(true), hidden: b.status === "cancelled" || b.status === "closed" },
              { label: "Cancel booking", icon: Prohibit, onClick: () => actions.cancel(b), hidden: b.status === "cancelled" || b.status === "closed" },
              { label: "Delete", icon: Trash, danger: true, onClick: () => actions.remove(b, { redirect: true }) },
            ]}
          />
        </div>
      </div>

      <BillStrip booking={b} />
      <Tabs
        id="booking"
        value={tab}
        onChange={setTab}
        className="mb-6"
        tabs={[
          { value: "details", label: "Details" },
          { value: "bill", label: "Add-ons & Bill" },
          { value: "payments", label: "Payments" },
        ]}
      />
      <m.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === "details" && <DetailsTab booking={b} />}
        {tab === "bill" && <BillTab booking={b} />}
        {tab === "payments" && <PaymentsTab booking={b} />}
      </m.div>
      <MeetingModal open={meeting} onOpenChange={setMeeting} booking={b} />
    </>
  );
}

function BillStrip({ booking }: { booking: Booking }) {
  const bill = useBill(booking)!;
  const items: [string, number][] = [
    ["Total", bill.total],
    ["Paid", bill.paid],
    ["Unpaid", bill.due],
    ["Security", bill.security],
  ];
  return (
    <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--crm-radius)] border border-crm-line bg-crm-line sm:grid-cols-4">
      {items.map(([k, v]) => (
        <div key={k} className="bg-crm-surface px-4 py-3">
          <p className="text-[12px] text-crm-muted">{k}</p>
          <p className={`text-[16px] font-semibold tabular ${k === "Unpaid" && v > 0 ? "text-crm-danger" : k === "Paid" && v > 0 ? "text-crm-success" : "text-crm-ink"}`}>{money(v)}</p>
        </div>
      ))}
    </div>
  );
}
