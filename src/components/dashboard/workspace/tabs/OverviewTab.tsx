"use client";
import { useState } from "react";
import { CalendarBlank, ChatText, Info, PencilSimple, Phone, UserSwitch, WarningCircle } from "@phosphor-icons/react";
import { CLIENT_TYPE_LABELS } from "@/types/crm";
import { LAYOUT_OPTIONS } from "@/data/crm/capacities";
import { capacityCheck, findHall } from "@/lib/crm/pricing";
import { ago, fmtDate, fmtDateTime, fmtTime } from "@/lib/crm/format";
import { addNote, assignBookings, logCall } from "@/services/crm/bookings.service";
import { useCrmAction } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Card, CardHeader, Input, Segmented, Select, Textarea } from "../../ui/core";
import { Timeline } from "../../ui/status";
import { useWs } from "../context";
import { EditDetailsDrawer, ScheduleMeetingModal } from "../modals";

export function OverviewTab() {
  const { b, halls, rates, canEdit } = useWs();
  const [edit, setEdit] = useState(false);
  const firstHall = findHall(rates, b.days[0]?.hallId ?? "");
  const cap = firstHall ? capacityCheck(firstHall.code, b.layout, b.guests.maximum || b.guests.optimum, rates) : null;
  const days = [...b.days].sort((a, c) => a.date.localeCompare(c.date));
  const food = Object.entries(b.food).filter(([, v]) => v).map(([k]) => k[0].toUpperCase() + k.slice(1)).join(", ") || "No food";
  const deco = b.decoration.provider === "outside" ? `Outside — ${b.decoration.firm ?? "firm not set"}` : b.decoration.provider === "iccb" ? "ICCB Events" : "None";

  return (
    <div className="space-y-5">
      {b.status === "requested" && !b.closed && canEdit && <RequestActions />}

      <Card>
        <CardHeader title="Event details" action={canEdit && !b.closed && <Button size="sm" variant="ghost" icon={PencilSimple} onClick={() => setEdit(true)}>Edit</Button>} />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 pb-4 sm:grid-cols-3">
          {[
            ["Event type", b.eventNature],
            ["Client type", CLIENT_TYPE_LABELS[b.clientType]],
            ["Guests", `${b.guests.optimum.toLocaleString("en-US")}${b.guests.maximum > b.guests.optimum ? ` – ${b.guests.maximum.toLocaleString("en-US")}` : ""}`],
            ["Layout", LAYOUT_OPTIONS.find((l) => l.value === b.layout)?.label ?? b.layout],
            ["Food", food],
            ["Decoration", deco],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[12px] text-crm-muted">{k}</dt>
              <dd className="truncate text-[13.5px] text-crm-ink" title={v}>{v}</dd>
            </div>
          ))}
        </dl>
        <ul className="divide-y divide-crm-line border-t border-crm-line">
          {days.map((d) => {
            const h = halls.find((x) => x.id === d.hallId);
            return (
              <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-2.5 text-[13px]">
                <span className="w-36 font-medium tabular text-crm-ink">{fmtDate(d.date, "EEE, dd MMM yyyy")}</span>
                <span className="flex-1 text-crm-ink-2">{h?.name ?? "—"}{d.sqft ? ` · ${d.sqft.toLocaleString("en-US")} sq ft` : ""}</span>
                <span className="tabular text-crm-muted">{fmtTime(d.start)} – {fmtTime(d.end)}</span>
                {d.dayType === "preparation" && <Badge tone="grey">Preparation</Badge>}
              </li>
            );
          })}
        </ul>
        {cap && (cap.status === "over" || cap.status === "near") && (
          <p className={cn("mx-5 mb-4 flex items-start gap-2 rounded-[var(--radius-btn)] px-3 py-2 text-[12.5px]", cap.status === "over" ? "bg-[#FEF3F2] text-[#B42318] dark:bg-[#2D1414]" : "bg-[#FEF6E7] text-[#B54708] dark:bg-[#2B2010]")}>
            {cap.status === "over" ? <WarningCircle size={16} className="mt-px shrink-0" weight="fill" /> : <Info size={16} className="mt-px shrink-0" />}
            {cap.message}
          </p>
        )}
        {b.notes && <p className="mx-5 mb-4 rounded-[var(--radius-btn)] bg-crm-surface-2 px-3 py-2 text-[12.5px] text-crm-ink-2">{b.notes}</p>}
      </Card>

      <Activity />
      {edit && <EditDetailsDrawer onClose={() => setEdit(false)} />}
    </div>
  );
}

/** Requested stage: assign → call → meeting, on one line each. */
function RequestActions() {
  const { b, users, me } = useWs();
  const [rep, setRep] = useState(b.assignedTo ?? "");
  const [outcome, setOutcome] = useState("");
  const [meeting, setMeeting] = useState(false);
  const assign = useCrmAction((u: string) => assignBookings([b.id], u), { success: "Representative assigned" });
  const call = useCrmAction((o: string) => logCall(b.id, o), { success: "Call logged", onSuccess: () => setOutcome("") });
  const reps = users.filter((u) => u.active && (u.role === "sales_executive" || u.role === "sales_manager"));
  const mins = b.firstResponseAt ? Math.round((new Date(b.firstResponseAt).getTime() - new Date(b.createdAt).getTime()) / 60000) : null;
  return (
    <Card className="border-s-[3px] border-s-[#F79009]">
      <CardHeader icon={Phone} title="New request — next steps" description="Assign, call within 2 hours, then book a meeting or site visit." />
      <div className="grid gap-4 px-5 pb-5 md:grid-cols-3">
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-crm-ink-2">1. Representative</p>
          {me.role !== "sales_executive" ? (
            <div className="flex gap-2">
              <Select value={rep} onChange={setRep} placeholder="Choose…" options={reps.map((u) => ({ value: u.id, label: u.name }))} />
              <Button size="icon" icon={UserSwitch} aria-label="Assign" disabled={!rep || rep === b.assignedTo} loading={assign.isPending} onClick={() => assign.mutate(rep)} />
            </div>
          ) : (
            <p className="text-[13px] text-crm-ink">{users.find((u) => u.id === b.assignedTo)?.name ?? "Unassigned"}</p>
          )}
        </div>
        <div>
          <p className="mb-1.5 flex items-center justify-between text-[12px] font-semibold text-crm-ink-2">
            2. Call client
            {mins !== null ? <Badge tone={mins <= 120 ? "green" : "red"}>{mins < 60 ? `${mins} min` : `${(mins / 60).toFixed(1)} h`}</Badge> : <Badge tone="amber">waiting {ago(b.createdAt).replace(" ago", "")}</Badge>}
          </p>
          <div className="flex gap-2">
            <Input value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Outcome…" />
            <Button disabled={!outcome.trim()} loading={call.isPending} onClick={() => call.mutate(outcome.trim())}>
              Log
            </Button>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-crm-ink-2">3. Meeting / site visit</p>
          {b.meetingAt ? (
            <button className="flex items-center gap-2 text-[13px] text-crm-ink hover:text-crm-brand" onClick={() => setMeeting(true)}>
              <CalendarBlank size={15} /> {fmtDateTime(b.meetingAt)}
            </button>
          ) : (
            <Button variant="primary" icon={CalendarBlank} onClick={() => setMeeting(true)}>
              Schedule
            </Button>
          )}
        </div>
      </div>
      {meeting && <ScheduleMeetingModal onClose={() => setMeeting(false)} />}
    </Card>
  );
}

/** Notes, calls and the latest changes — replaces the separate Activity tab. */
function Activity() {
  const { b, canEdit } = useWs();
  const [text, setText] = useState("");
  const [kind, setKind] = useState<"note" | "call">("note");
  const [all, setAll] = useState(false);
  const save = useCrmAction((t: string) => (kind === "call" ? logCall(b.id, t) : addNote(b.id, t)), { success: kind === "call" ? "Call logged" : "Note added", onSuccess: () => setText("") });
  const items = [...b.activity].sort((a, c) => c.at.localeCompare(a.at));
  return (
    <Card>
      <CardHeader title="Activity" description="Notes, calls, payments and changes." action={items.length > 5 && <Button size="sm" variant="ghost" onClick={() => setAll((v) => !v)}>{all ? "Show less" : `Show all (${items.length})`}</Button>} />
      {canEdit && (
        <div className="px-5 pb-4">
          <div className="rounded-[var(--radius-input)] border border-crm-line focus-within:border-crm-brand">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === "call" ? "Call outcome…" : "Write a note — @FirstName mentions a colleague"} className="min-h-[56px] border-0 focus:ring-0" />
            <div className="flex items-center justify-between border-t border-crm-line px-2 py-1.5">
              <Segmented size="sm" value={kind} onChange={setKind} options={[{ value: "note", label: "Note", icon: ChatText }, { value: "call", label: "Call", icon: Phone }]} />
              <Button size="sm" variant="primary" disabled={!text.trim()} loading={save.isPending} onClick={() => save.mutate(text.trim())}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="px-5 pb-5">
        <Timeline items={all ? items : items.slice(0, 5)} />
      </div>
    </Card>
  );
}
