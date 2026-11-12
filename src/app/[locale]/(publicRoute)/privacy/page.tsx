import type { Metadata } from "next";
import { RevealBlock } from "@/components/motion/RevealBlock";

export const metadata: Metadata = {
  title: "Privacy Policy — ICCB",
  description: "ICCB privacy policy — how we collect, use, and protect your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="pt-[88px] sm:pt-[112px]">
      <section className="bg-[var(--bg-soft)] py-12 border-b border-[var(--line)]">
        <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
          <RevealBlock>
            <span className="meta-label block mb-2">(LEGAL)</span>
            <h1 className="display-lg text-[var(--ink)]">PRIVACY POLICY</h1>
            <p className="text-[var(--ink-muted)] text-[14px] mt-2">Last updated: November 2025 · Sample content</p>
          </RevealBlock>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-3xl mx-auto px-[clamp(1rem,4vw,3rem)]">
          <div className="prose prose-sm max-w-none space-y-8 text-[var(--ink)]">
            {[
              {
                title: "1. Information We Collect",
                body: "We collect information you provide when making enquiries, booking events, or contacting us — including your name, phone number, email address, organization name, and event details. We also collect usage data through analytics tools to improve our website.",
              },
              {
                title: "2. How We Use Your Information",
                body: "Your information is used to respond to enquiries, process booking requests, send confirmation communications, and improve our services. We do not sell or share your personal information with third parties except as required to fulfil your request (e.g., our catering partners).",
              },
              {
                title: "3. Data Retention",
                body: "We retain your information for as long as necessary to provide services and comply with legal obligations. Enquiry data is retained for 2 years; booking data is retained for 7 years for accounting purposes.",
              },
              {
                title: "4. Cookies",
                body: "We use essential cookies for website functionality and analytics cookies (with your consent) to understand how visitors use our site. You can manage cookie preferences at any time via the cookie banner.",
              },
              {
                title: "5. Your Rights",
                body: "You have the right to access, correct, or delete your personal data. Contact us at privacy@iccbbg.com to exercise these rights. We will respond within 30 days.",
              },
              {
                title: "6. Security",
                body: "We implement industry-standard security measures to protect your information. All data is transmitted via HTTPS and stored on secured servers.",
              },
              {
                title: "7. Contact",
                body: "For privacy-related questions, contact our Data Protection Officer at privacy@iccbbg.com or in writing at: ICCB, Purbachal Express Highway, Kuril Bishwa Road, Dhaka 1229, Bangladesh.",
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
