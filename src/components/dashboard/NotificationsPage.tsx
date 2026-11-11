"use client";
import { useState } from "react";
import { Bell, CalendarCheck, Users, Warning, CheckCircle, Info, Envelope, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

type NType = "booking" | "lead" | "warning" | "success" | "info" | "query";

interface Notification {
  id: string;
  type: NType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  booking?: string;
}

const INITIAL: Notification[] = [
  { id: "n1", type: "booking", title: "New booking confirmed", body: "ICCB-2026-005 for Bashundhara Hall has been confirmed by the client. Event: Corporate Gala, 450 guests.", time: "2 min ago", read: false, booking: "ICCB-2026-005" },
  { id: "n2", type: "lead", title: "Hot lead assigned", body: "Tanvir Ahmed (wedding, 1200 guests) has been classified as hot lead and assigned to Rafi Ahmed.", time: "18 min ago", read: false },
  { id: "n3", type: "warning", title: "Hall conflict detected", body: "Meghna Hall has overlapping bookings on 2026-11-20 (morning shift). Please review and resolve.", time: "1 hr ago", read: false },
  { id: "n4", type: "query", title: "New client enquiry received", body: "Mohammed Faisal submitted an enquiry for a conference (300 guests) on December 2026.", time: "2 hr ago", read: false },
  { id: "n5", type: "success", title: "Payment received", body: "Full payment of ৳4,80,000 received for booking ICCB-2026-003 (Bangladesh Tech Expo).", time: "3 hr ago", read: true, booking: "ICCB-2026-003" },
  { id: "n6", type: "info", title: "Expo calendar updated", body: "The 2027 Expo Village calendar has been published. 14 trade fairs are now listed.", time: "5 hr ago", read: true },
  { id: "n7", type: "booking", title: "Booking cancelled", body: "ICCB-2026-007 (Seminar Hall) has been cancelled by client. Date 2026-11-18 is now available.", time: "Yesterday", read: true, booking: "ICCB-2026-007" },
  { id: "n8", type: "warning", title: "Catering deadline approaching", body: "Final menu confirmation for ICCB-2026-001 must be submitted by tomorrow 12:00 PM.", time: "Yesterday", read: true, booking: "ICCB-2026-001" },
  { id: "n9", type: "lead", title: "Lead converted to booking", body: "Lead from Priya Enterprises (Corporate Summit) has been converted to a confirmed booking.", time: "2 days ago", read: true },
  { id: "n10", type: "success", title: "Post-event report ready", body: "Post-event report for BGMEA Annual Convention has been generated and is ready for review.", time: "3 days ago", read: true },
];

const TYPE_CONFIG: Record<NType, { icon: React.ElementType; color: string; bg: string }> = {
  booking: { icon: CalendarCheck, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
  lead: { icon: Users, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10" },
  warning: { icon: Warning, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10" },
  success: { icon: CheckCircle, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10" },
  info: { icon: Info, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10" },
  query: { icon: Envelope, color: "text-[var(--accent)]", bg: "bg-[var(--accent)]/10" },
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const markAllRead = () => setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id: string) => setNotifications((ns) => ns.filter((n) => n.id !== id));

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Notifications</h1>
          <p className="text-[var(--ink-muted)] text-[13px] mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-[12px] text-[var(--accent-text)] hover:text-[var(--accent)] underline underline-offset-2 transition-colors mt-1"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Unread", value: unreadCount, color: "text-[var(--accent)]" },
          { label: "Bookings", value: notifications.filter((n) => n.type === "booking").length, color: "text-blue-600 dark:text-blue-400" },
          { label: "Warnings", value: notifications.filter((n) => n.type === "warning").length, color: "text-yellow-600 dark:text-yellow-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-4 text-center">
            <p className={cn("font-display text-3xl font-light", s.color)}>{s.value}</p>
            <p className="text-[var(--ink-muted)] text-[11px] mt-1 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-5 py-2 rounded-full text-[12px] font-medium capitalize transition-colors",
              filter === f ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-soft)] border border-[var(--line)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            {f === "unread" ? `Unread (${unreadCount})` : "All"}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Bell size={32} className="text-[var(--ink-muted)] mx-auto mb-3" weight="thin" />
            <p className="text-[var(--ink-muted)] text-[14px]">No unread notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {filtered.map((n) => {
              const { icon: Icon, color, bg } = TYPE_CONFIG[n.type];
              return (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-4 px-5 py-4 hover:bg-[var(--bg-soft)] transition-colors cursor-pointer",
                    !n.read && "bg-[var(--accent)]/3"
                  )}
                  onClick={() => markRead(n.id)}
                >
                  {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />}
                  {n.read && <div className="w-1.5 h-1.5 mt-2 flex-shrink-0" />}
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", bg)}>
                    <Icon size={17} className={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-[13px]", n.read ? "text-[var(--ink-muted)]" : "text-[var(--ink)] font-medium")}>
                        {n.title}
                      </p>
                      <span className="text-[11px] text-[var(--ink-muted)] flex-shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[12px] text-[var(--ink-muted)] mt-0.5 leading-relaxed">{n.body}</p>
                    {n.booking && (
                      <span className="text-[10px] text-[var(--accent-text)] font-medium mt-1 inline-block">{n.booking}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                    className="mt-0.5 text-[var(--ink-muted)] hover:text-red-500 transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
