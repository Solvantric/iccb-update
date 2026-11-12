import { cn } from "@/lib/utils/cn";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}

export function SectionLabel({ children, className, light }: SectionLabelProps) {
  return (
    <span
      className={cn(
        "text-eyebrow",
        light && "text-white/80",
        className
      )}
    >
      {children}
    </span>
  );
}
