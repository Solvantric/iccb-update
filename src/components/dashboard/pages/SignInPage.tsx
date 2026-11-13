"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Briefcase, ChartLineUp, Crown, Megaphone, Receipt, Wrench, type Icon } from "@phosphor-icons/react";
import type { Role } from "@/types/crm";
import { ROLE_LABELS } from "@/types/crm";
import { db, useSession } from "@/lib/crm/db";
import { useCrmReady } from "@/components/providers/CrmProvider";
import { m, Stagger, Item } from "../ui/motion";
import { Avatar, Skeleton } from "../ui/core";

const ROLE_INFO: Record<Role, { icon: Icon; desc: string }> = {
  admin: { icon: Crown, desc: "Everything: settings, pricing, users, overrides and data tools." },
  sales_manager: { icon: ChartLineUp, desc: "All sales, approvals for discounts, confirmations and date shifts." },
  sales_executive: { icon: Briefcase, desc: "Own bookings, clients, enquiries, follow-ups and invoices." },
  marketing: { icon: Megaphone, desc: "Leads, analytics, Opportunity Radar, demand pricing and website CMS." },
  operations: { icon: Wrench, desc: "Event board, PPM minutes, fact sheets, evaluations and damage claims." },
  accounts: { icon: Receipt, desc: "Money receipts, invoices and security-money refunds." },
};

export function SignInPage() {
  const ready = useCrmReady();
  const router = useRouter();
  const setUser = useSession((s) => s.setUser);
  const users = db.users.store((s) => s.items);
  const byRole = (r: Role) => users.find((u) => u.role === r && u.active && !u.deletedAt);

  return (
    <div className="relative min-h-screen overflow-hidden bg-crm-bg">
      <div className="pointer-events-none absolute -top-40 end-[-10%] h-[520px] w-[520px] rounded-full bg-crm-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 start-[-10%] h-[420px] w-[420px] rounded-full bg-crm-brand/5 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12">
        <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <div className="relative mx-auto mb-5 h-16 w-16">
            <Image src="https://res.cloudinary.com/sgufp9aq/image/upload/v1794418824/iccb-logo.png" alt="ICCB" fill sizes="64px" className="object-contain" />
          </div>
          <h1 className="text-[28px] font-bold tracking-[-0.01em] text-crm-ink">Sign in to ICCB CRM</h1>
          <p className="mx-auto mt-2 max-w-lg text-[14px] text-crm-muted">Demo mode — pick a role to see its view. You can switch roles any time from the avatar menu.</p>
        </m.div>

        {!ready ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.05}>
            {(Object.keys(ROLE_INFO) as Role[]).map((role) => {
              const u = byRole(role);
              const { icon: I, desc } = ROLE_INFO[role];
              if (!u) return null;
              return (
                <Item key={role}>
                  <button
                    onClick={() => {
                      setUser(u.id);
                      router.push("/dashboard");
                    }}
                    className="group crm-card flex h-full w-full flex-col p-5 text-start transition-all hover:-translate-y-0.5 hover:border-crm-brand/40 hover:shadow-[var(--crm-shadow-lg)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-crm-tint text-crm-brand transition-colors group-hover:bg-crm-brand group-hover:text-white">
                        <I size={22} weight="duotone" />
                      </span>
                      <ArrowRight size={18} className="text-crm-muted transition-transform group-hover:translate-x-1 group-hover:text-crm-brand rtl:rotate-180" />
                    </div>
                    <p className="mt-4 text-[16px] font-semibold text-crm-ink">{ROLE_LABELS[role]}</p>
                    <p className="mt-1 flex-1 text-[13px] text-crm-muted">{desc}</p>
                    <div className="mt-4 flex items-center gap-2 border-t border-crm-line pt-3">
                      <Avatar name={u.name} color={u.color} size={24} />
                      <span className="text-[12.5px] text-crm-ink-2">{u.name}</span>
                    </div>
                  </button>
                </Item>
              );
            })}
          </Stagger>
        )}
        <p className="mt-10 text-center text-[12px] text-crm-muted">All data is sample data stored in this browser. No real client information.</p>
      </div>
    </div>
  );
}
