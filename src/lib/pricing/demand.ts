export interface DemandDataPoint {
  date: string;
  demandIndex: number; // 0-100
}

export interface PricingRecommendation {
  date: string;
  demandIndex: number;
  adjustment: number; // percentage, e.g. +15 or -10
  reason: string;
  suggested: "increase" | "discount" | "none";
}

export function getPricingRecommendation(
  date: string,
  demandIndex: number
): PricingRecommendation {
  const daysFromNow = Math.ceil(
    (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (demandIndex >= 80) {
    return {
      date,
      demandIndex,
      adjustment: demandIndex >= 90 ? 20 : 15,
      reason: "High demand. Multiple enquiries and availability checks for this date.",
      suggested: "increase",
    };
  }

  if (demandIndex <= 30 && daysFromNow <= 45) {
    return {
      date,
      demandIndex,
      adjustment: daysFromNow <= 14 ? -15 : -10,
      reason: `Low demand with ${daysFromNow} days to event. Limited-time offer may convert leads.`,
      suggested: "discount",
    };
  }

  return {
    date,
    demandIndex,
    adjustment: 0,
    reason: "Normal demand. Standard pricing is appropriate.",
    suggested: "none",
  };
}
