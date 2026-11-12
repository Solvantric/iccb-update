import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  /** Small red label above the title, e.g. "Featured Venues" */
  eyebrow: string;
  /** First (black) line of the title */
  title: React.ReactNode;
  /** Second line rendered in brand red */
  highlight?: React.ReactNode;
  /** Optional short description under the title */
  description?: React.ReactNode;
  className?: string;
}

/**
 * Centered section heading — matches the bashundharaphcpile.com "Applications" block:
 * red tracked eyebrow + 3px bar, Oswald uppercase title with a red second line.
 */
export function SectionHeading({ eyebrow, title, highlight, description, className }: SectionHeadingProps) {
  return (
    <div className={cn("mx-auto max-w-[56rem] text-center", className)}>
      <div className="flex flex-col items-center">
        <p className="flex items-center gap-5">
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--accent)] sm:text-[0.9375rem] rtl:tracking-normal">
            {eyebrow}
          </span>
        </p>
        <span aria-hidden="true" className="mt-2.5 block h-[3px] w-14 bg-[var(--accent)]" />
      </div>
      <h2 className="mt-6 font-display text-3xl font-bold uppercase leading-[1.1] text-[var(--ink)] lg:text-[4.25rem] rtl:normal-case">
        {title}
        {highlight && (
          <>
            <br />
            <span className="text-[var(--accent)]">{highlight}</span>
          </>
        )}
      </h2>
      {description && <p className="mt-4 text-base text-[var(--ink-body)]">{description}</p>}
    </div>
  );
}
