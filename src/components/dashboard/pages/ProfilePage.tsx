"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { UserSwitch } from "@phosphor-icons/react";
import { ROLE_LABELS } from "@/types/crm";
import { db, useCurrentUser } from "@/lib/crm/db";
import { useBookings, useMeetings, usePayments } from "@/lib/crm/hooks";
import { fmtDate, fmtTime, money, todayYmd } from "@/lib/crm/format";
import { Avatar, Button, Card, Field, Input, KeyValue, PageHeader } from "../ui/core";

export function ProfilePage() {
  const user = useCurrentUser();
  return <ProfileForm key={user.id} />;
}

function ProfileForm() {
  const user = useCurrentUser();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  return (
    <>
      <PageHeader
        title="Profile"
        description="Your name appears on payments, meetings and history."
        action={
          <Link href="/dashboard/sign-in">
            <Button icon={UserSwitch}>Switch role</Button>
          </Link>
        }
      />
      <Card className="max-w-2xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <Avatar name={user.name} size={56} />
          <div>
            <p className="text-[16px] font-semibold text-crm-ink">{user.name}</p>
            <p className="text-[13px] text-crm-muted">{ROLE_LABELS[user.role]}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <div className="mt-5 flex items-center justify-between gap-4">
          <KeyValue cols={1} items={[["Role", ROLE_LABELS[user.role]]]} />
          <Button
            variant="primary"
            disabled={!name.trim() || (name === user.name && email === user.email)}
            onClick={() => {
              db.users.update(user.id, { name: name.trim(), email: email.trim() });
              toast.success("Profile saved");
            }}
          >
            Save
          </Button>
        </div>
      </Card>
      <MyActivity name={user.name} />
    </>
  );
}

function MyActivity({ name }: { name: string }) {
  const today = todayYmd();
  const meetings = useMeetings()
    .filter((m) => m.rep === name && m.date >= today && m.status === "scheduled")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 5);
  const payments = usePayments()
    .filter((p) => p.receivedBy === name)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const events = useBookings()
    .filter((b) => b.coordinator === name && b.status === "booked")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);
  const blocks: { title: string; empty: string; items: { key: string; href: string; main: string; sub: string }[] }[] = [
    { title: "My upcoming meetings", empty: "No meetings assigned to you.", items: meetings.map((m) => ({ key: m.id, href: "/dashboard/operations/ppm", main: `${m.type} · ${m.clientName}`, sub: `${fmtDate(m.date, "EEE, d MMM")} · ${fmtTime(m.time)}` })) },
    { title: "Payments I received", empty: "No payments recorded by you.", items: payments.map((p) => ({ key: p.id, href: `/dashboard/bookings/${p.bookingId}`, main: `${money(p.amount)} · ${p.kind}`, sub: `${fmtDate(p.date)} · ${p.method}` })) },
    { title: "Events I coordinate", empty: "No upcoming events assigned to you.", items: events.map((b) => ({ key: b.id, href: `/dashboard/bookings/${b.id}`, main: b.eventName, sub: fmtDate(b.date, "EEE, d MMM") })) },
  ];
  return (
    <div className="mt-6 grid max-w-5xl grid-cols-1 gap-5 lg:grid-cols-3">
      {blocks.map((bl) => (
        <Card key={bl.title}>
          <div className="px-5 pt-5 pb-3 text-[15px] font-semibold text-crm-ink">{bl.title}</div>
          {bl.items.length === 0 ? (
            <p className="px-5 pb-5 text-[13.5px] text-crm-muted">{bl.empty}</p>
          ) : (
            <ul className="px-2 pb-3">
              {bl.items.map((it) => (
                <li key={it.key}>
                  <Link href={it.href} className="block rounded-[10px] px-3 py-2 hover:bg-crm-surface-2">
                    <span className="block truncate text-[13.5px] text-crm-ink">{it.main}</span>
                    <span className="block text-[12px] text-crm-muted">{it.sub}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
