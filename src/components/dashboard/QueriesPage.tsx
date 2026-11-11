"use client";
import { useState, useEffect } from "react";
import { ArrowRight, ChatDots, Envelope, Question } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { getAllQueries, updateQuery } from "@/data/queries";
import type { Query } from "@/data/queries";

const TYPE_ICON = { ask: Question, enquiry: Envelope, chat: ChatDots };
const STATUS_COLOR = {
  open: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  replied: "bg-green-500/10 text-green-600 dark:text-green-400",
  closed: "bg-[var(--bg-soft)] text-[var(--ink-muted)]",
};

export function QueriesPage() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [selected, setSelected] = useState<Query | null>(null);
  const [reply, setReply] = useState("");

  const refresh = () => {
    const all = getAllQueries();
    setQueries(all);
    if (selected) setSelected(all.find((q) => q.id === selected.id) || null);
  };

  useEffect(() => { refresh(); }, []);

  const sendReply = () => {
    if (!selected || !reply.trim()) return;
    updateQuery(selected.id, { status: "replied", reply: reply.trim() });
    setReply("");
    refresh();
  };

  const closeQuery = (id: string) => {
    updateQuery(id, { status: "closed" });
    refresh();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Queries Inbox</h1>
        <p className="text-[var(--ink-muted)] text-[13px] mt-0.5">
          {queries.filter((q) => q.status === "open").length} open · {queries.length} total
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-[500px]">
        {/* List */}
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--bg-soft)]">
            <span className="text-[12px] text-[var(--ink-muted)] uppercase tracking-wider">Messages</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--line)]">
            {queries.map((q) => {
              const Icon = TYPE_ICON[q.type];
              return (
                <button
                  key={q.id}
                  onClick={() => setSelected(q)}
                  className={cn(
                    "w-full text-start px-4 py-4 hover:bg-[var(--bg-soft)] transition-colors",
                    selected?.id === q.id && "bg-[var(--bg-soft)]"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} className="text-[var(--accent)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-[var(--ink)] text-[13px] truncate">{q.name}</p>
                        <span className={cn("text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-medium flex-shrink-0", STATUS_COLOR[q.status])}>
                          {q.status}
                        </span>
                      </div>
                      <p className="text-[var(--ink-muted)] text-[12px] truncate mt-0.5">{q.question}</p>
                    </div>
                  </div>
                </button>
              );
            })}
            {queries.length === 0 && (
              <div className="p-8 text-center text-[var(--ink-muted)] text-[13px]">
                No queries yet.
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl flex flex-col">
          {selected ? (
            <>
              <div className="px-5 py-4 border-b border-[var(--line)] flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-[var(--ink)] text-[14px]">{selected.name}</p>
                  <p className="text-[var(--ink-muted)] text-[12px]">{selected.emailOrPhone} · {selected.type} · {selected.language}</p>
                </div>
                {selected.status !== "closed" && (
                  <button
                    onClick={() => closeQuery(selected.id)}
                    className="text-[11px] text-[var(--ink-muted)] hover:text-[var(--accent)] transition-colors uppercase tracking-wider"
                  >
                    Mark closed
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Question */}
                <div className="bg-[var(--bg-soft)] rounded-xl p-4">
                  <p className="text-[11px] text-[var(--ink-muted)] uppercase tracking-wider mb-2">Question</p>
                  <p className="text-[var(--ink)] text-[14px] leading-relaxed">{selected.question}</p>
                </div>

                {/* Existing reply */}
                {selected.reply && (
                  <div className="bg-[var(--accent)]/5 border border-[var(--accent)]/20 rounded-xl p-4">
                    <p className="text-[11px] text-[var(--accent)] uppercase tracking-wider mb-2">Reply Sent</p>
                    <p className="text-[var(--ink)] text-[14px] leading-relaxed">{selected.reply}</p>
                  </div>
                )}
              </div>

              {selected.status !== "closed" && (
                <div className="p-4 border-t border-[var(--line)]">
                  <div className="flex gap-3">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={3}
                      placeholder="Type your reply…"
                      className="flex-1 border border-[var(--line)] rounded-xl px-4 py-2.5 text-[13px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                    />
                    <button
                      onClick={sendReply}
                      disabled={!reply.trim()}
                      className="self-end p-3 bg-[var(--accent)] text-white rounded-xl hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <ArrowRight size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--ink-muted)] text-[13px]">
              Select a query to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
