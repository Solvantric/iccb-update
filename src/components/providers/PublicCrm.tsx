"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { hydrateAll, listenCrossTab } from "@/lib/crm/db";
import { trackCrm } from "@/lib/crm/track";

/**
 * Public site ↔ CRM bridge: hydrates the persisted CRM stores (so the booking
 * form, question forms and website content use the same data as the
 * dashboard) and records visits / venue views for Marketing → Analytics.
 */
export function PublicCrm() {
  const pathname = usePathname();
  useEffect(() => listenCrossTab(), []);
  useEffect(() => {
    let cancelled = false;
    hydrateAll().then(() => {
      if (cancelled) return;
      const path = pathname.replace(/^\/(en|bn|ar|zh)(?=\/|$)/, "") || "/";
      trackCrm("visit", path);
      if (/^\/venues\/[^/]+/.test(path)) trackCrm("venue_view", path);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);
  return null;
}
