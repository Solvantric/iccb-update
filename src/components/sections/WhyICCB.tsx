import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { SectionLabel } from "@/components/ui/SectionLabel";
import {
  Car, Lightning, Thermometer, ForkKnife, Shield, Wheelchair, MapPin, Gauge,
} from "@phosphor-icons/react/dist/ssr";

const facilities = [
  { icon: Car, title: "2,000+ Parking Spaces", desc: "Dedicated on-site parking for large events, with security and valet service." },
  { icon: Lightning, title: "Full Power Backup", desc: "High-capacity generators ensure uninterrupted power throughout all events." },
  { icon: Thermometer, title: "Central Air Conditioning", desc: "Precision-controlled climate in all halls, keeping every event comfortable." },
  { icon: ForkKnife, title: "Own Modern Kitchen", desc: "State-of-the-art kitchen with strict quality-control from farm to table." },
  { icon: Shield, title: "24/7 Security", desc: "Professional security team, CCTV coverage, and controlled access throughout." },
  { icon: Wheelchair, title: "Fully Accessible", desc: "Wheelchair access, lifts, and accessible facilities across all venues." },
  { icon: MapPin, title: "Prime Location", desc: "On the 300 ft. Purbachal Express Highway, 25 km from Dhaka airport." },
  { icon: Gauge, title: "High-Speed Internet", desc: "Dedicated fiber-optic connectivity for conferences and hybrid events." },
];

export function WhyICCB() {
  return (
    <section className="bg-[var(--bg-soft)] py-[clamp(4rem,10vw,9rem)]">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        {/* Centered heading */}
        <div className="text-center max-w-2xl mx-auto mb-12 lg:mb-14">
          <RevealBlock>
            <SectionLabel>(FACILITIES)</SectionLabel>
          </RevealBlock>
          <RevealBlock delay={0.08}>
            <h2 className="display-lg text-[var(--ink)] mt-3 mb-5">
              WHY CHOOSE <span className="text-[var(--accent)]">ICCB</span>
            </h2>
          </RevealBlock>
          <RevealBlock delay={0.12}>
            <span aria-hidden="true" className="block h-[3px] w-14 bg-[var(--accent)] mx-auto mb-5" />
            <p className="text-[var(--ink-body)] text-[16px] leading-relaxed">
              Every detail is designed to make your event flawless. World-class infrastructure, professional staff, and comprehensive services — all in one iconic location.
            </p>
          </RevealBlock>
        </div>

        {/* Compact facility grid — 4 per row, 2 rows on desktop */}
        <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto">
          {facilities.map((f, i) => (
            <RevealItem key={f.title}>
              <div className="group relative h-full text-center bg-[var(--surface)] border border-[var(--line)] px-4 py-6 md:px-5 md:py-7 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-[var(--shadow-card)] hover:border-[var(--accent)]/40">
                <span className="absolute top-3 end-4 text-[11px] font-semibold tracking-wider text-[var(--ink-muted)]/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="icon-chip !w-11 !h-11 mx-auto mb-4">
                  <f.icon size={22} weight="duotone" />
                </span>
                <h3 className="text-[var(--ink)] font-bold uppercase tracking-[0.02em] text-[13px] md:text-[14px] leading-snug mb-2">{f.title}</h3>
                <span aria-hidden="true" className="block h-[2px] w-8 bg-[var(--accent)] mx-auto mb-2.5 transition-all duration-500 group-hover:w-14" />
                <p className="text-[var(--ink-muted)] text-[12px] md:text-[13px] leading-relaxed">{f.desc}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
