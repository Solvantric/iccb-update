"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  SquaresFour, Users, CalendarCheck, ChartBar, Envelope,
  Crosshair, ChatDots, Gear, ArrowLeft, ArrowRight, Package,
  Fire, HouseLine, CalendarBlank, CurrencyDollar, CheckSquare,
  Bell, FilePdf,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { DEMO_USER } from "@/store/auth.store";

const NAV = [
  { label: "Overview", href: "/dashboard", icon: SquaresFour },
  { label: "Leads", href: "/dashboard/leads", icon: Users },
  { label: "Bookings", href: "/dashboard/bookings", icon: CalendarCheck },
  { label: "Calendar", href: "/dashboard/calendar", icon: CalendarBlank },
  { label: "Revenue", href: "/dashboard/revenue", icon: CurrencyDollar },
  { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { label: "Documents", href: "/dashboard/documents", icon: FilePdf },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Queries", href: "/dashboard/queries", icon: Envelope },
  { label: "Analytics", href: "/dashboard/analytics", icon: ChartBar },
  { label: "Radar", href: "/dashboard/radar", icon: Crosshair },
  { label: "Chats", href: "/dashboard/chats", icon: ChatDots },
  { label: "Content", href: "/dashboard/content", icon: Package },
  { label: "Settings", href: "/dashboard/settings", icon: Gear },
];

interface Props { open: boolean; onToggle: () => void }

export function DashboardSidebar({ open, onToggle }: Props) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col bg-[var(--bg-deep)] border-e border-[var(--line)] transition-all duration-300 flex-shrink-0",
        open ? "w-56" : "w-16"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[var(--line)]">
        <div className="relative w-7 h-7 flex-shrink-0">
          <Image src="https://res.cloudinary.com/sgufp9aq/image/upload/v1794418824/iccb-logo.png" alt="ICCB" fill className="object-contain" />
        </div>
        {open && (
          <span className="text-sm text-white font-semibold tracking-wider uppercase truncate">
            ICCB CRM
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors",
                isActive
                  ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon size={18} weight={isActive ? "fill" : "regular"} className="flex-shrink-0" />
              {open && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User + toggle */}
      <div className="border-t border-[var(--line)] p-3 space-y-2">
        {open && (
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[11px] font-bold">{DEMO_USER.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[12px] font-medium truncate">{DEMO_USER.name}</p>
              <p className="text-white/40 text-[10px] truncate">Demo Mode</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          {open && (
            <Link
              href="/"
              className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors text-[12px]"
            >
              <HouseLine size={15} />
              <span>View Site</span>
            </Link>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
            aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
          >
            {open ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
