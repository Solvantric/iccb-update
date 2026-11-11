import { format, formatDistanceToNow, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const TZ = "Asia/Dhaka";

export function formatDate(isoDate: string, locale?: string): string {
  try {
    const d = toZonedTime(parseISO(isoDate), TZ);
    return format(d, "dd MMM yyyy");
  } catch {
    return isoDate;
  }
}

export function formatDateTime(isoDate: string): string {
  try {
    const d = toZonedTime(parseISO(isoDate), TZ);
    return format(d, "dd MMM yyyy, h:mm a");
  } catch {
    return isoDate;
  }
}

export function timeAgo(isoDate: string): string {
  try {
    return formatDistanceToNow(parseISO(isoDate), { addSuffix: true });
  } catch {
    return isoDate;
  }
}

export function formatBDT(amount: number, showCurrency = true): string {
  const formatted = new Intl.NumberFormat("en-BD").format(Math.round(amount));
  return showCurrency ? `৳${formatted}` : formatted;
}

export function formatUSD(amount: number, rate = 110): string {
  const usd = amount / rate;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(usd);
}

export function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ICCB-${year}-${rand}`;
}
