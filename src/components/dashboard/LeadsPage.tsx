"use client";
import { useState, useEffect } from "react";
import { Fire, Funnel, MagnifyingGlass, ArrowsDownUp } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { getAllLeads, updateLead } from "@/data/leads";
import type { Lead } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { halls } from "@/data/halls";

const STATUSES = ["new", "contacted", "proposal", "negotiation", "won", "lost"] as const;
type Status = typeof STATUSES[number];

const STATUS_COLOR: Record<Status, string> = {
  new: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  contacted: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  proposal: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  negotiation: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  won: "bg-green-500/10 text-green-600 dark:text-green-400",
  lost: "bg-red-500/10 text-red-600 dark:text-red-400",
};

type ViewMode = "table" | "kanban";

export function LeadsPage() {
  const toast = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");

  const refresh = () => setLeads(getAllLeads());

  useEffect(() => {
    refresh();
    window.addEventListener("iccb:new-lead", refresh);
    return () => window.removeEventListener("iccb:new-lead", refresh);
  }, []);

  const filtered = leads.filter((l) => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
    const matchStatus = filterStatus === "all" || l.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const changeStatus = (id: string, status: Status) => {
    updateLead(id, { status });
    refresh();
    toast.success("Lead updated", `Status changed to ${status}`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Leads</h1>
          <p className="text-[var(--ink-muted)] text-[13px] mt-0.5">{leads.length} total · {leads.filter((l) => l.isHot).length} hot</p>
        </div>
        <div className="flex items-center gap-2">
          {["table", "kanban"].map((m) => (
            <button
              key={m}
              onClick={() => setView(m as ViewMode)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors capitalize",
                view === m ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-[var(--line)] text-[var(--ink-muted)]"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlass size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            type="text"
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full ps-9 pe-4 py-2 border border-[var(--line)] rounded-lg text-[13px] text-[var(--ink)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", ...STATUSES] as Array<Status | "all">).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors capitalize",
                filterStatus === s ? "bg-[var(--accent)] text-white border-[var(--accent)]" : "border-[var(--line)] text-[var(--ink-muted)]"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table view */}
      {view === "table" && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--bg-soft)]">
                  {["Name / Org", "Contact", "Event", "Hall", "Date", "Score", "Status", ""].map((h) => (
                    <th key={h} className="text-start px-4 py-3 text-[var(--ink-muted)] text-[11px] uppercase tracking-wider font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg-soft)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {lead.isHot && <Fire size={13} className="text-[var(--accent)]" weight="fill" />}
                        <div>
                          <p className="font-medium text-[var(--ink)]">{lead.name}</p>
                          {lead.organization && <p className="text-[var(--ink-muted)] text-[11px]">{lead.organization}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-muted)]">
                      <p>{lead.phone}</p>
                      {lead.email && <p className="text-[11px]">{lead.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-[var(--ink)] capitalize">{lead.eventType}</td>
                    <td className="px-4 py-3 text-[var(--ink-muted)] capitalize">
                      {halls.find((h) => h.id === lead.hallId)?.name.en?.split(" ")[0] || lead.hallId || "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-muted)]">{lead.date || "TBD"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[var(--bg-soft)] rounded-full h-1.5 w-12">
                          <div
                            className="h-1.5 rounded-full bg-[var(--accent)]"
                            style={{ width: `${lead.score || 0}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-[var(--ink-muted)]">{lead.score || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status}
                        onChange={(e) => changeStatus(lead.id, e.target.value as Status)}
                        className={cn(
                          "text-[11px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none",
                          STATUS_COLOR[lead.status as Status] || "bg-[var(--bg-soft)] text-[var(--ink-muted)]"
                        )}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {lead.isSample && (
                        <span className="text-[9px] text-[var(--ink-muted)] uppercase tracking-wider">sample</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kanban view */}
      {view === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((status) => {
            const colLeads = filtered.filter((l) => l.status === status);
            return (
              <div key={status} className="flex-shrink-0 w-56">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn("text-[11px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full", STATUS_COLOR[status])}>
                    {status}
                  </span>
                  <span className="text-[var(--ink-muted)] text-[12px]">{colLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {colLeads.map((lead) => (
                    <div key={lead.id} className="bg-[var(--surface)] border border-[var(--line)] rounded-lg p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-[var(--ink)] text-[13px] leading-tight">{lead.name}</p>
                        {lead.isHot && <Fire size={12} className="text-[var(--accent)] flex-shrink-0 mt-0.5" weight="fill" />}
                      </div>
                      {lead.organization && (
                        <p className="text-[var(--ink-muted)] text-[11px] mt-0.5">{lead.organization}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-[var(--ink-muted)] capitalize">{lead.eventType}</span>
                        <span className="text-[11px] text-[var(--ink-muted)]">{lead.date || "TBD"}</span>
                      </div>
                      <div className="mt-2 bg-[var(--bg-soft)] rounded-full h-1 w-full">
                        <div className="h-1 rounded-full bg-[var(--accent)]" style={{ width: `${lead.score || 0}%` }} />
                      </div>
                    </div>
                  ))}
                  {colLeads.length === 0 && (
                    <div className="border border-dashed border-[var(--line)] rounded-lg p-4 text-center text-[var(--ink-muted)] text-[12px]">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
