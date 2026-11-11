"use client";
import { useState } from "react";
import { Plus, Minus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import type { FaqItem } from "@/data/faq";

interface Category { id: string; label: string }

interface FaqAccordionProps {
  items: FaqItem[];
  categories: Category[];
}

export function FaqAccordion({ items, categories }: FaqAccordionProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = activeCategory === "all"
    ? items
    : items.filter((item) => item.category === activeCategory);

  return (
    <div>
      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); setOpenId(null); }}
            className={cn(
              "px-4 py-2 rounded-full text-[12px] font-medium border transition-colors",
              activeCategory === cat.id
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : "border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-[var(--surface)] border border-[var(--line)] rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setOpenId(openId === item.id ? null : item.id)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-start"
            >
              <span className="font-medium text-[var(--ink)] text-[15px]">{item.question.en}</span>
              {openId === item.id
                ? <Minus size={16} className="flex-shrink-0 text-[var(--accent)]" />
                : <Plus size={16} className="flex-shrink-0 text-[var(--ink-muted)]" />
              }
            </button>
            {openId === item.id && (
              <div className="px-5 pb-5 border-t border-[var(--line)]">
                <p className="text-[var(--ink-muted)] text-[14px] leading-relaxed pt-4">
                  {item.answer.en}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
