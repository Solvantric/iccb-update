import Image from "next/image";
import type { clientLogos } from "@/data/expo";

type Partner = (typeof clientLogos)[number];

/** White logo tile used in partner marquees; falls back to a text badge when no logo file exists. */
export function PartnerLogo({ logo }: { logo: Partner }) {
  return (
    <div
      title={logo.name}
      className="group/logo flex-shrink-0 h-16 w-[148px] px-4 rounded-[var(--radius-card)] border border-[var(--line)] bg-white flex items-center justify-center cursor-default transition-all duration-300 hover:border-[var(--accent)] hover:shadow-[var(--shadow-card)]"
    >
      {logo.logo ? (
        <span className="relative block h-10 w-full">
          <Image
            src={logo.logo}
            alt={logo.name}
            fill
            sizes="148px"
            unoptimized={logo.logo.endsWith(".svg")}
            className="object-contain grayscale-[35%] opacity-90 transition-all duration-300 group-hover/logo:grayscale-0 group-hover/logo:opacity-100"
          />
        </span>
      ) : (
        <span className="text-[13px] font-bold tracking-[0.04em]" style={{ color: logo.color }}>
          {logo.abbr}
        </span>
      )}
    </div>
  );
}
