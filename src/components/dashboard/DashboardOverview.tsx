"use client";
import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Users, CalendarCheck, CurrencyDollar, TrendUp, Fire, ArrowRight, Clock } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { getAllLeads } from "@/data/leads";
import { getAllBookings } from "@/data/bookings";
import { formatBDT } from "@/lib/utils/format";
import { halls } from "@/data/halls";
import Link from "next/link";

const MONTHLY_REVENUE = [
  { month: "May", value: 1200000 },
  { month: "Jun", value: 1800000 },
  { month: "Jul", value: 980000 },
  { month: "Aug", value: 2100000 },
  { month: "Sep", value: 1650000 },
  { month: "Oct", value: 2300000 },
  { month: "Nov", value: 1900000 },
];

const LEAD_SOURCES = [
  { name: "Website", value: 42 },
  { name: "WhatsApp", value: 24 },
  { name: "Referral", value: 18 },
  { name: "Radar", value: 11 },
  { name: "Other", value: 5 },
];

const HALL_UTILIZATION = halls.slice(0, 5).map((h, i) => ({
  name: h.name.en.split(" ")[0],
  utilization: [72, 58, 84, 45, 61][i],
}));

const PIE_COLORS = ["#E24F5F", "#F59E0B", "#3B82F6", "#8B5CF6", "#10B981"];

function KpiCard({ label, value, sub, icon: Icon, trend, color = "accent" }: {
  label: string; value: string; sub: string; icon: React.ElementType; trend?: string; color?: string
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", color === "accent" ? "bg-[var(--accent)]/10" : "bg-[var(--accent)]/10")}>
          <Icon size={18} className="text-[var(--accent)]" />
        </div>
        {trend && (
          <span className="text-[11px] text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
            <TrendUp size={12} /> {trend}
          </span>
        )}
      </div>
      <p className="font-display text-2xl text-[var(--ink)] font-light">{value}</p>
      <p className="text-[var(--ink-muted)] text-[12px] mt-0.5">{label}</p>
      <p className="text-[var(--ink-muted)] text-[11px] mt-2">{sub}</p>
    </div>
  );
}

export function DashboardOverview() {
  const [leads, setLeads] = useState<ReturnType<typeof getAllLeads>>([]);
  const [bookings, setBookings] = useState<ReturnType<typeof getAllBookings>>([]);

  useEffect(() => {
    setLeads(getAllLeads());
    setBookings(getAllBookings());

    const refresh = () => setLeads(getAllLeads());
    window.addEventListener("iccb:new-lead", refresh);
    return () => window.removeEventListener("iccb:new-lead", refresh);
  }, []);

  const hotLeads = leads.filter((l) => l.isHot);
  const newLeads = leads.filter((l) => l.status === "new");
  const totalRevenuePipeline = leads.reduce((s, l) => s + (l.guests || 0) * 400, 0);
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Overview</h1>
        <p className="text-[var(--ink-muted)] text-[13px] mt-1">
          Sample data · Live dashboard
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Leads"
          value={String(leads.length)}
          sub={`${newLeads.length} new today`}
          icon={Users}
          trend="+12%"
        />
        <KpiCard
          label="Hot Leads"
          value={String(hotLeads.length)}
          sub="Score > 80"
          icon={Fire}
        />
        <KpiCard
          label="Confirmed Bookings"
          value={String(confirmedBookings.length)}
          sub="This month"
          icon={CalendarCheck}
          trend="+5%"
        />
        <KpiCard
          label="Revenue Pipeline"
          value={`৳${(totalRevenuePipeline / 100000).toFixed(1)}L`}
          sub="Estimated · sample"
          icon={CurrencyDollar}
          trend="+8%"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue trend */}
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[15px] text-[var(--ink)] font-light uppercase">Monthly Revenue Trend</h3>
            <span className="text-[11px] text-[var(--ink-muted)]">Sample data</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_REVENUE} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E24F5F" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#E24F5F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${v / 100000}L`} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [formatBDT(Number(v)), "Revenue"]}
              />
              <Area type="monotone" dataKey="value" stroke="#E24F5F" strokeWidth={2} fill="url(#rev-grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead sources pie */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
          <h3 className="font-display text-[15px] text-[var(--ink)] font-light uppercase mb-4">Lead Sources</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={LEAD_SOURCES} cx="50%" cy="45%" outerRadius={70} dataKey="value" stroke="none">
                {LEAD_SOURCES.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hall utilization + recent leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Hall utilization */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
          <h3 className="font-display text-[15px] text-[var(--ink)] font-light uppercase mb-4">Hall Utilization (Nov 2026)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={HALL_UTILIZATION} margin={{ left: -20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`${v}%`, "Utilization"]}
              />
              <Bar dataKey="utilization" fill="#E24F5F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent leads */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[15px] text-[var(--ink)] font-light uppercase">Recent Leads</h3>
            <Link href="/dashboard/leads" className="text-[11px] text-[var(--accent-text)] hover:text-[var(--accent)] flex items-center gap-1">
              View all <ArrowRight size={10} />
            </Link>
          </div>
          <div className="space-y-3">
            {leads.slice(0, 4).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-[var(--accent)] text-[11px] font-bold">{lead.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-[var(--ink)] text-[13px] font-medium">{lead.name}</p>
                    <p className="text-[var(--ink-muted)] text-[11px] capitalize">{lead.eventType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lead.isHot && <Fire size={13} className="text-[var(--accent)]" weight="fill" />}
                  <span className={cn(
                    "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium",
                    lead.status === "new" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                    lead.status === "contacted" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" :
                    lead.status === "proposal" ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" :
                    lead.status === "negotiation" ? "bg-orange-500/10 text-orange-600 dark:text-orange-400" :
                    "bg-green-500/10 text-green-600 dark:text-green-400"
                  )}>
                    {lead.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming bookings */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[15px] text-[var(--ink)] font-light uppercase">Upcoming Bookings</h3>
          <Link href="/dashboard/bookings" className="text-[11px] text-[var(--accent-text)] hover:text-[var(--accent)] flex items-center gap-1">
            View all <ArrowRight size={10} />
          </Link>
        </div>
        {bookings.length === 0 ? (
          <p className="text-[var(--ink-muted)] text-[13px]">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)]">
                  {["Ref", "Hall", "Date", "Event", "Guests", "Status"].map((h) => (
                    <th key={h} className="text-start pb-3 text-[var(--ink-muted)] text-[11px] uppercase tracking-wider font-medium pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map((bk) => (
                  <tr key={bk.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-3 pr-4 text-[var(--accent-text)] font-medium">{bk.referenceNumber}</td>
                    <td className="py-3 pr-4 text-[var(--ink)] capitalize">
                      {halls.find((h) => h.id === bk.hallId)?.name.en || bk.hallId}
                    </td>
                    <td className="py-3 pr-4 text-[var(--ink-muted)]">{bk.date}</td>
                    <td className="py-3 pr-4 text-[var(--ink)] capitalize">{bk.eventType}</td>
                    <td className="py-3 pr-4 text-[var(--ink-muted)]">{bk.guests?.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={cn(
                        "text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-medium",
                        bk.status === "confirmed" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                        bk.status === "on_hold" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" :
                        "bg-[var(--bg-soft)] text-[var(--ink-muted)]"
                      )}>
                        {bk.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
