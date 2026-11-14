import type { Role } from "@/types/crm";

const SALES = ["/dashboard/leads", "/dashboard/bookings", "/dashboard/clients", "/dashboard/calendar", "/dashboard/enquiries", "/dashboard/invoices", "/dashboard/operations/ppm"];
const OPERATIONS = ["/dashboard/operations", "/dashboard/calendar", "/dashboard/bookings"];
const MARKETING = ["/dashboard/marketing"];
const ALWAYS = ["/dashboard/profile"];

/** Admin sees everything; other roles see Overview, Profile and their own groups. */
export function canSeePath(role: Role, path: string): boolean {
  if (role === "admin") return true;
  if (path === "/dashboard" || path === "/dashboard/") return true;
  const under = (p: string) => path === p || path.startsWith(`${p}/`);
  if (ALWAYS.some(under)) return true;
  if (role === "sales") return SALES.some(under);
  if (role === "operations") return OPERATIONS.some(under);
  if (role === "marketing") return MARKETING.some(under);
  return false;
}
