import {
  CalendarBlank,
  CalendarCheck,
  ChartLineUp,
  ChatCircleDots,
  CheckSquareOffset,
  ClipboardText,
  Crosshair,
  CurrencyCircleDollar,
  Fire,
  Gear,
  House,
  Kanban,
  MapTrifold,
  Megaphone,
  Newspaper,
  Receipt,
  ShieldCheck,
  SquaresFour,
  Star,
  UserCircle,
  UsersThree,
  type Icon,
} from "@phosphor-icons/react";
import type { UiLang } from "@/lib/crm/db";

export type CounterKey = "requested" | "enquiries" | "overdue" | "approvals" | "hot" | "ppmDue" | "radarNew" | "refundDue";

export interface NavItem {
  key: string;
  href: string;
  icon: Icon;
  label: Record<UiLang, string>;
  counter?: CounterKey;
}
export interface NavGroup {
  key: string;
  title: Record<UiLang, string>;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    key: "overview",
    title: { en: "Overview", bn: "ওভারভিউ" },
    items: [{ key: "home", href: "/dashboard", icon: SquaresFour, label: { en: "Dashboard", bn: "ড্যাশবোর্ড" }, counter: "approvals" }],
  },
  {
    key: "sales",
    title: { en: "Sales", bn: "সেলস" },
    items: [
      { key: "bookings", href: "/dashboard/sales/bookings", icon: Kanban, label: { en: "Bookings", bn: "বুকিং" }, counter: "requested" },
      { key: "calendar", href: "/dashboard/sales/calendar", icon: CalendarBlank, label: { en: "Calendar", bn: "ক্যালেন্ডার" } },
      { key: "clients", href: "/dashboard/sales/clients", icon: UsersThree, label: { en: "Clients", bn: "ক্লায়েন্ট" } },
      { key: "enquiries", href: "/dashboard/sales/enquiries", icon: ChatCircleDots, label: { en: "Enquiries", bn: "জিজ্ঞাসা" }, counter: "enquiries" },
      { key: "followups", href: "/dashboard/sales/follow-ups", icon: CheckSquareOffset, label: { en: "Follow-ups", bn: "ফলো-আপ" }, counter: "overdue" },
      { key: "invoices", href: "/dashboard/sales/invoices", icon: Receipt, label: { en: "Invoices", bn: "ইনভয়েস" }, counter: "refundDue" },
    ],
  },
  {
    key: "marketing",
    title: { en: "Marketing", bn: "মার্কেটিং" },
    items: [
      { key: "leads", href: "/dashboard/marketing/leads", icon: Fire, label: { en: "Leads", bn: "লিড" }, counter: "hot" },
      { key: "analytics", href: "/dashboard/marketing/analytics", icon: ChartLineUp, label: { en: "Analytics", bn: "অ্যানালিটিক্স" } },
      { key: "radar", href: "/dashboard/marketing/opportunity-radar", icon: Crosshair, label: { en: "Opportunity Radar", bn: "অপরচুনিটি রাডার" }, counter: "radarNew" },
      { key: "demand", href: "/dashboard/marketing/demand", icon: MapTrifold, label: { en: "Demand & Pricing", bn: "চাহিদা ও মূল্য" } },
      { key: "content", href: "/dashboard/marketing/content", icon: Newspaper, label: { en: "Website CMS", bn: "ওয়েবসাইট কনটেন্ট" } },
    ],
  },
  {
    key: "operations",
    title: { en: "Operations", bn: "অপারেশনস" },
    items: [
      { key: "events", href: "/dashboard/operations/events", icon: CalendarCheck, label: { en: "Events", bn: "ইভেন্ট" } },
      { key: "ppm", href: "/dashboard/operations/ppm", icon: ClipboardText, label: { en: "PPM", bn: "পিপিএম" }, counter: "ppmDue" },
      { key: "quality", href: "/dashboard/operations/quality", icon: Star, label: { en: "Quality", bn: "মান" } },
    ],
  },
  {
    key: "admin",
    title: { en: "Admin", bn: "অ্যাডমিন" },
    items: [
      { key: "pricing", href: "/dashboard/admin/pricing", icon: CurrencyCircleDollar, label: { en: "Pricing", bn: "মূল্য তালিকা" } },
      { key: "venues", href: "/dashboard/admin/venues", icon: House, label: { en: "Venues", bn: "ভেন্যু" } },
      { key: "users", href: "/dashboard/admin/users", icon: ShieldCheck, label: { en: "Users", bn: "ব্যবহারকারী" } },
      { key: "settings", href: "/dashboard/admin/settings", icon: Gear, label: { en: "Settings", bn: "সেটিংস" } },
    ],
  },
  {
    key: "personal",
    title: { en: "Personal", bn: "ব্যক্তিগত" },
    items: [{ key: "profile", href: "/dashboard/profile", icon: UserCircle, label: { en: "Profile", bn: "প্রোফাইল" } }],
  },
];

export const ALL_NAV = NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g })));

export function activeNav(pathname: string) {
  return [...ALL_NAV].sort((a, b) => b.href.length - a.href.length).find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
}

/** Small UI dictionary for the dashboard chrome (EN + BN). */
export const T = {
  search: { en: "Search bookings, clients, pages…", bn: "বুকিং, ক্লায়েন্ট, পেজ খুঁজুন…" },
  quickCreate: { en: "Create", bn: "তৈরি করুন" },
  notifications: { en: "Notifications", bn: "নোটিফিকেশন" },
  markAllRead: { en: "Mark all read", bn: "সব পড়া হয়েছে" },
  switchRole: { en: "Switch role (demo)", bn: "রোল পরিবর্তন (ডেমো)" },
  signOut: { en: "Sign out", bn: "সাইন আউট" },
  viewSite: { en: "View website", bn: "ওয়েবসাইট দেখুন" },
  collapse: { en: "Collapse", bn: "ছোট করুন" },
} satisfies Record<string, Record<UiLang, string>>;

export { Megaphone, Receipt };
