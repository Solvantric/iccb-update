"use client";
import { useState } from "react";
import { CalendarBlank, Info, PencilSimple, Phone, SealCheck, UserSwitch, WarningCircle } from "@phosphor-icons/react";
import { CLIENT_TYPE_LABELS, SOURCE_LABELS } from "@/types/crm";
import { LAYOUT_OPTIONS } from "@/data/crm/capacities";
import { capacityCheck, findHall, hallRent, rentLabel } from "@/lib/crm/pricing";
import { ago, fmtDate, fmtDateTime, fmtTime, taka } from "@/lib/crm/format";
import { assignBookings, logCall, toggleChecklist } from "@/services/crm/bookings.service";
import { useCrmAction } from "@/services/crm/hooks";
import { cn } from "@/lib/utils/cn";
import { Badge, Button, Card, CardHeader, Checkbox, Input, KeyValue, Select } from "../../ui/core";
import { useWs } from "../context";
import { EditDetailsDrawer, ScheduleMeetingModal } from "../modals";

function hours(start: string, end: string) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 1440;
  return mins / 60;
}

export function OverviewTab() {
  const { b, halls, users, rates, canEdit, me } = useWs();
  const [edit, setEdit] = useState(false);
  const [meeting, setMeeting] = useState(false);
  const [outcome, setOutcome] = useState("");
  const [rep, setRep] = useState(b.assignedTo ?? "");
  const call = useCrmAction((o: string) => logCall(b.id, o), { success: "Call logged", onSuccess: () => setOutcome("") });
  const assign = useCrmAction((u: string) => assignBookings([b.id], u), { success: "Representative assigned" });
  const finalize = useCrmAction((done: boolean) => toggleChecklist(b.id, "finalized", done), { success: (r) => (r.checklist.finalized?.done ? "Marked as finalized" : "Unmarked") });

  const firstHall = findHall(rates, b.days[0]?.hallId ?? "");
  const cap = firstHall ? capacityCheck(firstHall.code, b.layout, b.guests.maximum || b.guests.optimum, rates) : null;
  const responseMins = b.firstResponseAt ? Math.round((new Date(b.firstResponseAt).getTime() - new Date(b.createdAt).getTime()) / 60000) : null;
  const reps = users.filter((u) => u.active && (u.role === "sales_executive" || u.role === "sales_manager"));
  const canAssign = canEdit && me.role !== "sales_executive";

  return (
    <div className="space-y-5">
      {/* Request-stage actions */}
      {b.status === "requested" && !b.closed && canEdit && (
        <Card className="border-[#FDE7C2] bg-[#FFFCF5] dark:bg-[#1F1A10] dark:border-[#4A3510]">
          <CardHeader icon={Phone} title="Next steps for this request" description="Assign → call within 2 hours → schedule a meeting / site visit." />
          <div className="grid gap-4 px-5 pb-5 md:grid-cols-3">
            <div>
              <p className="mb-1.5 text-[12.5px] font-medium text-crm-ink-2">1. Representative</p>
              {canAssign ? (
                <div className="flex gap-2">
                  <Select value={rep} onChange={setRep} placeholder="Choose…" options={reps.map((u) => ({ value: u.id, label: u.name }))} />
                  <Button icon={UserSwitch} disabled={!rep || rep === b.assignedTo} loading={assign.isPending} onClick={() => assign.mutate(rep)}>
                    Assign
                  </Button>
                </div>
              ) : (
                <p className="text-[13px] text-crm-ink">{users.find((u) => u.id === b.assignedTo)?.name ?? "Unassigned"}</p>
              )}
            </div>
            <div>
              <p className="mb-1.5 flex items-center justify-between text-[12.5px] font-medium text-crm-ink-2">
                2. Call client
                {b.firstResponseAt ? (
                  <Badge tone={responseMins! <= 120 ? "green" : "red"}>{responseMins! < 60 ? `${responseMins} min` : `${(responseMins! / 60).toFixed(1)} h`}</Badge>
                ) : (
                  <Badge tone="amber">Waiting {ago(b.createdAt).replace(" ago", "")}</Badge>
                )}
              </p>
              <div className="flex gap-2">
                <Input value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Outcome, e.g. interested" />
                <Button disabled={!outcome.trim()} loading={call.isPending} onClick={() => call.mutate(outcome.trim())}>
                  Log
                </Button>
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[12.5px] font-medium text-crm-ink-2">3. Meeting / site visit</p>
              {b.meetingAt ? (
                <p className="flex items-center gap-2 text-[13px] text-crm-ink">
                  <CalendarBlank size={15} /> {fmtDateTime(b.meetingAt)}
                  <button className="text-[12px] text-crm-brand hover:underline" onClick={() => setMeeting(true)}>
                    Change
                  </button>
                </p>
              ) : (
                <Button variant="primary" icon={CalendarBlank} onClick={() => setMeeting(true)}>
                  Schedule meeting
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Event"
          action={
            canEdit && (
              <Button size="sm" icon={PencilSimple} onClick={() => setEdit(true)}>
                Edit details
              </Button>
            )
          }
        />
        <div className="px-5 pb-5">
          <KeyValue
            cols={3}
            items={[
              ["Event title", b.eventTitle],
              ["Event nature", b.eventNature],
              ["Client type", CLIENT_TYPE_LABELS[b.clientType]],
              ["Layout", LAYOUT_OPTIONS.find((l) => l.value === b.layout)?.label ?? b.layout],
              ["Guests (optimum / max)", `${b.guests.optimum.toLocaleString("en-US")} / ${b.guests.maximum.toLocaleString("en-US")}`],
              ["Cars (optimum / max)", `${b.cars.optimum} / ${b.cars.maximum}`],
              ["Food", Object.entries(b.food).filter(([, v]) => v).map(([k]) => k[0].toUpperCase() + k.slice(1)).join(", ") || "No food"],
              ["Decoration", b.decoration.provider === "outside" ? `Outside firm${b.decoration.firm ? ` — ${b.decoration.firm}` : ""} (Cat. ${b.decoration.category ?? "?"})` : b.decoration.provider === "iccb" ? "ICCB Events" : "Not needed"],
              ["Booking date", fmtDate(b.bookingDate)],
            ]}
          />
          {cap && cap.status !== "ok" && (
            <p className={cn("mt-4 flex items-start gap-2 rounded-lg px-3 py-2 text-[13px]", cap.status === "over" ? "bg-[#FEF3F2] text-[#B42318] dark:bg-[#2D1414]" : cap.status === "near" ? "bg-[#FEF6E7] text-[#B54708] dark:bg-[#2B2010]" : "bg-crm-surface-2 text-crm-ink-2")}>
              {cap.status === "over" ? <WarningCircle size={17} className="mt-0.5 shrink-0" weight="fill" /> : <Info size={17} className="mt-0.5 shrink-0" />}
              {firstHall?.name}: {cap.message}
            </p>
          )}
          {b.status === "requested" && !b.closed && canEdit && (
            <div className="mt-4 rounded-lg border border-crm-line p-3">
              <Checkbox
                checked={!!b.checklist.finalized?.done}
                onChange={(v) => finalize.mutate(v)}
                label="Hall, dates, business hours, guests, cars and layout are finalized with the client"
                description="Required before the Sales Manager can approve."
              />
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Hall-wise days" description="One booking day = 24 h; business period = 12 h (AC runs only in business hours)." />
        <div className="overflow-x-auto px-5 pb-5">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-crm-line text-start text-[12px] text-crm-muted">
                <th className="py-2 text-start font-medium">Day type</th>
                <th className="py-2 text-start font-medium">Hall</th>
                <th className="py-2 text-start font-medium">Date</th>
                <th className="py-2 text-start font-medium">Time</th>
                <th className="py-2 text-end font-medium">Duration</th>
                <th className="py-2 text-end font-medium">Rent</th>
              </tr>
            </thead>
            <tbody>
              {[...b.days].sort((a, c) => a.date.localeCompare(c.date)).map((d) => {
                const h = halls.find((x) => x.id === d.hallId);
                const dur = hours(d.start, d.end);
                return (
                  <tr key={d.id} className="border-b border-crm-line last:border-0">
                    <td className="py-2.5">
                      <Badge tone={d.dayType === "program" ? "brand" : "grey"}>{d.dayType === "program" ? "Program" : "Preparation"}</Badge>
                    </td>
                    <td className="py-2.5 text-crm-ink">
                      {h?.name ?? "—"} <span className="text-crm-muted">{h?.number}</span>
                      {d.sqft ? <span className="block text-[11.5px] text-crm-muted">{d.sqft.toLocaleString("en-US")} sq ft</span> : null}
                    </td>
                    <td className="py-2.5 whitespace-nowrap tabular">{fmtDate(d.date, "EEE, dd MMM yyyy")}</td>
                    <td className="py-2.5 whitespace-nowrap tabular">
                      {fmtTime(d.start)} – {fmtTime(d.end)}
                    </td>
                    <td className={cn("py-2.5 text-end tabular", dur > 12 && "font-semibold text-[#B54708]")}>{dur.toFixed(1)} h</td>
                    <td className="py-2.5 text-end tabular">
                      {h && h.kind !== "expo" ? (
                        <>
                          {taka(hallRent(h, d.date, rates))}
                          <span className="block text-[11px] text-crm-muted">{rentLabel(d.date)}</span>
                        </>
                      ) : (
                        "per sq ft"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader title="Contacts" />
          <div className="px-5 pb-5">
            <KeyValue
              items={[
                ["Client", b.contact.name],
                ["Mobile", b.contact.mobile],
                ["Organization", b.contact.organization],
                ["Email", b.contact.email],
                ["Emergency contact", [b.emergency.name, b.emergency.mobile].filter(Boolean).join(" · ")],
                ["Refund account holder", b.refundAccountName],
              ]}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Source & notes" />
          <div className="px-5 pb-5">
            <KeyValue
              items={[
                ["Source", SOURCE_LABELS[b.source]],
                ["Referred by", b.referredBy ? `${b.referredBy.name}${b.referredBy.designation ? `, ${b.referredBy.designation}` : ""}` : ""],
                ["Preferred meeting time", b.preferredMeetingTime],
                ["Meeting", b.meetingAt ? fmtDateTime(b.meetingAt) : ""],
                ["Approved", b.approvedBy ? `${b.approvedBy} · ${fmtDate(b.approvedAt)}` : ""],
                ["Tags", b.tags.join(", ")],
              ]}
            />
            {b.notes && <p className="mt-3 rounded-lg bg-crm-surface-2 px-3 py-2 text-[13px] text-crm-ink-2">{b.notes}</p>}
            {b.approvedBy && (
              <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-[#067647]">
                <SealCheck size={15} weight="fill" /> Approved by {b.approvedBy}
              </p>
            )}
          </div>
        </Card>
      </div>

      {edit && <EditDetailsDrawer onClose={() => setEdit(false)} />}
      {meeting && <ScheduleMeetingModal onClose={() => setMeeting(false)} />}
    </div>
  );
}

