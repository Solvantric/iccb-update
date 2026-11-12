import type { Metadata } from "next";
import { RevealBlock } from "@/components/motion/RevealBlock";

export const metadata: Metadata = {
  title: "Terms & Conditions — ICCB",
  description: "ICCB terms and conditions for venue rental, event services, and use of this website.",
};

export default function TermsPage() {
  return (
    <div className="pt-[88px] sm:pt-[112px]">
      <section className="bg-[var(--bg-soft)] py-12 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <span className="meta-label block mb-2">(LEGAL)</span>
            <h1 className="display-lg text-[var(--ink)]">TERMS & CONDITIONS</h1>
            <p className="text-[var(--ink-muted)] text-[14px] mt-2">Last updated: November 2025 · Sample content</p>
          </RevealBlock>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-3xl mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="space-y-8">
            {[
              {
                title: "1. Bookings & Reservations",
                body: "All bookings are subject to availability and confirmed only upon receipt of a signed agreement and deposit. Holds are valid for 48 hours and are not guaranteed until a deposit is received. ICCB reserves the right to release holds not confirmed within this period.",
              },
              {
                title: "2. Payment Terms",
                body: "A 30% deposit is required to confirm a booking. The remaining balance is due 14 days before the event. All prices are in BDT and exclude VAT (15%) and service charge (10%) unless stated otherwise. Online estimates are indicative only.",
              },
              {
                title: "3. Cancellation Policy",
                body: "Cancellations made more than 60 days before the event: 20% cancellation fee. 30–60 days: 50% cancellation fee. Within 30 days: 100% of booking fee is forfeited. Rescheduling is subject to availability at no additional charge if made more than 30 days in advance.",
              },
              {
                title: "4. Event Conduct",
                body: "ICCB reserves the right to terminate any event that violates local laws, poses a safety risk, or is deemed inappropriate. The organizer is responsible for the conduct of all guests and vendors. ICCB security decisions are final.",
              },
              {
                title: "5. Catering",
                body: "ICCB operates an exclusive catering arrangement. External food and beverages are not permitted unless written approval is obtained. ICCB catering menus and pricing are subject to change.",
              },
              {
                title: "6. Liability",
                body: "ICCB is not liable for loss, damage, or injury arising from events held on the premises except in cases of gross negligence. Organizers are advised to obtain event insurance. ICCB's liability is limited to the value of the booking fee.",
              },
              {
                title: "7. Force Majeure",
                body: "ICCB is not liable for failure to perform obligations due to circumstances beyond its control, including natural disasters, government orders, or infrastructure failures. In such cases, rescheduling or refund options will be provided.",
              },
              {
                title: "8. Website Use",
                body: "The budget calculator and availability calendar on this website are for estimation purposes only. All figures shown are indicative and not binding. Final pricing is confirmed in writing by ICCB.",
              },
            ].map((section) => (
              <RevealBlock key={section.title}>
                <h2 className="font-display text-xl text-[var(--ink)] font-light uppercase mb-3">{section.title}</h2>
                <p className="text-[var(--ink-muted)] text-[15px] leading-relaxed">{section.body}</p>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
