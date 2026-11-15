"use client";
import { useState } from "react";
import { CheckCircle, User, Phone, EnvelopeSimple, PaperPlaneTilt } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/Toast";
import { submitEnquiry } from "@/services/crm";

export function ContactForm() {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message || (!form.phone && !form.email)) {
      toast.error("Almost there", "Please add your name, a message and a phone or email.");
      return;
    }
    setLoading(true);
    try {
      await submitEnquiry({ type: "contact", source: "website", name: form.name, mobile: form.phone, email: form.email || undefined, message: [form.subject && `Subject: ${form.subject}`, form.message].filter(Boolean).join("\n"), language: document.documentElement.lang || "en" });
      setSubmitted(true);
      toast.success("Message sent!", "Our team will respond within one business day.");
    } catch (err) {
      toast.error("Couldn't send", err instanceof Error ? err.message : "Please call +88-01991-197719.");
    } finally {
      setLoading(false);
    }
  };

  const TOPICS = [
    { v: "booking", t: "Hall Booking" },
    { v: "catering", t: "Catering" },
    { v: "expo", t: "Expo / Exhibition" },
    { v: "media", t: "Media & PR" },
    { v: "other", t: "Other" },
  ];
  const field =
    "w-full rounded-xl border border-[var(--line)] bg-[var(--bg-soft)]/60 ps-11 pe-4 py-3 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-muted)]/70 outline-none transition focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_12%,transparent)]";
  const label = "mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]";
  const icon = "pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-[var(--ink-muted)] transition-colors group-focus-within:text-[var(--accent)]";

  if (submitted) {
    return (
      <div className="py-10 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle size={38} weight="fill" />
        </span>
        <h3 className="mt-5 font-display text-[26px] uppercase text-[var(--ink)]">Message Sent!</h3>
        <p className="mt-2 text-[15px] text-[var(--ink-muted)]">Thank you — our team will respond within one business day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="cf-name" className={label}>Full name *</label>
          <div className="group relative">
            <User size={17} className={icon} />
            <input id="cf-name" type="text" required value={form.name} onChange={(e) => set("name", e.target.value)} className={field} placeholder="Your name" autoComplete="name" />
          </div>
        </div>
        <div>
          <label htmlFor="cf-phone" className={label}>Phone</label>
          <div className="group relative">
            <Phone size={17} className={icon} />
            <input id="cf-phone" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={field} placeholder="01XXXXXXXXX" autoComplete="tel" />
          </div>
        </div>
        <div>
          <label htmlFor="cf-email" className={label}>Email</label>
          <div className="group relative">
            <EnvelopeSimple size={17} className={icon} />
            <input id="cf-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={field} placeholder="email@example.com" autoComplete="email" />
          </div>
        </div>
      </div>

      <div>
        <span className={label}>What is it about?</span>
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((tp) => {
            const on = form.subject === tp.v;
            return (
              <button
                key={tp.v}
                type="button"
                onClick={() => set("subject", on ? "" : tp.v)}
                className={`rounded-full border px-4 py-2 text-[13px] font-medium transition-all ${on ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-[0_8px_18px_-10px_var(--accent)]" : "border-[var(--line)] text-[var(--ink)] hover:border-[var(--ink)]/40"}`}
              >
                {tp.t}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="cf-msg" className={label}>Message *</label>
        <textarea
          id="cf-msg"
          required
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          rows={5}
          className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--bg-soft)]/60 px-4 py-3 text-[14px] text-[var(--ink)] placeholder:text-[var(--ink-muted)]/70 outline-none transition focus:border-[var(--accent)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--accent)_12%,transparent)]"
          placeholder="Tell us your event date, number of guests and anything else we should know…"
        />
      </div>

      <div className="flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-[12.5px] text-[var(--ink-muted)]">* Required. Add a phone number or email so we can reply.</p>
        <button
          type="submit"
          disabled={loading}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] px-8 py-3.5 text-[13px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_12px_26px_-12px_var(--accent)] transition-all hover:-translate-y-0.5 hover:brightness-110 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send Message"}
          <PaperPlaneTilt size={16} weight="fill" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
      </div>
    </form>
  );
}
