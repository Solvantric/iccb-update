"use client";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, ArrowSquareOut, ArrowUUpLeft, CalendarBlank, CalendarPlus, Check, Lock, Phone, Prohibit, Ticket, WhatsappLogo } from "@phosphor-icons/react";
import type { Lead } from "@/types/crm";
import { LEAD_STAGE_LABELS, LEAD_STAGES, LOST_REASONS } from "@/types/crm";
import { useBookings, useHallMap, useUsers } from "@/lib/crm/hooks";
import { differenceInCalendarDays } from "date-fns";
import { fmtDate, money, num, telHref, timeAgo, todayYmd, waHref } from "@/lib/crm/format";
import { addLeadNote, assignLead, completeLeadFollowUp, markLeadLost, reopenLead, setLeadFollowUp, setLeadStage } from "@/services/crm";
import { useCurrentUser } from "@/lib/crm/db";
import { cn } from "@/lib/utils/cn";
import { Button, Input, KeyValue, LinkButton, Segmented, Textarea } from "../ui/core";
import { Drawer } from "../ui/overlay";
import { StatusPill } from "../ui/status";
import { useNewBooking } from "../bookings/NewBookingModal";
import { useBookingActions } from "../bookings/useBookingActions";
import { AssignPicker, isOverdue, SourcePill, stageColor } from "./shared";
import { LeadJourney } from "./LeadJourney";

export function LeadDrawer({ lead, onClose }: { lead: Lead | undefined; onClose: () => void }) {
  return (
    <Drawer open={!!lead} onOpenChange={(v) => !v && onClose()} title={lead?.name ?? ""} description={lead ? `${lead.code} · ${lead.eventName}` : undefined}>
      {lead && <Body key={lead.id} lead={lead} />}
    </Drawer>
  );
}

function Body({ lead }: { lead: Lead }) {
  const users = useUsers();
  const hallMap = useHallMap();
  const at = LEAD_STAGES.indexOf(lead.stage);
  const [note, setNote] = useState("");
  const [kind, setKind] = useState<"note" | "call">("call");
  const [lostOpen, setLostOpen] = useState(false);
  const [logFollowUp, setLogFollowUp] = useState(0);

  const move = (i: number) => {
    if (lead.lost || i === at || i === 4) return;
    setLeadStage(lead.id, LEAD_STAGES[i]);
    toast.success(`Moved to ${LEAD_STAGE_LABELS[LEAD_STAGES[i]]}`);
  };

  return (
    <div className="space-y-6">
      {/* Stage tracker */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[13px] font-medium text-crm-muted">Funnel step</h3>
          {lead.lost && <span className="rounded-full bg-crm-closed-bg px-2.5 py-0.5 text-[12px] font-medium text-crm-muted">Lost · {lead.lostReason}</span>}
        </div>
        <ol className="grid grid-cols-5 gap-1.5">
          {LEAD_STAGES.map((s, i) => {
            const done = i <= at;
            const locked = i === 4;
            return (
              <li key={s}>
                <button
                  type="button"
                  disabled={lead.lost || (locked && at !== 4)}
                  onClick={() => move(i)}
                  title={locked && at !== 4 ? "Becomes Customer when the booking is marked Booked" : lead.stageAt[s] ? `${LEAD_STAGE_LABELS[s]} · ${fmtDate(lead.stageAt[s]!.slice(0, 10), "d MMM")}` : `Move to ${LEAD_STAGE_LABELS[s]}`}
                  className={cn("group flex w-full flex-col items-start gap-1.5 rounded-[8px] p-1.5 text-start transition-colors hover:bg-crm-surface-2 disabled:cursor-not-allowed disabled:hover:bg-transparent", i === at && "bg-crm-surface-2")}
                >
                  <span className={cn("h-1.5 w-full rounded-full transition-colors", !done ? "bg-crm-line group-hover:bg-crm-muted/40" : lead.lost && "bg-crm-muted/40")} style={done && !lead.lost ? { background: stageColor(i).fill } : undefined} />
                  <span className={cn("inline-flex items-center gap-1 text-[11.5px] leading-tight", i === at ? "font-semibold text-crm-ink" : "text-crm-muted")}>
                    {LEAD_STAGE_LABELS[s]}
                    {locked && at !== 4 && <Lock size={10} />}
                  </span>
                  <span className="tabular text-[10.5px] text-crm-muted">{lead.stageAt[s] ? fmtDate(lead.stageAt[s]!.slice(0, 10), "d MMM") : " "}</span>
                </button>
              </li>
            );
          })}
        </ol>
        {!lead.lost && at < 3 && (
          <Button variant="primary" size="sm" className="mt-3" onClick={() => move(at + 1)}>
            Move to {LEAD_STAGE_LABELS[LEAD_STAGES[at + 1]]} <ArrowRight size={14} className="rtl:rotate-180" />
          </Button>
        )}
      </section>

      <BookingBox lead={lead} />

      {/* Contact */}
      <div className="flex flex-wrap gap-2">
        <LinkButton href={telHref(lead.mobile)} icon={Phone}>
          {lead.mobile}
        </LinkButton>
        <LinkButton href={waHref(lead.mobile, `Hello ${lead.name}, this is ICCB about ${lead.eventName}.`)} icon={WhatsappLogo} external>
          WhatsApp
        </LinkButton>
      </div>

      {/* Owner + follow-up */}
      <section className="grid gap-3 rounded-[10px] border border-crm-line p-4">
        <div className="grid gap-1.5">
          <span className="text-[13px] font-medium text-crm-ink-2">Assigned to</span>
          <AssignPicker variant="field" value={lead.ownerIds} users={users} onChange={(ids) => assignLead(lead.id, ids)} />
        </div>
        {lead.stage !== "customer" && !lead.lost && <FollowUpBox lead={lead} onDone={() => setLogFollowUp((n) => n + 1)} />}
      </section>

      <LeadJourney
        lead={lead}
        openAdd={logFollowUp}
        prefillAction={lead.nextAction}
        onSaved={() => {
          completeLeadFollowUp(lead.id);
          toast.success("Follow-up done");
        }}
      />

      {/* Event */}
      <section>
        <h3 className="mb-3 text-[13px] font-medium text-crm-muted">Event</h3>
        <KeyValue
          items={[
            ["Organisation", lead.organization],
            ["Event type", lead.eventType],
            ["Guests", num(lead.guests)],
            ["Preferred hall", lead.hallId ? hallMap.get(lead.hallId)?.name : undefined],
            ["Event date", lead.eventDate ? fmtDate(lead.eventDate, "d MMM yyyy") : undefined],
            ["Estimated value", money(lead.value)],
            ["Email", lead.email],
            ["Lead since", fmtDate(lead.createdAt.slice(0, 10), "d MMM yyyy")],
          ]}
        />
      </section>

      <SourceTrail lead={lead} />

      {/* Activity */}
      <section>
        <h3 className="mb-3 text-[13px] font-medium text-crm-muted">Notes & history</h3>
        <form
          className="mb-4 grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            addLeadNote(lead.id, note, kind);
            setNote("");
          }}
        >
          <Segmented id={`act-${lead.id}`} value={kind} onChange={setKind} options={[{ value: "call", label: "Call log" }, { value: "note", label: "Note" }]} />
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder={kind === "call" ? "What did the client say?" : "Add a note for the team"} className="min-h-[64px]" />
          <Button type="submit" size="sm" disabled={!note.trim()} className="justify-self-end">
            Save
          </Button>
        </form>
        <ol className="relative space-y-4 border-s border-crm-line ps-4">
          {lead.activity.map((a, i) => (
            <li key={i} className="relative">
              <span className={cn("absolute -start-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-crm-surface", a.kind === "stage" ? "bg-crm-success" : a.kind === "step" ? "bg-crm-info" : a.kind === "lost" ? "bg-crm-muted" : a.kind === "created" ? "bg-crm-reserved" : "bg-crm-line")} />
              <p className="text-[13.5px] text-crm-ink">{a.text}</p>
              <p className="mt-0.5 text-[12px] text-crm-muted">
                {a.by} · {timeAgo(a.at)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Lost / reopen */}
      <section className="border-t border-crm-line pt-4">
        {lead.lost ? (
          <Button size="sm" icon={ArrowUUpLeft} onClick={() => reopenLead(lead.id)}>
            Reopen lead
          </Button>
        ) : lead.stage !== "customer" ? (
          lostOpen ? (
            <div className="grid gap-2">
              <p className="text-[13px] text-crm-ink-2">Why was this lead lost?</p>
              <div className="flex flex-wrap gap-2">
                {LOST_REASONS.map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    onClick={() => {
                      markLeadLost(lead.id, r);
                      setLostOpen(false);
                      toast(`${lead.name} marked lost`, { action: { label: "Undo", onClick: () => reopenLead(lead.id) } });
                    }}
                  >
                    {r}
                  </Button>
                ))}
                <Button size="sm" variant="ghost" onClick={() => setLostOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="danger" icon={Prohibit} onClick={() => setLostOpen(true)}>
              Mark as lost
            </Button>
          )
        ) : (
          <p className="inline-flex items-center gap-1.5 text-[13px] font-medium text-crm-success">
            <Check size={14} weight="bold" /> Converted to customer
          </p>
        )}
      </section>
    </div>
  );
}

/**
 * Next follow-up. Admins set the date and the task (with a Save button);
 * the assigned employee sees it and marks it done by logging what they did.
 */
function FollowUpBox({ lead, onDone }: { lead: Lead; onDone: () => void }) {
  const me = useCurrentUser();
  const admin = me.role === "admin";
  const [date, setDate] = useState(lead.nextAt ?? "");
  const [task, setTask] = useState(lead.nextAction ?? "");
  const changed = date !== (lead.nextAt ?? "") || task.trim() !== (lead.nextAction ?? "");
  const overdue = isOverdue(lead);
  const days = lead.nextAt ? differenceInCalendarDays(new Date(`${lead.nextAt}T00:00:00`), new Date(`${todayYmd()}T00:00:00`)) : 0;
  const when = !lead.nextAt ? "" : days < 0 ? `${-days} day${days === -1 ? "" : "s"} late` : days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`;

  return (
    <div className="grid gap-2 border-t border-crm-line pt-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-crm-ink-2">Next follow-up</span>
        {lead.nextBy && <span className="text-[12px] text-crm-muted">Set by {lead.nextBy}</span>}
      </div>

      {/* What the employee sees */}
      {lead.nextAt ? (
        <div className={cn("flex items-start gap-3 rounded-[10px] px-3 py-2.5", overdue ? "bg-crm-danger-bg" : days === 0 ? "bg-crm-reserved-bg" : "bg-crm-info-bg")}>
          <CalendarBlank size={18} className={cn("mt-0.5 shrink-0", overdue ? "text-crm-danger" : days === 0 ? "text-crm-reserved-ink" : "text-crm-info-ink")} />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-medium text-crm-ink">
              {fmtDate(lead.nextAt, "EEE, d MMM yyyy")}
              <span className={cn("ms-2 text-[12px] font-medium", overdue ? "text-crm-danger" : days === 0 ? "text-crm-reserved-ink" : "text-crm-info-ink")}>{when}</span>
            </p>
            <p className="mt-0.5 text-[13px] text-crm-ink-2">{lead.nextAction || "No task written"}</p>
          </div>
          <Button size="sm" variant={overdue ? "primary" : "outline"} icon={Check} onClick={onDone} className="shrink-0">
            Done
          </Button>
        </div>
      ) : (
        <p className="text-[13px] text-crm-muted">{admin ? "No follow-up set. Pick a date and what to do." : "No follow-up set yet. Admin will set the next date."}</p>
      )}

      {/* Admin sets it */}
      {admin && (
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setLeadFollowUp(lead.id, date, task);
            toast.success(date ? `Follow-up set for ${fmtDate(date, "d MMM")}` : "Follow-up removed");
          }}
        >
          <div className="flex gap-2">
            <Input type="date" aria-label="Follow-up date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[150px] shrink-0" />
            <Input aria-label="What to do" placeholder="What to do, e.g. Send quotation" value={task} onChange={(e) => setTask(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            {lead.nextAt && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDate("");
                  setTask("");
                  setLeadFollowUp(lead.id, undefined);
                  toast("Follow-up removed");
                }}
              >
                Remove
              </Button>
            )}
            <Button type="submit" size="sm" variant="primary" disabled={!changed || !date}>
              {lead.nextAt ? "Update follow-up" : "Set follow-up"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Where the lead came from, so anyone can trace it back. */
function SourceTrail({ lead }: { lead: Lead }) {
  const t = lead.trace;
  const rows: [string, React.ReactNode][] =
    lead.source === "ai"
      ? [
          ["Found on", t.platform],
          ["Search used", t.query ? `“${t.query}”` : undefined],
          ["What the AI saw", t.signal],
          ["Match score", t.score != null ? <ScoreBar score={t.score} /> : undefined],
        ]
      : lead.source === "website"
        ? [
            ["Came from", t.referrer],
            ["Campaign", [t.utmSource, t.utmMedium, t.utmCampaign].filter(Boolean).join(" · ") || "No campaign tag"],
            ["Landing page", t.landingPage],
            ["Form page", t.formPage],
            ["Device", t.device],
          ]
        : [
            ["Channel", t.channel],
            ["Referred by", t.referredBy],
            ["Added by", t.addedBy],
          ];
  return (
    <section className="rounded-[10px] bg-crm-surface-2/60 p-4 ring-1 ring-inset ring-crm-line">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-medium text-crm-muted">Lead source</h3>
        <SourcePill source={lead.source} />
      </div>
      <dl className="grid gap-2.5">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k} className="grid grid-cols-[110px_1fr] gap-3 text-[13px]">
              <dt className="text-crm-muted">{k}</dt>
              <dd className="min-w-0 break-words text-crm-ink">{v}</dd>
            </div>
          ))}
      </dl>
      {lead.source === "ai" && t.url && (
        <a href={t.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-crm-info-ink hover:underline">
          Open original post <ArrowSquareOut size={13} />
        </a>
      )}
      {lead.source === "website" && t.bookingId && (
        <Link href={`/dashboard/bookings/${t.bookingId}`} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-crm-info-ink hover:underline">
          Open booking {t.bookingRef} <ArrowRight size={13} className="rtl:rotate-180" />
        </Link>
      )}
      {lead.source === "website" && !t.bookingId && t.bookingRef && <p className="mt-3 text-[12.5px] text-crm-muted">Booking request {t.bookingRef}</p>}
    </section>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-crm-line">
        <span className={cn("block h-full rounded-full", score >= 80 ? "bg-crm-success" : "bg-crm-reserved")} style={{ width: `${score}%` }} />
      </span>
      <span className="tabular">{score}/100</span>
    </span>
  );
}


/** The only way to Customer: a booking for this lead, marked Booked on the Bookings page. */
function BookingBox({ lead }: { lead: Lead }) {
  const bookings = useBookings();
  const newBooking = useNewBooking();
  const actions = useBookingActions();
  const id = lead.bookingId ?? lead.trace.bookingId;
  const b = id ? bookings.find((x) => x.id === id) : undefined;
  const ref = b?.ref ?? lead.bookingRef ?? lead.trace.bookingRef;

  return (
    <section className="flex items-start gap-3 rounded-[10px] border border-crm-line p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-crm-info-bg text-crm-info-ink">
        <Ticket size={18} />
      </span>
      <div className="min-w-0 flex-1">
        {b ? (
          <>
            <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-crm-ink">
              Booking {b.ref} <StatusPill status={b.status} />
            </p>
            <p className="mt-1 text-[12.5px] text-crm-muted">
              {b.status === "reserved" ? "Date is held. Once the advance is paid, mark it Booked: it moves to Bookings and this lead becomes a Customer." : b.status === "booked" || b.status === "closed" ? "Booking is confirmed, so this lead is a Customer. It is listed on the Bookings page." : "This request was cancelled and the date released."}
            </p>
            {b.status === "reserved" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="primary" icon={Check} onClick={() => actions.confirm(b)}>
                  Mark as Booked
                </Button>
                <Button size="sm" variant="ghost" icon={Prohibit} onClick={() => actions.cancel(b)}>
                  Cancel request
                </Button>
              </div>
            )}
            <Link href={`/dashboard/bookings/${b.id}`} className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-crm-info-ink hover:underline">
              {b.status === "reserved" ? "Bill, payments & details" : "Open booking"} <ArrowRight size={13} className="rtl:rotate-180" />
            </Link>
          </>
        ) : lead.stage === "customer" ? (
          <>
            <p className="text-[14px] font-medium text-crm-ink">Booked{ref ? ` · ${ref}` : ""}</p>
            <p className="mt-1 text-[12.5px] text-crm-muted">Converted when the booking was marked Booked.</p>
          </>
        ) : (
          <>
            <p className="text-[14px] font-medium text-crm-ink">{ref ? `Booking ${ref}` : "No booking yet"}</p>
            <p className="mt-1 text-[12.5px] text-crm-muted">This lead becomes a Customer only after its booking is marked Booked. Creating a booking holds the date and moves the lead to Confirmed.</p>
            {!lead.lost && (
              <Button
                size="sm"
                icon={CalendarPlus}
                className="mt-2"
                onClick={() => newBooking({ leadId: lead.id, name: lead.name, mobile: lead.mobile, email: lead.email, organization: lead.organization, eventName: lead.eventName, eventType: lead.eventType, guests: lead.guests, hallId: lead.hallId, date: lead.eventDate })}
              >
                Create booking
              </Button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
