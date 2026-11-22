"use client";
import { useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence } from "framer-motion";
import { CaretRight, List, MagnifyingGlass, Moon, SignOut, Sun, User as UserIcon, UserSwitch } from "@phosphor-icons/react";
import { ROLE_LABELS } from "@/types/crm";
import { useCurrentUser, useSession } from "@/lib/crm/db";
import { useBookings, useHallMap } from "@/lib/crm/hooks";
import { fmtDate } from "@/lib/crm/format";
import { Avatar, Button } from "../ui/core";
import { Menu } from "../ui/overlay";
import { StatusPill } from "../ui/status";
import { m } from "../ui/motion";
import { breadcrumb } from "./nav";

function GlobalSearch() {
  const router = useRouter();
  const bookings = useBookings();
  const halls = useHallMap();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const results = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return [];
    return bookings.filter((b) => [b.name, b.mobile, b.ref, b.eventName].join(" ").toLowerCase().includes(n)).slice(0, 6);
  }, [q, bookings]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <div ref={box} className="relative w-full max-w-[320px]" onBlur={(e) => !box.current?.contains(e.relatedTarget as Node) && setOpen(false)}>
      <MagnifyingGlass size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-crm-muted" />
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && q.trim()) go(results[0] ? `/dashboard/bookings/${results[0].id}` : `/dashboard/bookings?q=${encodeURIComponent(q.trim())}`);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search name, mobile or ref…"
        aria-label="Search bookings"
        className="h-9 w-full rounded-[8px] border border-crm-line bg-crm-surface-2 ps-9 pe-3 text-[13.5px] text-crm-ink placeholder:text-crm-muted/80 focus:border-crm-brand focus:bg-crm-surface focus:outline-none"
      />
      <AnimatePresence>
        {open && q.trim() && (
          <m.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-[10px] border border-crm-line bg-crm-surface p-1 shadow-[var(--crm-shadow-lg)]">
            {results.length ? (
              results.map((b) => (
                <button key={b.id} type="button" onClick={() => go(`/dashboard/bookings/${b.id}`)} className="flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-start hover:bg-crm-surface-2">
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium text-crm-ink">{b.name}</span>
                    <span className="block truncate text-[12px] text-crm-muted">
                      {b.eventName} · {halls.get(b.hallId)?.name} · {fmtDate(b.date)}
                    </span>
                  </span>
                  <StatusPill status={b.status} />
                </button>
              ))
            ) : (
              <p className="px-3 py-3 text-[13px] text-crm-muted">No bookings match “{q}”.</p>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const signOut = useSession((s) => s.signOut);
  const { resolvedTheme, setTheme } = useTheme();
  const crumbs = breadcrumb(pathname);
  const dark = resolvedTheme === "dark";

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-crm-line bg-crm-surface px-4 md:px-8">
      <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <List size={20} />
      </Button>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13.5px] sm:flex">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <CaretRight size={12} className="text-crm-muted rtl:rotate-180" />}
            <span className={i === crumbs.length - 1 ? "font-medium text-crm-ink" : "text-crm-muted"}>{c}</span>
          </span>
        ))}
      </nav>
      <div className="ms-auto flex flex-1 items-center justify-end gap-2">
        <GlobalSearch />
        <Button variant="ghost" size="icon-sm" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? "Light mode" : "Dark mode"}>
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <Menu
          label="Account"
          trigger={
            <button type="button" className="flex items-center gap-2 rounded-full p-0.5 transition-opacity hover:opacity-80" aria-label="Account menu">
              <Avatar name={user.name} id={user.id} size={32} />
            </button>
          }
          items={[
            { label: `${user.name} · ${ROLE_LABELS[user.role]}`, icon: UserIcon, onClick: () => router.push("/dashboard/profile") },
            { label: "Switch role", icon: UserSwitch, onClick: () => router.push("/dashboard/sign-in") },
            {
              label: "Sign out",
              icon: SignOut,
              onClick: () => {
                signOut();
                router.push("/dashboard/sign-in");
              },
            },
          ]}
        />
      </div>
    </header>
  );
}

