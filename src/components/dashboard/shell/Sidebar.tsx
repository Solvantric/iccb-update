"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence } from "framer-motion";
import { House, SidebarSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { useCurrentUser, useSession } from "@/lib/crm/db";
import { useLeads, useMeetings } from "@/lib/crm/hooks";
import { todayYmd } from "@/lib/crm/format";
import { canSeePath } from "@/lib/crm/permissions";
import { m } from "../ui/motion";
import { activeItem, NAV } from "./nav";

export const LOGO = "https://res.cloudinary.com/sgufp9aq/image/upload/v1794418824/iccb-logo.png";

function SidebarBody({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const user = useCurrentUser();
  const setCollapsed = useSession((s) => s.setCollapsed);
  // New leads nobody has picked up yet.
  const leads = useLeads().filter((l) => l.stage === "discover" && !l.lost && !l.ownerIds.length).length;
  const today = todayYmd();
  const ppm = useMeetings().filter((m) => m.status === "scheduled" && m.date === today).length;
  const active = activeItem(pathname);

  return (
    <div className="flex h-full flex-col">
      <div className={cn("flex h-16 shrink-0 items-center gap-3", collapsed ? "justify-center px-2" : "px-5")}>
        <Link href="/" onClick={onNavigate} title="Go to home page" aria-label="ICCB home page" className="relative h-9 w-9 shrink-0">
          <Image src={LOGO} alt="ICCB" fill sizes="36px" className="object-contain" />
        </Link>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-tight text-crm-ink">ICCB</p>
            <p className="truncate text-[12px] text-crm-muted">Booking dashboard</p>
          </div>
        )}
      </div>

      <nav className="crm-scroll flex-1 overflow-y-auto overflow-x-hidden px-3 pt-2 pb-4">
        {NAV.map((g) => {
          const items = g.items.filter((i) => canSeePath(user.role, i.href));
          if (!items.length) return null;
          return (
            <div key={g.title} className="mb-5 last:mb-0">
              {collapsed ? <div className="mx-auto mb-2 h-px w-6 bg-crm-line" /> : <p className="mb-1.5 px-3 text-[12px] text-crm-muted">{g.title}</p>}
              <ul className="space-y-0.5">
                {items.map((i) => {
                  const on = active?.href === i.href;
                  const I = i.icon;
                  const count = i.counter === "leads" ? leads : i.counter === "ppm" ? ppm : 0;
                  return (
                    <li key={i.href}>
                      <Link
                        href={i.href}
                        onClick={onNavigate}
                        title={collapsed ? i.label : undefined}
                        aria-current={on ? "page" : undefined}
                        className={cn("relative flex items-center gap-3 rounded-[8px] text-[14px] font-medium transition-colors duration-200", collapsed ? "h-10 justify-center" : "h-10 px-3", on ? "text-crm-brand-text" : "text-crm-ink-2 hover:bg-crm-surface-2 hover:text-crm-ink")}
                      >
                        {on && <m.span layoutId="nav-active" className="absolute inset-0 rounded-[8px] bg-crm-tint" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} />}
                        <I size={19} weight={on ? "fill" : "regular"} className="relative shrink-0" />
                        {!collapsed && <span className="relative flex-1 truncate">{i.label}</span>}
                        {count > 0 &&
                          (collapsed ? (
                            <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-crm-reserved" />
                          ) : (
                            <span className="relative grid h-5 min-w-5 place-items-center rounded-full bg-crm-reserved-bg px-1.5 text-[11.5px] font-semibold text-crm-reserved-ink tabular">{count}</span>
                          ))}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-crm-line p-3 pb-1">
        <Link
          href="/"
          onClick={onNavigate}
          title={collapsed ? "Back to home" : undefined}
          className={cn("crm-btn-primary flex h-10 w-full items-center gap-2 rounded-[8px] text-[14px] font-medium shadow-[0_6px_16px_-8px_var(--accent-glow)] transition-colors", collapsed ? "justify-center" : "px-3")}
        >
          <House size={18} weight="fill" className="shrink-0" />
          {!collapsed && "Back to home"}
        </Link>
      </div>
      {!onNavigate && (
        <div className="hidden shrink-0 p-3 pt-2 lg:block">
          <button type="button" onClick={() => setCollapsed(!collapsed)} className={cn("flex h-9 w-full items-center gap-2 rounded-[8px] text-[13px] text-crm-muted transition-colors hover:bg-crm-surface-2 hover:text-crm-ink", collapsed ? "justify-center" : "px-3")} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <SidebarSimple size={18} className="rtl:-scale-x-100" />
            {!collapsed && "Collapse"}
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const collapsed = useSession((s) => s.collapsed);
  const rtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  return (
    <>
      <aside className={cn("hidden shrink-0 border-e border-crm-line bg-crm-surface transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block", collapsed ? "w-[72px]" : "w-[240px]")}>
        <SidebarBody collapsed={collapsed} />
      </aside>
      <Dialog.Root open={mobileOpen} onOpenChange={(v) => !v && onMobileClose()}>
        <AnimatePresence>
          {mobileOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <m.div className="fixed inset-0 z-[60] bg-black/30 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount>
                <m.aside className="crm fixed inset-y-0 start-0 z-[61] w-[264px] max-w-[85vw] border-e border-crm-line bg-crm-surface lg:hidden" initial={{ x: rtl ? "100%" : "-100%" }} animate={{ x: 0 }} exit={{ x: rtl ? "100%" : "-100%" }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                  <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                  <Dialog.Description className="sr-only">Dashboard pages</Dialog.Description>
                  <SidebarBody collapsed={false} onNavigate={onMobileClose} />
                </m.aside>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}
