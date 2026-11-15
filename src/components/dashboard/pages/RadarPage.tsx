"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { ArrowClockwise, CalendarBlank, Check, Fire, GlobeHemisphereEast, MapPin, Plus, Target, UsersThree, X } from "@phosphor-icons/react";
import { FilterSelect, FilterSummary, SortSelect, useFilters } from "../ui/filters";
import type { RadarItem } from "@/types/crm";
import { db } from "@/lib/crm/db";
import { fmtDate, money } from "@/lib/crm/format";
import { useHalls, useSettingsValue } from "@/lib/crm/hooks";
import { differenceInCalendarDays } from "date-fns";
import { dismissRadar, refreshRadar } from "@/services/crm";
import { Button, Card, CardTitle, EmptyState, FilterRow, PageHeader, SearchInput, Skeleton } from "../ui/core";
import { Kpi, Tabs } from "../ui/data";
import { Item, m, Stagger } from "../ui/motion";
import { useNewBooking } from "../bookings/NewBookingModal";

function ScoreRing({ score }: { score: number }) {
  const r = 20;
  return (
    <span className="relative grid h-12 w-12 shrink-0 place-items-center" aria-label={`Score ${score} of 100`}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="var(--crm-line)" strokeWidth="4" />
        <m.circle cx="24" cy="24" r={r} fill="none" stroke={score >= 75 ? "var(--accent)" : "var(--crm-reserved)"} strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: score / 100 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <span className="text-[13px] font-semibold text-crm-ink tabular">{score}</span>
    </span>
  );
}

export function RadarPage() {
  const items = db.radar.store((s) => s.items);
  const newBooking = useNewBooking();
  const [scope, setScope] = useState<RadarItem["scope"]>("national");
  const [loading, setLoading] = useState(false);
  const { f, set, reset, active } = useFilters({ q: "", category: "", score: "", show: "", sort: "newest" });
  const stats = useMemo(() => {
    const open = items.filter((r) => !r.dismissed);
    const avg = (l: RadarItem[]) => (l.length ? Math.round(l.reduce((t, r) => t + r.score, 0) / l.length) : 0);
    const nat = open.filter((r) => r.scope === "national");
    const intl = open.filter((r) => r.scope === "international");
    return { total: open.length, dismissed: items.length - open.length, national: nat.length, international: intl.length, natAvg: avg(nat), intAvg: avg(intl), hot: open.filter((r) => r.score >= 80).length, guests: open.reduce((t, r) => t + r.guests, 0), leads: items.filter((r) => r.leadAt).length };
  }, [items]);
  const halls = useHalls().filter((h) => h.active);
  const rates = useSettingsValue().addOnRates;
  /** Smallest active hall that fits the guests (or the largest one), and a rough value: weekday rent + lunch for all guests. */
  const fitFor = (r: RadarItem) => {
    const bySize = [...halls].sort((a, b) => a.capacity - b.capacity);
    const hall = bySize.find((h) => h.capacity >= r.guests) ?? bySize[bySize.length - 1];
    return { hall, value: (hall?.weekdayRate ?? 0) + r.guests * rates.lunch };
  };
  const daysTo = (date: string) => Math.max(0, differenceInCalendarDays(new Date(`${date}T00:00:00`), new Date()));
  const upcoming = useMemo(() => items.filter((r) => !r.dismissed).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6), [items]);
  const byCategory = useMemo(() => {
    const m = new Map<string, { n: number; score: number; guests: number }>();
    for (const r of items) {
      if (r.dismissed) continue;
      const c = m.get(r.category) ?? { n: 0, score: 0, guests: 0 };
      c.n++;
      c.score += r.score;
      c.guests += r.guests;
      m.set(r.category, c);
    }
    return [...m.entries()].map(([cat, c]) => ({ cat, n: c.n, avg: Math.round(c.score / c.n), guests: c.guests })).sort((a, b) => b.n - a.n || b.avg - a.avg);
  }, [items]);
  const categories = useMemo(() => [...new Set(items.map((r) => r.category))].sort(), [items]);
  const visible = useMemo(() => {
    const n = f.q.trim().toLowerCase();
    const list = items.filter(
      (r) =>
        r.scope === scope &&
        (f.show === "dismissed" ? r.dismissed : f.show === "all" ? true : !r.dismissed) &&
        (!f.category || r.category === f.category) &&
        (!f.score || r.score >= Number(f.score)) &&
        (!n || [r.title, r.organizer, r.location, r.summary].join(" ").toLowerCase().includes(n))
    );
    return [...list].sort((a, b) => (f.sort === "score" ? b.score - a.score : f.sort === "date" ? a.date.localeCompare(b.date) : f.sort === "guests" ? b.guests - a.guests : b.createdAt.localeCompare(a.createdAt)));
  }, [items, scope, f]);

  const refresh = () => {
    setLoading(true);
    setTimeout(() => {
      const added = refreshRadar(scope);
      setLoading(false);
      if (added) {
        if (added.scope !== scope) setScope(added.scope);
        toast.success(`New opportunity: ${added.title}`);
      } else toast("No new opportunities right now.");
    }, 1500);
  };

  return (
    <>
      <PageHeader
        title="Opportunity Radar"
        description="Events that could come to ICCB. Live AI search connects later — these are sample ideas."
        action={
          <Button variant="primary" icon={ArrowClockwise} loading={loading} onClick={refresh}>
            Refresh
          </Button>
        }
      />
      <Stagger className="mb-6 grid grid-cols-2 gap-5 xl:grid-cols-4">
        <Item>
          <Kpi label="Open opportunities" value={stats.total} icon={Target} hint={`${stats.leads} added as leads · ${stats.dismissed} dismissed`} />
        </Item>
        <Item>
          <Kpi label="National" value={stats.national} icon={MapPin} hint={`Avg score ${stats.natAvg}`} />
        </Item>
        <Item>
          <Kpi label="International" value={stats.international} icon={GlobeHemisphereEast} hint={`Avg score ${stats.intAvg}`} />
        </Item>
        <Item>
          <Kpi label="Hot leads (80+)" value={stats.hot} icon={Fire} hint={`${stats.guests.toLocaleString("en-IN")} potential guests`} />
        </Item>
      </Stagger>
      <Tabs
        id="radar"
        value={scope}
        onChange={setScope}
        className="mb-6"
        tabs={[
          { value: "national", label: `National · ${stats.national}` },
          { value: "international", label: `International · ${stats.international}` },
        ]}
      />
      <FilterRow>
        <SearchInput value={f.q} onChange={(v) => set("q", v)} placeholder="Title, organizer, city…" />
        <FilterSelect label="Categories" value={f.category} onChange={(v) => set("category", v)} options={categories} />
        <FilterSelect label="Score" all="Any score" value={f.score} onChange={(v) => set("score", v)} options={[{ value: "50", label: "50+" }, { value: "70", label: "70+" }, { value: "80", label: "80+ (hot)" }]} />
        <FilterSelect label="Show" all="Active ideas" value={f.show} onChange={(v) => set("show", v)} options={[{ value: "dismissed", label: "Dismissed" }, { value: "all", label: "Active & dismissed" }]} />
        <SortSelect value={f.sort} onChange={(v) => set("sort", v)} options={[{ value: "newest", label: "Newest found" }, { value: "score", label: "Highest score" }, { value: "date", label: "Soonest event" }, { value: "guests", label: "Most guests" }]} className="sm:ms-auto" />
      </FilterRow>
      <FilterSummary active={active} onClear={reset} count={visible.length} noun="opportunity" plural="opportunities" />
      {visible.length === 0 && !loading ? (
        <div className="crm-card">
          <EmptyState icon={Target} text={active ? "No opportunities match these filters." : "No opportunities here. Refresh to look for more."} action={active ? <Button onClick={reset}>Clear filters</Button> : <Button onClick={refresh}>Refresh</Button>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {loading && <Skeleton className="h-[220px]" />}
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((r) => (
              <m.article key={r.id} layout initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="crm-card crm-card-hover flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-flex h-6 items-center rounded-full bg-crm-surface-2 px-2.5 text-[12px] font-medium text-crm-ink-2">{r.category}</span>
                    <h3 className="mt-2 text-[16px] font-semibold leading-snug text-crm-ink">{r.title}</h3>
                  </div>
                  <ScoreRing score={r.score} />
                </div>
                <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-crm-muted">
                  <span className="inline-flex items-center gap-1">
                    <CalendarBlank size={14} /> {fmtDate(r.date)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} /> {r.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <UsersThree size={14} /> {r.guests.toLocaleString("en-IN")} guests
                  </span>
                </p>
                <p className="mt-3 flex-1 text-[14px] text-crm-ink-2">{r.summary}</p>
                <p className="mt-2 text-[12.5px] text-crm-muted">Organizer: {r.organizer}</p>
                {(() => {
                  const fit = fitFor(r);
                  return (
                    <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-[10px] border border-crm-line bg-crm-line text-[12px]">
                      <span className="bg-crm-surface px-2.5 py-2">
                        <span className="block text-crm-muted">Best hall</span>
                        <span className="block truncate font-medium text-crm-ink">{fit.hall?.name ?? "—"}</span>
                      </span>
                      <span className="bg-crm-surface px-2.5 py-2">
                        <span className="block text-crm-muted">Est. value</span>
                        <span className="block truncate font-medium text-crm-ink tabular">{money(fit.value)}</span>
                      </span>
                      <span className="bg-crm-surface px-2.5 py-2">
                        <span className="block text-crm-muted">Starts in</span>
                        <span className="block font-medium text-crm-ink tabular">{daysTo(r.date)} days</span>
                      </span>
                    </div>
                  );
                })()}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-crm-line pt-4">
                  {r.leadAt ? (
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-crm-success-bg px-3 text-[12.5px] font-medium text-crm-success">
                      <Check size={13} weight="bold" /> Lead added {fmtDate(r.leadAt, "d MMM")}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      icon={Plus}
                      onClick={() => {
                        db.radar.update(r.id, { leadAt: new Date().toISOString() });
                        newBooking({ name: r.organizer, eventName: r.title, eventType: r.eventType, guests: r.guests, hallId: fitFor(r).hall?.id });
                      }}
                    >
                      Add as lead
                    </Button>
                  )}
                  {r.dismissed ? (
                    <Button size="sm" variant="ghost" onClick={() => db.radar.update(r.id, { dismissed: false })}>
                      Restore
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" icon={X} onClick={() => dismissRadar(r.id)}>
                      Dismiss
                    </Button>
                  )}
                </div>
              </m.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardTitle title="Coming up" action={<span className="text-[12.5px] text-crm-muted">Nearest event dates, both scopes</span>} />
          <ol className="px-2 pb-3">
            {upcoming.map((r) => (
              <li key={r.id} className="flex items-center gap-4 rounded-[10px] px-3 py-2.5">
                <span className="grid w-12 shrink-0 text-center leading-tight">
                  <span className="text-[11px] uppercase text-crm-muted">{fmtDate(r.date, "MMM")}</span>
                  <span className="text-[18px] font-semibold text-crm-ink tabular">{fmtDate(r.date, "d")}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-crm-ink">{r.title}</span>
                  <span className="block truncate text-[12.5px] text-crm-muted">
                    {r.scope === "national" ? "National" : "International"} · {r.category} · {r.guests.toLocaleString("en-IN")} guests
                  </span>
                </span>
                <span className="shrink-0 text-end">
                  <span className="block text-[13px] font-medium text-crm-ink tabular">{daysTo(r.date)} days</span>
                  <span className="block text-[12px] text-crm-muted tabular">score {r.score}</span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle title="By category" />
          <ul className="divide-y divide-crm-line border-t border-crm-line">
            {byCategory.map((c) => (
              <li key={c.cat} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13.5px]">
                <span>
                  <span className="block text-crm-ink">{c.cat}</span>
                  <span className="block text-[12px] text-crm-muted">{c.guests.toLocaleString("en-IN")} potential guests</span>
                </span>
                <span className="text-end">
                  <span className="block text-crm-ink tabular">{c.n}</span>
                  <span className="block text-[12px] text-crm-muted tabular">avg {c.avg}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      <p className="mt-4 text-[12.5px] text-crm-muted">Score = fit for ICCB (size, date, past interest). Estimated value is weekday hall rent plus lunch for every guest — a rough guide, not a quote.</p>
    </>
  );
}
