"use client";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { ArrowClockwise, CalendarBlank, MapPin, Plus, Target, UsersThree, X } from "@phosphor-icons/react";
import { FilterSelect, FilterSummary, SortSelect, useFilters } from "../ui/filters";
import type { RadarItem } from "@/types/crm";
import { db } from "@/lib/crm/db";
import { fmtDate } from "@/lib/crm/format";
import { dismissRadar, refreshRadar } from "@/services/crm";
import { Button, EmptyState, FilterRow, PageHeader, SearchInput, Skeleton } from "../ui/core";
import { Tabs } from "../ui/data";
import { m } from "../ui/motion";
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
      <Tabs
        id="radar"
        value={scope}
        onChange={setScope}
        className="mb-6"
        tabs={[
          { value: "national", label: "National" },
          { value: "international", label: "International" },
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
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-crm-line pt-4">
                  <Button size="sm" icon={Plus} onClick={() => newBooking({ name: r.organizer, eventName: r.title, eventType: r.eventType, guests: r.guests })}>
                    Add as lead
                  </Button>
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
    </>
  );
}
