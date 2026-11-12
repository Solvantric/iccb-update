import { RevealBlock } from "@/components/motion/RevealBlock";
import { MapPin, Clock, ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";

export function GettingHere() {
  const mapUrl = "https://www.google.com/maps/place/International+Convention+City+Bashundhara/";

  return (
    <section className="bg-[var(--bg-soft)] py-[clamp(4rem,10vw,9rem)]">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        <RevealBlock className="text-center mb-10">
          <span className="meta-label block mb-3">(LOCATION)</span>
          <h2 className="display-md text-[var(--ink)]">GETTING HERE</h2>
        </RevealBlock>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Map */}
          <RevealBlock>
            <div className="aspect-[4/3] bg-[var(--surface)] border border-[var(--line)] rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3649.137!2d90.4260!3d23.8259!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3755c7a95b800001%3A0xbdc4e3e282fafe29!2sInternational%20Convention%20City%20Bashundhara!5e0!3m2!1sen!2sbd!4v1"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                title="ICCB location map"
              />
            </div>
          </RevealBlock>

          {/* Info */}
          <RevealBlock delay={0.1} className="space-y-6">
            <div>
              <span className="meta-label block mb-2">Address</span>
              <div className="flex gap-3">
                <MapPin size={18} className="text-[var(--accent)] mt-0.5 flex-shrink-0" weight="light" />
                <p className="text-[var(--ink)] text-[15px] leading-relaxed">
                  Kuril Bishwa Road, Next to 300 ft. Purbachal Express Highway<br />
                  Bashundhara, Dhaka 1229, Bangladesh
                </p>
              </div>
            </div>

            <div>
              <span className="meta-label block mb-2">Office Hours</span>
              <div className="flex gap-3">
                <Clock size={18} className="text-[var(--accent)] mt-0.5 flex-shrink-0" weight="light" />
                <div className="text-[var(--ink)] text-[15px]">
                  <p>Sunday – Thursday: 9:00 AM – 6:00 PM</p>
                  <p>Friday – Saturday: By appointment</p>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5 space-y-3">
              <p className="text-[var(--ink-muted)] text-[13px] font-medium uppercase tracking-wider">Nearby</p>
              {[
                ["Hazrat Shahjalal International Airport", "~25 km"],
                ["Gulshan 2 Circle", "~12 km"],
                ["Uttara, Dhaka", "~8 km"],
                ["Purbachal New Town", "~3 km"],
              ].map(([place, dist]) => (
                <div key={place} className="flex justify-between items-center">
                  <span className="text-[var(--ink)] text-[14px]">{place}</span>
                  <span className="text-[var(--ink-muted)] text-[13px]">{dist}</span>
                </div>
              ))}
            </div>

            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border-2 border-[var(--accent)] text-[var(--ink)] rounded-[var(--radius-btn)] px-6 py-3 text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[var(--accent)] hover:text-white transition-colors"
            >
              Open in Maps
              <ArrowSquareOut size={13} />
            </a>
          </RevealBlock>
        </div>
      </div>
    </section>
  );
}
