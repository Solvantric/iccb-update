"use client";
import { useMemo, useState } from "react";
import { format, subDays } from "date-fns";
import { ChartLineUp, Eye, Funnel as FunnelIcon, Globe, UserCircle, Users } from "@phosphor-icons/react";
import type { AnalyticsEvent } from "@/types/crm";
import { ago } from "@/lib/crm/format";
import { useAnalytics } from "@/services/crm/hooks";
import { Item, Stagger } from "../ui/motion";
import { Badge, Card, CardHeader, PageHeader, Segmented } from "../ui/core";
import { DataTable, type Column } from "../ui/data-table";
import { KpiCard } from "../ui/kpi";
import { AreaTrend, Bars, Donut, Funnel } from "../ui/charts";

const STEP_LABEL: Record<AnalyticsEvent["type"], string> = { visit: "Visit", venue_view: "Venue view", availability_check: "Availability check", estimate: "Estimate", booking_form: "Booking form", confirmed: "Confirmed" };
const LANG_LABEL = { en: "English", bn: "Bangla", ar: "Arabic", zh: "Chinese" } as const;

interface Visitor {
  id: string;
  createdAt: string;
  visitorId: string;
  known?: string;
  device: string;
  country: string;
  source: string;
  pages: number;
  deepest: AnalyticsEvent["type"];
  at: string;
}

function delta(cur: number, prev: number) {
  return prev ? Math.round(((cur - prev) / prev) * 100) : 0;
}

export function AnalyticsPage() {
  const analytics = useAnalytics();
  const [range, setRange] = useState<"7" | "30" | "90">("30");

  const data = useMemo(() => {
    const all = analytics.data ?? [];
    const days = Number(range);
    const since = subDays(new Date(), days).toISOString();
    const prevSince = subDays(new Date(), days * 2).toISOString();
    const cur = all.filter((e) => e.at >= since);
    const prev = all.filter((e) => e.at >= prevSince && e.at < since);
    const visitors = (list: AnalyticsEvent[]) => new Set(list.map((e) => e.visitorId)).size;
    const count = (list: AnalyticsEvent[], t: AnalyticsEvent["type"]) => list.filter((e) => e.type === t).length;

    const trendMap = new Map<string, { date: string; visits: number; leads: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      trendMap.set(d, { date: format(subDays(new Date(), i), days > 30 ? "dd MMM" : "dd"), visits: 0, leads: 0 });
    }
    for (const e of cur) {
      const r = trendMap.get(e.at.slice(0, 10));
      if (!r) continue;
      if (e.type === "visit") r.visits++;
      if (e.type === "booking_form") r.leads++;
    }

    const group = <K extends keyof AnalyticsEvent>(k: K, list = cur.filter((e) => e.type === "visit")) =>
      Object.entries(list.reduce<Record<string, number>>((acc, e) => ({ ...acc, [String(e[k])]: (acc[String(e[k])] ?? 0) + 1 }), {}))
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    const byVisitor = new Map<string, AnalyticsEvent[]>();
    for (const e of cur) byVisitor.set(e.visitorId, [...(byVisitor.get(e.visitorId) ?? []), e]);
    const order: AnalyticsEvent["type"][] = ["visit", "venue_view", "availability_check", "estimate", "booking_form", "confirmed"];
    const visitorRows: Visitor[] = [...byVisitor.entries()]
      .map(([id, evs]) => {
        const first = evs[0];
        const deepest = evs.reduce((d, e) => (order.indexOf(e.type) > order.indexOf(d) ? e.type : d), "visit" as AnalyticsEvent["type"]);
        return { id, createdAt: first.at, visitorId: id, known: evs.find((e) => e.leadName)?.leadName, device: first.device, country: first.country, source: first.source, pages: evs.length, deepest, at: evs.map((e) => e.at).sort().pop()! };
      })
      .sort((a, b) => b.at.localeCompare(a.at));

    const topPages = group("page", cur).slice(0, 8).map((p) => ({ page: p.name, views: p.value }));

    return {
      visitors: visitors(cur),
      visitorsDelta: delta(visitors(cur), visitors(prev)),
      known: visitorRows.filter((v) => v.known).length,
      forms: count(cur, "booking_form"),
      formsDelta: delta(count(cur, "booking_form"), count(prev, "booking_form")),
      conv: count(cur, "visit") ? (count(cur, "confirmed") / count(cur, "visit")) * 100 : 0,
      trend: [...trendMap.values()],
      sources: group("source"),
      languages: group("language").map((l) => ({ ...l, name: LANG_LABEL[l.name as keyof typeof LANG_LABEL] ?? l.name })),
      devices: group("device"),
      countries: group("country").slice(0, 6),
      funnel: order.map((t) => ({ label: STEP_LABEL[t], value: count(cur, t) })),
      topPages,
      visitorRows,
      events: cur.slice().sort((a, b) => b.at.localeCompare(a.at)),
    };
  }, [analytics.data, range]);

  const visitorCols: Column<Visitor>[] = [
    { id: "who", header: "Visitor", primary: true, value: (v) => v.known ?? "Anonymous", cell: (v) => (v.known ? <span className="flex items-center gap-1.5 font-semibold text-crm-ink"><UserCircle size={16} weight="fill" className="text-crm-brand" />{v.known}</span> : <span className="text-crm-muted">Anonymous · {v.visitorId.slice(-5)}</span>) },
    { id: "type", header: "Type", value: (v) => (v.known ? 1 : 0), cell: (v) => <Badge tone={v.known ? "brand" : "grey"}>{v.known ? "Known lead" : "Anonymous"}</Badge> },
    { id: "device", header: "Device", value: (v) => v.device, cell: (v) => v.device },
    { id: "country", header: "Country", value: (v) => v.country, cell: (v) => v.country },
    { id: "source", header: "Source", value: (v) => v.source, cell: (v) => v.source },
    { id: "pages", header: "Pages", align: "end", value: (v) => v.pages, cell: (v) => <span className="tabular">{v.pages}</span> },
    { id: "deepest", header: "Reached", value: (v) => v.deepest, cell: (v) => <Badge tone={v.deepest === "confirmed" ? "green" : v.deepest === "booking_form" ? "brand" : "neutral"}>{STEP_LABEL[v.deepest]}</Badge> },
    { id: "at", header: "Last seen", value: (v) => v.at, cell: (v) => ago(v.at) },
  ];
  const eventCols: Column<AnalyticsEvent>[] = [
    { id: "type", header: "Event", primary: true, value: (e) => e.type, cell: (e) => <Badge tone="neutral">{STEP_LABEL[e.type]}</Badge> },
    { id: "page", header: "Page", value: (e) => e.page, cell: (e) => <span className="font-mono text-[12px]">{e.page}</span> },
    { id: "source", header: "Source", value: (e) => e.source, cell: (e) => e.source },
    { id: "lang", header: "Lang", value: (e) => e.language, cell: (e) => e.language.toUpperCase() },
    { id: "at", header: "Time", value: (e) => e.at, cell: (e) => ago(e.at) },
  ];

  const loading = analytics.isLoading;
  return (
    <Stagger>
      <Item>
        <PageHeader eyebrow="Marketing" title="Website analytics" description="Visitors, traffic sources, languages and the booking funnel from the public website." actions={<Segmented value={range} onChange={setRange} options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }]} />} />
      </Item>
      <Item>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Visitors" value={data.visitors} delta={data.visitorsDelta} icon={Users} spark={data.trend.map((t) => t.visits)} loading={loading} />
          <KpiCard label="Known leads" value={data.known} icon={UserCircle} tone="blue" loading={loading} />
          <KpiCard label="Booking forms" value={data.forms} delta={data.formsDelta} icon={Eye} tone="amber" spark={data.trend.map((t) => t.leads)} loading={loading} />
          <KpiCard label="Visit → confirmed" value={data.conv} format={(n) => `${n.toFixed(1)}%`} icon={FunnelIcon} tone="green" loading={loading} />
        </div>
      </Item>
      <Item>
        <div className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader icon={ChartLineUp} title="Visits & booking forms" />
            <div className="px-3 pb-4">
              <AreaTrend data={data.trend} x="date" series={[{ key: "visits", label: "Visits" }, { key: "leads", label: "Booking forms" }]} height={260} />
            </div>
          </Card>
          <Card>
            <CardHeader icon={FunnelIcon} title="Booking funnel" description="Visit → Venue view → Availability → Estimate → Form → Confirmed" />
            <div className="px-5 pb-5">
              <Funnel steps={data.funnel} />
            </div>
          </Card>
        </div>
      </Item>
      <Item>
        <div className="mb-6 grid gap-5 lg:grid-cols-3">
          <Card>
            <CardHeader title="Traffic sources" />
            <div className="px-5 pb-5">
              <Donut data={data.sources} height={160} />
            </div>
          </Card>
          <Card>
            <CardHeader icon={Globe} title="Languages" />
            <div className="px-5 pb-5">
              <Donut data={data.languages} height={160} />
            </div>
          </Card>
          <Card>
            <CardHeader title="Devices & countries" />
            <div className="space-y-4 px-5 pb-5">
              <Donut data={data.devices} height={120} />
              <ul className="space-y-1 text-[12.5px]">
                {data.countries.map((c) => (
                  <li key={c.name} className="flex justify-between">
                    <span className="text-crm-ink-2">{c.name}</span>
                    <span className="font-semibold text-crm-ink tabular">{c.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </Item>
      <Item>
        <Card className="mb-6">
          <CardHeader title="Top pages" />
          <div className="px-3 pb-4">
            <Bars data={data.topPages} x="page" series={[{ key: "views", label: "Views" }]} horizontal height={280} />
          </div>
        </Card>
      </Item>
      <Item>
        <h3 className="mb-3 text-[15px] font-semibold text-crm-ink">Recent visitors</h3>
        <DataTable rows={loading ? undefined : data.visitorRows} loading={loading} columns={visitorCols} initialSort={{ id: "at", dir: "desc" }} exportName="iccb-visitors" pageSize={10} />
      </Item>
      <Item>
        <h3 className="mb-3 mt-6 text-[15px] font-semibold text-crm-ink">Events</h3>
        <DataTable rows={loading ? undefined : data.events} loading={loading} columns={eventCols} initialSort={{ id: "at", dir: "desc" }} exportName="iccb-analytics-events" dense />
      </Item>
    </Stagger>
  );
}
