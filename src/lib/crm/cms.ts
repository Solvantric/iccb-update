"use client";
import { useMemo, useSyncExternalStore } from "react";
import type { ContentItem, ContentSection } from "@/types/crm";
import { db, isHydrated, onHydrated } from "./db";

/** True once every persisted CRM store has loaded from localStorage. */
export function useCrmReady() {
  return useSyncExternalStore(onHydrated, isHydrated, () => false);
}

/**
 * Published website content for a section (Marketing → Website content), or
 * null until the store has hydrated so pages can fall back to static content.
 */
export function usePublishedContent(section: ContentSection): ContentItem[] | null {
  const ready = useCrmReady();
  const items = db.content.store((s) => s.items);
  return useMemo(() => (ready ? items.filter((c) => c.section === section && c.published).sort((a, b) => a.order - b.order) : null), [ready, items, section]);
}

/** Only local paths and hosts allowed in next.config `images.remotePatterns` can be rendered by next/image. */
export const isAllowedImage = (src?: string): src is string =>
  !!src && (/^\/[^/]/.test(src) || /^https:\/\/(images\.unsplash\.com|plus\.unsplash\.com|www\.iccbbg\.com|img\.youtube\.com|res\.cloudinary\.com)\//.test(src));
