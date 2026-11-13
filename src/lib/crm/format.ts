import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

export type Grouping = "intl" | "bd";

/** ৳ 1,258,215.00 (intl) or ৳ 12,58,215.00 (BD/Indian lakh grouping). */
export function taka(amount: number, opts: { grouping?: Grouping; decimals?: boolean; symbol?: boolean } = {}) {
  const { grouping = "intl", decimals = false, symbol = true } = opts;
  const n = Number.isFinite(amount) ? amount : 0;
  const s = new Intl.NumberFormat(grouping === "bd" ? "en-IN" : "en-US", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(n);
  return symbol ? `৳ ${s}` : s;
}

/** Compact: ৳12.6L, ৳1.2Cr */
export function takaShort(amount: number) {
  const a = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (a >= 1e7) return `${sign}৳${(a / 1e7).toFixed(a >= 1e8 ? 0 : 1)}Cr`;
  if (a >= 1e5) return `${sign}৳${(a / 1e5).toFixed(a >= 1e6 ? 0 : 1)}L`;
  if (a >= 1e3) return `${sign}৳${(a / 1e3).toFixed(0)}K`;
  return `${sign}৳${a}`;
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (rest) parts.push(rest < 20 ? ONES[rest] : `${TENS[Math.floor(rest / 10)]}${rest % 10 ? `-${ONES[rest % 10]}` : ""}`);
  return parts.join(" ");
}

/** "Twelve Lakh Fifty-Eight Thousand Two Hundred Fifteen Taka Only" */
export function amountInWords(amount: number): string {
  let n = Math.round(Math.abs(amount));
  if (n === 0) return "Zero Taka Only";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${crore >= 1000 ? amountInWords(crore).replace(" Taka Only", "") : below1000(crore)} Crore`);
  if (lakh) parts.push(`${below1000(lakh)} Lakh`);
  if (thousand) parts.push(`${below1000(thousand)} Thousand`);
  if (n) parts.push(below1000(n));
  return `${amount < 0 ? "Minus " : ""}${parts.join(" ")} Taka Only`;
}

export const fmtDate = (v?: string | Date | null, pattern = "dd MMM yyyy") => {
  if (!v) return "—";
  try {
    return format(typeof v === "string" ? (v.length === 10 ? parseISO(`${v}T00:00:00`) : parseISO(v)) : v, pattern);
  } catch {
    return String(v);
  }
};
export const fmtDateTime = (v?: string | null) => fmtDate(v, "dd MMM yyyy, h:mm a");
export const fmtTime = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return format(d, "h:mm a");
};
export const ago = (iso?: string) => {
  if (!iso) return "—";
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
};
export const todayYmd = () => format(new Date(), "yyyy-MM-dd");
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
export const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
