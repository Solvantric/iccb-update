import type { Metadata } from "next";
import { RevealBlock, RevealGroup, RevealItem } from "@/components/motion/RevealBlock";
import { Phone, Envelope, MapPin, Clock } from "@phosphor-icons/react/dist/ssr";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact — ICCB",
  description: "Get in touch with ICCB. Call, email, or visit our convention centre on Purbachal Express Highway, Dhaka.",
};

export default function ContactPage() {
  return (
    <div className="pt-[88px] sm:pt-[112px]">
      {/* Page header */}
      <section className="bg-[var(--bg-soft)] py-12 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <span className="meta-label block mb-2">(CONTACT)</span>
            <h1 className="display-lg text-[var(--ink)]">GET IN TOUCH</h1>
            <p className="text-[var(--ink-muted)] text-[16px] mt-3 max-w-xl">
              Our team is available 7 days a week to help you plan your event.
            </p>
          </RevealBlock>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Contact info */}
            <div className="lg:col-span-2 space-y-8">
              <RevealBlock>
                <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-6">Contact Information</h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                      <MapPin size={18} className="text-[var(--accent)]" weight="light" />
                    </div>
                    <div>
                      <p className="text-[var(--ink)] font-medium text-[14px]">Address</p>
                      <p className="text-[var(--ink-muted)] text-[14px] mt-1 leading-relaxed">
                        International Convention City Bashundhara<br />
                        Purbachal Express Highway<br />
                        Kuril Bishwa Road, Dhaka 1229, Bangladesh
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                      <Phone size={18} className="text-[var(--accent)]" weight="light" />
                    </div>
                    <div>
                      <p className="text-[var(--ink)] font-medium text-[14px]">Phone</p>
                      <a href="tel:+8801991197719" className="text-[var(--ink-muted)] text-[14px] mt-1 block hover:text-[var(--accent)] transition-colors">
                        +880 1991-197719
                      </a>
                      <p className="text-[11px] text-[var(--ink-muted)] mt-0.5">Sample number — replace</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                      <Envelope size={18} className="text-[var(--accent)]" weight="light" />
                    </div>
                    <div>
                      <p className="text-[var(--ink)] font-medium text-[14px]">Email</p>
                      <a href="mailto:info@iccbbg.com" className="text-[var(--ink-muted)] text-[14px] mt-1 block hover:text-[var(--accent)] transition-colors">
                        info@iccbbg.com
                      </a>
                      <a href="mailto:sales@iccbbg.com" className="text-[var(--ink-muted)] text-[14px] block hover:text-[var(--accent)] transition-colors">
                        sales@iccbbg.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                      <Clock size={18} className="text-[var(--accent)]" weight="light" />
                    </div>
                    <div>
                      <p className="text-[var(--ink)] font-medium text-[14px]">Office Hours</p>
                      <div className="text-[var(--ink-muted)] text-[14px] mt-1 space-y-0.5">
                        <p>Sunday – Thursday: 9:00 AM – 6:00 PM</p>
                        <p>Friday – Saturday: 10:00 AM – 4:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </RevealBlock>

              {/* Map */}
              <RevealBlock>
                <div className="rounded-[var(--radius-card)] overflow-hidden border border-[var(--line)]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3649.8878!2d90.4126!3d23.8103!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sICCB!5e0!3m2!1sen!2sbd!4v1620000000000!5m2!1sen!2sbd"
                    width="100%"
                    height="220"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="ICCB Location"
                  />
                </div>
              </RevealBlock>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-3">
              <RevealBlock>
                <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase mb-6">Send a Message</h2>
                <ContactForm />
              </RevealBlock>
            </div>
          </div>
        </div>
      </section>

      {/* Departments */}
      <section className="py-14 bg-[var(--bg-soft)] border-t border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock className="mb-8">
            <h2 className="font-display text-2xl text-[var(--ink)] font-light uppercase">Departments</h2>
          </RevealBlock>
          <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { dept: "Sales & Bookings", email: "sales@iccbbg.com", note: "Hall reservations & quotes" },
              { dept: "Catering", email: "catering@iccbbg.com", note: "Menu planning & packages" },
              { dept: "Expo Village", email: "expo@iccbbg.com", note: "Exhibition booth enquiries" },
              { dept: "Media & PR", email: "media@iccbbg.com", note: "Press & partnership requests" },
            ].map((d) => (
              <RevealItem key={d.dept}>
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-lg p-4">
                  <p className="font-medium text-[var(--ink)] text-[14px]">{d.dept}</p>
                  <a href={`mailto:${d.email}`} className="text-[var(--accent-text)] text-[13px] mt-1 block hover:text-[var(--accent)] transition-colors">
                    {d.email}
                  </a>
                  <p className="text-[var(--ink-muted)] text-[12px] mt-1">{d.note}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
    </div>
  );
}
