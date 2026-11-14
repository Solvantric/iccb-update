"use client";
import { useMemo, useState } from "react";
import { subDays } from "date-fns";
import { ChartLineUp, Eye, PaperPlaneTilt } from "@phosphor-icons/react";
import { DEVICES, TRAFFIC_SOURCES, type AnalyticsType } from "@/types/crm";
import { db } from "@/lib/crm/db";
import { num } from "@/lib/crm/format";
import { Button, Card, CardTitle, FilterRow, PageHeader, Segmented } from "../ui/core";
import { FilterSelect } from "../ui/filters";
import { Kpi, SimpleBars } from "../ui/data";
import { Item, m, Stagger } from "../ui/motion";

type Range = "7" | "30" | "90";
const FUNNEL: { type: AnalyticsType; label: string }[] = [
  { type: "visit", label: "Visit" },
  { type: "venue_view", label: "Venue page" },
  { type: "form_open", label: "Booking form opened" },
  { type: "form_submit", label: "Form submitted" },
];

export function AnalyticsPage() {
  const events = db.analytics.store((s) => s.items);
  const [range, setRange] = useState<Range>("30");
  const [source, setSource] = useState("");
  const [device, setDevice] = useState("");

  const data = useMemo(() => {
    const since = subDays(new Date(), Number(range)).toISOString();
    const inRange = events.filter((e) => e.createdAt >= since && (!source || e.source === source) && (!device || (e.device ?? "Desktop") === device));
    const visitsList = inRange.filter((e) => e.type === "visit");
    const pages = new Map<string, number>();
    for (const e of inRange) if (e.type === "visit" || e.type === "venue_view") pages.set(e.page ?? "/", (pages.get(e.page ?? "/") ?? 0) + 1);
    const count = (t: AnalyticsType) => inRange.filter((e) => e.type === t).length;
    const visits = count("visit");
    const submits = count("form_submit");
    return {
      visits,
      submits,
      conversion: visits ? (submits / visits) * 100 : 0,
      sources: TRAFFIC_SOURCES.map((s) => ({ label: s, value: inRange.filter((e) => e.type === "visit" && e.source === s).length })),
      funnel: FUNNEL.map((f) => ({ ...f, value: count(f.type) })),
      devices: DEVICES.map((d) => ({ label: d, value: visitsList.filter((e) => (e.device ?? "Desktop") === d).length })),
      pages: [...pages.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [events, range, source, device]);
  const top = data.funnel[0]?.value || 1;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Website visitors and booking form performance."
        action={
          <Segmented
            id="range"
            value={range}
            onChange={setRange}
            options={[
              { value: "7", label: "7d" },
              { value: "30", label: "30d" },
              { value: "90", label: "90d" },
            ]}
          />
        }
      />
      <FilterRow>
        <FilterSelect label="Sources" value={source} onChange={setSource} options={TRAFFIC_SOURCES} />
        <FilterSelect label="Devices" value={device} onChange={setDevice} options={DEVICES} />
        {(source || device) && (
          <Button size="sm" variant="ghost" onClick={() => { setSource(""); setDevice(""); }}>
            Clear filters
          </Button>
        )}
      </FilterRow>
      <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Item>
          <Kpi label="Visitors" value={data.visits} icon={Eye} />
        </Item>
        <Item>
          <Kpi label="Form submissions" value={data.submits} icon={PaperPlaneTilt} />
        </Item>
        <Item>
          <Kpi label="Conversion" value={data.conversion} icon={ChartLineUp} format={(n) => `${n.toFixed(1)}%`} hint="Submissions ÷ visitors" />
        </Item>
      </Stagger>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardTitle title="Visitors by source" />
          <div className="px-3 pb-4">
            <SimpleBars key={range} data={data.sources} height={260} />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle title="Funnel" />
          <ol className="space-y-4 px-5 pb-5">
            {data.funnel.map((f, i) => {
              const pct = (f.value / top) * 100;
              return (
                <li key={f.type}>
                  <div className="mb-1.5 flex items-baseline justify-between text-[13.5px]">
                    <span className="text-crm-ink">
                      <span className="me-2 text-crm-muted tabular">{i + 1}</span>
                      {f.label}
                    </span>
                    <span className="text-crm-ink-2 tabular">
                      {num(f.value)} <span className="text-[12px] text-crm-muted">· {pct.toFixed(pct < 10 ? 1 : 0)}%</span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-crm-surface-2">
                    <m.div key={range} className="h-full origin-left rounded-full bg-crm-brand rtl:origin-right" style={{ opacity: 1 - i * 0.18 }} initial={{ scaleX: 0 }} animate={{ scaleX: pct / 100 }} transition={{ duration: 0.5, delay: i * 0.05 }} />
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle title="Visitors by device" />
          <ul className="space-y-3 px-5 pb-5">
            {data.devices.map((d) => {
              const pct = data.visits ? (d.value / data.visits) * 100 : 0;
              return (
                <li key={d.label} className="flex items-center justify-between gap-3 text-[13.5px]">
                  <span className="w-20 text-crm-ink">{d.label}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-crm-surface-2">
                    <m.span className="block h-full origin-left rounded-full bg-crm-ink-2/60 rtl:origin-right" initial={{ scaleX: 0 }} animate={{ scaleX: pct / 100 }} transition={{ duration: 0.5 }} />
                  </span>
                  <span className="w-24 text-end text-crm-muted tabular">
                    {num(d.value)} · {Math.round(pct)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <CardTitle title="Top pages" />
          {data.pages.length === 0 ? (
            <p className="px-5 pb-5 text-[13.5px] text-crm-muted">No page data in this range.</p>
          ) : (
            <ol className="divide-y divide-crm-line border-t border-crm-line">
              {data.pages.map(([page, n], i) => (
                <li key={page} className="flex items-center justify-between gap-3 px-5 py-2.5 text-[13.5px]">
                  <span className="truncate text-crm-ink">
                    <span className="me-2 text-crm-muted tabular">{i + 1}</span>
                    {page}
                  </span>
                  <span className="text-crm-muted tabular">{num(n)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}
