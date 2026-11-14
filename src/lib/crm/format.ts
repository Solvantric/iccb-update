import { format, formatDistanceToNowStrict, parseISO } from "date-fns";

/** `৳ 1,25,000` (South Asian digit grouping). */
export const money = (n: number) => `৳ ${Math.round(n || 0).toLocaleString("en-IN")}`;
export const num = (n: number) => Math.round(n || 0).toLocaleString("en-IN");

/** yyyy-MM-dd for today, in local time. */
export const todayYmd = () => format(new Date(), "yyyy-MM-dd");
export const ymd = (d: Date) => format(d, "yyyy-MM-dd");

/** "Sat, 26 Dec 2026" from yyyy-MM-dd (or ISO). */
export function fmtDate(date: string | undefined, pattern = "d MMM yyyy") {
  if (!date) return "—";
  try {
    return format(date.length === 10 ? parseISO(`${date}T00:00:00`) : parseISO(date), pattern);
  } catch {
    return date;
  }
}

export function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  return `${((h + 11) % 12) + 1}:${String(m ?? 0).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function timeAgo(iso: string) {
  try {
    return `${formatDistanceToNowStrict(parseISO(iso))} ago`;
  } catch {
    return iso;
  }
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w[0] ?? ""))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

/** "01711-234567" → "8801711234567" for wa.me / tel: links. */
export function phoneDigits(mobile: string) {
  const d = mobile.replace(/\D/g, "");
  return d.startsWith("88") ? d : `88${d}`;
}
export const telHref = (mobile: string) => `tel:+${phoneDigits(mobile)}`;
export const waHref = (mobile: string, text?: string) => `https://wa.me/${phoneDigits(mobile)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Taka in words, Bangladeshi system (crore / lakh / thousand). */
export function amountInWords(n: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x: number) => (x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? ` ${ones[x % 10]}` : ""}`);
  const three = (x: number) => [x >= 100 ? `${ones[Math.floor(x / 100)]} Hundred` : "", two(x % 100)].filter(Boolean).join(" ");
  let v = Math.round(Math.abs(n));
  if (v === 0) return "Zero Taka only";
  const parts: string[] = [];
  const crore = Math.floor(v / 10_000_000);
  v %= 10_000_000;
  const lakh = Math.floor(v / 100_000);
  v %= 100_000;
  const thousand = Math.floor(v / 1000);
  v %= 1000;
  if (crore) parts.push(`${crore >= 100 ? three(crore) : two(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (v) parts.push(three(v));
  return `${parts.join(" ")} Taka only`;
}

/** Last 4 digits of a reference, for file names: ICCB-2026-0007 → 0007. */
export const shortNo = (ref: string) => ref.match(/(\d+)$/)?.[1]?.padStart(4, "0") ?? ref;
