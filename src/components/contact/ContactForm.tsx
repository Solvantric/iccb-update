"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/Toast";

export function ContactForm() {
  const toast = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
    toast.success("Message sent!", "Our team will respond within one business day.");
  };

  if (submitted) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-8 text-center">
        <CheckCircle size={48} className="text-[var(--status-success)] mx-auto mb-4" weight="light" />
        <h3 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-2">Message Sent!</h3>
        <p className="text-[var(--ink-muted)] text-[14px]">
          Our team will respond within one business day.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="meta-label block mb-1.5">Full Name *</label>
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
            <label className="meta-label block mb-1.5">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full border-b border-[var(--line)] pb-2 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="meta-label block mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full border-b border-[var(--line)] pb-2 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="+880..."
            />
          </div>
          <div>
            <label className="meta-label block mb-1.5">Subject</label>
            <select
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              className="w-full border-b border-[var(--line)] pb-2 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
            >
              <option value="">Select a topic</option>
              <option value="booking">Hall Booking</option>
              <option value="catering">Catering</option>
              <option value="expo">Expo / Exhibition</option>
              <option value="media">Media & PR</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label className="meta-label block mb-1.5">Message *</label>
          <textarea
            required
            value={form.message}
            onChange={(e) => set("message", e.target.value)}
            rows={5}
            className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-4 py-2.5 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
            placeholder="How can we help you?"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !form.name || !form.message}
          className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-full py-4 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? "Sending…" : "Send Message"}
          <ArrowRight size={14} weight="bold" />
        </button>
      </form>
    </div>
  );
}
