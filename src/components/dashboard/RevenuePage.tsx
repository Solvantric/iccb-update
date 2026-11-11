"use client";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from "recharts";
import { TrendUp, TrendDown, CurrencyDollar, Buildings, CalendarCheck, ArrowUpRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { getAllBookings } from "@/data/bookings";
import { halls } from "@/data/halls";
import { formatBDT } from "@/lib/utils/format";

const YEARLY_DATA = [
  { month: "Jan", revenue: 980000, bookings: 4 },
  { month: "Feb", revenue: 1340000, bookings: 6 },
  { month: "Mar", revenue: 1120000, bookings: 5 },
  { month: "Apr", revenue: 1680000, bookings: 7 },
  { month: "May", revenue: 1200000, bookings: 5 },
  { month: "Jun", revenue: 1800000, bookings: 8 },
  { month: "Jul", revenue: 980000, bookings: 4 },
  { month: "Aug", revenue: 2100000, bookings: 9 },
  { month: "Sep", revenue: 1650000, bookings: 7 },
  { month: "Oct", revenue: 2300000, bookings: 10 },
  { month: "Nov", revenue: 1900000, bookings: 8 },
  { month: "Dec", revenue: 2450000, bookings: 11 },
];

const EVENT_TYPE_REV = [
  { name: "Wedding", value: 5800000, color: "#E24F5F" },
  { name: "Corporate", value: 4200000, color: "#3B82F6" },
  { name: "Expo / Trade Fair", value: 3600000, color: "#8B5CF6" },
  { name: "Conference", value: 2800000, color: "#F59E0B" },
  { name: "Seminar", value: 1200000, color: "#10B981" },
  { name: "Others", value: 950000, color: "#6B7280" },
];

const HALL_REV = [
  { name: "Bashundhara", rev: 6200000 },
  { name: "Meghna", rev: 4800000 },
  { name: "Padma", rev: 3400000 },
  { name: "Jamuna", rev: 2900000 },
  { name: "Heritage", rev: 1600000 },
  { name: "Seminar", rev: 950000 },
];

function KpiCard({ label, value, change, positive, icon: Icon }: {
  label: string; value: string; change: string; positive: boolean; icon: React.ElementType;
}) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
          <Icon size={18} className="text-[var(--accent)]" />
        </div>
        <span className={cn("text-[11px] font-medium flex items-center gap-0.5",
          positive ? "text-green-600 dark:text-green-400" : "text-red-500")}>
          {positive ? <TrendUp size={12} /> : <TrendDown size={12} />}
          {change}
        </span>
      </div>
      <p className="font-display text-2xl text-[var(--ink)] font-light">{value}</p>
      <p className="text-[var(--ink-muted)] text-[12px] mt-0.5">{label}</p>
    </div>
  );
}

export function RevenuePage() {
  const [bookings, setBookings] = useState<ReturnType<typeof getAllBookings>>([]);

  useEffect(() => {
    setBookings(getAllBookings());
  }, []);

  const totalRev = YEARLY_DATA.reduce((s, d) => s + d.revenue, 0);
  const confirmedRev = bookings
    .filter((b) => b.status === "confirmed" && b.estimatedTotal)
    .reduce((s, b) => s + (b.estimatedTotal || 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Revenue Analytics</h1>
        <p className="text-[var(--ink-muted)] text-[13px] mt-0.5">Financial overview · Sample data for demonstration</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="YTD Revenue" value={`৳${(totalRev / 1000000).toFixed(1)}M`} change="+18% YoY" positive icon={CurrencyDollar} />
        <KpiCard label="Avg. per Booking" value="৳1.65L" change="+6% YoY" positive icon={ArrowUpRight} />
        <KpiCard label="Total Bookings" value={String(YEARLY_DATA.reduce((s, d) => s + d.bookings, 0))} change="+22% YoY" positive icon={CalendarCheck} />
        <KpiCard label="Top Hall Revenue" value="৳62L" change="-3% MoM" positive={false} icon={Buildings} />
      </div>

      {/* Revenue trend + hall breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase">Monthly Revenue 2026</h3>
            <span className="text-[11px] text-[var(--ink-muted)]">Sample data</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={YEARLY_DATA} margin={{ left: -10 }}>
              <defs>
                <linearGradient id="rev-line" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E24F5F" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#E24F5F" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${v / 100000}L`} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [formatBDT(Number(v)), "Revenue"]}
              />
              <Line type="monotone" dataKey="revenue" stroke="#E24F5F" strokeWidth={2.5} dot={{ fill: "#E24F5F", r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Event type pie */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
          <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase mb-4">Revenue by Event Type</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={EVENT_TYPE_REV} cx="50%" cy="50%" outerRadius={68} innerRadius={32} dataKey="value" stroke="none">
                {EVENT_TYPE_REV.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [formatBDT(Number(v)), "Revenue"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {EVENT_TYPE_REV.map((e) => (
              <div key={e.name} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                  <span className="text-[var(--ink-muted)]">{e.name}</span>
                </div>
                <span className="text-[var(--ink)] font-medium">৳{(e.value / 100000).toFixed(1)}L</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hall revenue bar + booking volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
          <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase mb-4">Revenue by Hall</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={HALL_REV} margin={{ left: -10 }} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${v / 100000}L`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [formatBDT(Number(v)), "Revenue"]}
              />
              <Bar dataKey="rev" fill="#E24F5F" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly bookings volume */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
          <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase mb-4">Monthly Booking Volume</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={YEARLY_DATA} margin={{ left: -20 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--ink-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="bookings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confirmed bookings revenue table */}
      {confirmedRev > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
          <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase mb-1">Live Bookings Revenue</h3>
          <p className="text-[var(--ink-muted)] text-[12px] mb-4">From confirmed bookings in demo data</p>
          <p className="font-display text-3xl text-[var(--accent)] font-light">{formatBDT(confirmedRev)}</p>
          <p className="text-[var(--ink-muted)] text-[12px] mt-1">
            Across {bookings.filter((b) => b.status === "confirmed").length} confirmed bookings
          </p>
        </div>
      )}
    </div>
  );
}
