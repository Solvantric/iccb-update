"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { TrendDown, TrendUp } from "@phosphor-icons/react";
import { useBookings, useHalls, useSettingsValue, useSpecials } from "@/lib/crm/hooks";
import { dayOfWeek } from "@/lib/crm/bill";
import { fmtDate, todayYmd, ymd } from "@/lib/crm/format";
import { applySpecialPrice } from "@/services/crm";
import { cn } from "@/lib/utils/cn";
import { Button, Card, FilterRow, PageHeader, Segmented } from "../ui/core";
import { FilterSelect } from "../ui/filters";
import { EVENT_TYPES } from "@/types/crm";
import { m } from "../ui/motion";

interface Suggestion {
  id: string;
  kind: "high" | "low";
  from: string;
  to: string;
  percent: number;
  text: string;
}

const range = (from: string, to: string) => (from === to ? fmtDate(from, "d MMM") : `${fmtDate(from, "d MMM")} – ${fmtDate(to, "d MMM")}`);

/** Group sorted yyyy-MM-dd dates into consecutive runs. */
function runs(dates: string[]) {
  const out: { from: string; to: string; days: number }[] = [];
  for (const d of dates) {
    const last = out[out.length - 1];
    if (last && ymd(addDays(new Date(`${last.to}T00:00:00`), 1)) === d) {
      last.to = d;
      last.days++;
    } else out.push({ from: d, to: d, days: 1 });
  }
  return out;
}

export function DemandPage() {
  const router = useRouter();
  const bookings = useBookings();
  const allHalls = useHalls().filter((h) => h.active);
  const specials = useSpecials();
  const { weekendDays } = useSettingsValue();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const today = todayYmd();

  const [hallF, setHallF] = useState("");
  const [typeF, setTypeF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [horizon, setHorizon] = useState("3");
  const halls = useMemo(() => (hallF ? allHalls.filter((h) => h.id === hallF) : allHalls), [allHalls, hallF]);

  const demand = useMemo(() => {
    const map = new Map<string, { requests: number; taken: Set<string> }>();
    for (const b of bookings) {
      if ((hallF && b.hallId !== hallF) || (typeF && b.eventType !== typeF) || (statusF === "active" && (b.status === "cancelled" || b.status === "closed"))) continue;
      const cur = map.get(b.date) ?? { requests: 0, taken: new Set<string>() };
      cur.requests++;
      if (b.status === "reserved" || b.status === "booked") cur.taken.add(b.hallId);
      map.set(b.date, cur);
    }
    return map;
  }, [bookings, hallF, typeF, statusF]);

  const months = useMemo(() => Array.from({ length: Number(horizon) }, (_, i) => startOfMonth(addMonths(new Date(), i))), [horizon]);

  const suggestions = useMemo(() => {
    const days = eachDayOfInterval({ start: new Date(`${today}T00:00:00`), end: endOfMonth(addMonths(new Date(), Number(horizon) - 1)) }).map(ymd);
    const hot = days.filter((d) => {
      const x = demand.get(d);
      return x && (x.requests >= 3 || (halls.length > 0 && x.taken.size / halls.length >= 0.8));
    });
    const quiet = days.slice(1, 31).filter((d) => !weekendDays.includes(dayOfWeek(d)) && !demand.get(d)?.requests);
    const out: Suggestion[] = [
      ...runs(hot).map((r) => ({ id: `high-${r.from}`, kind: "high" as const, from: r.from, to: r.to, percent: 10, text: `Increase price by 10% for ${range(r.from, r.to)}` })),
      ...runs(quiet)
        .filter((r) => r.days >= 3)
        .map((r) => ({ id: `low-${r.from}`, kind: "low" as const, from: r.from, to: r.to, percent: -10, text: `Offer 10% off for ${range(r.from, r.to)}` })),
    ];
    const applied = new Set(specials.map((s) => `${s.from}|${s.to}`));
    return out.filter((s) => !dismissed.has(s.id) && !applied.has(`${s.from}|${s.to}`)).slice(0, 3);
  }, [demand, halls.length, weekendDays, specials, dismissed, today, horizon]);

  const shade = (n: number) => (n >= 3 ? "bg-crm-brand text-white" : n === 2 ? "bg-crm-brand/45 text-crm-ink" : n === 1 ? "bg-crm-brand/15 text-crm-ink" : "bg-crm-surface text-crm-ink-2");

  return (
    <>
      <PageHeader title="Demand & Pricing" description="See which dates are most requested, so you can set better prices." />
      <FilterRow>
        <Segmented
          id="horizon"
          value={horizon}
          onChange={setHorizon}
          options={[
            { value: "3", label: "3 months" },
            { value: "6", label: "6 months" },
          ]}
        />
        <FilterSelect label="Halls" value={hallF} onChange={setHallF} options={allHalls.map((h) => ({ value: h.id, label: h.name }))} />
        <FilterSelect label="Event types" value={typeF} onChange={setTypeF} options={EVENT_TYPES} />
        <FilterSelect label="Requests" all="All requests (incl. cancelled)" value={statusF} onChange={setStatusF} options={[{ value: "active", label: "Reserved & booked only" }]} />
      </FilterRow>

      <AnimatePresence initial={false}>
        {suggestions.length > 0 && (
          <m.div layout className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
            <AnimatePresence initial={false} mode="popLayout">
              {suggestions.map((s) => {
                const I = s.kind === "high" ? TrendUp : TrendDown;
                return (
                  <m.div key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="crm-card flex flex-col p-5">
                    <span className={cn("mb-3 inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium", s.kind === "high" ? "bg-crm-booked-bg text-crm-brand-text" : "bg-crm-success-bg text-crm-success")}>
                      <I size={13} weight="bold" /> {s.kind === "high" ? "High demand" : "Low demand"}
                    </span>
                    <p className="flex-1 text-[15px] font-medium text-crm-ink">{s.text}</p>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          applySpecialPrice(s.from, s.to, s.percent, s.kind === "high" ? "High demand" : "Low demand");
                          toast.success("Special price added to Pricing", { action: { label: "View", onClick: () => router.push("/dashboard/admin/pricing") } });
                        }}
                      >
                        Apply
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDismissed((d) => new Set(d).add(s.id))}>
                        Dismiss
                      </Button>
                    </div>
                  </m.div>
                );
              })}
            </AnimatePresence>
          </m.div>
        )}
      </AnimatePresence>

      <Card className="p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-crm-ink">
            Requests per date · next {horizon} months{hallF ? ` · ${halls[0]?.name}` : ""}
          </h2>
          <div className="flex items-center gap-1.5 text-[12px] text-crm-muted">
            Fewer
            {[0, 1, 2, 3].map((n) => (
              <span key={n} className={cn("h-3.5 w-3.5 rounded-[4px] border border-crm-line", shade(n))} />
            ))}
            More
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {months.map((mo) => (
            <div key={mo.toISOString()}>
              <p className="mb-2 text-[13.5px] font-medium text-crm-ink">{format(mo, "MMMM yyyy")}</p>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-crm-muted">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
                {eachDayOfInterval({ start: startOfWeek(mo), end: endOfWeek(endOfMonth(mo)) }).map((d) => {
                  const key = ymd(d);
                  if (!isSameMonth(d, mo)) return <span key={key} />;
                  const x = demand.get(key);
                  const n = x?.requests ?? 0;
                  const free = halls.length - (x?.taken.size ?? 0);
                  const past = key < today;
                  return (
                    <span
                      key={key}
                      title={`${fmtDate(key, "EEE, d MMM")}: ${n} request${n === 1 ? "" : "s"} · ${free} hall${free === 1 ? "" : "s"} free`}
                      className={cn("grid aspect-square place-items-center rounded-[6px] border border-crm-line text-[12px] tabular transition-transform hover:scale-110", shade(n), past && "opacity-40")}
                    >
                      {format(d, "d")}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {specials.length > 0 && (
          <p className="mt-5 text-[13px] text-crm-muted">
            {specials.length} special price{specials.length === 1 ? "" : "s"} active —{" "}
            <Link href="/dashboard/admin/pricing" className="text-crm-brand-text hover:underline">
              see Pricing
            </Link>
          </p>
        )}
      </Card>
    </>
  );
}
