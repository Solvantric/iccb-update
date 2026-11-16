"use client";
/**
 * Services page: auto-playing hero that shows every service (hover the strip to jump),
 * an animated service grid, and a "how it works" band.
 */
import { useEffect, useState, type MouseEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChatCircleText, ClipboardText, Sparkle, Confetti } from "@phosphor-icons/react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { Service } from "@/types";
import { serviceDetail } from "@/data/serviceDetails";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Ornament } from "@/components/venues/Ornament";
import { ServiceIcon } from "./serviceIcons";

const ease = [0.22, 1, 0.36, 1] as const;
const AUTOPLAY = 5000;

/** "Event Management" → ["Event ", "Management"] so one word can be red. */
export function splitName(name: string, highlight: string) {
  const i = highlight ? name.indexOf(highlight) : -1;
  if (i < 0) return { before: name, red: "", after: "" };
  return { before: name.slice(0, i), red: highlight, after: name.slice(i + highlight.length) };
}

/* ─── Hero ─────────────────────────────────────────────────────────────── */
export function ServicesHero({ services, locale }: { services: Service[]; locale: Locale }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? i;
  const s = services[active];
  const d = serviceDetail(s.slug);
  const name = splitName(s.name.en, d.highlight);

  useEffect(() => {
    if (reduced || hover !== null) return;
    const t = setTimeout(() => setI((v) => (v + 1) % services.length), AUTOPLAY);
    return () => clearTimeout(t);
  }, [i, reduced, hover, services.length]);

  const v = {
    hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.65, ease } },
    out: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  return (
    <section className="relative h-[86vh] min-h-[620px] max-h-[900px] overflow-hidden bg-black">
      <AnimatePresence initial={false}>
        <motion.div
          key={s.id}
          className="absolute inset-0"
          initial={{ opacity: 0, clipPath: "inset(0 0 0 100%)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0 0 0%)" }}
          exit={{ opacity: 0.6 }}
          transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
        >
          <motion.div className="absolute inset-0" initial={{ scale: reduced ? 1 : 1.15 }} animate={{ scale: 1.02 }} transition={{ duration: AUTOPLAY / 1000 + 1.5, ease: "easeOut" }}>
            <Image src={s.image} alt={s.name.en} fill priority={active === 0} quality={90} sizes="100vw" className="object-cover" />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/5" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 to-transparent" />

      <div className="relative flex h-full items-center container-site pb-40">
        <AnimatePresence mode="wait">
          <motion.div
            key={s.id}
            className="max-w-2xl"
            initial="hidden"
            animate="show"
            exit="out"
            variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } }, out: { transition: { staggerChildren: 0.03 } } }}
          >
            <motion.p variants={v} className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.22em] text-white/80">
              <span className="h-px w-8 bg-[var(--accent)]" /> Our Services · {String(active + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
            </motion.p>
            <motion.h1 variants={v} className="mt-4 font-display uppercase text-white text-[clamp(2.6rem,6vw,5rem)] leading-[1]">
              {name.before}
              <span className="text-[var(--accent)]">{name.red}</span>
              {name.after}
            </motion.h1>
            <motion.p variants={v} className="mt-3 font-serif text-[clamp(1.05rem,1.8vw,1.4rem)] italic text-[var(--accent)]">{s.tagline.en}</motion.p>
            <motion.p variants={v} className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/85 max-md:hidden">{s.description.en}</motion.p>
            <motion.ul variants={v} className="mt-5 grid max-w-lg gap-x-6 gap-y-2 sm:grid-cols-2 max-md:hidden">
              {s.features.slice(0, 4).map((f) => (
                <li key={f.en} className="flex items-start gap-2 text-[13.5px] text-white/90">
                  <span className="mt-0.5 grid h-4 w-4 flex-shrink-0 place-items-center rounded-full bg-[var(--accent)]">
                    <Check size={9} weight="bold" />
                  </span>
                  {f.en}
                </li>
              ))}
            </motion.ul>
            <motion.div variants={v} className="mt-7 flex flex-wrap gap-3">
              <Link href={`/services/${s.slug}`} locale={locale} className="btn btn-primary group">
                Explore {s.name.en} <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100" />
              </Link>
              <Link href="/enquiry" locale={locale} className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-white/40 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[var(--ink)]">
                Get a Quote
              </Link>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* service strip */}
      <div className="absolute inset-x-0 bottom-0">
        <div className="container-site pb-6">
          <motion.div
            className="grid grid-cols-3 gap-2 md:grid-cols-6 md:gap-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.5 } } }}
            onMouseLeave={() => {
              if (hover !== null) setI(hover);
              setHover(null);
            }}
          >
            {services.map((sv, k) => {
              const on = active === k;
              return (
                <motion.div key={sv.id} variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}>
                  <Link
                    href={`/services/${sv.slug}`}
                    locale={locale}
                    onMouseEnter={() => setHover(k)}
                    onFocus={() => setHover(k)}
                    onBlur={() => {
                      setI(k);
                      setHover(null);
                    }}
                    className={`relative flex items-center gap-2.5 overflow-hidden rounded-xl border p-2 pe-3 backdrop-blur-md transition-all duration-300 ${on ? "-translate-y-1 border-white/70 bg-white text-[var(--ink)]" : "border-white/20 bg-white/10 text-white hover:bg-white/20"}`}
                  >
                    <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg transition-colors ${on ? "bg-[var(--accent)] text-white" : "bg-white/15 text-white"}`}>
                      <ServiceIcon name={sv.icon} size={18} weight="duotone" />
                    </span>
                    <span className="min-w-0 truncate text-[12px] font-semibold md:text-[13px]">{sv.name.en.replace(" & Trade Fair Support", "")}</span>
                    {on && hover === null && !reduced && (
                      <motion.span
                        key={i}
                        className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-[var(--accent)] rtl:origin-right"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: AUTOPLAY / 1000, ease: "linear" }}
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── Grid ─────────────────────────────────────────────────────────────── */
function ServiceCard({ s, index, locale }: { s: Service; index: number; locale: Locale }) {
  const d = serviceDetail(s.slug);
  const alt = d.gallery[1] ?? s.image;
  const [hover, setHover] = useState(false);
  const [o, setO] = useState({ x: 50, y: 50 });
  const onEnter = (e: MouseEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setO({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    setHover(true);
  };

  return (
    <Link
      href={`/services/${s.slug}`}
      locale={locale}
      onMouseEnter={onEnter}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_24px_50px_-40px_rgba(0,0,0,0.5)] transition-shadow duration-500 hover:shadow-[0_34px_60px_-30px_rgba(0,0,0,0.45)]"
    >
      <div className="relative aspect-[16/11] overflow-hidden bg-black">
        <Image src={s.image} alt={s.name.en} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ clipPath: hover ? `circle(150% at ${o.x}% ${o.y}%)` : `circle(0% at ${o.x}% ${o.y}%)` }}
          transition={{ duration: hover ? 0.9 : 0.5, ease }}
        >
          <Image src={alt} alt="" fill quality={90} sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute start-4 top-4 font-display text-[13px] tracking-[0.2em] text-white/85">{String(index + 1).padStart(2, "0")}</span>
      </div>

      {/* icon medallion overlapping the photo */}
      <span className="relative z-10 -mt-8 ms-6 grid h-16 w-16 place-items-center rounded-2xl bg-[var(--surface)] shadow-[0_14px_30px_-14px_rgba(0,0,0,0.45)] ring-1 ring-[var(--line)] transition-all duration-500 group-hover:-translate-y-1 group-hover:rotate-6 group-hover:bg-[var(--accent)]">
        <ServiceIcon name={s.icon} size={30} weight="duotone" className="text-[var(--accent)] transition-colors duration-500 group-hover:text-white" />
      </span>

      <div className="flex flex-1 flex-col p-6 pt-4">
        <h3 className="font-display text-[24px] uppercase leading-tight text-[var(--ink)] transition-colors group-hover:text-[var(--accent)]">{s.name.en}</h3>
        <p className="mt-1 text-[13.5px] italic text-[var(--ink-muted)]">{s.tagline.en}</p>
        <ul className="mt-4 space-y-2">
          {s.features.slice(0, 3).map((f, k) => (
            <li
              key={f.en}
              className="flex items-start gap-2 text-[13.5px] text-[var(--ink-body)] transition-all duration-500"
              style={{ transitionDelay: `${k * 60}ms` }}
            >
              <Check size={14} weight="bold" className="mt-0.5 flex-shrink-0 text-[var(--accent)]" />
              {f.en}
            </li>
          ))}
        </ul>
        <span className="mt-auto flex items-center gap-2 pt-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--ink)] group-hover:text-[var(--accent)]">
          Explore service
          <ArrowRight size={13} weight="bold" className="transition-transform duration-300 group-hover:translate-x-1.5 rtl:-scale-x-100" />
        </span>
      </div>
      <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 bg-[var(--accent)] transition-transform duration-500 group-hover:scale-x-100 rtl:origin-right" />
    </Link>
  );
}

export function ServiceGrid({ services, locale }: { services: Service[]; locale: Locale }) {
  return (
    <section className="section-y bg-[var(--bg)]">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, ease }}>
            <SectionLabel>What We Offer</SectionLabel>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]"
          >
            Everything Your Event <span className="text-[var(--accent)]">Needs</span>
          </motion.h2>
          <Ornament className="mt-5" />
          <motion.p initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.7, ease, delay: 0.2 }} className="mt-5 text-[15.5px] leading-relaxed text-[var(--ink-body)]">
            Venue, food, décor and a team to run it all — six services under one roof, so your event is planned with a single call.
          </motion.p>
        </div>

        <motion.div
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.1 }}
          variants={{ show: { transition: { staggerChildren: 0.14 } } }}
        >
          {services.map((s, i) => (
            <motion.div
              key={s.id}
              variants={{ hidden: { opacity: 0, y: 50, rotateX: -12 }, show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease } } }}
              style={{ perspective: 1000 }}
            >
              <ServiceCard s={s} index={i} locale={locale} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── How it works ─────────────────────────────────────────────────────── */
const PROCESS = [
  { icon: ChatCircleText, title: "Tell us your plan", text: "Share the date, guest count and the kind of event you have in mind." },
  { icon: ClipboardText, title: "Get a tailored proposal", text: "Hall, menu, décor and services — priced clearly in one quote." },
  { icon: Sparkle, title: "We prepare everything", text: "Our teams set up the hall, kitchen, stage and technical production." },
  { icon: Confetti, title: "You enjoy the day", text: "A dedicated coordinator runs the event while you host your guests." },
];

export function ServiceProcess() {
  return (
    <section className="section-y bg-[var(--bg-soft)]">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, ease }}>
            <SectionLabel>How It Works</SectionLabel>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]"
          >
            One Call, <span className="text-[var(--accent)]">Four Steps</span>
          </motion.h2>
          <Ornament className="mt-5" />
        </div>
        <ProcessSteps steps={PROCESS.map((p) => ({ ...p }))} />
      </div>
    </section>
  );
}

/** Numbered steps joined by a line that draws across as the section scrolls in. */
export function ProcessSteps({ steps }: { steps: { icon?: typeof Sparkle; title: string; text: string }[] }) {
  return (
    <motion.ol
      className="relative mt-14 grid gap-8 md:grid-cols-4 md:gap-6"
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount: 0.3 }}
      variants={{ show: { transition: { staggerChildren: 0.22 } } }}
    >
      <motion.span
        aria-hidden
        className="absolute start-[12.5%] end-[12.5%] top-8 hidden h-[2px] origin-left bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] md:block rtl:origin-right"
        variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1.4, ease } } }}
      />
      {steps.map((st, i) => {
        const Icon = st.icon;
        return (
          <motion.li
            key={st.title}
            className="relative text-center"
            variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}
          >
            <motion.span
              className="relative mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-[var(--accent)] bg-[var(--surface)] text-[var(--accent)] shadow-[0_12px_28px_-14px_var(--accent)]"
              variants={{ hidden: { scale: 0 }, show: { scale: 1, transition: { type: "spring", stiffness: 260, damping: 16 } } }}
            >
              {Icon ? <Icon size={26} weight="duotone" /> : <span className="font-display text-[22px]">{i + 1}</span>}
              <span className="absolute -end-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-[var(--accent)] font-display text-[11px] text-white">{i + 1}</span>
            </motion.span>
            <h3 className="mt-5 text-[16px] font-semibold text-[var(--ink)]">{st.title}</h3>
            <p className="mx-auto mt-2 max-w-[240px] text-[13.5px] leading-relaxed text-[var(--ink-muted)]">{st.text}</p>
          </motion.li>
        );
      })}
    </motion.ol>
  );
}
