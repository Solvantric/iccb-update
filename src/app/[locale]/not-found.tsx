import { Link } from "@/lib/i18n/navigation";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <span className="font-display text-[120px] text-[var(--accent)] font-light leading-none opacity-20">404</span>
        <h1 className="font-display text-3xl text-[var(--ink)] font-light uppercase -mt-4 mb-4">Page Not Found</h1>
        <p className="text-[var(--ink-muted)] text-[15px] mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[var(--accent)] text-white rounded-full px-7 py-3.5 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--accent-hover)] transition-colors"
          >
            Go Home
            <ArrowRight size={13} weight="bold" />
          </Link>
          <Link
            href="/venues"
            className="inline-flex items-center gap-2 border border-[var(--ink)] text-[var(--ink)] rounded-full px-7 py-3.5 text-[12px] font-medium tracking-[0.12em] uppercase hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors"
          >
            Explore Venues
          </Link>
        </div>
      </div>
    </div>
  );
}
