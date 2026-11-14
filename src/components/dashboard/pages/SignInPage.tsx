"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Briefcase, Crown, Megaphone, Wrench, type Icon } from "@phosphor-icons/react";
import type { Role } from "@/types/crm";
import { ROLE_LABELS } from "@/types/crm";
import { db, useSession } from "@/lib/crm/db";
import { useCrmReady } from "@/components/providers/CrmProvider";
import { Item, Stagger, m } from "../ui/motion";
import { Avatar, Skeleton } from "../ui/core";
import { LOGO } from "../shell/Sidebar";

const ROLE_INFO: Record<Role, { icon: Icon; desc: string }> = {
  admin: { icon: Crown, desc: "Everything, including rates, users and settings." },
  sales: { icon: Briefcase, desc: "Leads, bookings, clients, calendar, payments and PPM." },
  operations: { icon: Wrench, desc: "Event-day board, PPM meetings, quality and damage claims." },
  marketing: { icon: Megaphone, desc: "Analytics, Opportunity Radar, demand and website content." },
};

/** Demo sign-in: pick a role. Not real authentication. */
export function SignInPage() {
  const ready = useCrmReady();
  const router = useRouter();
  const setUser = useSession((s) => s.setUser);
  const users = db.users.store((s) => s.items);

  return (
    <div className="flex min-h-screen items-center justify-center bg-crm-bg px-4 py-12">
      <div className="w-full max-w-4xl">
        <m.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <div className="relative mx-auto mb-4 h-14 w-14">
            <Image src={LOGO} alt="ICCB" fill sizes="56px" className="object-contain" />
          </div>
          <h1 className="text-[24px] font-semibold text-crm-ink">Sign in to ICCB</h1>
          <p className="mt-1 text-[14px] text-crm-muted">Demo mode — choose a role to continue.</p>
        </m.div>
        {!ready ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(ROLE_INFO) as Role[]).map((role) => {
              const u = users.find((x) => x.role === role && x.active);
              if (!u) return null;
              const { icon: I, desc } = ROLE_INFO[role];
              return (
                <Item key={role}>
                  <button
                    type="button"
                    onClick={() => {
                      setUser(u.id);
                      router.push("/dashboard");
                    }}
                    className="group crm-card crm-card-hover flex h-full w-full flex-col p-5 text-start"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-crm-tint text-crm-brand-text">
                        <I size={20} />
                      </span>
                      <ArrowRight size={16} className="text-crm-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                    </div>
                    <p className="mt-4 text-[15px] font-semibold text-crm-ink">{ROLE_LABELS[role]}</p>
                    <p className="mt-1 flex-1 text-[13px] text-crm-muted">{desc}</p>
                    <div className="mt-4 flex items-center gap-2 border-t border-crm-line pt-3">
                      <Avatar name={u.name} size={24} />
                      <span className="text-[12.5px] text-crm-ink-2">{u.name}</span>
                    </div>
                  </button>
                </Item>
              );
            })}
          </Stagger>
        )}
        <p className="mt-8 text-center text-[12px] text-crm-muted">All data is sample data stored in this browser.</p>
      </div>
    </div>
  );
}
