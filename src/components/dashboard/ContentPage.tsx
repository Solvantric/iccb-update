"use client";
import { newsArticles } from "@/data/news";
import { halls } from "@/data/halls";
import { expoEvents } from "@/data/expo";
import { Newspaper, Buildings, Package } from "@phosphor-icons/react";
import Link from "next/link";

const TABS = ["News", "Halls", "Expos"] as const;
type Tab = typeof TABS[number];

import { useState } from "react";

export function ContentPage() {
  const [tab, setTab] = useState<Tab>("News");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Content</h1>
        <p className="text-[var(--ink-muted)] text-[13px] mt-1">Manage sample content — replace with CMS in production</p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-2 border-b border-[var(--line)]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
              tab === t
                ? "border-[var(--accent)] text-[var(--accent)]"
                : "border-transparent text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* News */}
      {tab === "News" && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--bg-soft)]">
                  {["Title", "Category", "Published", "Sample"].map((h) => (
                    <th key={h} className="text-start px-4 py-3 text-[var(--ink-muted)] text-[11px] uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {newsArticles.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg-soft)] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/en/news/${a.slug}`} target="_blank" className="text-[var(--accent-text)] hover:text-[var(--accent)] font-medium">
                        {a.title.en}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink)]">{a.category}</td>
                    <td className="px-4 py-3 text-[var(--ink-muted)]">{new Date(a.publishedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {a.isSample && <span className="text-[9px] text-[var(--ink-muted)] uppercase tracking-wider">sample</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Halls */}
      {tab === "Halls" && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--bg-soft)]">
                  {["Name", "Area", "Theatre", "Banquet", "Sample"].map((h) => (
                    <th key={h} className="text-start px-4 py-3 text-[var(--ink-muted)] text-[11px] uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {halls.map((h) => (
                  <tr key={h.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg-soft)] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/en/venues/${h.slug}`} target="_blank" className="text-[var(--accent-text)] hover:text-[var(--accent)] font-medium">
                        {h.name.en}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--ink)]">{h.area.toLocaleString()} sq ft</td>
                    <td className="px-4 py-3 text-[var(--ink)]">{h.capacity.theatre.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[var(--ink)]">{h.capacity.banquet.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {h.isSample && <span className="text-[9px] text-[var(--ink-muted)] uppercase tracking-wider">sample</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expos */}
      {tab === "Expos" && (
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--bg-soft)]">
                  {["Name", "Date", "Industry", "Attendees", "Sample"].map((h) => (
                    <th key={h} className="text-start px-4 py-3 text-[var(--ink-muted)] text-[11px] uppercase tracking-wider font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expoEvents.map((e) => (
                  <tr key={e.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--bg-soft)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--ink)]">{e.name.en}</td>
                    <td className="px-4 py-3 text-[var(--ink-muted)]">{e.date}</td>
                    <td className="px-4 py-3 text-[var(--ink)]">{e.industry}</td>
                    <td className="px-4 py-3 text-[var(--ink)]">{e.attendees?.toLocaleString() || "—"}</td>
                    <td className="px-4 py-3">
                      {e.isSample && <span className="text-[9px] text-[var(--ink-muted)] uppercase tracking-wider">sample</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
