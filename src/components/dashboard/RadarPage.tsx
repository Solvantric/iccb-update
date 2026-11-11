"use client";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";
import { TrendUp, ArrowRight, Fire } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import Link from "next/link";

const RADAR_ITEMS = [
  {
    id: "r-001",
    organization: "BGMEA — Annual Summit",
    industry: "Textile & Garments",
    estimatedGuests: 1500,
    estimatedBudget: 850000,
    priority: "high" as const,
    lastContact: "2026-11-05",
    source: "industry-db",
    score: 88,
    notes: "Annual event — previously held at Basundhara City. High conversion probability.",
    isSample: true,
  },
  {
    id: "r-002",
    organization: "Bangladesh Medical Society Conference",
    industry: "Healthcare",
    estimatedGuests: 900,
    estimatedBudget: 420000,
    priority: "medium" as const,
    lastContact: "2026-10-28",
    source: "linkedin",
    score: 71,
    notes: "Annual conference. Venue not confirmed for 2026 yet.",
    isSample: true,
  },
  {
    id: "r-003",
    organization: "Tech Bangladesh Startup Summit",
    industry: "Technology",
    estimatedGuests: 600,
    estimatedBudget: 280000,
    priority: "medium" as const,
    lastContact: "2026-11-01",
    source: "referral",
    score: 65,
    notes: "Growing event. 3rd edition in 2026.",
    isSample: true,
  },
  {
    id: "r-004",
    organization: "Bangladesh Education Expo 2026",
    industry: "Education",
    estimatedGuests: 2000,
    estimatedBudget: 1100000,
    priority: "high" as const,
    lastContact: "2026-11-08",
    source: "cold-call",
    score: 82,
    notes: "Large-scale expo. Organizer evaluating venues this month.",
    isSample: true,
  },
];

const RADAR_CHART_DATA = [
  { metric: "Size", value: 85 },
  { metric: "Budget", value: 78 },
  { metric: "Timing", value: 70 },
  { metric: "Fit", value: 90 },
  { metric: "Urgency", value: 65 },
];

const PRIORITY_COLOR = {
  high: "bg-red-500/10 text-red-600 dark:text-red-400",
  medium: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  low: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

const formatBDT = (n: number) => `৳${(n / 100000).toFixed(1)}L`;

export function RadarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Opportunity Radar</h1>
        <p className="text-[var(--ink-muted)] text-[13px] mt-1">
          Sample proactive opportunities — replace with actual CRM prospecting data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Radar chart */}
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-5">
          <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase mb-4">Top Opportunity Profile</h3>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_CHART_DATA} cx="50%" cy="50%" outerRadius={75}>
              <PolarGrid stroke="var(--line)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "var(--ink-muted)" }} />
              <Radar dataKey="value" stroke="#E24F5F" fill="#E24F5F" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-[var(--ink-muted)] text-center mt-2">BGMEA Summit opportunity score</p>
        </div>

        {/* Summary stats */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {[
            { label: "Total Opportunities", value: RADAR_ITEMS.length, icon: TrendUp },
            { label: "High Priority", value: RADAR_ITEMS.filter((r) => r.priority === "high").length, icon: Fire },
            { label: "Est. Pipeline", value: `৳${(RADAR_ITEMS.reduce((s, r) => s + r.estimatedBudget, 0) / 100000).toFixed(1)}L`, icon: TrendUp },
            { label: "Est. Guests", value: RADAR_ITEMS.reduce((s, r) => s + r.estimatedGuests, 0).toLocaleString(), icon: TrendUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center mb-2">
                <Icon size={15} className="text-[var(--accent)]" />
              </div>
              <p className="font-display text-2xl text-[var(--ink)] font-light">{value}</p>
              <p className="text-[var(--ink-muted)] text-[12px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Opportunity list */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--bg-soft)]">
          <h3 className="font-display text-[14px] text-[var(--ink)] font-light uppercase">Prospect List</h3>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {RADAR_ITEMS.map((item) => (
            <div key={item.id} className="px-5 py-4 hover:bg-[var(--bg-soft)] transition-colors">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-[var(--ink)] text-[14px]">{item.organization}</h4>
                    <span className={cn("text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium", PRIORITY_COLOR[item.priority])}>
                      {item.priority}
                    </span>
                    {item.isSample && (
                      <span className="text-[9px] text-[var(--ink-muted)] uppercase tracking-wider">sample</span>
                    )}
                  </div>
                  <p className="text-[var(--ink-muted)] text-[13px]">{item.industry} · {item.estimatedGuests.toLocaleString()} guests · {formatBDT(item.estimatedBudget)}</p>
                  <p className="text-[var(--ink-muted)] text-[12px] mt-1">{item.notes}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-end">
                    <div className="flex items-center gap-1.5 justify-end">
                      <div className="w-20 bg-[var(--bg-soft)] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-[var(--accent)]" style={{ width: `${item.score}%` }} />
                      </div>
                      <span className="text-[11px] text-[var(--ink-muted)]">{item.score}</span>
                    </div>
                    <p className="text-[11px] text-[var(--ink-muted)] mt-1">Last: {item.lastContact}</p>
                  </div>
                  <Link
                    href="/dashboard/leads"
                    className="p-2 rounded-lg border border-[var(--line)] text-[var(--ink-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                  >
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
