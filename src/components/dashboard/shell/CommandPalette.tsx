"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence } from "framer-motion";
import { CalendarPlus, CheckSquare, Kanban, MagnifyingGlass, Moon, User, UserPlus } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { db, useCurrentUser, useSession } from "@/lib/crm/db";
import { canSeePath, seesOnlyOwn } from "@/lib/crm/permissions";
import { firstEventDate } from "@/lib/crm/pricing";
import { fmtDate } from "@/lib/crm/format";
import { m } from "../ui/motion";
import { StatusPill } from "../ui/status";
import { Kbd } from "../ui/core";
import { ALL_NAV, T } from "./nav";
import { useQuickCreate } from "./QuickCreate";

const itemCls = "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] text-crm-ink-2 aria-selected:bg-crm-tint aria-selected:text-crm-ink";
const groupCls = "px-1 pb-1 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.1em] [&_[cmdk-group-heading]]:text-crm-muted";

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const user = useCurrentUser();
  const lang = useSession((s) => s.lang);
  const { resolvedTheme, setTheme } = useTheme();
  const show = useQuickCreate((s) => s.show);
  const bookings = db.bookings.store((s) => s.items);
  const clients = db.clients.store((s) => s.items);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const visibleBookings = bookings.filter((b) => !b.deletedAt && (!seesOnlyOwn(user.role) || b.assignedTo === user.id));
  const canBookings = canSeePath(user.role, "/dashboard/sales/bookings");
  const canClients = canSeePath(user.role, "/dashboard/sales/clients");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div className="fixed inset-0 z-[90] bg-[#2B2A2E]/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <m.div className="crm fixed left-1/2 top-[12vh] z-[91] w-[calc(100vw-24px)] max-w-xl overflow-hidden rounded-2xl border border-crm-line bg-crm-surface shadow-[var(--crm-shadow-lg)]" initial={{ opacity: 0, scale: 0.97, y: -8, x: "-50%" }} animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, scale: 0.98, x: "-50%" }}>
                <Dialog.Title className="sr-only">Command palette</Dialog.Title>
                <Dialog.Description className="sr-only">Search bookings, clients and pages</Dialog.Description>
                <Command loop>
                  <div className="flex items-center gap-2 border-b border-crm-line px-4">
                    <MagnifyingGlass size={17} className="text-crm-muted" />
                    <Command.Input autoFocus placeholder={T.search[lang]} className="h-12 flex-1 bg-transparent text-[14px] text-crm-ink placeholder:text-crm-muted focus:outline-none" />
                    <Kbd>Esc</Kbd>
                  </div>
                  <Command.List className="crm-scroll max-h-[60vh] overflow-y-auto pb-2">
                    <Command.Empty className="px-4 py-8 text-center text-[13px] text-crm-muted">No results.</Command.Empty>
                    <Command.Group heading="Quick actions" className={groupCls}>
                      {canBookings && (
                        <Command.Item className={itemCls} onSelect={() => go("/dashboard/sales/bookings/new")}>
                          <CalendarPlus size={17} /> New booking
                        </Command.Item>
                      )}
                      {canClients && (
                        <Command.Item className={itemCls} onSelect={() => { onOpenChange(false); show("client"); }}>
                          <UserPlus size={17} /> New client
                        </Command.Item>
                      )}
                      <Command.Item className={itemCls} onSelect={() => { onOpenChange(false); show("task"); }}>
                        <CheckSquare size={17} /> New task
                      </Command.Item>
                      <Command.Item className={itemCls} onSelect={() => { setTheme(resolvedTheme === "dark" ? "light" : "dark"); onOpenChange(false); }}>
                        <Moon size={17} /> Toggle dark mode
                      </Command.Item>
                    </Command.Group>
                    <Command.Group heading="Go to" className={groupCls}>
                      {ALL_NAV.filter((n) => canSeePath(user.role, n.href)).map((n) => {
                        const I = n.icon;
                        return (
                          <Command.Item key={n.key} value={`go ${n.label.en} ${n.label.bn} ${n.group.title.en}`} className={itemCls} onSelect={() => go(n.href)}>
                            <I size={17} /> {n.label[lang]}
                            <span className="ms-auto text-[11.5px] text-crm-muted">{n.group.title[lang]}</span>
                          </Command.Item>
                        );
                      })}
                    </Command.Group>
                    {canBookings && (
                      <Command.Group heading="Bookings" className={groupCls}>
                        {visibleBookings.map((b) => (
                          <Command.Item key={b.id} value={`${b.bfNo} ${b.eventTitle} ${b.contact.name} ${b.contact.mobile}`} className={itemCls} onSelect={() => go(`/dashboard/sales/bookings/${b.id}`)}>
                            <Kanban size={17} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-crm-ink">{b.eventTitle}</span>
                              <span className="block truncate text-[11.5px] text-crm-muted">
                                {b.bfNo} · {b.contact.name} · {fmtDate(firstEventDate(b))}
                              </span>
                            </span>
                            <StatusPill status={b.status} size="sm" />
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                    {canClients && (
                      <Command.Group heading="Clients" className={groupCls}>
                        {clients.filter((c) => !c.deletedAt).map((c) => (
                          <Command.Item key={c.id} value={`${c.name} ${c.mobile} ${c.clientNo} ${c.organization ?? ""}`} className={itemCls} onSelect={() => go(`/dashboard/sales/clients?c=${c.id}`)}>
                            <User size={17} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-crm-ink">{c.name}</span>
                              <span className="block truncate text-[11.5px] text-crm-muted">
                                {c.clientNo} · {c.mobile}
                                {c.organization ? ` · ${c.organization}` : ""}
                              </span>
                            </span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                  </Command.List>
                </Command>
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
