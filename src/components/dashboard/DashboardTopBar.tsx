"use client";
import { useState, useEffect } from "react";
import { List, Bell, Sun, Moon, Fire } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils/cn";

interface Props { onMenuClick: () => void }

export function DashboardTopBar({ onMenuClick }: Props) {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // Listen for new leads from the website form submissions
  useEffect(() => {
    const handler = () => {
      setNotifications((prev) => [
        `New lead received — ${new Date().toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}`,
        ...prev.slice(0, 4),
      ]);
    };
    window.addEventListener("iccb:new-lead", handler);
    return () => window.removeEventListener("iccb:new-lead", handler);
  }, []);

  return (
    <header className="h-14 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between px-5 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-soft)] transition-colors"
        >
          <List size={18} />
        </button>
        <span className="text-[var(--ink-muted)] text-[12px] hidden sm:block">
          Dashboard · Demo Mode
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative p-2 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-soft)] transition-colors"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 end-1.5 w-2 h-2 rounded-full bg-[var(--accent)]" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute end-0 top-full mt-1 w-72 bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-[var(--line)] flex items-center justify-between">
                <span className="text-[13px] font-medium text-[var(--ink)]">Notifications</span>
                {notifications.length > 0 && (
                  <button onClick={() => setNotifications([])} className="text-[11px] text-[var(--ink-muted)] hover:text-[var(--accent)]">
                    Clear all
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-[var(--ink-muted)] text-[13px]">
                  No new notifications
                </div>
              ) : (
                <div>
                  {notifications.map((n, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-[var(--line)] last:border-0">
                      <Fire size={14} className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
                      <span className="text-[13px] text-[var(--ink)]">{n}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--bg-soft)] transition-colors"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Demo badge */}
        <span className="text-[10px] uppercase tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-1 rounded-full font-medium">
          Demo
        </span>
      </div>
    </header>
  );
}
