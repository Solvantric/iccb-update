import type { EstimateInput, EstimateOutput } from "@/types";
import {
  hallBasePrice,
  shiftMultiplier,
  decorationPrices,
  addonPrices,
  VAT_PERCENT,
  SERVICE_CHARGE_PERCENT,
  peakDates,
  cateringPackages,
} from "@/data/pricing";

export function calculateEstimate(input: EstimateInput): EstimateOutput {
  const lineItems: EstimateOutput["lineItems"] = [];

  // Hall base price
  const baseHall = hallBasePrice[input.hallId] || 150000;
  const shiftMult = shiftMultiplier[input.shift] || 1;
  const hallPrice = baseHall * shiftMult;
  lineItems.push({ label: "Hall rental", amount: hallPrice, unit: `${input.shift} shift` });

  // Peak date surcharge
  const isPeakDate = input.date ? peakDates.includes(input.date) : false;
  if (isPeakDate) {
    const peakSurcharge = hallPrice * 0.2;
    lineItems.push({ label: "Peak date surcharge (+20%)", amount: peakSurcharge });
  }

  // Catering
  if (input.cateringPackageId && input.guests) {
    const pkg = cateringPackages.find((p) => p.id === input.cateringPackageId);
    if (pkg) {
      const cateringTotal = pkg.pricePerHead * input.guests;
      lineItems.push({
        label: `Catering — ${pkg.name.en}`,
        amount: cateringTotal,
        unit: `৳${pkg.pricePerHead}/head × ${input.guests}`,
      });
    }
  }

  // Decoration
  if (input.decorationTier) {
    const decPrice = decorationPrices[input.decorationTier] || 0;
    lineItems.push({
      label: `Decoration — ${input.decorationTier.charAt(0).toUpperCase() + input.decorationTier.slice(1)}`,
      amount: decPrice,
    });
  }

  // Add-ons
  for (const addon of input.addons) {
    const addonPrice = addonPrices[addon];
    if (addonPrice) {
      const labels: Record<string, string> = {
        stage: "Stage setup",
        "led-wall": "LED wall (20×10 ft)",
        "sound-light": "Sound & lighting system",
        photography: "Photography & videography",
        "extra-hour": "Extra hour",
      };
      lineItems.push({ label: labels[addon] || addon, amount: addonPrice });
    }
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const serviceChargeAmt = Math.round(subtotal * (SERVICE_CHARGE_PERCENT / 100));
  const vatAmt = Math.round((subtotal + serviceChargeAmt) * (VAT_PERCENT / 100));
  const total = subtotal + serviceChargeAmt + vatAmt;

  return {
    lineItems,
    subtotal,
    vat: vatAmt,
    serviceCharge: serviceChargeAmt,
    total,
    rangeLow: Math.round(total * 0.9),
    rangeHigh: Math.round(total * 1.1),
    currency: "BDT",
    isPeakDate,
  };
}
