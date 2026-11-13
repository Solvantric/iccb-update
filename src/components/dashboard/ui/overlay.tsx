"use client";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence } from "framer-motion";
import { Warning, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { m } from "./motion";
import { Button, Textarea } from "./core";

/* ─── Modal ──────────────────────────────────────────────────────────────── */

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const w = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div className="fixed inset-0 z-[80] bg-[#2B2A2E]/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <m.div
                className={cn("crm fixed left-1/2 top-1/2 z-[81] w-[calc(100vw-24px)] rounded-2xl border border-crm-line bg-crm-surface shadow-[var(--crm-shadow-lg)] flex flex-col max-h-[calc(100vh-40px)]", w)}
                initial={{ opacity: 0, scale: 0.96, y: "-48%", x: "-50%" }}
                animate={{ opacity: 1, scale: 1, y: "-50%", x: "-50%" }}
                exit={{ opacity: 0, scale: 0.97, y: "-48%", x: "-50%" }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              >
                <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-3">
                  <div>
                    <Dialog.Title className="text-[16px] font-semibold text-crm-ink">{title}</Dialog.Title>
                    {description ? <Dialog.Description className="mt-1 text-[13px] text-crm-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</Dialog.Description>}
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Close">
                      <X size={16} />
                    </Button>
                  </Dialog.Close>
                </div>
                <div className="px-5 pb-5 overflow-y-auto crm-scroll">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-crm-line px-5 py-3 bg-crm-surface-2 rounded-b-2xl">{footer}</div>}
              </m.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/* ─── Drawer (slides from the right; left in RTL) ────────────────────────── */

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = 520,
  headerExtra,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  headerExtra?: React.ReactNode;
}) {
  const rtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const from = rtl ? "-100%" : "100%";
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div className="fixed inset-0 z-[70] bg-[#2B2A2E]/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <m.aside
                className="crm fixed top-0 end-0 z-[71] flex h-full w-full flex-col border-s border-crm-line bg-crm-surface shadow-[var(--crm-shadow-lg)]"
                style={{ maxWidth: width }}
                initial={{ x: from }}
                animate={{ x: 0 }}
                exit={{ x: from }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
              >
                <div className="flex items-start justify-between gap-4 border-b border-crm-line px-5 py-4">
                  <div className="min-w-0">
                    <Dialog.Title className="text-[16px] font-semibold text-crm-ink truncate">{title}</Dialog.Title>
                    {description ? <Dialog.Description className="mt-0.5 text-[12.5px] text-crm-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">Details</Dialog.Description>}
                    {headerExtra}
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Close">
                      <X size={16} />
                    </Button>
                  </Dialog.Close>
                </div>
                <div className="flex-1 overflow-y-auto crm-scroll px-5 py-5">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-crm-line bg-crm-surface-2 px-5 py-3">{footer}</div>}
              </m.aside>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/* ─── Confirm dialog (promise-based) ─────────────────────────────────────── */

interface ConfirmOpts {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  /** Ask for a written reason; the promise resolves with it. */
  reason?: { label: string; placeholder?: string; required?: boolean };
}
type ConfirmResult = { ok: boolean; reason?: string };
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<ConfirmResult>>(async () => ({ ok: false }));

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const [reason, setReason] = useState("");
  const resolver = useRef<((r: ConfirmResult) => void) | null>(null);

  const confirm = useCallback((o: ConfirmOpts) => {
    setReason("");
    setOpts(o);
    return new Promise<ConfirmResult>((res) => {
      resolver.current = res;
    });
  }, []);

  const close = (ok: boolean) => {
    resolver.current?.({ ok, reason: reason.trim() || undefined });
    resolver.current = null;
    setOpts(null);
  };

  const needReason = !!opts?.reason?.required && !reason.trim();

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal
        open={!!opts}
        onOpenChange={(v) => !v && close(false)}
        size="sm"
        title={
          <span className="flex items-center gap-2">
            {opts?.tone === "danger" && <Warning size={18} weight="fill" className="text-[#D92D20]" />}
            {opts?.title}
          </span>
        }
        description={opts?.description}
        footer={
          <>
            <Button onClick={() => close(false)}>Cancel</Button>
            <Button variant={opts?.tone === "danger" ? "danger" : "primary"} disabled={needReason} onClick={() => close(true)}>
              {opts?.confirmLabel ?? "Confirm"}
            </Button>
          </>
        }
      >
        {opts?.reason && (
          <label className="block">
            <span className="mb-1.5 block text-[12.5px] font-medium text-crm-ink-2">
              {opts.reason.label}
              {opts.reason.required && <span className="text-crm-brand"> *</span>}
            </span>
            <Textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} placeholder={opts.reason.placeholder} />
          </label>
        )}
      </Modal>
    </ConfirmCtx.Provider>
  );
}

export const useConfirm = () => useContext(ConfirmCtx);
