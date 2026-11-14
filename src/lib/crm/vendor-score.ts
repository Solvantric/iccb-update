/** Vendor & Decorator Scorecard — pure scoring. */
import type { VendorReview, VendorStatus } from "@/types/crm";

/** Points for one review: start at 100, subtract penalties, add/subtract by rating. */
export function reviewPoints(r: Pick<VendorReview, "setupOnTime" | "dismantledWithin24h" | "violations" | "damageAmount" | "rating">) {
  let s = 100;
  if (!r.setupOnTime) s -= 10;
  if (!r.dismantledWithin24h) s -= 15;
  s -= 10 * r.violations.length;
  if (r.damageAmount >= 20000) s -= 20;
  else if (r.damageAmount >= 1) s -= 10;
  s += (r.rating - 3) * 5;
  return Math.max(0, Math.min(100, s));
}

/** Average of the last 10 reviews (newest first). No reviews → 100. */
export function vendorScore(reviews: Pick<VendorReview, "setupOnTime" | "dismantledWithin24h" | "violations" | "damageAmount" | "rating" | "date">[]) {
  if (!reviews.length) return 100;
  const last = [...reviews].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  return Math.round(last.reduce((s, r) => s + reviewPoints(r), 0) / last.length);
}

export type SuggestedStatus = VendorStatus | "review_blacklist";
export function suggestedStatus(score: number, t: { active: number; warning: number } = { active: 70, warning: 50 }): SuggestedStatus {
  if (score >= t.active) return "active";
  if (score >= t.warning) return "warning";
  return "review_blacklist";
}

export const scoreColor = (score: number) => (score >= 70 ? "#12B76A" : score >= 50 ? "#F79009" : "#D92D20");
