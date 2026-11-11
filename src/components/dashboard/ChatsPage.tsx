"use client";
import { useState } from "react";
import { ChatDots, ArrowRight, Robot } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

const SAMPLE_SESSIONS = [
  {
    id: "chat-001",
    visitorId: "v-anon-7f2a",
    messages: [
      { role: "user", text: "What is the capacity of Gulnaksha hall?", time: "14:02" },
      { role: "assistant", text: "Gulnaksha Hall can accommodate up to 2,500 guests in theatre style and 1,500 in banquet configuration. It's our flagship hall spanning 25,000 sq ft.", time: "14:02" },
      { role: "user", text: "What about parking?", time: "14:03" },
      { role: "assistant", text: "ICCB offers 2,000+ dedicated parking spaces on-site, with additional overflow for large events.", time: "14:03" },
    ],
    lastMessage: "2026-11-09T14:03:00Z",
    status: "active",
  },
  {
    id: "chat-002",
    visitorId: "v-anon-3c8b",
    messages: [
      { role: "user", text: "আপনাদের বিয়ের প্যাকেজ কী?", time: "11:30" },
      { role: "assistant", text: "আমাদের বিয়ের আয়োজনের জন্য বিভিন্ন হল রয়েছে। বিস্তারিত আলোচনার জন্য আমাদের সেলস টিমের সাথে যোগাযোগ করুন।", time: "11:30" },
    ],
    lastMessage: "2026-11-09T11:30:00Z",
    status: "ended",
  },
];

export function ChatsPage() {
  const [selected, setSelected] = useState<typeof SAMPLE_SESSIONS[0] | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Chat Sessions</h1>
        <p className="text-[var(--ink-muted)] text-[13px] mt-1">
          Sample chatbot session logs · {SAMPLE_SESSIONS.length} sessions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 min-h-[500px]">
        {/* Session list */}
        <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--bg-soft)]">
            <span className="text-[12px] text-[var(--ink-muted)] uppercase tracking-wider">Sessions</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--line)]">
            {SAMPLE_SESSIONS.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelected(session)}
                className={cn(
                  "w-full text-start px-4 py-4 hover:bg-[var(--bg-soft)] transition-colors",
                  selected?.id === session.id && "bg-[var(--bg-soft)]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--bg-soft)] border border-[var(--line)] flex items-center justify-center flex-shrink-0">
                    <ChatDots size={14} className="text-[var(--ink-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-[var(--ink)] text-[13px] truncate">{session.visitorId}</p>
                      <span className={cn(
                        "text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-medium flex-shrink-0",
                        session.status === "active" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-[var(--bg-soft)] text-[var(--ink-muted)]"
                      )}>
                        {session.status}
                      </span>
                    </div>
                    <p className="text-[var(--ink-muted)] text-[12px] truncate mt-0.5">
                      {session.messages.at(-1)?.text}
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)] mt-1">
                      {session.messages.length} messages
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat transcript */}
        <div className="lg:col-span-3 bg-[var(--surface)] border border-[var(--line)] rounded-xl flex flex-col">
          {selected ? (
            <>
              <div className="px-5 py-4 border-b border-[var(--line)]">
                <p className="font-medium text-[var(--ink)] text-[14px]">Session: {selected.visitorId}</p>
                <p className="text-[var(--ink-muted)] text-[12px]">{selected.messages.length} messages · {selected.status}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {selected.messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-3", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0",
                      msg.role === "user" ? "bg-[var(--bg-soft)] border border-[var(--line)]" : "bg-[var(--accent)]/10"
                    )}>
                      {msg.role === "assistant"
                        ? <Robot size={13} className="text-[var(--accent)]" />
                        : <span className="text-[10px] text-[var(--ink-muted)]">U</span>
                      }
                    </div>
                    <div className={cn(
                      "max-w-[75%] rounded-xl px-4 py-2.5 text-[13px]",
                      msg.role === "user"
                        ? "bg-[var(--accent)] text-white rounded-tr-sm"
                        : "bg-[var(--bg-soft)] text-[var(--ink)] rounded-tl-sm"
                    )}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[var(--ink-muted)] text-[13px]">
              Select a session to view the transcript
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
