"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { leadsService } from "@/services/leads.service";
import type { EstimateInput } from "@/types";
import { generateReferenceNumber } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";

interface BookingFormProps {
  estimateInput?: Partial<EstimateInput>;
  onSuccess?: (refNumber: string) => void;
}

export function BookingForm({ estimateInput, onSuccess }: BookingFormProps) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "",
    organization: "",
    phone: "",
    email: "",
    notes: "",
    organizerType: "company",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refNumber, setRefNumber] = useState("");

  const handleChange = (k: string, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setLoading(true);
    try {
      const ref = generateReferenceNumber();
      await leadsService.create({
        name: form.name,
        organization: form.organization,
        phone: form.phone,
        email: form.email || undefined,
        eventType: estimateInput?.eventType,
        hallId: estimateInput?.hallId,
        date: estimateInput?.date,
        guests: estimateInput?.guests,
        notes: form.notes,
        source: "website",
      });
      setRefNumber(ref);
      setSubmitted(true);
      onSuccess?.(ref);
      toast.success("Booking request submitted!", `Your reference: ${ref}`);
    } catch {
      toast.error("Something went wrong", "Please try again or call us directly.");
      // fail silently in demo
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-6 text-center">
        <CheckCircle size={48} className="text-[var(--status-success)] mx-auto mb-4" weight="light" />
        <h3 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-2">
          Request Sent!
        </h3>
        <p className="text-[var(--ink-muted)] text-[14px] mb-4">
          Reference: <strong className="text-[var(--ink)]">{refNumber}</strong>
        </p>
        <p className="text-[var(--ink-muted)] text-[13px]">
          Our team will call you within 2 hours to confirm the hold.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-5 md:p-6">
      <h3 className="font-display text-xl text-[var(--ink)] font-light uppercase mb-5">
        Reserve This Date
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="meta-label block mb-1.5">Full Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full border-b border-[var(--line)] pb-2 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="meta-label block mb-1.5">Organization</label>
            <input
              type="text"
              value={form.organization}
              onChange={(e) => handleChange("organization", e.target.value)}
              className="w-full border-b border-[var(--line)] pb-2 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="Company / event organizer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="meta-label block mb-1.5">Phone Number *</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full border-b border-[var(--line)] pb-2 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="+880..."
            />
          </div>
          <div>
            <label className="meta-label block mb-1.5">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full border-b border-[var(--line)] pb-2 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="email@example.com"
            />
          </div>
        </div>

        <div>
          <label className="meta-label block mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={3}
            className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-4 py-2.5 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
            placeholder="Tell us more about your event…"
          />
        </div>

        {estimateInput?.hallId && (
          <div className="bg-[var(--bg-soft)] rounded-lg p-4 text-[13px] text-[var(--ink-muted)]">
            <p>Hall: {estimateInput.hallId} · Date: {estimateInput.date || "TBD"} · Guests: {estimateInput.guests || "TBD"}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !form.name || !form.phone}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] py-4 text-[12px] font-bold tracking-[0.12em] uppercase hover:brightness-110 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading ? "Sending…" : "Submit Reserve Request"}
          <ArrowRight size={14} weight="bold" />
        </button>

        <p className="text-[11px] text-[var(--ink-muted)] text-center">
          A manager will confirm your hold within 2 hours. Holds are valid for 48 hours.
        </p>
      </form>
    </div>
  );
}
