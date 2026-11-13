"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "@phosphor-icons/react";

const noopSubscribe = () => () => {};
const readConsent = () => {
  try {
    return localStorage.getItem("iccb_cookie_consent");
  } catch {
    return "blocked";
  }
};

export function CookieBanner() {
  // Server snapshot "pending" keeps the banner hidden until the client knows.
  const consent = useSyncExternalStore(noopSubscribe, readConsent, () => "pending");
  const [dismissed, setDismissed] = useState(false);
  const visible = !dismissed && consent === null;

  const accept = () => {
    try {
      localStorage.setItem("iccb_cookie_consent", "true");
    } catch {}
    setDismissed(true);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 bg-[var(--surface)] border-t border-[var(--line)] px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg"
      role="banner"
      aria-label="Cookie consent"
    >
      <p className="text-[13px] text-[var(--ink-muted)] flex-1 leading-relaxed">
        We use essential cookies to ensure the site works correctly. Analytics cookies are only used with your consent.{" "}
        <Link href="/privacy" className="text-[var(--accent-text)] underline">Learn more</Link>
      </p>
      <div className="flex gap-3 flex-shrink-0">
        <button
          onClick={accept}
          className="bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] shadow-[0_8px_22px_-10px_var(--accent-glow)] hover:-translate-y-px text-white rounded-[var(--radius-btn)] px-5 py-2 text-[12px] font-bold tracking-wider uppercase hover:brightness-110 transition-colors"
        >
          Accept
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
