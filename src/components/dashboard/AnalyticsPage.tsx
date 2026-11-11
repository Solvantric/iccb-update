"use client";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend,
} from "recharts";
import { TrendUp, Users, Eye, MouseSimple } from "@phosphor-icons/react";

const DAILY_VISITORS = [
  { day: "Mon", visitors: 142, pageviews: 380, enquiries: 3 },
  { day: "Tue", visitors: 198, pageviews: 512, enquiries: 7 },
  { day: "Wed", visitors: 165, pageviews: 440, enquiries: 5 },
  { day: "Thu", visitors: 221, pageviews: 590, enquiries: 9 },
  { day: "Fri", visitors: 310, pageviews: 820, enquiries: 14 },
  { day: "Sat", visitors: 280, pageviews: 740, enquiries: 11 },
  { day: "Sun", visitors: 190, pageviews: 480, enquiries: 6 },
];

const TOP_PAGES = [
  { page: "/booking", views: 1240, bounce: "32%" },
  { page: "/venues/gulnaksha", views: 980, bounce: "41%" },
  { page: "/venues", views: 870, bounce: "38%" },
  { page: "/", views: 740, bounce: "55%" },
  { page: "/menu", views: 520, bounce: "44%" },
];

const UTM_SOURCES = [
  { source: "Google CPC", sessions: 420 },
  { source: "Direct", sessions: 310 },
  { source: "WhatsApp", sessions: 180 },
  { source: "LinkedIn", sessions: 120 },
  { source: "Facebook", sessions: 90 },
  { source: "Organic", sessions: 75 },
];

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Analytics</h1>
        <p className="text-[var(--ink-muted)] text-[13px] mt-1">Sample data · Last 7 days</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Visitors", value: "1,506", trend: "+18%", icon: Users },
          { label: "Pageviews", value: "3,962", trend: "+22%", icon: Eye },
          { label: "Enquiries", value: "55", trend: "+8%", icon: MouseSimple },
          { label: "Avg. Session", value: "3m 42s", trend: "+5%", icon: TrendUp },
        ].map(({ label, value, trend, icon: Icon }) => (
          <div key={label} className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                <Icon size={16} className="text-[var(--accent)]" />
              </div>
              <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">{trend}</span>
            </div>
            <p className="font-display text-2xl text-[var(--ink)] font-light">{value}</p>
            <p className="text-[var(--ink-muted)] text-[12px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Visitor trend */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
        <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase mb-4">Daily Traffic (This Week)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={DAILY_VISITORS} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="visitors" stroke="#E24F5F" strokeWidth={2} dot={false} name="Visitors" />
            <Line type="monotone" dataKey="pageviews" stroke="#3B82F6" strokeWidth={2} dot={false} name="Pageviews" />
            <Line type="monotone" dataKey="enquiries" stroke="#10B981" strokeWidth={2} dot={false} name="Enquiries" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top pages */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
          <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase mb-4">Top Pages</h3>
          <div className="space-y-3">
            {TOP_PAGES.map((p, i) => (
              <div key={p.page} className="flex items-center gap-3">
                <span className="text-[var(--ink-muted)] text-[12px] w-5 flex-shrink-0">{i + 1}</span>
                <span className="text-[var(--ink)] text-[13px] flex-1 truncate font-mono">{p.page}</span>
                <span className="text-[var(--ink)] text-[13px] font-medium">{p.views.toLocaleString()}</span>
                <span className="text-[var(--ink-muted)] text-[11px] w-10 text-end">{p.bounce}</span>
              </div>
            ))}
          </div>
        </div>

        {/* UTM sources */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
          <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase mb-4">Traffic Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={UTM_SOURCES} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="source" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="sessions" fill="#E24F5F" radius={[0, 4, 4, 0]} name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
