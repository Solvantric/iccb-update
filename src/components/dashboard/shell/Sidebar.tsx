"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ArrowSquareOut, CaretDoubleLeft, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { useCurrentUser, useSession } from "@/lib/crm/db";
import { canSeePath } from "@/lib/crm/permissions";
import { ROLE_LABELS } from "@/types/crm";
import { m } from "../ui/motion";
import { Avatar, CountPill } from "../ui/core";
import { activeNav, NAV, T } from "./nav";
import { useCounters } from "./counters";

const LOGO = "https://res.cloudinary.com/sgufp9aq/image/upload/v1794418824/iccb-logo.png";

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const lang = useSession((s) => s.lang);
  const setCollapsed = useSession((s) => s.setCollapsed);
  const counters = useCounters();
  const active = activeNav(pathname);

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex h-16 shrink-0 items-center gap-3 border-b border-crm-line", collapsed ? "justify-center px-2" : "px-5")}>
        <m.div layout className="relative shrink-0" style={{ width: collapsed ? 34 : 40, height: collapsed ? 34 : 40 }}>
          <Image src={LOGO} alt="ICCB" fill sizes="40px" className="object-contain" />
        </m.div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <m.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} className="min-w-0">
              <p className="text-[15px] font-bold leading-tight text-crm-ink">ICCB CRM</p>
              <p className="text-[11px] text-crm-muted truncate">International Convention City</p>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="crm-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {NAV.map((g) => {
          const items = g.items.filter((i) => canSeePath(user.role, i.href));
          if (!items.length) return null;
          return (
            <div key={g.key} className="mb-4 last:mb-0">
              {collapsed ? (
                <div className="mx-auto mb-2 h-px w-6 bg-crm-line" />
              ) : (
                <p className="mb-1.5 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-crm-muted">{g.title[lang]}</p>
              )}
              <ul className="space-y-0.5">
                {items.map((i) => {
                  const isActive = active?.key === i.key;
                  const n = i.counter ? counters[i.counter] : 0;
                  const I = i.icon;
                  return (
                    <li key={i.key} className="relative">
                      {isActive && <m.span layoutId="nav-active-bar" className="absolute -start-3 top-1.5 bottom-1.5 w-[3px] rounded-e-full bg-crm-brand" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
                      <Link
                        href={i.href}
                        onClick={onNavigate}
                        title={collapsed ? i.label[lang] : undefined}
                        className={cn(
                          "relative flex items-center gap-3 rounded-[8px] text-[13.5px] font-medium transition-colors",
                          collapsed ? "h-10 justify-center" : "h-9 px-3",
                          isActive ? "bg-crm-tint text-crm-brand" : "text-crm-ink-2 hover:bg-crm-surface-2 hover:text-crm-ink"
                        )}
                      >
                        <I size={19} weight={isActive ? "fill" : "regular"} className="shrink-0" />
                        {!collapsed && <span className="flex-1 truncate">{i.label[lang]}</span>}
                        {n > 0 && (collapsed ? <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-crm-brand ring-2 ring-crm-surface" /> : <CountPill n={n} />)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* User card */}
      <div className="shrink-0 border-t border-crm-line p-3">
        <div className={cn("flex items-center gap-2.5 rounded-[10px] p-2", !collapsed && "bg-crm-surface-2")}>
          <Avatar name={user.name} color={user.color} size={32} />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-crm-ink">{user.name}</p>
              <p className="truncate text-[11.5px] text-crm-muted">{ROLE_LABELS[user.role]}</p>
            </div>
          )}
          {!collapsed && (
            <Link href="/" target="_blank" title={T.viewSite[lang]} className="grid h-7 w-7 place-items-center rounded-md text-crm-muted hover:bg-crm-surface hover:text-crm-ink">
              <ArrowSquareOut size={15} />
            </Link>
          )}
        </div>
        {!onNavigate && (
          <button onClick={() => setCollapsed(!collapsed)} className="mt-2 hidden w-full items-center justify-center gap-2 rounded-md py-1.5 text-[12px] text-crm-muted hover:bg-crm-surface-2 hover:text-crm-ink lg:flex">
            <m.span animate={{ rotate: collapsed ? 180 : 0 }} className="grid rtl:-scale-x-100">
              <CaretDoubleLeft size={14} />
            </m.span>
            {!collapsed && T.collapse[lang]}
          </button>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const collapsedPref = useSession((s) => s.collapsed);
  return (
    <>
      {/* Desktop / tablet */}
      <m.aside
        initial={false}
        animate={{ width: collapsedPref ? 76 : 264 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="hidden lg:block h-screen shrink-0 border-e border-crm-line bg-crm-surface"
      >
        <SidebarBody collapsed={collapsedPref} />
      </m.aside>
      {/* Tablet icon rail */}
      <aside className="hidden md:block lg:hidden h-screen w-[76px] shrink-0 border-e border-crm-line bg-crm-surface">
        <SidebarBody collapsed />
      </aside>
      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <m.div className="fixed inset-0 z-[60] bg-[#2B2A2E]/40 md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onMobileClose} />
            <m.aside className="fixed inset-y-0 start-0 z-[61] w-[280px] border-e border-crm-line bg-crm-surface md:hidden" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", stiffness: 380, damping: 38 }}>
              <button onClick={onMobileClose} className="absolute end-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-md text-crm-muted hover:bg-crm-surface-2" aria-label="Close menu">
                <X size={16} />
              </button>
              <SidebarBody collapsed={false} onNavigate={onMobileClose} />
            </m.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
