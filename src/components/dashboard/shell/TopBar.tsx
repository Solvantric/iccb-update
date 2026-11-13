"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { AnimatePresence } from "framer-motion";
import { Bell, CaretRight, Check, List, MagnifyingGlass, Moon, Plus, SignOut, Sun, Translate, UserSwitch } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { db, useCurrentUser, useSession } from "@/lib/crm/db";
import { ROLE_LABELS } from "@/types/crm";
import { m } from "../ui/motion";
import { Avatar, Button, CountPill, Kbd } from "../ui/core";
import { activeNav, T } from "./nav";
import { NotificationsPanel, useMyNotifications } from "./Notifications";
import { QuickCreateMenu } from "./QuickCreate";

function useOutside(ref: React.RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, close, ref]);
}

const SEGMENT_LABELS: Record<string, string> = { sales: "Sales", marketing: "Marketing", operations: "Operations", admin: "Admin", new: "New booking" };

export function TopBar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useCurrentUser();
  const { lang, setLang, setUser, signOut } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const [menu, setMenu] = useState<null | "user" | "bell" | "create">(null);
  const userRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const createRef = useRef<HTMLDivElement>(null);
  const close = () => setMenu(null);
  useOutside(userRef, menu === "user", close);
  useOutside(bellRef, menu === "bell", close);
  useOutside(createRef, menu === "create", close);

  const { unread } = useMyNotifications();
  const nav = activeNav(pathname);
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const users = db.users.store((s) => s.items).filter((u) => !u.deletedAt && u.active);

  // Bell shakes once when a new unread notification arrives.
  const prevUnread = useRef(unread);
  const [shakeKey, setShakeKey] = useState(0);
  useEffect(() => {
    if (unread > prevUnread.current) {
      const t = setTimeout(() => setShakeKey((k) => k + 1), 0);
      prevUnread.current = unread;
      return () => clearTimeout(t);
    }
    prevUnread.current = unread;
  }, [unread]);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-crm-line bg-crm-surface/95 px-4 backdrop-blur md:px-6">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu} aria-label="Open menu">
        <List size={20} />
      </Button>

      {/* Breadcrumb */}
      <nav className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex" aria-label="Breadcrumb">
        <Link href="/dashboard" className="text-crm-muted hover:text-crm-ink">
          ICCB
        </Link>
        {segments.map((s, i) => {
          const href = `/dashboard/${segments.slice(0, i + 1).join("/")}`;
          const last = i === segments.length - 1;
          const label = SEGMENT_LABELS[s] ?? (href === nav?.href ? nav.label[lang] : s.length > 14 ? "Details" : s.replace(/-/g, " "));
          return (
            <span key={href} className="flex min-w-0 items-center gap-1.5">
              <CaretRight size={11} className="text-crm-muted rtl:rotate-180" />
              {last ? <span className="truncate font-medium capitalize text-crm-ink">{label}</span> : <span className="truncate capitalize text-crm-muted">{label}</span>}
            </span>
          );
        })}
        {!segments.length && (
          <>
            <CaretRight size={11} className="text-crm-muted rtl:rotate-180" />
            <span className="font-medium text-crm-ink">{nav?.label[lang] ?? "Dashboard"}</span>
          </>
        )}
      </nav>

      <div className="ms-auto flex items-center gap-1.5">
        <button onClick={onSearch} className="hidden h-9 w-64 items-center gap-2 rounded-[8px] border border-crm-line bg-crm-surface-2 px-3 text-[13px] text-crm-muted transition-colors hover:border-crm-muted/40 lg:flex">
          <MagnifyingGlass size={15} />
          <span className="flex-1 truncate text-start">{T.search[lang]}</span>
          <Kbd>⌘K</Kbd>
        </button>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onSearch} aria-label="Search">
          <MagnifyingGlass size={19} />
        </Button>

        {/* Quick create */}
        <div ref={createRef} className="relative">
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setMenu(menu === "create" ? null : "create")}>
            <span className="hidden sm:inline">{T.quickCreate[lang]}</span>
          </Button>
          <AnimatePresence>{menu === "create" && <QuickCreateMenu onClose={close} />}</AnimatePresence>
        </div>

        {/* Notifications */}
        <div ref={bellRef} className="relative">
          <Button variant="ghost" size="icon" onClick={() => setMenu(menu === "bell" ? null : "bell")} aria-label={T.notifications[lang]}>
            <m.span key={shakeKey} animate={shakeKey ? { rotate: [0, -16, 14, -10, 8, 0] } : undefined} transition={{ duration: 0.6 }} className="grid">
              <Bell size={20} />
            </m.span>
            {unread > 0 && <CountPill n={unread} className="absolute -end-0.5 -top-0.5 h-[18px] min-w-[18px] text-[10px]" />}
          </Button>
          <AnimatePresence>{menu === "bell" && <NotificationsPanel onClose={close} />}</AnimatePresence>
        </div>

        <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={() => setLang(lang === "en" ? "bn" : "en")} aria-label="Language" title={lang === "en" ? "বাংলা" : "English"}>
          <span className="relative grid">
            <Translate size={19} />
            <span className="absolute -bottom-1.5 -end-2 rounded bg-crm-surface px-0.5 text-[9px] font-bold uppercase text-crm-brand">{lang}</span>
          </span>
        </Button>

        <Button variant="ghost" size="icon" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
          <AnimatePresence mode="wait" initial={false}>
            <m.span key={resolvedTheme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} className="grid">
              {resolvedTheme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </m.span>
          </AnimatePresence>
        </Button>

        {/* Avatar menu */}
        <div ref={userRef} className="relative">
          <button onClick={() => setMenu(menu === "user" ? null : "user")} className="ms-1 flex items-center gap-2 rounded-full p-0.5 hover:ring-2 hover:ring-crm-line" aria-label="Account menu">
            <Avatar name={user.name} color={user.color} size={34} />
          </button>
          <AnimatePresence>
            {menu === "user" && (
              <m.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} className="absolute end-0 top-11 z-50 w-72 rounded-xl border border-crm-line bg-crm-surface p-2 shadow-[var(--crm-shadow-lg)]">
                <div className="flex items-center gap-3 border-b border-crm-line px-2 pb-3 pt-1">
                  <Avatar name={user.name} color={user.color} size={38} />
                  <div className="min-w-0">
                    <p className="truncate text-[13.5px] font-semibold text-crm-ink">{user.name}</p>
                    <p className="truncate text-[12px] text-crm-muted">
                      {ROLE_LABELS[user.role]} · {user.email}
                    </p>
                  </div>
                </div>
                <p className="flex items-center gap-1.5 px-2 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-crm-muted">
                  <UserSwitch size={13} /> {T.switchRole[lang]}
                </p>
                <div className="max-h-64 overflow-y-auto crm-scroll">
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setUser(u.id);
                        close();
                        router.push("/dashboard");
                      }}
                      className={cn("flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-start hover:bg-crm-surface-2", u.id === user.id && "bg-crm-tint")}
                    >
                      <Avatar name={u.name} color={u.color} size={24} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-crm-ink">{ROLE_LABELS[u.role]}</span>
                        <span className="block truncate text-[11.5px] text-crm-muted">{u.name}</span>
                      </span>
                      {u.id === user.id && <Check size={14} className="text-crm-brand" />}
                    </button>
                  ))}
                </div>
                <div className="mt-1 border-t border-crm-line pt-1">
                  <Link href="/dashboard/profile" onClick={close} className="block rounded-lg px-2 py-1.5 text-[13px] text-crm-ink-2 hover:bg-crm-surface-2">
                    Profile & preferences
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      close();
                      router.push("/dashboard/sign-in");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] text-crm-ink-2 hover:bg-crm-surface-2"
                  >
                    <SignOut size={15} /> {T.signOut[lang]}
                  </button>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
