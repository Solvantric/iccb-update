"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKey } from "@phosphor-icons/react";
import { useCrmReady } from "@/components/providers/CrmProvider";
import { useCurrentUser } from "@/lib/crm/db";
import { canSeePath } from "@/lib/crm/permissions";
import { ROLE_LABELS } from "@/types/crm";
import { m } from "../ui/motion";
import { Button, EmptyState, Skeleton } from "../ui/core";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

function NoAccess() {
  const user = useCurrentUser();
  return (
    <div className="crm-card mx-auto mt-10 max-w-lg">
      <EmptyState
        icon={LockKey}
        text={`The ${ROLE_LABELS[user.role]} role can't open this page.`}
        action={
          <Link href="/dashboard">
            <Button variant="primary">Back to overview</Button>
          </Link>
        }
      />
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex h-screen">
      <div className="hidden w-[240px] border-e border-crm-line bg-crm-surface p-5 lg:block">
        <Skeleton className="mb-8 h-9 w-32" />
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-8 w-full" />
        ))}
      </div>
      <div className="flex-1">
        <div className="h-16 border-b border-crm-line bg-crm-surface" />
        <div className="mx-auto max-w-[1400px] p-4 md:p-8">
          <Skeleton className="mb-2 h-7 w-48" />
          <Skeleton className="mb-8 h-4 w-72" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const ready = useCrmReady();
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);
  if (!ready) return <ShellSkeleton />;
  return (
    <ShellInner pathname={pathname} mobileNav={mobileNav} setMobileNav={setMobileNav}>
      {children}
    </ShellInner>
  );
}

function ShellInner({ children, pathname, mobileNav, setMobileNav }: { children: React.ReactNode; pathname: string; mobileNav: boolean; setMobileNav: (v: boolean) => void }) {
  const user = useCurrentUser();
  const allowed = canSeePath(user.role, pathname);
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar mobileOpen={mobileNav} onMobileClose={() => setMobileNav(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobileNav(true)} />
        <main className="crm-scroll flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 pb-24 md:px-8 md:py-8">
            {/* Fade + 8px rise on route change. */}
            <m.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              {allowed ? children : <NoAccess />}
            </m.div>
          </div>
        </main>
      </div>
    </div>
  );
}
