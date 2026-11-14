import { AddressBook, Buildings, CalendarBlank, ChartBar, ChatsCircle, CurrencyCircleDollar, Handshake, House, Images, Receipt, Star, Target, Ticket, TrendUp, Tray, UserCircle, UsersThree, type Icon } from "@phosphor-icons/react";

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  counter?: "leads" | "ppm";
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  { title: "Overview", items: [{ href: "/dashboard", label: "Overview", icon: House }] },
  {
    title: "Sales",
    items: [
      { href: "/dashboard/leads", label: "Leads", icon: Tray, counter: "leads" },
      { href: "/dashboard/bookings", label: "Bookings", icon: Ticket },
      { href: "/dashboard/clients", label: "Clients", icon: AddressBook },
      { href: "/dashboard/calendar", label: "Calendar", icon: CalendarBlank },
      { href: "/dashboard/enquiries", label: "Enquiries", icon: ChatsCircle },
      { href: "/dashboard/invoices", label: "Invoices", icon: Receipt },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/dashboard/operations/ppm", label: "PPM", icon: Handshake, counter: "ppm" },
      { href: "/dashboard/operations/quality", label: "Quality", icon: Star },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/dashboard/marketing/analytics", label: "Analytics", icon: ChartBar },
      { href: "/dashboard/marketing/opportunity-radar", label: "Opportunity Radar", icon: Target },
      { href: "/dashboard/marketing/demand", label: "Demand & Pricing", icon: TrendUp },
      { href: "/dashboard/marketing/content", label: "Website content", icon: Images },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/dashboard/admin/pricing", label: "Pricing", icon: CurrencyCircleDollar },
      { href: "/dashboard/admin/venues", label: "Venues", icon: Buildings },
      { href: "/dashboard/admin/users", label: "Users", icon: UsersThree },
    ],
  },
  { title: "Personal", items: [{ href: "/dashboard/profile", label: "Profile", icon: UserCircle }] },
];

const ALL = NAV.flatMap((g) => g.items);

/** Longest matching nav item for the current path. */
export function activeItem(path: string): NavItem | undefined {
  return ALL.filter((i) => path === i.href || (i.href !== "/dashboard" && path.startsWith(`${i.href}/`))).sort((a, b) => b.href.length - a.href.length)[0];
}

export function breadcrumb(path: string): string[] {
  const item = activeItem(path);
  if (!item) return ["Overview"];
  const group = NAV.find((g) => g.items.includes(item))!;
  const crumbs = group.title === item.label ? [item.label] : [group.title, item.label];
  if (path.startsWith("/dashboard/bookings/")) crumbs.push("Detail");
  return crumbs;
}
