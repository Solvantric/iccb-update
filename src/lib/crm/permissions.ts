import type { Role } from "@/types/crm";

export type Action = "view" | "create" | "update" | "delete" | "approve" | "override" | "export";
export type Resource =
  | "overview"
  | "bookings"
  | "calendar"
  | "clients"
  | "enquiries"
  | "followups"
  | "invoices"
  | "payments"
  | "leads"
  | "analytics"
  | "radar"
  | "demand"
  | "content"
  | "events"
  | "ppm"
  | "quality"
  | "pricing"
  | "venues"
  | "users"
  | "settings"
  | "profile"
  /* business features */
  | "leakage"
  | "portal"
  | "offers"
  | "matchmaker"
  | "collections"
  | "vendors";

const ALL: Action[] = ["view", "create", "update", "delete", "approve", "override", "export"];
const CRUD: Action[] = ["view", "create", "update", "delete", "export"];
const READ: Action[] = ["view", "export"];
const EDIT: Action[] = ["view", "create", "update", "export"];

type Matrix = Partial<Record<Resource, Action[]>>;

const MATRIX: Record<Role, Matrix> = {
  admin: Object.fromEntries(
    (["overview", "bookings", "calendar", "clients", "enquiries", "followups", "invoices", "payments", "leads", "analytics", "radar", "demand", "content", "events", "ppm", "quality", "pricing", "venues", "users", "settings", "profile", "leakage", "portal", "offers", "matchmaker", "collections", "vendors"] as Resource[]).map((r) => [r, ALL])
  ) as Matrix,
  sales_manager: {
    overview: READ,
    bookings: [...CRUD, "approve"],
    calendar: [...CRUD, "approve"],
    clients: CRUD,
    enquiries: CRUD,
    followups: CRUD,
    invoices: [...CRUD, "approve"],
    payments: READ,
    leads: CRUD,
    analytics: READ,
    radar: READ,
    demand: READ,
    events: READ,
    ppm: READ,
    quality: READ,
    profile: EDIT,
    leakage: [...EDIT, "approve"], // add + waive
    portal: CRUD,
    offers: [...READ, "approve"], // approve offers above the max discount
    matchmaker: EDIT,
    collections: EDIT,
    vendors: READ,
  },
  sales_executive: {
    overview: READ,
    bookings: EDIT,
    calendar: EDIT,
    clients: EDIT,
    enquiries: EDIT,
    followups: CRUD,
    invoices: EDIT,
    payments: READ,
    profile: EDIT,
    leakage: EDIT, // add to bill (no waive)
    portal: CRUD,
    matchmaker: EDIT,
    vendors: READ,
  },
  marketing: {
    overview: READ,
    leads: CRUD,
    analytics: READ,
    radar: CRUD,
    demand: [...EDIT, "approve"],
    content: CRUD,
    enquiries: READ,
    profile: EDIT,
    offers: CRUD,
  },
  operations: {
    overview: READ,
    bookings: READ,
    calendar: READ,
    events: CRUD,
    ppm: CRUD,
    quality: CRUD,
    profile: EDIT,
    vendors: CRUD, // reviews + vendor records; blacklist is Admin only
  },
  accounts: {
    overview: READ,
    bookings: READ,
    calendar: READ,
    clients: READ,
    invoices: CRUD,
    payments: CRUD,
    profile: EDIT,
    collections: CRUD,
    leakage: READ,
  },
};

export function can(role: Role, action: Action, resource: Resource): boolean {
  return MATRIX[role]?.[resource]?.includes(action) ?? false;
}

/** Route → resource, for sidebar filtering and the "No access" guard. */
export const ROUTE_RESOURCES: [prefix: string, resource: Resource][] = [
  ["/dashboard/sales/bookings", "bookings"],
  ["/dashboard/sales/calendar", "calendar"],
  ["/dashboard/sales/clients", "clients"],
  ["/dashboard/sales/enquiries", "enquiries"],
  ["/dashboard/sales/follow-ups", "followups"],
  ["/dashboard/sales/invoices", "invoices"],
  ["/dashboard/marketing/leads", "leads"],
  ["/dashboard/marketing/analytics", "analytics"],
  ["/dashboard/marketing/opportunity-radar", "radar"],
  ["/dashboard/marketing/demand", "demand"],
  ["/dashboard/marketing/content", "content"],
  ["/dashboard/operations/events", "events"],
  ["/dashboard/operations/ppm", "ppm"],
  ["/dashboard/operations/quality", "quality"],
  ["/dashboard/admin/pricing", "pricing"],
  ["/dashboard/admin/venues", "venues"],
  ["/dashboard/admin/users", "users"],
  ["/dashboard/admin/settings", "settings"],
  ["/dashboard/profile", "profile"],
  ["/dashboard", "overview"],
];

export function resourceForPath(path: string): Resource {
  return ROUTE_RESOURCES.find(([p]) => path === p || path.startsWith(`${p}/`))?.[1] ?? "overview";
}

export const canSeePath = (role: Role, path: string) => {
  // Invoices is shared by Sales and Accounts.
  if (path.startsWith("/dashboard/sales/invoices")) return can(role, "view", "invoices");
  return can(role, "view", resourceForPath(path));
};

/** Sales Executives see only their own / assigned bookings. */
export const seesOnlyOwn = (role: Role) => role === "sales_executive";
