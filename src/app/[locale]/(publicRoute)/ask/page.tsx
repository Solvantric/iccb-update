"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { RevealBlock } from "@/components/motion/RevealBlock";
import { generateReferenceNumber } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";

const QUICK_QUESTIONS = [
  "What is the capacity of Gulnaksha Hall?",
  "Do you have parking for 500 cars?",
  "Can I bring an external decorator?",
  "What is included in the catering package?",
  "How far is ICCB from the airport?",
];

export default function AskPage() {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", phone: "", question: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.question) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setSubmitted(true);
    toast.info("Question sent!", "Our team will respond within 2 hours.");
  };

  if (submitted) {
    return (
      <div className="pt-20 md:pt-24 min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle size={56} className="text-[var(--status-success)] mx-auto mb-5" weight="light" />
          <h2 className="font-display text-3xl text-[var(--ink)] font-light uppercase mb-3">
            Question Sent!
          </h2>
          <p className="text-[var(--ink-muted)] text-[14px]">
            Our team will respond to your question within one business day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-24">
      <section className="bg-[var(--bg-soft)] py-12 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <span className="meta-label block mb-2">(ASK)</span>
            <h1 className="display-lg text-[var(--ink)]">ASK A QUESTION</h1>
            <p className="text-[var(--ink-muted)] text-[16px] mt-3 max-w-xl">
              Have a quick question? Send it to our team and we'll respond promptly.
            </p>
          </RevealBlock>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="max-w-2xl mx-auto px-[clamp(1rem,4vw,3rem)]">
          {/* Quick questions */}
          <div className="mb-8">
            <p className="meta-label mb-3">Quick picks</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => set("question", q)}
                  className="px-4 py-2 rounded-full text-[12px] border border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-start"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="meta-label block mb-1.5">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    className="w-full border-b border-[var(--line)] pb-2 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="meta-label block mb-1.5">Phone / Email</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    className="w-full border-b border-[var(--line)] pb-2 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
                    placeholder="+880 or email"
                  />
                </div>
              </div>

              <div>
                <label className="meta-label block mb-1.5">Your Question *</label>
                <textarea
                  required
                  value={form.question}
                  onChange={(e) => set("question", e.target.value)}
                  rows={4}
                  className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-4 py-2.5 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                  placeholder="Type your question here…"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !form.name || !form.question}
                className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-full py-4 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? "Sending…" : "Send Question"}
                <ArrowRight size={14} weight="bold" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
