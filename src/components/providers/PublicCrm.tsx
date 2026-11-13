"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { hydrateAll } from "@/lib/crm/db";
import { hallCodeFor, trackCrm } from "@/lib/crm/track";

/**
 * Public site ↔ CRM bridge: hydrates the persisted CRM stores (so forms,
 * chatbot and CMS content use the same data as the dashboard) and records
 * page views / venue views for Marketing → Analytics.
 */
export function PublicCrm() {
  const pathname = usePathname();
  useEffect(() => {
    let cancelled = false;
    hydrateAll().then(() => {
      if (cancelled) return;
      const path = pathname.replace(/^\/(en|bn|ar|zh)(?=\/|$)/, "") || "/";
      trackCrm("visit", { page: path });
      const venue = path.match(/^\/venues\/([^/]+)/)?.[1];
      if (venue) trackCrm("venue_view", { page: path, hallCode: hallCodeFor(venue) });
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);
  return null;
}
