"use client";
import { useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardTopBar } from "./DashboardTopBar";
import { ToastProvider } from "@/components/ui/Toast";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ToastProvider>
      <div className="flex h-screen bg-[var(--bg)] overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((v) => !v)} />

        {/* Main area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <DashboardTopBar onMenuClick={() => setSidebarOpen((v) => !v)} />
          <main className="flex-1 overflow-y-auto p-5 md:p-7">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
