"use client";
import { useMemo, useState } from "react";
import { addMonths, format, getDaysInMonth, startOfMonth } from "date-fns";
import { ArrowDown, ArrowUp, CalendarX, Check, Lightbulb, MapTrifold, X } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs } from "../ui/tabs";
import { IdleDatesTab } from "../features/IdleDates";
import type { HallTariff } from "@/types/crm";
import { db, getSettings, useRole } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { isPeakSeason, parseYmd, tariffFor } from "@/lib/crm/pricing";
import { taka } from "@/lib/crm/format";
import { useAnalytics, useBookings, useCrmAction, useEnquiries, useHalls, useTariffs } from "@/services/crm/hooks";
import { withLatency } from "@/services/crm/base";
import { getRates } from "@/lib/crm/db";
import { cn } from "@/lib/utils/cn";
import { m, Item, Stagger } from "../ui/motion";
import { Badge, Button, Card, CardHeader, EmptyState, PageHeader, Skeleton } from "../ui/core";
import { Heatmap } from "../ui/charts";

interface Cell {
  index: number;
  occupancy: number;
  requests: number;
  enquiries: number;
  interest: number;
}

interface Suggestion {
  id: string;
  hallId: string;
  group: HallTariff["group"];
  month: string;
  pct: number;
  reasons: string[];
  index: number;
}

export function DemandPage() {
  const role = useRole();
  const bookings = useBookings();
  const enquiries = useEnquiries();
  const analytics = useAnalytics();
  const halls = useHalls();
  const tariffs = useTariffs();
  const [sel, setSel] = useState<{ r: string; c: string } | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const tab: "demand" | "idle" = params.get("tab") === "idle" ? "idle" : "demand";
  const setTab = (t: "demand" | "idle") => router.replace(t === "idle" ? "/dashboard/marketing/demand?tab=idle" : "/dashboard/marketing/demand", { scroll: false });
  const canApply = can(role, "approve", "demand") || role === "admin";

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => format(addMonths(startOfMonth(new Date()), i), "yyyy-MM")), []);
  const hallList = useMemo(() => (halls.data ?? []).filter((h) => h.active && h.kind === "hall").sort((a, b) => a.order - b.order), [halls.data]);

  const grid = useMemo(() => {
    const out: Record<string, Record<string, Cell>> = {};
    if (!bookings.data || !enquiries.data || !analytics.data) return out;
    // Recent web interest per hall (last 90 days), spread over months with a seasonal factor.
    const interestByHall: Record<string, number> = {};
    for (const e of analytics.data) if ((e.type === "availability_check" || e.type === "estimate" || e.type === "venue_view") && e.hallCode) interestByHall[e.hallCode] = (interestByHall[e.hallCode] ?? 0) + 1;
    for (const h of hallList) {
      out[h.id] = {};
      for (const mo of months) {
        const days = getDaysInMonth(parseYmd(`${mo}-01`));
        const live = bookings.data.filter((b) => !b.closed);
        const occupied = new Set(live.flatMap((b) => b.days.filter((d) => d.hallId === h.id && d.date.startsWith(mo) && b.status !== "requested").map((d) => d.date))).size;
        const requests = live.filter((b) => b.status === "requested" && b.days.some((d) => d.hallId === h.id && d.date.startsWith(mo))).length;
        const enq = enquiries.data.filter((e) => e.preferredDate?.startsWith(mo) && (!e.hallPreference || e.hallPreference === h.name)).length;
        const month = parseYmd(`${mo}-01`).getMonth();
        const season = isPeakSeason(parseYmd(`${mo}-01`)) ? 1.6 : month === 10 || month === 1 ? 1.25 : month >= 5 && month <= 7 ? 0.7 : 1;
        const interest = Math.round(((interestByHall[h.code] ?? 0) / 12) * season);
        const index = Math.min(100, Math.round((occupied / days) * 220 + requests * 9 + enq * 7 + interest * 1.4));
        out[h.id][mo] = { index, occupancy: Math.round((occupied / days) * 100), requests, enquiries: enq, interest };
      }
    }
    return out;
  }, [bookings.data, enquiries.data, analytics.data, hallList, months]);

  const ignored = new Set(getSettings().ignoredSuggestions ?? []);
  const suggestions = useMemo<Suggestion[]>(() => {
    const list: Suggestion[] = [];
    const appliedKeys = new Set((tariffs.data ?? []).filter((t) => t.month).map((t) => `${t.group}:${t.month}`));
    const seenGroups = new Set<string>();
    for (const h of hallList) {
      for (const mo of months) {
        const c = grid[h.id]?.[mo];
        if (!c) continue;
        const key = `${h.tariffGroup}:${mo}`;
        // One suggestion per tariff group + month (halls 1–3 share a tariff).
        if (seenGroups.has(key) || appliedKeys.has(key)) continue;
        const id = `sp-${key}`;
        if (ignored.has(id)) continue;
        const reasons: string[] = [];
        let pct = 0;
        if (c.index >= 70) {
          pct = c.index >= 85 ? 10 : 5;
          if (c.occupancy >= 25) reasons.push(`${c.occupancy}% of days already booked`);
          if (c.requests) reasons.push(`${c.requests} open request${c.requests > 1 ? "s" : ""}`);
          if (c.enquiries) reasons.push(`${c.enquiries} enquir${c.enquiries > 1 ? "ies" : "y"} for this month`);
          if (isPeakSeason(parseYmd(`${mo}-01`))) reasons.push("Dec–Jan wedding peak");
          reasons.push(`Demand index ${c.index}/100`);
        } else if (c.index <= 18 && mo > months[1]) {
          pct = -10;
          reasons.push(`Low demand index ${c.index}/100`, `${c.occupancy}% booked so far`, "Weekday promo can fill idle dates");
        }
        if (pct) {
          seenGroups.add(key);
          list.push({ id, hallId: h.id, group: h.tariffGroup, month: mo, pct, reasons, index: c.index });
        }
      }
    }
    return list.sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct) || b.index - a.index).slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, hallList, months, tariffs.data, ignored.size]);

  const apply = useCrmAction(
    (s: Suggestion) =>
      withLatency(() => {
        const base = tariffFor(getRates(), s.group);
        if (!base) throw new Error("No base tariff");
        const f = 1 + s.pct / 100;
        const r = (n: number) => Math.round((n * f) / 1000) * 1000;
        return db.tariffs.create({
          key: `${s.group}:${s.month}`,
          effectiveFrom: format(new Date(), "yyyy-MM-dd"),
          group: s.group,
          month: s.month,
          label: `${base.label} — special ${format(parseYmd(`${s.month}-01`), "MMM yyyy")} (${s.pct > 0 ? "+" : ""}${s.pct}%)`,
          peakWeekend: r(base.peakWeekend),
          peakWeekday: r(base.peakWeekday),
          offPeak: r(base.offPeak),
          extraHour: base.extraHour,
          note: `Smart Pricing: ${s.reasons.join("; ")}`,
        });
      }),
    { success: (t) => `Special tariff applied: ${t.label}` }
  );
  const ignore = useCrmAction(
    (id: string) =>
      withLatency(() => {
        const st = getSettings();
        return db.settings.update(st.id, { ignoredSuggestions: [...(st.ignoredSuggestions ?? []), id] }, { silent: true });
      }),
    { success: "Suggestion ignored" }
  );

  const selCell = sel ? grid[sel.r]?.[sel.c] : null;
  const loading = bookings.isLoading || enquiries.isLoading || analytics.isLoading || halls.isLoading;
  const specials = (tariffs.data ?? []).filter((t) => t.month).sort((a, b) => (a.month ?? "").localeCompare(b.month ?? ""));

  return (
    <Stagger>
      <Item>
        <PageHeader eyebrow="Marketing" title="Demand & idle dates" description="Demand per hall per month, smart pricing, and offers that turn empty hall-days into bookings." />
      </Item>
      <Item>
        <Tabs tabs={[{ value: "demand" as const, label: "Demand & pricing", icon: MapTrifold }, { value: "idle" as const, label: "Idle dates", icon: CalendarX }]} value={tab} onChange={setTab} className="mb-6" />
      </Item>
      {tab === "idle" ? (
        <Item>
          <IdleDatesTab />
        </Item>
      ) : (<>
      <Item>
        <Card className="mb-6">
          <CardHeader icon={MapTrifold} title="Next 12 months" description="Darker = higher demand. Click a cell for the breakdown." />
          <div className="px-5 pb-5">
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : (
              <Heatmap
                rows={hallList.map((h) => ({ id: h.id, label: h.name }))}
                cols={months.map((mo) => ({ id: mo, label: format(parseYmd(`${mo}-01`), "MMM yy") }))}
                value={(r, c) => grid[r]?.[c]?.index ?? 0}
                max={100}
                selected={sel}
                onCellClick={(r, c) => setSel({ r, c })}
              />
            )}
            {selCell && sel && (
              <m.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4 grid gap-3 rounded-xl bg-crm-surface-2 p-4 sm:grid-cols-5">
                <div>
                  <p className="text-[12px] text-crm-muted">Hall · month</p>
                  <p className="text-[13.5px] font-semibold text-crm-ink">
                    {hallList.find((h) => h.id === sel.r)?.name} · {format(parseYmd(`${sel.c}-01`), "MMMM yyyy")}
                  </p>
                </div>
                {[
                  ["Demand index", `${selCell.index}/100`],
                  ["Booked days", `${selCell.occupancy}%`],
                  ["Open requests", selCell.requests],
                  ["Enquiries · web interest", `${selCell.enquiries} · ${selCell.interest}`],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <p className="text-[12px] text-crm-muted">{k}</p>
                    <p className="text-[15px] font-bold text-crm-ink tabular">{v}</p>
                  </div>
                ))}
              </m.div>
            )}
          </div>
        </Card>
      </Item>
      <Item>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader icon={Lightbulb} title="Smart pricing suggestions" description="Apply writes a special tariff rule; Ignore hides the suggestion." />
            {loading ? (
              <div className="space-y-3 px-5 pb-5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : suggestions.length === 0 ? (
              <EmptyState icon={Lightbulb} title="No suggestions right now" description="Demand is balanced — or every suggestion has been applied or ignored." />
            ) : (
              <ul className="divide-y divide-crm-line">
                {suggestions.map((s) => {
                  const base = tariffFor(getRates(), s.group);
                  const label = base?.label ?? s.group;
                  const up = s.pct > 0;
                  return (
                    <li key={s.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", up ? "bg-crm-tint text-crm-brand" : "bg-[#EFF8FF] text-[#1570EF] dark:bg-[#0F2236]")}>{up ? <ArrowUp size={20} weight="bold" /> : <ArrowDown size={20} weight="bold" />}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-crm-ink">
                          {label} · {format(parseYmd(`${s.month}-01`), "MMMM yyyy")}{" "}
                          <Badge tone={up ? "brand" : "blue"}>
                            {up ? "+" : ""}
                            {s.pct}%
                          </Badge>
                        </p>
                        {base && (
                          <p className="text-[12.5px] text-crm-muted tabular">
                            Off-peak {taka(base.offPeak)} → {taka(Math.round((base.offPeak * (1 + s.pct / 100)) / 1000) * 1000)}
                          </p>
                        )}
                        <ul className="mt-1.5 flex flex-wrap gap-1.5">
                          {s.reasons.map((r) => (
                            <li key={r}>
                              <Badge tone="neutral">{r}</Badge>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {canApply && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="primary" icon={Check} loading={apply.isPending && apply.variables?.id === s.id} onClick={() => apply.mutate(s)}>
                            Apply
                          </Button>
                          <Button size="sm" variant="ghost" icon={X} onClick={() => ignore.mutate(s.id)}>
                            Ignore
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
          <Card>
            <CardHeader title="Special tariff rules" description="Created by Smart Pricing. Edit or delete in Admin → Pricing." />
            <ul className="divide-y divide-crm-line px-5 pb-3">
              {specials.map((t) => (
                <li key={t.id} className="py-2.5">
                  <p className="text-[13px] font-medium text-crm-ink">{t.label}</p>
                  <p className="text-[12px] text-crm-muted tabular">
                    Peak wknd {taka(t.peakWeekend)} · wkday {taka(t.peakWeekday)} · off-peak {taka(t.offPeak)}
                  </p>
                </li>
              ))}
              {!specials.length && <li className="py-4 text-[13px] text-crm-muted">No special rules yet.</li>}
            </ul>
          </Card>
        </div>
      </Item>
      </>)}
    </Stagger>
  );
}
