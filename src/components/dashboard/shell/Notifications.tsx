"use client";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, CalendarCheck, CheckCircle, CurrencyCircleDollar, Fire, Info, SealCheck, UserPlus } from "@phosphor-icons/react";
import type { Notification, User } from "@/types/crm";
import { db, useCurrentUser, useSession, getSettings } from "@/lib/crm/db";
import { ago } from "@/lib/crm/format";
import { cn } from "@/lib/utils/cn";
import { m } from "../ui/motion";
import { EmptyState } from "../ui/core";
import { T } from "./nav";

const KIND_ICON = { booking: CalendarCheck, lead: UserPlus, approval: SealCheck, payment: CurrencyCircleDollar, task: CheckCircle, system: Info, hot_lead: Fire } as const;

export const isForUser = (n: Notification, u: User) => !n.deletedAt && (n.userId === u.id || ((n.userId == null) && (!n.roles || n.roles.includes(u.role))));

export function useMyNotifications() {
  const items = db.notifications.store((s) => s.items);
  const user = useCurrentUser();
  return useMemo(() => {
    const mine = items.filter((n) => isForUser(n, user)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: mine, unread: mine.filter((n) => !n.read).length };
  }, [items, user]);
}

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { items, unread } = useMyNotifications();
  const lang = useSession((s) => s.lang);
  const markAll = () => items.filter((n) => !n.read).forEach((n) => db.notifications.update(n.id, { read: true }, { silent: true }));
  return (
    <m.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} className="absolute end-0 top-11 z-50 w-[min(380px,calc(100vw-24px))] rounded-xl border border-crm-line bg-crm-surface shadow-[var(--crm-shadow-lg)]">
      <div className="flex items-center justify-between border-b border-crm-line px-4 py-3">
        <p className="text-[14px] font-semibold text-crm-ink">
          {T.notifications[lang]} {unread > 0 && <span className="ms-1 text-crm-brand">({unread})</span>}
        </p>
        {unread > 0 && (
          <button onClick={markAll} className="text-[12px] font-medium text-crm-brand hover:underline">
            {T.markAllRead[lang]}
          </button>
        )}
      </div>
      <div className="max-h-[420px] overflow-y-auto crm-scroll">
        {items.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" className="py-10" />
        ) : (
          <m.ul initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}>
            {items.slice(0, 30).map((n) => {
              const I = KIND_ICON[n.kind] ?? Info;
              return (
                <m.li key={n.id} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}>
                  <Link
                    href={n.href ?? "#"}
                    onClick={() => {
                      db.notifications.update(n.id, { read: true }, { silent: true });
                      onClose();
                    }}
                    className={cn("flex gap-3 border-b border-crm-line px-4 py-3 last:border-0 hover:bg-crm-surface-2", !n.read && "bg-crm-tint/40")}
                  >
                    <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg", n.kind === "hot_lead" ? "bg-crm-brand text-white" : "bg-crm-surface-2 text-crm-ink-2")}>
                      <I size={16} weight="duotone" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-semibold text-crm-ink">{n.title}</span>
                        {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-crm-brand" />}
                      </span>
                      <span className="block text-[12.5px] text-crm-ink-2 line-clamp-2">{n.body}</span>
                      <span className="block text-[11.5px] text-crm-muted">{ago(n.createdAt)}</span>
                    </span>
                  </Link>
                </m.li>
              );
            })}
          </m.ul>
        )}
      </div>
    </m.div>
  );
}

/** Pops a toast (red left bar for hot leads) when a new notification arrives for this user. */
export function NotificationToaster() {
  useEffect(() => {
    let known = new Set(db.notifications.all().map((n) => n.id));
    return db.notifications.store.subscribe((s) => {
      const user = db.users.get(useSession.getState().userId);
      const fresh = s.items.filter((n) => !known.has(n.id));
      known = new Set(s.items.map((n) => n.id));
      if (!user) return;
      for (const n of fresh) {
        if (!isForUser(n, user)) continue;
        if (n.kind === "hot_lead" && !getSettings().notifyHotLead) continue;
        toast.custom(
          () => (
            <div className={cn("crm flex w-[356px] items-start gap-3 rounded-xl border border-crm-line bg-crm-surface p-3.5 shadow-[var(--crm-shadow-lg)]", n.kind === "hot_lead" && "border-s-4 border-s-crm-brand")}>
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", n.kind === "hot_lead" ? "bg-crm-brand text-white" : "bg-crm-tint text-crm-brand")}>
                {n.kind === "hot_lead" ? <Fire size={16} weight="fill" /> : <Bell size={16} weight="duotone" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-crm-ink">{n.title}</span>
                <span className="block text-[12.5px] text-crm-ink-2">{n.body}</span>
                {n.href && (
                  <Link href={n.href} className="mt-1 inline-block text-[12px] font-medium text-crm-brand hover:underline">
                    Open →
                  </Link>
                )}
              </span>
            </div>
          ),
          { duration: n.kind === "hot_lead" ? 8000 : 5000 }
        );
      }
    });
  }, []);
  return null;
}
