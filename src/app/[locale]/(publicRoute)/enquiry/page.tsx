"use client";
import { useState } from "react";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react";
import { RevealBlock } from "@/components/motion/RevealBlock";
import { halls } from "@/data/halls";
import { leadsService } from "@/services/leads.service";
import { generateReferenceNumber } from "@/lib/utils/format";
import { useToast } from "@/components/ui/Toast";

const EVENT_TYPES = [
  "Conference", "Exhibition / Trade Fair", "Wedding", "Concert", "Corporate Event",
  "Seminar / Workshop", "Expo", "Gala Dinner", "Award Ceremony", "Other",
];

const STEPS = ["Event Details", "Contact Info", "Confirm"];

export default function EnquiryPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    eventType: "",
    hallId: "",
    date: "",
    guests: "",
    name: "",
    organization: "",
    phone: "",
    email: "",
    notes: "",
  });
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [refNumber, setRefNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleNext = () => setStep((s) => Math.min(s + 1, 2));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

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
        eventType: form.eventType as never || undefined,
        hallId: form.hallId || undefined,
        date: form.date || undefined,
        guests: form.guests ? Number(form.guests) : undefined,
        notes: form.notes,
        source: "website",
      });
      setRefNumber(ref);
      setSubmitted(true);
      toast.success("Enquiry received!", `Reference: ${ref} — we'll contact you soon.`);
    } catch {
      toast.error("Submission failed", "Please try again or contact us directly.");
      // silent fail in demo
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="pt-20 md:pt-24 min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <CheckCircle size={56} className="text-[var(--status-success)] mx-auto mb-5" weight="light" />
          <h2 className="font-display text-3xl text-[var(--ink)] font-light uppercase mb-3">Enquiry Received!</h2>
          <p className="text-[var(--ink-muted)] text-[15px] mb-4">
            Reference: <strong className="text-[var(--ink)]">{refNumber}</strong>
          </p>
          <p className="text-[var(--ink-muted)] text-[14px]">
            Our sales team will contact you within 2 hours to discuss your event requirements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 md:pt-24">
      {/* Page header */}
      <section className="bg-[var(--bg-soft)] py-12 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <span className="meta-label block mb-2">(ENQUIRY)</span>
            <h1 className="display-lg text-[var(--ink)]">REQUEST A QUOTE</h1>
            <p className="text-[var(--ink-muted)] text-[16px] mt-3 max-w-xl">
              Tell us about your event and we'll prepare a custom proposal.
            </p>
          </RevealBlock>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="max-w-2xl mx-auto px-[clamp(1rem,4vw,3rem)]">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-10">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-3 flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-medium transition-colors ${
                      i <= step
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--bg-soft)] border border-[var(--line)] text-[var(--ink-muted)]"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className={`text-[12px] tracking-wider uppercase hidden sm:block ${i <= step ? "text-[var(--ink)]" : "text-[var(--ink-muted)]"}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && <div className="flex-1 h-px bg-[var(--line)]" />}
              </div>
            ))}
          </div>

          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-6 md:p-8">
            {/* Step 0: Event Details */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl text-[var(--ink)] font-light uppercase mb-6">Event Details</h2>

                <div>
                  <label className="meta-label block mb-1.5">Event Type</label>
                  <div className="flex flex-wrap gap-2">
                    {EVENT_TYPES.map((et) => (
                      <button
                        key={et}
                        type="button"
                        onClick={() => set("eventType", et)}
                        className={`px-4 py-2 rounded-full text-[12px] font-medium border transition-colors ${
                          form.eventType === et
                            ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                            : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        }`}
                      >
                        {et}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="meta-label block mb-1.5">Preferred Hall</label>
                    <select
                      value={form.hallId}
                      onChange={(e) => set("hallId", e.target.value)}
                      className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-4 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    >
                      <option value="">Any hall / not sure</option>
                      {halls.map((h) => (
                        <option key={h.id} value={h.id}>{h.name.en}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="meta-label block mb-1.5">Preferred Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => set("date", e.target.value)}
                      className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-4 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="meta-label block mb-1.5">Expected Guest Count</label>
                  <input
                    type="number"
                    min="1"
                    value={form.guests}
                    onChange={(e) => set("guests", e.target.value)}
                    className="w-full border-b border-[var(--line)] pb-2 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
                    placeholder="e.g. 500"
                  />
                </div>

                <div>
                  <label className="meta-label block mb-1.5">Additional Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    rows={3}
                    className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-4 py-2.5 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
                    placeholder="Describe your event, special requirements, etc."
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-full py-4 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Next: Contact Info
                  <ArrowRight size={14} weight="bold" />
                </button>
              </div>
            )}

            {/* Step 1: Contact Info */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="font-display text-xl text-[var(--ink)] font-light uppercase mb-6">Contact Information</h2>

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
                    <label className="meta-label block mb-1.5">Organization</label>
                    <input
                      type="text"
                      value={form.organization}
                      onChange={(e) => set("organization", e.target.value)}
                      className="w-full border-b border-[var(--line)] pb-2 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
                      placeholder="Company / event organizer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="meta-label block mb-1.5">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className="w-full border-b border-[var(--line)] pb-2 text-[14px] text-[var(--ink)] bg-transparent focus:outline-none focus:border-[var(--accent)] transition-colors"
                      placeholder="+880..."
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

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-4 border border-[var(--line)] text-[var(--ink)] rounded-full text-[12px] font-medium tracking-[0.12em] uppercase hover:border-[var(--ink)] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!form.name || !form.phone}
                    className="flex-[2] flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-full py-4 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Next: Review
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Confirm */}
            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="font-display text-xl text-[var(--ink)] font-light uppercase mb-6">Confirm Your Enquiry</h2>

                <div className="bg-[var(--bg-soft)] rounded-lg p-5 space-y-3 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-muted)]">Event Type</span>
                    <span className="text-[var(--ink)]">{form.eventType || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-muted)]">Hall</span>
                    <span className="text-[var(--ink)] capitalize">{halls.find((h) => h.id === form.hallId)?.name.en || "Any"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-muted)]">Date</span>
                    <span className="text-[var(--ink)]">{form.date || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--ink-muted)]">Guests</span>
                    <span className="text-[var(--ink)]">{form.guests || "Not specified"}</span>
                  </div>
                  <div className="border-t border-[var(--line)] pt-3 flex justify-between">
                    <span className="text-[var(--ink-muted)]">Contact</span>
                    <span className="text-[var(--ink)] text-end">{form.name}<br />{form.phone}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex-1 py-4 border border-[var(--line)] text-[var(--ink)] rounded-full text-[12px] font-medium tracking-[0.12em] uppercase hover:border-[var(--ink)] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-full py-4 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
                  >
                    {loading ? "Submitting…" : "Submit Enquiry"}
                    <ArrowRight size={14} weight="bold" />
                  </button>
                </div>

                <p className="text-[11px] text-[var(--ink-muted)] text-center">
                  A manager will contact you within 2 hours.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
