"use client";
import { useEffect, useState } from "react";
import { runAutomations } from "@/services/crm/features.service";
import { MatchmakerDrawer } from "../features/Matchmaker";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKey } from "@phosphor-icons/react";
import { useCrmReady } from "@/components/providers/CrmProvider";
import { useCurrentUser, useSession } from "@/lib/crm/db";
import { canSeePath } from "@/lib/crm/permissions";
import { ROLE_LABELS } from "@/types/crm";
import { m } from "../ui/motion";
import { Button, EmptyState, Skeleton } from "../ui/core";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "./CommandPalette";
import { QuickCreateModals } from "./QuickCreate";
import { NotificationToaster } from "./Notifications";

export function NoAccess() {
  const user = useCurrentUser();
  return (
    <div className="crm-card mx-auto mt-10 max-w-lg">
      <EmptyState
        icon={LockKey}
        title="No access"
        description={`Your role (${ROLE_LABELS[user.role]}) can't open this page. Switch role from the avatar menu to preview other views.`}
        action={
          <Link href="/dashboard">
            <Button variant="primary">Back to dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="flex h-screen">
      <div className="hidden w-[264px] border-e border-crm-line bg-crm-surface p-5 lg:block">
        <Skeleton className="mb-8 h-10 w-36" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="mb-3 h-7 w-full" />
        ))}
      </div>
      <div className="flex-1">
        <div className="h-16 border-b border-crm-line bg-crm-surface" />
        <div className="mx-auto max-w-[1600px] p-6">
          <Skeleton className="mb-2 h-7 w-56" />
          <Skeleton className="mb-8 h-4 w-80" />
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
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
  const [palette, setPalette] = useState(false);
  const lang = useSession((s) => s.lang);

  if (!ready) return <ShellSkeleton />;
  return <ShellInner pathname={pathname} mobileNav={mobileNav} setMobileNav={setMobileNav} palette={palette} setPalette={setPalette} lang={lang}>{children}</ShellInner>;
}

function ShellInner({ children, pathname, mobileNav, setMobileNav, palette, setPalette, lang }: { children: React.ReactNode; pathname: string; mobileNav: boolean; setMobileNav: (v: boolean) => void; palette: boolean; setPalette: (v: boolean) => void; lang: string }) {
  const user = useCurrentUser();
  const allowed = canSeePath(user.role, pathname);
  // Readiness milestones, risk escalation and vendor-review tasks (once per session).
  useEffect(() => {
    runAutomations();
  }, []);
  return (
    <div className="flex h-screen overflow-hidden" lang={lang}>
      <Sidebar mobileOpen={mobileNav} onMobileClose={() => setMobileNav(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setMobileNav(true)} onSearch={() => setPalette(true)} />
        <main className="crm-scroll flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 pb-24 md:px-6 md:pb-10">
            {/* Enter-only transition: App Router swaps children immediately, so no exit animation. */}
            <m.div key={pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
              {allowed ? children : <NoAccess />}
            </m.div>
          </div>
        </main>
      </div>
      <CommandPalette open={palette} onOpenChange={setPalette} />
      <QuickCreateModals />
      <MatchmakerDrawer />
      <NotificationToaster />
    </div>
  );
}
