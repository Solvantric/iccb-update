"use client";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import { CalendarPlus, ChatCircleText, CheckSquare, UserPlus } from "@phosphor-icons/react";
import { useRole } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { m } from "../ui/motion";
import { ClientFormModal, EnquiryFormModal, TaskFormModal } from "../forms/QuickForms";

type Kind = "client" | "task" | "enquiry" | null;
export const useQuickCreate = create<{ open: Kind; key: number; show: (k: Kind) => void }>((set) => ({
  open: null,
  key: 0,
  show: (open) => set((s) => ({ open, key: s.key + 1 })),
}));

export function QuickCreateMenu({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const role = useRole();
  const show = useQuickCreate((s) => s.show);
  const items = [
    { icon: CalendarPlus, label: "Booking", hint: "Walk-in / phone client", allowed: can(role, "create", "bookings"), run: () => router.push("/dashboard/sales/bookings/new") },
    { icon: UserPlus, label: "Client", hint: "Add to the client list", allowed: can(role, "create", "clients"), run: () => show("client") },
    { icon: CheckSquare, label: "Task", hint: "Call, meeting, reminder", allowed: true, run: () => show("task") },
    { icon: ChatCircleText, label: "Enquiry", hint: "Phone / WhatsApp enquiry", allowed: can(role, "create", "enquiries") || can(role, "view", "enquiries"), run: () => show("enquiry") },
  ].filter((i) => i.allowed);
  return (
    <m.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} className="absolute end-0 top-11 z-50 w-64 rounded-xl border border-crm-line bg-crm-surface p-1.5 shadow-[var(--crm-shadow-lg)]">
      {items.map(({ icon: I, label, hint, run }) => (
        <button
          key={label}
          onClick={() => {
            onClose();
            run();
          }}
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-start hover:bg-crm-surface-2"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-crm-tint text-crm-brand">
            <I size={17} weight="duotone" />
          </span>
          <span>
            <span className="block text-[13.5px] font-medium text-crm-ink">{label}</span>
            <span className="block text-[12px] text-crm-muted">{hint}</span>
          </span>
        </button>
      ))}
    </m.div>
  );
}

/** Mounted once in the shell; modals keyed so each open starts fresh. */
export function QuickCreateModals() {
  const { open, key, show } = useQuickCreate();
  const close = (v: boolean) => !v && show(null);
  return (
    <>
      {open === "client" && <ClientFormModal key={key} open onOpenChange={close} />}
      {open === "task" && <TaskFormModal key={key} open onOpenChange={close} />}
      {open === "enquiry" && <EnquiryFormModal key={key} open onOpenChange={close} />}
    </>
  );
}
