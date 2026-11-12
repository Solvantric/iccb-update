"use client";
import { useState, useMemo } from "react";
import { ArrowRight, Download, WhatsappLogo } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { halls } from "@/data/halls";
import { cateringPackages } from "@/data/pricing";
import { calculateEstimate } from "@/lib/pricing/estimate";
import { formatBDT, formatUSD } from "@/lib/utils/format";
import type { EstimateInput, DecorationTier, EventType } from "@/types";

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: "conference", label: "Conference" },
  { value: "exhibition", label: "Exhibition" },
  { value: "wedding", label: "Wedding" },
  { value: "concert", label: "Concert" },
  { value: "corporate", label: "Corporate" },
  { value: "seminar", label: "Seminar" },
  { value: "expo", label: "Expo" },
  { value: "other", label: "Other" },
];

const ADDONS = [
  { id: "stage", label: "Stage Setup" },
  { id: "led-wall", label: "LED Wall (20×10 ft)" },
  { id: "sound-light", label: "Sound & Lighting" },
  { id: "photography", label: "Photography & Video" },
  { id: "extra-hour", label: "Extra Hour" },
];

interface BudgetCalculatorProps {
  initialHallId?: string;
  initialDate?: string;
  onReserve?: (input: EstimateInput) => void;
  onEnquiry?: (input: EstimateInput) => void;
}

export function BudgetCalculator({ initialHallId, initialDate, onReserve, onEnquiry }: BudgetCalculatorProps) {
  const [input, setInput] = useState<EstimateInput>({
    eventType: "conference",
    hallId: initialHallId || "gulnaksha",
    shift: "fullday",
    guests: 500,
    cateringPackageId: "",
    decorationTier: undefined,
    addons: [],
    date: initialDate,
  });
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");

  const estimate = useMemo(() => calculateEstimate(input), [input]);

  const formatAmt = (n: number) =>
    currency === "BDT" ? formatBDT(n) : formatUSD(n);

  const setField = <K extends keyof EstimateInput>(k: K, v: EstimateInput[K]) =>
    setInput((prev) => ({ ...prev, [k]: v }));

  const toggleAddon = (id: string) =>
    setInput((prev) => ({
      ...prev,
      addons: prev.addons.includes(id)
        ? prev.addons.filter((a) => a !== id)
        : [...prev.addons, id],
    }));

  const waUrl = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8801991197719"}?text=${encodeURIComponent(
    `Hello ICCB, I'd like to enquire about an event.\n\nHall: ${halls.find((h) => h.id === input.hallId)?.name.en}\nDate: ${input.date || "TBD"}\nGuests: ${input.guests}\nEstimated total: ${formatBDT(estimate.total)}`
  )}`;

  return (
    <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-xl text-[var(--ink)] font-light uppercase">Budget Estimate</h3>
        <div className="flex gap-2">
          {["BDT", "USD"].map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c as "BDT" | "USD")}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-medium border transition-colors",
                currency === c
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "border-[var(--line)] text-[var(--ink-muted)]"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Event type */}
        <div>
          <label className="meta-label block mb-1.5">Event Type</label>
          <select
            value={input.eventType}
            onChange={(e) => setField("eventType", e.target.value as EventType)}
            className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-4 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          >
            {EVENT_TYPES.map((et) => (
              <option key={et.value} value={et.value}>{et.label}</option>
            ))}
          </select>
        </div>

        {/* Hall */}
        <div>
          <label className="meta-label block mb-1.5">Hall</label>
          <select
            value={input.hallId}
            onChange={(e) => setField("hallId", e.target.value)}
            className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-4 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          >
            {halls.map((h) => (
              <option key={h.id} value={h.id}>{h.name.en}</option>
            ))}
          </select>
        </div>

        {/* Guests slider */}
        <div>
          <label className="meta-label block mb-1.5">
            Guests — <span className="text-[var(--ink)]">{input.guests.toLocaleString()}</span>
          </label>
          <input
            type="range"
            min="50"
            max="3000"
            step="50"
            value={input.guests}
            onChange={(e) => setField("guests", Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
          <div className="flex justify-between text-[11px] text-[var(--ink-muted)] mt-1">
            <span>50</span>
            <span>3,000</span>
          </div>
        </div>

        {/* Catering */}
        <div>
          <label className="meta-label block mb-1.5">Catering Package (optional)</label>
          <select
            value={input.cateringPackageId || ""}
            onChange={(e) => setField("cateringPackageId", e.target.value || undefined)}
            className="w-full border border-[var(--line)] rounded-[var(--radius-input)] px-4 py-2.5 text-[14px] text-[var(--ink)] bg-[var(--surface)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          >
            <option value="">No catering</option>
            {cateringPackages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name.en} — ৳{pkg.pricePerHead}/head
              </option>
            ))}
          </select>
        </div>

        {/* Decoration */}
        <div>
          <label className="meta-label block mb-1.5">Decoration Tier (optional)</label>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: undefined, label: "None" },
              { key: "classic" as DecorationTier, label: "Classic" },
              { key: "premium" as DecorationTier, label: "Premium" },
              { key: "royal" as DecorationTier, label: "Royal" },
            ].map((tier) => (
              <button
                key={tier.label}
                onClick={() => setField("decorationTier", tier.key)}
                className={cn(
                  "px-4 py-2 rounded-full text-[12px] font-medium border transition-colors",
                  input.decorationTier === tier.key
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                )}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Add-ons */}
        <div>
          <label className="meta-label block mb-1.5">Add-ons</label>
          <div className="flex flex-wrap gap-2">
            {ADDONS.map((addon) => (
              <button
                key={addon.id}
                onClick={() => toggleAddon(addon.id)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors",
                  input.addons.includes(addon.id)
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                )}
              >
                {addon.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Estimate breakdown */}
      <div className="mt-6 pt-5 border-t border-[var(--line)]">
        <div className="space-y-2">
          {estimate.lineItems.map((item, i) => (
            <div key={i} className="flex justify-between text-[14px]">
              <span className="text-[var(--ink-muted)]">{item.label}</span>
              <span className="text-[var(--ink)]">{formatAmt(item.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between text-[14px]">
            <span className="text-[var(--ink-muted)]">Service charge (10%)</span>
            <span className="text-[var(--ink)]">{formatAmt(estimate.serviceCharge)}</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-[var(--ink-muted)]">VAT (15%)</span>
            <span className="text-[var(--ink)]">{formatAmt(estimate.vat)}</span>
          </div>
        </div>

        <div className="mt-4 p-4 bg-[var(--bg-soft)] rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium text-[var(--ink)] text-[15px]">Estimated Range</span>
          </div>
          <div className="font-display text-2xl text-[var(--ink)] font-light">
            {formatAmt(estimate.rangeLow)} – {formatAmt(estimate.rangeHigh)}
          </div>
          <p className="text-[11px] text-[var(--ink-muted)] mt-2">
            ±10% estimate. Final price confirmed by ICCB.
          </p>
          {estimate.isPeakDate && (
            <p className="text-[11px] text-[var(--status-reserved-color)] mt-1">
              Peak date surcharge applied.
            </p>
          )}
        </div>

        <p className="text-[11px] text-[var(--ink-muted)] text-center mt-3">
          Sample data · All prices must be confirmed with ICCB
        </p>
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-col gap-3">
        <button
          onClick={() => onReserve?.(input)}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] py-3.5 text-[12px] font-bold tracking-[0.12em] uppercase hover:brightness-110 transition-colors"
        >
          Reserve This Date
          <ArrowRight size={14} weight="bold" />
        </button>
        <button
          onClick={() => onEnquiry?.(input)}
          className="w-full flex items-center justify-center gap-2 border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] py-3.5 text-[12px] font-bold tracking-[0.12em] uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
        >
          Send as Enquiry
        </button>
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 border-2 border-[var(--accent)] text-[var(--ink-muted)] rounded-[var(--radius-btn)] py-3 text-[12px] font-bold tracking-[0.12em] uppercase hover:text-white hover:bg-[var(--accent)] transition-colors"
        >
          Share on WhatsApp
        </a>
      </div>
    </div>
  );
}
