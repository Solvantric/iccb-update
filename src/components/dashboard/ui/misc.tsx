"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CaretDown, Check, FilePdf, Paperclip, Trash, UploadSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { m } from "./motion";
import { Button, type Option } from "./core";

/* ─── Combobox (searchable select) ───────────────────────────────────────── */

export function Combobox({ value, onChange, options, placeholder = "Select…", className, emptyText = "No results" }: { value?: string; onChange: (v: string) => void; options: (Option & { hint?: string })[]; placeholder?: string; className?: string; emptyText?: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);
  const filtered = useMemo(() => (q ? options.filter((o) => `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q.toLowerCase())) : options).slice(0, 60), [q, options]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex h-9 w-full items-center justify-between gap-2 rounded-[8px] border border-crm-line bg-crm-surface px-3 text-start text-[13.5px] text-crm-ink hover:border-crm-muted/40">
        <span className={cn("truncate", !current && "text-crm-muted")}>{current?.label ?? placeholder}</span>
        <CaretDown size={14} className="text-crm-muted" />
      </button>
      <AnimatePresence>
        {open && (
          <m.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute z-30 mt-1 w-full min-w-[220px] rounded-xl border border-crm-line bg-crm-surface p-1.5 shadow-[var(--crm-shadow-lg)]">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="mb-1 h-8 w-full rounded-md border border-crm-line bg-crm-surface-2 px-2.5 text-[13px] text-crm-ink focus:outline-none" />
            <div className="max-h-60 overflow-y-auto crm-scroll">
              {filtered.length === 0 && <p className="px-2 py-3 text-[12.5px] text-crm-muted">{emptyText}</p>}
              {filtered.map((o) => (
                <button
                  type="button"
                  key={o.value}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQ("");
                  }}
                  className={cn("flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-[13px] hover:bg-crm-surface-2", o.value === value ? "text-crm-brand" : "text-crm-ink")}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{o.label}</span>
                    {o.hint && <span className="block truncate text-[11.5px] text-crm-muted">{o.hint}</span>}
                  </span>
                  {o.value === value && <Check size={14} />}
                </button>
              ))}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── File upload (stored as data URL) ───────────────────────────────────── */

export function FileUpload({ value, fileName, onChange, accept = "image/*,application/pdf", label = "Upload file" }: { value?: string; fileName?: string; onChange: (dataUrl: string | undefined, name?: string) => void; accept?: string; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const read = (f?: File) => {
    if (!f) return;
    if (f.size > 1.5 * 1024 * 1024) {
      alert("Please choose a file under 1.5 MB (demo storage limit).");
      return;
    }
    const r = new FileReader();
    r.onload = () => onChange(String(r.result), f.name);
    r.readAsDataURL(f);
  };
  if (value) {
    const isImg = value.startsWith("data:image");
    return (
      <div className="flex items-center gap-3 rounded-xl border border-crm-line bg-crm-surface-2 p-2.5">
        {isImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={fileName ?? "Uploaded file"} className="h-12 w-12 rounded-md object-cover" />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-md bg-crm-tint text-crm-brand">
            <FilePdf size={24} weight="duotone" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-crm-ink">{fileName ?? "File"}</p>
          <a href={value} target="_blank" rel="noreferrer" download={fileName} className="text-[12px] text-crm-brand hover:underline">
            Preview
          </a>
        </div>
        <Button size="icon-sm" variant="ghost" onClick={() => onChange(undefined)} aria-label="Remove file">
          <Trash size={15} />
        </Button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        read(e.dataTransfer.files[0]);
      }}
      className={cn("flex w-full items-center gap-3 rounded-xl border border-dashed px-3 py-3 text-start transition-colors", drag ? "border-crm-brand bg-crm-tint" : "border-crm-line hover:border-crm-muted/50 hover:bg-crm-surface-2")}
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-crm-surface-2 text-crm-muted">
        <UploadSimple size={18} />
      </span>
      <span>
        <span className="block text-[13px] font-medium text-crm-ink">{label}</span>
        <span className="block text-[12px] text-crm-muted">Image or PDF, up to 1.5 MB</span>
      </span>
      <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => read(e.target.files?.[0])} />
    </button>
  );
}

export { Paperclip };

/* ─── Signature pad ──────────────────────────────────────────────────────── */

export function SignaturePad({ value, onChange, height = 140 }: { value?: string; onChange: (dataUrl: string | undefined) => void; height?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = height * ratio;
    const ctx = c.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#2B2A2E";
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, c.offsetWidth, height);
      img.src = value;
    }
    // Only on mount — later strokes are drawn imperatively.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  return (
    <div>
      <canvas
        ref={canvas}
        style={{ height }}
        className="w-full touch-none rounded-xl border border-crm-line bg-white"
        onPointerDown={(e) => {
          drawing.current = true;
          const ctx = canvas.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.beginPath();
          ctx.moveTo(x, y);
          canvas.current!.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const ctx = canvas.current!.getContext("2d")!;
          const [x, y] = pos(e);
          ctx.lineTo(x, y);
          ctx.stroke();
          if (!dirty) setDirty(true);
        }}
        onPointerUp={() => {
          drawing.current = false;
          onChange(canvas.current!.toDataURL("image/png"));
        }}
      />
      <div className="mt-1.5 flex justify-between text-[12px] text-crm-muted">
        <span>Sign with mouse, pen or finger</span>
        <button
          type="button"
          className="text-crm-brand hover:underline"
          onClick={() => {
            const c = canvas.current!;
            c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
            setDirty(false);
            onChange(undefined);
          }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

/* ─── Confetti (tiny canvas burst; skipped with reduced motion) ─────────── */

export function fireConfetti(origin?: { x: number; y: number }) {
  if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.createElement("canvas");
  c.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:100";
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  document.body.appendChild(c);
  const ctx = c.getContext("2d")!;
  const ox = origin?.x ?? window.innerWidth / 2;
  const oy = origin?.y ?? window.innerHeight / 3;
  const colors = ["#E24F5F", "#F59E0B", "#12B76A", "#2E90FA", "#FCE3E6"];
  const parts = Array.from({ length: 90 }, () => ({
    x: ox,
    y: oy,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * -11 - 3,
    r: Math.random() * 360,
    vr: (Math.random() - 0.5) * 18,
    s: 4 + Math.random() * 5,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const start = performance.now();
  const tick = (t: number) => {
    const el = t - start;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const p of parts) {
      p.vy += 0.35;
      p.x += p.vx;
      p.y += p.vy;
      p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - el / 1600);
      ctx.translate(p.x, p.y);
      ctx.rotate((p.r * Math.PI) / 180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      ctx.restore();
    }
    if (el < 1600) requestAnimationFrame(tick);
    else c.remove();
  };
  requestAnimationFrame(tick);
}

/** Copy to clipboard with a fallback. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}
