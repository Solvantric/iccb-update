"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence } from "framer-motion";
import { DotsThree, X, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { m } from "./motion";
import { Button } from "./core";

/* ─── Media query ────────────────────────────────────────────────────────── */

const MQ = "(max-width: 639px)";
export function useIsMobile() {
  return useSyncExternalStore(
    (cb) => {
      const q = window.matchMedia(MQ);
      q.addEventListener("change", cb);
      return () => q.removeEventListener("change", cb);
    },
    () => window.matchMedia(MQ).matches,
    () => false
  );
}

/* ─── Modal (bottom sheet on mobile) ─────────────────────────────────────── */

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
  const mobile = useIsMobile();
  const w = { sm: "sm:max-w-md", md: "sm:max-w-lg", lg: "sm:max-w-2xl", xl: "sm:max-w-4xl" }[size];
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            </Dialog.Overlay>
            <div className="pointer-events-none fixed inset-0 z-[81] flex items-end justify-center sm:items-center sm:p-6">
              <Dialog.Content asChild forceMount>
                <m.div
                  className={cn(
                    "crm pointer-events-auto flex max-h-[92vh] w-full flex-col border border-crm-line bg-crm-surface shadow-[var(--crm-shadow-lg)] sm:max-h-[calc(100vh-48px)] sm:rounded-[var(--crm-radius)]",
                    "rounded-t-[16px]",
                    w
                  )}
                  initial={mobile ? { y: "100%" } : { opacity: 0, scale: 0.97 }}
                  animate={mobile ? { y: 0 } : { opacity: 1, scale: 1 }}
                  exit={mobile ? { y: "100%" } : { opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  {mobile && <span className="mx-auto mt-2 h-1 w-10 rounded-full bg-crm-line" />}
                  <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 sm:pt-5">
                    <div className="min-w-0">
                      <Dialog.Title className="text-[16px] font-semibold text-crm-ink">{title}</Dialog.Title>
                      {description ? <Dialog.Description className="mt-1 text-[13px] text-crm-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</Dialog.Description>}
                    </div>
                    <Dialog.Close asChild>
                      <Button variant="ghost" size="icon-sm" aria-label="Close">
                        <X size={16} />
                      </Button>
                    </Dialog.Close>
                  </div>
                  <div className="crm-scroll overflow-y-auto px-5 pb-5">{children}</div>
                  {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-crm-line px-5 py-3">{footer}</div>}
                </m.div>
              </Dialog.Content>
            </div>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/* ─── Drawer (slides in from the end edge) ───────────────────────────────── */

export function Drawer({ open, onOpenChange, title, description, children, footer }: { open: boolean; onOpenChange: (v: boolean) => void; title: React.ReactNode; description?: React.ReactNode; children?: React.ReactNode; footer?: React.ReactNode }) {
  const rtl = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const from = rtl ? "-100%" : "100%";
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <m.div className="fixed inset-0 z-[70] bg-black/30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <m.aside className="crm fixed top-0 end-0 z-[71] flex h-full w-full max-w-[460px] flex-col border-s border-crm-line bg-crm-surface shadow-[var(--crm-shadow-lg)]" initial={{ x: from }} animate={{ x: 0 }} exit={{ x: from }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                <div className="flex items-start justify-between gap-4 border-b border-crm-line px-5 py-4">
                  <div className="min-w-0">
                    <Dialog.Title className="truncate text-[16px] font-semibold text-crm-ink">{title}</Dialog.Title>
                    {description ? <Dialog.Description className="mt-0.5 text-[13px] text-crm-muted">{description}</Dialog.Description> : <Dialog.Description className="sr-only">Details</Dialog.Description>}
                  </div>
                  <Dialog.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Close">
                      <X size={16} />
                    </Button>
                  </Dialog.Close>
                </div>
                <div className="crm-scroll flex-1 overflow-y-auto px-5 py-5">{children}</div>
                {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-crm-line px-5 py-3">{footer}</div>}
              </m.aside>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

/* ─── Confirm (promise-based) ────────────────────────────────────────────── */

interface ConfirmOpts {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}
const ConfirmCtx = createContext<(o: ConfirmOpts) => Promise<boolean>>(async () => false);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const confirm = useCallback((o: ConfirmOpts) => {
    setOpts(o);
    return new Promise<boolean>((res) => {
      resolver.current = res;
    });
  }, []);
  const close = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOpts(null);
  };
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal
        open={!!opts}
        onOpenChange={(v) => !v && close(false)}
        size="sm"
        title={opts?.title}
        description={opts?.description}
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button variant={opts?.danger ? "danger" : "primary"} onClick={() => close(true)}>
              {opts?.confirmLabel ?? "Confirm"}
            </Button>
          </>
        }
      />
    </ConfirmCtx.Provider>
  );
}
export const useConfirm = () => useContext(ConfirmCtx);

/* ─── "⋯" menu ───────────────────────────────────────────────────────────── */

export interface MenuItem {
  label: string;
  icon?: Icon;
  onClick: () => void;
  danger?: boolean;
  hidden?: boolean;
}

export function Menu({ items, label = "More actions", trigger }: { items: MenuItem[]; label?: string; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const visible = items.filter((i) => !i.hidden);
  if (!visible.length) return null;
  return (
    <div ref={ref} className="relative">
      {trigger ? (
        <span onClick={() => setOpen((v) => !v)}>{trigger}</span>
      ) : (
        <Button variant="ghost" size="icon-sm" aria-label={label} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <DotsThree size={20} weight="bold" />
        </Button>
      )}
      <AnimatePresence>
        {open && (
          <m.div role="menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="absolute end-0 top-full z-40 mt-1 min-w-[180px] rounded-[10px] border border-crm-line bg-crm-surface p-1 shadow-[var(--crm-shadow-lg)]">
            {visible.map((i) => (
              <button
                key={i.label}
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false);
                  i.onClick();
                }}
                className={cn("flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-start text-[13.5px] transition-colors hover:bg-crm-surface-2", i.danger ? "text-crm-danger" : "text-crm-ink-2")}
              >
                {i.icon && <i.icon size={16} />}
                {i.label}
              </button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
