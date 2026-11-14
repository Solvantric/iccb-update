"use client";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { takaShort, taka } from "@/lib/crm/format";
import { CHART } from "../ui/charts";

const axis = { tick: { fill: "var(--crm-muted)", fontSize: 11 }, axisLine: false, tickLine: false } as const;

/** Weekly expected (bars, current week in brand red) vs received (line). */
export function ComposedBars({ data, height = 260 }: { data: { week: string; expected: number; received: number; current: boolean }[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="week" {...axis} interval="preserveStartEnd" />
          <YAxis {...axis} width={56} tickFormatter={(v: number) => takaShort(v)} />
          <Tooltip
            cursor={{ fill: "var(--crm-surface-2)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <div className="rounded-[var(--radius-btn)] border border-crm-line bg-crm-surface px-3 py-2 text-[12px] shadow-[var(--crm-shadow-lg)]">
                  <p className="mb-1 font-semibold text-crm-ink">Week of {label}</p>
                  {payload.map((p) => (
                    <p key={String(p.dataKey)} className="text-crm-ink-2">
                      {p.name}: <span className="font-semibold text-crm-ink tabular">{taka(Number(p.value))}</span>
                    </p>
                  ))}
                </div>
              ) : null
            }
          />
          <Bar dataKey="expected" name="Expected" maxBarSize={30} radius={[4, 4, 0, 0]} animationDuration={800}>
            {data.map((d) => (
              <Cell key={d.week} fill={d.current ? CHART.brand : CHART.grey[2]} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="received" name="Received" stroke="#12B76A" strokeWidth={2} dot={{ r: 3 }} animationDuration={900} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
