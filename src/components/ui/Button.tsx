import { cn } from "@/lib/utils/cn";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

type ButtonVariant = "primary" | "secondary" | "ghost" | "outline-dark";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  withArrow?: boolean;
  asChild?: boolean;
}

const base = "inline-flex items-center justify-center gap-2 font-sans font-medium tracking-[0.12em] uppercase transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-[var(--accent)] text-[var(--on-accent)] rounded-full hover:bg-[var(--accent-hover)] hover:gap-3",
  secondary: "border border-[var(--ink)] text-[var(--ink)] rounded-full hover:bg-[var(--ink)] hover:text-[var(--bg)] hover:gap-3",
  ghost: "text-[var(--ink)] underline-offset-4 hover:underline",
  "outline-dark": "border border-white/30 text-white rounded-full hover:border-white hover:bg-white/10 hover:gap-3",
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
