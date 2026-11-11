"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Warning, Info, X, XCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const STYLES: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: "bg-emerald-600",
    icon: "text-white",
    border: "border-emerald-500",
  },
  error: {
    bg: "bg-rose-600",
    icon: "text-white",
    border: "border-rose-500",
  },
  warning: {
    bg: "bg-amber-500",
    icon: "text-white",
    border: "border-amber-400",
  },
  info: {
    bg: "bg-sky-600",
    icon: "text-white",
    border: "border-sky-500",
  },
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} weight="fill" />,
  error: <XCircle size={20} weight="fill" />,
  warning: <Warning size={20} weight="fill" />,
  info: <Info size={20} weight="fill" />,
};

function ToastItem({ t, onClose }: { t: Toast; onClose: () => void }) {
  const s = STYLES[t.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex items-start gap-3 min-w-[280px] max-w-[380px] rounded-xl px-4 py-3.5 shadow-2xl border",
        s.bg, s.border
      )}
    >
      <span className={cn("mt-0.5 shrink-0", s.icon)}>{ICONS[t.type]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-white text-[13px] font-semibold leading-snug">{t.title}</p>
        {t.message && (
          <p className="text-white/80 text-[12px] mt-0.5 leading-snug">{t.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 text-white/70 hover:text-white transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        <X size={15} weight="bold" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (opts: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev.slice(-4), { ...opts, id }]);
      const timer = setTimeout(() => dismiss(id), 4500);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const ctx: ToastContextValue = {
    toast: show,
    success: (title, message) => show({ type: "success", title, message }),
    error: (title, message) => show({ type: "error", title, message }),
    warning: (title, message) => show({ type: "warning", title, message }),
    info: (title, message) => show({ type: "info", title, message }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 end-6 z-[200] flex flex-col gap-2 items-end pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem t={t} onClose={() => dismiss(t.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
