"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { testimonials } from "@/data/testimonials";
import { RevealBlock } from "@/components/motion/RevealBlock";

export function Testimonials() {
  const [current, setCurrent] = useState(0);

  return (
    <section className="bg-[var(--bg)] py-[clamp(4rem,10vw,9rem)]">
      <div className="max-w-[1440px] mx-auto px-[clamp(1rem,4vw,3rem)]">
        <RevealBlock className="text-center mb-14">
          <span className="meta-label block mb-3">(TESTIMONIALS)</span>
          <h2 className="display-md text-[var(--ink)]">WHAT CLIENTS SAY</h2>
        </RevealBlock>

        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <div className="flex justify-center gap-1 mb-6">
                {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                  <Star key={i} size={14} weight="fill" className="text-[var(--accent)]" />
                ))}
              </div>
              <blockquote className="font-display text-2xl md:text-3xl text-[var(--ink)] font-light italic leading-relaxed mb-8">
                &ldquo;{testimonials[current].content.en}&rdquo;
              </blockquote>
              <div>
                <p className="font-medium text-[var(--ink)] text-[15px]">{testimonials[current].name}</p>
                {testimonials[current].organization && (
                  <p className="text-[var(--ink-muted)] text-[13px] mt-0.5">{testimonials[current].organization}</p>
                )}
                {testimonials[current].role && (
                  <p className="text-[var(--ink-muted)] text-[12px]">{testimonials[current].role}</p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center items-center gap-6 mt-10">
            <button
              onClick={() => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length)}
              aria-label="Previous testimonial"
              className="w-10 h-10 rounded-full border border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center"
            >
              <ArrowLeft size={16} weight="light" />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Testimonial ${i + 1}`}
                  className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-[var(--accent)]" : "bg-[var(--line)]"}`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrent((c) => (c + 1) % testimonials.length)}
              aria-label="Next testimonial"
              className="w-10 h-10 rounded-full border border-[var(--line)] text-[var(--ink-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center"
            >
              <ArrowRight size={16} weight="light" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
