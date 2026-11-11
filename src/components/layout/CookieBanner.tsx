"use client";
import { useState, useEffect } from "react";
import { X } from "@phosphor-icons/react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("iccb_cookie_consent");
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("iccb_cookie_consent", "true");
    setVisible(false);
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
        <a href="/privacy" className="text-[var(--accent-text)] underline">Learn more</a>
      </p>
      <div className="flex gap-3 flex-shrink-0">
        <button
          onClick={accept}
          className="bg-[var(--accent)] text-white rounded-full px-5 py-2 text-[12px] font-medium tracking-wider uppercase hover:bg-[var(--accent-hover)] transition-colors"
        >
          Accept
        </button>
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          className="text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
