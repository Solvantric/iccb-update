"use client";
import { useState } from "react";
import { FilePdf, FileDoc, FileXls, Download, Eye, MagnifyingGlass, Plus, Trash, Tag } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

type DocType = "contract" | "proposal" | "invoice" | "report" | "agreement";
type DocStatus = "draft" | "sent" | "signed" | "expired" | "pending";

interface Document {
  id: string;
  name: string;
  type: DocType;
  status: DocStatus;
  client: string;
  booking?: string;
  size: string;
  date: string;
  format: "pdf" | "docx" | "xlsx";
}

const DOCS: Document[] = [
  { id: "d1", name: "Venue Rental Agreement - Bashundhara Hall", type: "contract", status: "signed", client: "Priya Enterprises", booking: "ICCB-2026-001", size: "248 KB", date: "2026-11-01", format: "pdf" },
  { id: "d2", name: "Catering Proposal - Wedding Package Premium", type: "proposal", status: "sent", client: "Ahmed & Family", booking: "ICCB-2026-002", size: "1.2 MB", date: "2026-11-05", format: "pdf" },
  { id: "d3", name: "Invoice #INV-2026-089", type: "invoice", status: "pending", client: "Bangladesh Tech Expo", booking: "ICCB-2026-003", size: "98 KB", date: "2026-11-08", format: "pdf" },
  { id: "d4", name: "Post-Event Report - BGMEA Convention", type: "report", status: "signed", client: "BGMEA", size: "3.4 MB", date: "2026-10-30", format: "pdf" },
  { id: "d5", name: "Service Level Agreement 2026-27", type: "agreement", status: "signed", client: "UN Bangladesh", size: "512 KB", date: "2026-09-15", format: "docx" },
  { id: "d6", name: "Expo Booth Package Proposal - Q4 2026", type: "proposal", status: "draft", client: "Various Exhibitors", size: "880 KB", date: "2026-11-09", format: "pdf" },
  { id: "d7", name: "Revenue Report - October 2026", type: "report", status: "signed", client: "Internal", size: "1.8 MB", date: "2026-11-01", format: "xlsx" },
  { id: "d8", name: "Decoration Contract - Heritage Hall Gala", type: "contract", status: "sent", client: "Dhaka Rotary Club", booking: "ICCB-2026-005", size: "185 KB", date: "2026-11-07", format: "pdf" },
  { id: "d9", name: "Invoice #INV-2026-091", type: "invoice", status: "signed", client: "Asian Dev. Bank", size: "102 KB", date: "2026-11-09", format: "pdf" },
  { id: "d10", name: "Security Services Agreement", type: "agreement", status: "expired", client: "SafeGuard Ltd", size: "290 KB", date: "2026-06-01", format: "docx" },
];

const DOC_TYPE_COLOR: Record<DocType, string> = {
  contract: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  proposal: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  invoice: "bg-[var(--accent)]/10 text-[var(--accent)]",
  report: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  agreement: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

const STATUS_COLOR: Record<DocStatus, string> = {
  signed: "bg-green-500/10 text-green-600 dark:text-green-400",
  sent: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  draft: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
  pending: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  expired: "bg-red-500/10 text-red-500",
};

function DocIcon({ format, size = 20 }: { format: Document["format"]; size?: number }) {
  if (format === "pdf") return <FilePdf size={size} className="text-red-500" />;
  if (format === "xlsx") return <FileXls size={size} className="text-green-600" />;
  return <FileDoc size={size} className="text-blue-500" />;
}

export function DocumentsPage() {
  const [docs, setDocs] = useState<Document[]>(DOCS);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DocStatus | "all">("all");

  const filtered = docs.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.client.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.type === typeFilter;
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Documents</h1>
          <p className="text-[var(--ink-muted)] text-[13px] mt-0.5">Contracts, proposals, invoices & reports</p>
        </div>
        <button className="flex items-center gap-2 bg-[var(--accent)] text-white rounded-lg px-4 py-2 text-[12px] font-medium hover:bg-[var(--accent-hover)] transition-colors">
          <Plus size={14} weight="bold" />
          Upload
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([
          { label: "Contracts", type: "contract" as DocType },
          { label: "Proposals", type: "proposal" as DocType },
          { label: "Invoices", type: "invoice" as DocType },
          { label: "Reports", type: "report" as DocType },
        ]).map(({ label, type }) => (
          <div
            key={type}
            onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}
            className={cn(
              "bg-[var(--surface)] border rounded-xl p-4 text-center cursor-pointer transition-all",
              typeFilter === type ? "border-[var(--accent)] ring-1 ring-[var(--accent)]/30" : "border-[var(--line)] hover:border-[var(--accent)]/40"
            )}
          >
            <p className="font-display text-3xl text-[var(--ink)] font-light">
              {docs.filter((d) => d.type === type).length}
            </p>
            <p className="text-[var(--ink-muted)] text-[11px] mt-1 uppercase tracking-wider">{label}</p>
          </div>
        ))}
      </div>

      {/* Search + status filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <MagnifyingGlass size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents or clients…"
            className="w-full bg-[var(--bg-soft)] border border-[var(--line)] rounded-lg ps-9 pe-3 py-2 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
          />
        </div>
        {(["all", "signed", "sent", "pending", "draft", "expired"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-4 py-2 rounded-lg text-[12px] font-medium capitalize transition-colors",
              statusFilter === s ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-soft)] border border-[var(--line)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Documents table */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[var(--bg-soft)]">
                {["Document", "Type", "Client / Booking", "Size", "Date", "Status", ""].map((h) => (
                  <th key={h} className="text-start px-4 py-3 text-[var(--ink-muted)] text-[11px] uppercase tracking-wider font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[var(--ink-muted)] text-[13px]">
                    No documents found.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg-soft)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <DocIcon format={doc.format} />
                        <span className="text-[var(--ink)] font-medium max-w-xs truncate" title={doc.name}>{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full", DOC_TYPE_COLOR[doc.type])}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--ink)]">{doc.client}</p>
                      {doc.booking && <p className="text-[10px] text-[var(--accent-text)]">{doc.booking}</p>}
                    </td>
                    <td className="px-4 py-3 text-[var(--ink-muted)]">{doc.size}</td>
                    <td className="px-4 py-3 text-[var(--ink-muted)]">{doc.date}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full", STATUS_COLOR[doc.status])}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button title="Preview" className="p-1.5 rounded-lg hover:bg-[var(--bg-soft)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors">
                          <Eye size={14} />
                        </button>
                        <button title="Download" className="p-1.5 rounded-lg hover:bg-[var(--bg-soft)] text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors">
                          <Download size={14} />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => setDocs((ds) => ds.filter((d) => d.id !== doc.id))}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--ink-muted)] hover:text-red-500 transition-colors"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
