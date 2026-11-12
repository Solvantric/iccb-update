import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { RevealGroup, RevealItem } from "@/components/motion/RevealBlock";

export function StatsStrip() {
  return (
    <section className="bg-[var(--bg-soft)] py-12 md:py-16 border-b border-[var(--line)]">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        <RevealGroup className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
          {[
            { counter: 4, suffix: "", label: "Convention halls", prefix: "" },
            { counter: 10000, suffix: "+", label: "Guests at a time", prefix: "" },
            { counter: 2015, suffix: "", label: "Operating since", prefix: "" },
            { counter: 1, suffix: "", label: "Expo Village", prefix: "" },
          ].map((stat, i) => (
            <RevealItem key={i} className="text-center md:border-e last:border-0 border-[var(--line)] px-4">
              <div className="font-display text-5xl md:text-6xl text-[var(--accent)] font-semibold leading-none mb-2">
                <AnimatedCounter
                  to={stat.counter}
                  suffix={stat.suffix}
                  prefix={stat.prefix}
                />
              </div>
              <p className="meta-label">{stat.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
