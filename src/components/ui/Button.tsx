import { cn } from "@/lib/utils/cn";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline-dark";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  withArrow?: boolean;
  asChild?: boolean;
}

const base = "inline-flex items-center justify-center gap-2 font-sans font-bold tracking-[0.08em] uppercase transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] text-[var(--on-accent)] rounded-[var(--radius-btn)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px hover:gap-3",
  secondary: "border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] hover:bg-[var(--accent)] hover:text-[var(--on-accent)] hover:gap-3",
  ghost: "text-[var(--ink)] underline-offset-4 hover:underline",
  "outline-dark": "border-2 border-white/40 text-white rounded-[var(--radius-btn)] hover:border-white hover:bg-white/10 hover:gap-3",
};

const sizes: Record<string, string> = {
  sm: "text-[11px] h-10 px-5",
  md: "text-[11px] h-12 px-7",
  lg: "text-[13px] h-14 px-9",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  withArrow = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
      {withArrow && <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-1" />}
    </button>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  withArrow = false,
  className,
  ...props
}: Omit<ButtonProps, "asChild"> & { href: string; target?: string; rel?: string }) {
  return (
    <a
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
    >
      {children}
      {withArrow && <ArrowRight size={14} weight="bold" />}
    </a>
  );
}
