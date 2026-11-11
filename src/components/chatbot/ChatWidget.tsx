"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PaperPlaneTilt, ChatCircleDots, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/lib/i18n/routing";
import { chatService } from "@/services/chat.service";
import { nanoid } from "nanoid";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_REPLIES = [
  "Check availability",
  "Expo enquiry",
  "Catering menu",
  "Talk to a human",
];

interface ChatWidgetProps {
  locale: Locale;
}

export function ChatWidget({ locale }: ChatWidgetProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Hello! Welcome to ICCB. I can help you with venue availability, event planning, catering, and more. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => nanoid());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8801991197719";

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open, messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    if (text === "Talk to a human") {
      window.open(
        `https://wa.me/${wa}?text=${encodeURIComponent("Hello, I need to speak with an ICCB sales representative.")}`,
        "_blank"
      );
      return;
    }

    const userMsg: Message = { id: nanoid(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const reply = await chatService.sendMessage(text, sessionId, locale);
      setMessages((m) => [...m, { id: nanoid(), role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: nanoid(), role: "assistant", content: "Sorry, I'm having trouble connecting. Please call us at +88-02-41091551." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, sessionId, locale, wa]);

  return (
    <>
      {/* Trigger button (shown via FloatingDock) — but also accessible as separate element */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 end-6 z-50 w-[380px] max-w-[calc(100vw-24px)] bg-[var(--surface)] border border-[var(--line)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "620px" }}
            role="dialog"
            aria-label="ICCB AI Assistant"
            aria-modal="true"
          >
            {/* Header */}
            <div className="bg-[var(--bg-deep)] px-4 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
                <ChatCircleDots size={18} className="text-white" weight="light" />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-[14px]">ICCB Assistant</p>
                <p className="text-white/50 text-[11px]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 me-1.5" />
                  Online · Typically replies in minutes
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ minHeight: 0 }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
                      msg.role === "user"
                        ? "bg-[var(--accent)] text-white rounded-br-sm"
                        : "bg-[var(--bg-soft)] text-[var(--ink)] rounded-bl-sm border border-[var(--line)]"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--bg-soft)] border border-[var(--line)] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-[var(--ink-muted)] animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => sendMessage(qr)}
                    className="text-[12px] border border-[var(--line)] text-[var(--ink-muted)] rounded-full px-3 py-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Disclaimer */}
            <p className="px-4 text-[10px] text-[var(--ink-muted)] text-center pb-2">
              Prices and availability must be confirmed by an ICCB manager.
            </p>

            {/* Input */}
            <div className="border-t border-[var(--line)] p-3 flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Type a message… (max 500 chars)"
                maxLength={500}
                className="flex-1 bg-[var(--bg-soft)] border border-[var(--line)] rounded-full px-4 py-2.5 text-[13px] text-[var(--ink)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                aria-label="Chat message"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="w-10 h-10 rounded-full bg-[var(--accent)] text-white flex items-center justify-center hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:pointer-events-none flex-shrink-0"
              >
                <PaperPlaneTilt size={16} weight="fill" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
