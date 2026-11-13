"use client";
import { useMemo } from "react";
import type { ContentItem, ContentSection } from "@/types/crm";
import { db } from "./db";
import { useCrmReady } from "@/components/providers/CrmProvider";

/**
 * Published CMS items for a section (Marketing → Website CMS), or null until
 * the store has hydrated so pages can fall back to their static content.
 */
export function usePublishedContent(section: ContentSection): ContentItem[] | null {
  const ready = useCrmReady();
  const items = db.content.store((s) => s.items);
  return useMemo(() => (ready ? items.filter((c) => c.section === section && c.published && !c.deletedAt).sort((a, b) => a.order - b.order) : null), [ready, items, section]);
}
