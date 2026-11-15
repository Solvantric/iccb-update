"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { format, subDays } from "date-fns";
import { CalendarBlank, ChartLineUp, Eye, PaperPlaneTilt } from "@phosphor-icons/react";
import { useBookings, useHalls } from "@/lib/crm/hooks";
import { StatusPill } from "../ui/status";
import { DEVICES, TRAFFIC_SOURCES, type AnalyticsType } from "@/types/crm";
import { db } from "@/lib/crm/db";
import { fmtDate, num, timeAgo } from "@/lib/crm/format";
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

const PAGE_LABEL: Record<string, string> = { "/": "Home", "/venues": "Venues", "/booking": "Booking form", "/gallery": "Gallery", "/menu": "Menu", "/contact": "Contact", "/faq": "FAQ" };
const pageLabel = (p: string) => PAGE_LABEL[p] ?? (p.startsWith("/venues/") ? `Venue · ${p.split("/")[2]?.replace(/^\w/, (c) => c.toUpperCase())}` : p);

export function AnalyticsPage() {
  const events = db.analytics.store((s) => s.items);
  const bookings = useBookings();
  const hallList = useHalls();
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
      avgDaily: visits / Number(range),
      daily: Array.from({ length: Math.min(Number(range), 30) }, (_, i) => {
        const d = format(subDays(new Date(), Math.min(Number(range), 30) - 1 - i), "yyyy-MM-dd");
        return { day: d, value: visitsList.filter((e) => e.createdAt.slice(0, 10) === d).length };
      }),
      perSource: TRAFFIC_SOURCES.map((src) => {
        const v = inRange.filter((e) => e.source === src && e.type === "visit").length;
        const sub = inRange.filter((e) => e.source === src && e.type === "form_submit").length;
        return { src, visits: v, submits: sub, conv: v ? (sub / v) * 100 : 0, share: visits ? (v / visits) * 100 : 0 };
      }).sort((a, b) => b.visits - a.visits),
      venueViews: inRange.filter((e) => e.type === "venue_view"),
    };
  }, [events, range, source, device]);

  /** Venue pages viewed vs. real booking requests for that hall (same period). */
  const venues = useMemo(() => {
    const since = format(subDays(new Date(), Number(range)), "yyyy-MM-dd");
    return hallList
      .map((h) => ({
        hall: h,
        views: data.venueViews.filter((e) => e.page === `/venues/${h.id}`).length,
        requests: bookings.filter((b) => b.hallId === h.id && b.createdAt.slice(0, 10) >= since).length,
      }))
      .sort((a, b) => b.views - a.views);
  }, [hallList, data.venueViews, bookings, range]);

  /** Website form → booking outcome (same period). */
  const web = useMemo(() => {
    const since = format(subDays(new Date(), Number(range)), "yyyy-MM-dd");
    const list = bookings.filter((b) => b.source === "website" && b.createdAt.slice(0, 10) >= since);
    const confirmed = list.filter((b) => b.status === "booked" || b.status === "closed").length;
    return { total: list.length, reserved: list.filter((b) => b.status === "reserved").length, confirmed, cancelled: list.filter((b) => b.status === "cancelled").length, rate: list.length ? (confirmed / list.length) * 100 : 0, latest: [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4) };
  }, [bookings, range]);
  const peak = Math.max(1, ...data.daily.map((d) => d.value));
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
      <Stagger className="grid grid-cols-2 gap-5 xl:grid-cols-4">
        <Item>
          <Kpi label="Visitors" value={data.visits} icon={Eye} />
        </Item>
        <Item>
          <Kpi label="Form submissions" value={data.submits} icon={PaperPlaneTilt} />
        </Item>
        <Item>
          <Kpi label="Conversion" value={data.conversion} icon={ChartLineUp} format={(n) => `${n.toFixed(1)}%`} hint="Submissions ÷ visitors" />
        </Item>
        <Item>
          <Kpi label="Avg. daily visitors" value={data.avgDaily} icon={CalendarBlank} format={(n) => n.toFixed(1)} hint={`Over ${range} days`} />
        </Item>
      </Stagger>

      <Card className="mt-6">
        <CardTitle title="Daily visitors" action={<span className="text-[12.5px] text-crm-muted">Last {Math.min(Number(range), 30)} days</span>} />
        <div className="flex h-24 items-end gap-[3px] px-5 pb-2" aria-label="Daily visitors">
          {data.daily.map((d, i) => (
            <m.span
              key={d.day}
              title={`${fmtDate(d.day, "EEE, d MMM")}: ${d.value} visitors`}
              className="flex-1 origin-bottom rounded-t-[3px] bg-crm-brand/70 hover:bg-crm-brand"
              style={{ height: `${Math.max(4, (d.value / peak) * 100)}%` }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, delay: i * 0.01 }}
            />
          ))}
        </div>
        <div className="flex justify-between px-5 pb-4 text-[11.5px] text-crm-muted">
          <span>{data.daily[0] && fmtDate(data.daily[0].day, "d MMM")}</span>
          <span>Today</span>
        </div>
      </Card>

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
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardTitle title="Source performance" action={<span className="text-[12.5px] text-crm-muted">Which channels bring bookings</span>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[440px] text-[13.5px]">
              <thead>
                <tr className="border-y border-crm-line text-[12.5px] text-crm-muted">
                  <th className="px-5 py-2 text-start font-medium">Source</th>
                  <th className="px-3 py-2 text-end font-medium">Visitors</th>
                  <th className="px-3 py-2 text-end font-medium">Share</th>
                  <th className="px-3 py-2 text-end font-medium">Forms sent</th>
                  <th className="px-5 py-2 text-end font-medium">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.perSource.map((x, i) => (
                  <tr key={x.src} className="border-b border-crm-line last:border-0">
                    <td className="px-5 py-2.5 text-crm-ink">
                      {x.src}
                      {i === 0 && x.visits > 0 && <span className="ms-2 rounded-full bg-crm-tint px-2 py-0.5 text-[11px] text-crm-brand-text">Top</span>}
                    </td>
                    <td className="px-3 py-2.5 text-end tabular">{num(x.visits)}</td>
                    <td className="px-3 py-2.5 text-end text-crm-muted tabular">{Math.round(x.share)}%</td>
                    <td className="px-3 py-2.5 text-end tabular">{num(x.submits)}</td>
                    <td className="px-5 py-2.5 text-end font-medium text-crm-ink tabular">{x.conv.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle title="Venue interest" action={<span className="text-[12.5px] text-crm-muted">Views → requests</span>} />
          <ul className="space-y-3 px-5 pb-5">
            {venues.map((v) => {
              const max = venues[0]?.views || 1;
              return (
                <li key={v.hall.id} className="text-[13.5px]">
                  <div className="mb-1 flex justify-between gap-3">
                    <span className="text-crm-ink">{v.hall.name}</span>
                    <span className="text-crm-muted tabular">
                      {num(v.views)} views · {v.requests} request{v.requests === 1 ? "" : "s"}
                    </span>
                  </div>
                  <span className="block h-2 overflow-hidden rounded-full bg-crm-surface-2">
                    <m.span className="block h-full origin-left rounded-full bg-crm-brand/70 rtl:origin-right" initial={{ scaleX: 0 }} animate={{ scaleX: v.views / max }} transition={{ duration: 0.5 }} />
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle
          title="Website leads → bookings"
          action={
            <Link href="/dashboard/leads" className="text-[13px] text-crm-muted hover:text-crm-ink">
              Open leads
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-5 px-5 pb-5 lg:grid-cols-5">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-crm-line bg-crm-line lg:col-span-2">
            {(
              [
                ["Booking forms", web.total],
                ["Still reserved", web.reserved],
                ["Confirmed", web.confirmed],
                ["Cancelled", web.cancelled],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="bg-crm-surface px-4 py-3">
                <p className="text-[12px] text-crm-muted">{k}</p>
                <p className="text-[18px] font-semibold text-crm-ink tabular">{v}</p>
              </div>
            ))}
            <div className="col-span-2 bg-crm-surface px-4 py-3 text-[13px] text-crm-ink-2">
              Form → confirmed booking: <span className="font-semibold text-crm-ink">{web.rate.toFixed(0)}%</span>
            </div>
          </div>
          <div className="lg:col-span-3">
            <p className="mb-2 text-[12.5px] font-medium text-crm-muted">Latest website requests</p>
            {web.latest.length === 0 ? (
              <p className="text-[13.5px] text-crm-muted">No website booking forms in this period.</p>
            ) : (
              <ul className="divide-y divide-crm-line rounded-[10px] border border-crm-line">
                {web.latest.map((b) => (
                  <li key={b.id}>
                    <Link href={`/dashboard/bookings/${b.id}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-crm-surface-2">
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-medium text-crm-ink">{b.eventName}</span>
                        <span className="block text-[12px] text-crm-muted">
                          {b.name} · received {timeAgo(b.createdAt)}
                        </span>
                      </span>
                      <StatusPill status={b.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

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
                    {pageLabel(page)}
                    <span className="ms-2 text-[12px] text-crm-muted">{page}</span>
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
