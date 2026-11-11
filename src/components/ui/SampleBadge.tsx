import { cn } from "@/lib/utils/cn";

export function SampleBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium tracking-wider uppercase",
        "bg-[var(--color-brand-50)] text-[var(--color-brand-700)]",
        className
      )}
    >
      Sample
    </span>
  );
}
