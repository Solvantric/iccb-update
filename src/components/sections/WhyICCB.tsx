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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left sticky text */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <RevealBlock>
              <SectionLabel>(FACILITIES)</SectionLabel>
            </RevealBlock>
            <RevealBlock delay={0.08}>
              <h2 className="display-lg text-[var(--ink)] mt-3 mb-6">
                WHY CHOOSE ICCB
              </h2>
            </RevealBlock>
            <RevealBlock delay={0.12}>
              <p className="text-[var(--ink-muted)] text-[16px] leading-relaxed max-w-md">
                Every detail is designed to make your event flawless. World-class infrastructure, professional staff, and comprehensive services — all in one iconic location.
              </p>
            </RevealBlock>
          </div>

          {/* Right: facility grid */}
          <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {facilities.map((f) => (
              <RevealItem key={f.title}>
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius-card)] p-5 hover:border-[var(--accent)] transition-colors group">
                  <f.icon
                    size={24}
                    weight="light"
                    className="text-[var(--accent)] mb-3 group-hover:scale-110 transition-transform"
                  />
                  <h3 className="text-[var(--ink)] font-medium text-[15px] mb-1">{f.title}</h3>
                  <p className="text-[var(--ink-muted)] text-[13px] leading-relaxed">{f.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
