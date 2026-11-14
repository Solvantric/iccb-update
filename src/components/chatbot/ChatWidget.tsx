"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowClockwise, ArrowSquareOut, CaretDown, ChatCircleDots, PaperPlaneTilt, X } from "@phosphor-icons/react";
import { nanoid } from "nanoid";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/lib/i18n/routing";
import { chatService } from "@/services/chat.service";
import { submitEnquiry } from "@/services/crm/sales.service";
import { useChatStore } from "./chat-store";
import { FAQ, GREETING, HUMAN, UI, localAnswer, type ChatAction, type ChatLang } from "./faq";

const PHONE_RE = /(?:\+?88)?0?1[3-9]\d{8}/;
const NAME_RE = /(?:my name is|i am|i'm|this is|amar nam|আমার নাম)\s+([A-Za-zঀ-৿][A-Za-zঀ-৿.\s]{1,40}?)(?=[,.!?]|\s+(?:and|my|phone|number|from)\b|$)/i;
const EVENT_RE = /(wedding|reception|holud|engagement|birthday|conference|seminar|concert|convocation|exhibition|expo|trade fair|corporate|product launch|award)/i;
const GUESTS_RE = /(\d{2,5})\s*(?:guests|people|persons|pax|জন)/i;
const STORAGE_KEY = "iccb-chat-v1";
const EASE = [0.22, 1, 0.36, 1] as const;

/** Chatbot → CRM lead: when a visitor shares a BD mobile number, log a chatbot enquiry. */
function extractLead(transcript: string[]) {
  const all = transcript.join(" \n ");
  const phone = all.match(PHONE_RE)?.[0];
  if (!phone) return null;
  const name = all.match(NAME_RE)?.[1]?.trim();
  const event = all.match(EVENT_RE)?.[1];
  const guests = all.match(GUESTS_RE)?.[1];
  return { phone, name: name && name.length >= 2 ? name : "Chat visitor", eventType: event ? event[0].toUpperCase() + event.slice(1).toLowerCase() : undefined, guests: guests ? Number(guests) : undefined };
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ChatAction[];
}

interface Saved {
  messages: Message[];
  sessionId: string;
  asked: string[];
  captured: boolean;
  transcript: string[];
}

const greeting = (lang: ChatLang): Message => ({ id: "init", role: "assistant", content: GREETING[lang] });

function load(lang: ChatLang): Saved {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Saved;
  } catch {
    // storage blocked — start fresh
  }
  return { messages: [greeting(lang)], sessionId: nanoid(), asked: [], captured: false, transcript: [] };
}

export function ChatWidget({ locale }: { locale: Locale }) {
  const lang = (["en", "bn", "ar", "zh"].includes(locale) ? locale : "en") as ChatLang;
  const { open, setOpen } = useChatStore();
  // The panel only renders after the visitor opens it, so reading sessionStorage here can't cause a hydration mismatch.
  const [state, setState] = useState<Saved>(() => (typeof window === "undefined" ? { messages: [greeting(lang)], sessionId: "ssr", asked: [], captured: false, transcript: [] } : load(lang)));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8801991197719";
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(HUMAN.waText)}`;

  useEffect(() => {
    if (state.sessionId === "ssr") return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  useEffect(() => {
    if (!open) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, state.messages, loading]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  const push = (m: Omit<Message, "id">) => setState((s) => ({ ...s, messages: [...s.messages, { ...m, id: nanoid() }] }));

  /** Common question → instant answer from the knowledge base (no server round-trip). */
  const askFaq = (id: string) => {
    const f = FAQ.find((x) => x.id === id);
    if (!f || loading) return;
    setShowMore(false);
    setState((s) => ({ ...s, asked: [...new Set([...s.asked, id])], messages: [...s.messages, { id: nanoid(), role: "user", content: f.q[lang] }] }));
    setLoading(true);
    setTimeout(() => {
      push({ role: "assistant", content: f.a[lang], actions: f.actions?.(lang, wa) });
      setLoading(false);
    }, 450);
  };

  const captureLead = (transcript: string[], captured: boolean) => {
    if (captured) return;
    const lead = extractLead(transcript);
    if (!lead) return;
    setState((s) => ({ ...s, captured: true }));
    submitEnquiry({ type: "chatbot", source: "chatbot", name: lead.name, mobile: lead.phone, eventType: lead.eventType, guests: lead.guests, message: `Chatbot conversation:\n${transcript.map((t) => `• ${t}`).join("\n")}`, language: lang })
      .then(() => push({ role: "assistant", content: UI.leadThanks[lang].replace("{name}", lead.name !== "Chat visitor" ? `, ${lead.name}` : "").replace("{phone}", lead.phone) }))
      .catch(() => setState((s) => ({ ...s, captured: false })));
  };

  /** Free text → AI server; falls back to the built-in answers when the server can't reply. */
  const sendMessage = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, 500);
      if (!text || loading) return;
      const transcript = [...state.transcript, text];
      setState((s) => ({ ...s, transcript, messages: [...s.messages, { id: nanoid(), role: "user", content: text }] }));
      setInput("");
      setShowMore(false);
      setLoading(true);
      captureLead(transcript, state.captured);
      try {
        const reply = await chatService.sendMessage(text, state.sessionId, lang);
        push({ role: "assistant", content: reply });
      } catch {
        const f = localAnswer(text);
        if (f) push({ role: "assistant", content: `${UI.offline[lang]}\n\n${f.a[lang]}`, actions: f.actions?.(lang, wa) });
        else push({ role: "assistant", content: UI.handover[lang], actions: [{ label: HUMAN.label[lang], href: waUrl, external: true }] });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, state.sessionId, state.transcript, state.captured, lang, wa, waUrl]
  );

  const restart = () => {
    const fresh: Saved = { messages: [greeting(lang)], sessionId: nanoid(), asked: [], captured: false, transcript: [] };
    setState(fresh);
    setInput("");
  };

  const firstScreen = state.messages.length <= 1;
  const remaining = FAQ.filter((f) => !state.asked.includes(f.id));

  const chip = "rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[12.5px] text-[var(--ink-body)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="fixed inset-x-3 bottom-20 z-50 flex max-h-[min(640px,calc(100dvh-110px))] flex-col overflow-hidden rounded-[var(--radius-card-lg)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)] sm:inset-x-auto sm:bottom-24 sm:end-6 sm:w-[390px]"
          role="dialog"
          aria-label={UI.title[lang]}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b-[3px] border-[var(--accent)] bg-[var(--bg-deep)] px-4 py-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)]">
              <ChatCircleDots size={18} className="text-white" weight="fill" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-semibold uppercase tracking-wide text-white rtl:normal-case">{UI.title[lang]}</p>
              <p className="text-[11px] text-white/60">
                <span className="me-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                {UI.online[lang]}
              </p>
            </div>
            {!firstScreen && (
              <button onClick={restart} aria-label={UI.restart[lang]} title={UI.restart[lang]} className="text-white/60 transition-colors hover:text-white">
                <ArrowClockwise size={17} />
              </button>
            )}
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="text-white/60 transition-colors hover:text-white">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[var(--bg-soft)] px-4 py-4" aria-live="polite">
            {state.messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: EASE }} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                <div className={cn("max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed", msg.role === "user" ? "rounded-ee-sm bg-[var(--accent)] text-white" : "rounded-es-sm border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)]")}>
                  {msg.content}
                </div>
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {msg.actions.map((a) =>
                      a.external ? (
                        <a key={a.href} href={a.href} target="_blank" rel="noreferrer" className={cn(chip, "inline-flex items-center gap-1 font-semibold text-[var(--accent)]")}>
                          {a.label} <ArrowSquareOut size={12} />
                        </a>
                      ) : (
                        <Link key={a.href} href={a.href} onClick={() => setOpen(false)} className={cn(chip, "inline-flex items-center gap-1 font-semibold text-[var(--accent)]")}>
                          {a.label} →
                        </Link>
                      )
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            {/* Common questions on the first screen */}
            {firstScreen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--ink-muted)] rtl:tracking-normal">{UI.common[lang]}</p>
                <div className="flex flex-col gap-1.5">
                  {FAQ.map((f, i) => (
                    <motion.button key={f.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05, duration: 0.3, ease: EASE }} onClick={() => askFaq(f.id)} className="rounded-[var(--radius-btn)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-start text-[13px] font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                      {f.q[lang]}
                    </motion.button>
                  ))}
                  <a href={waUrl} target="_blank" rel="noreferrer" className="rounded-[var(--radius-btn)] border border-dashed border-[var(--line)] px-3 py-2 text-[13px] font-medium text-[var(--ink-muted)] transition-colors hover:border-[#25D366] hover:text-[#128C7E]">
                    {HUMAN.label[lang]} (WhatsApp)
                  </a>
                </div>
              </motion.div>
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-es-sm border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--ink-muted)]" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* More questions (after the first answer) */}
          {!firstScreen && (
            <div className="border-t border-[var(--line)] px-4 pt-2">
              <button onClick={() => setShowMore((v) => !v)} className="flex items-center gap-1 text-[12px] font-semibold text-[var(--ink-muted)] hover:text-[var(--accent)]">
                {UI.more[lang]} <CaretDown size={12} className={cn("transition-transform", showMore && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {showMore && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex flex-wrap gap-1.5 py-2">
                      {(remaining.length ? remaining : FAQ).map((f) => (
                        <button key={f.id} onClick={() => askFaq(f.id)} className={chip}>
                          {f.q[lang]}
                        </button>
                      ))}
                      <a href={waUrl} target="_blank" rel="noreferrer" className={chip}>
                        {HUMAN.label[lang]}
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <p className="px-4 pt-1.5 text-center text-[10px] text-[var(--ink-muted)]">{UI.disclaimer[lang]}</p>

          {/* Input */}
          <form
            className="flex gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={UI.placeholder[lang]}
              maxLength={500}
              className="flex-1 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--bg-soft)] px-4 py-2.5 text-[13.5px] text-[var(--ink)] transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--accent)] focus:outline-none"
              aria-label={UI.placeholder[lang]}
            />
            <button type="submit" disabled={!input.trim() || loading} aria-label="Send message" className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[var(--radius-btn)] bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)] disabled:pointer-events-none disabled:opacity-40">
              <PaperPlaneTilt size={17} weight="fill" className="rtl:-scale-x-100" />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
