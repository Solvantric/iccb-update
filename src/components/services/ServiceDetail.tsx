"use client";
/** Building blocks for an individual service page (/services/[slug]). */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, CalendarCheck, ChatCircleText, Check, CaretLeft, CaretRight, X, MagnifyingGlassPlus } from "@phosphor-icons/react";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { Service } from "@/types";
import { serviceDetail } from "@/data/serviceDetails";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Ornament } from "@/components/venues/Ornament";
import { ServiceIcon } from "./serviceIcons";
import { ProcessSteps, splitName } from "./ServicesShowcase";

const ease = [0.22, 1, 0.36, 1] as const;
const AUTOPLAY = 5000;

function Heading({ label, children, center = true }: { label: string; children: React.ReactNode; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : ""}>
      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: false }} transition={{ duration: 0.6, ease }}>
        <SectionLabel>{label}</SectionLabel>
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: false }}
        transition={{ duration: 0.8, ease, delay: 0.1 }}
        className="mt-4 font-display uppercase text-[clamp(2rem,4vw,3.2rem)] leading-[1.05] text-[var(--ink)]"
      >
        {children}
      </motion.h2>
      <Ornament align={center ? "center" : "start"} className="mt-5" />
    </div>
  );
}

/* ─── Hero ─────────────────────────────────────────────────────────────── */
export function ServiceHero({ service, locale }: { service: Service; locale: Locale }) {
  const d = serviceDetail(service.slug);
  const reduced = useReducedMotion();
  const photos = [service.image, ...d.gallery.filter((g) => !g.includes(service.image.split("?")[0].split("/").pop() ?? "_"))].slice(0, 4);
  const [p, setP] = useState(0);
  const name = splitName(service.name.en, d.highlight);
  const words = [name.before, name.red, name.after];

  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => setP((v) => (v + 1) % photos.length), AUTOPLAY);
    return () => clearTimeout(t);
  }, [p, reduced, photos.length]);

  return (
    <section className="relative h-[86vh] min-h-[600px] max-h-[900px] overflow-hidden bg-black">
      <AnimatePresence initial={false}>
        <motion.div key={p} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.1, ease: "easeInOut" }}>
          <motion.div className="absolute inset-0" initial={{ scale: reduced ? 1 : 1.15 }} animate={{ scale: 1.02 }} transition={{ duration: AUTOPLAY / 1000 + 1.5, ease: "easeOut" }}>
            <Image src={photos[p]} alt={service.name.en} fill priority={p === 0} quality={90} sizes="100vw" className="object-cover" />
          </motion.div>
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

      <div className="relative flex h-full items-center container-site pb-16">
        <motion.div className="max-w-2xl" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}>
          <motion.nav
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] text-white/65"
          >
            <Link href="/" locale={locale} className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/services" locale={locale} className="hover:text-white">Services</Link>
            <span>/</span>
            <span className="text-white">{service.name.en}</span>
          </motion.nav>

          <motion.span
            variants={{ hidden: { scale: 0, rotate: -90 }, show: { scale: 1, rotate: 0, transition: { type: "spring", stiffness: 220, damping: 15 } } }}
            className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--accent)] text-white shadow-[0_16px_34px_-12px_var(--accent)]"
          >
            <ServiceIcon name={service.icon} size={32} weight="duotone" />
          </motion.span>

          <h1 className="mt-6 font-display uppercase text-white text-[clamp(2.6rem,6.4vw,5.4rem)] leading-[1]" aria-label={service.name.en}>
            {words.map((w, wi) =>
              w ? (
                <span key={wi} aria-hidden className={wi === 1 ? "text-[var(--accent)]" : ""}>
                  {w.split("").map((ch, ci) => (
                    <motion.span
                      key={ci}
                      className="inline-block"
                      variants={{ hidden: { y: "100%", opacity: 0 }, show: { y: "0%", opacity: 1, transition: { duration: 0.7, ease } } }}
                    >
                      {ch === " " ? " " : ch}
                    </motion.span>
                  ))}
                </span>
              ) : null,
            )}
          </h1>
          <motion.p variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }} className="mt-3 font-serif text-[clamp(1.1rem,1.9vw,1.45rem)] italic text-[var(--accent)]">
            {service.tagline.en}
          </motion.p>
          <motion.span variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.7, ease } } }} className="mt-5 block h-[3px] w-16 origin-left bg-[var(--accent)] rtl:origin-right" />
          <motion.p variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }} className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/85">
            {service.description.en}
          </motion.p>
          <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }} className="mt-8 flex flex-wrap gap-3">
            <Link href="/booking" locale={locale} className="btn btn-primary">
              <CalendarCheck size={16} weight="bold" /> Check Availability
            </Link>
            <Link href="/enquiry" locale={locale} className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-white/40 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-[var(--ink)]">
              <ChatCircleText size={16} /> Get a Quote
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {photos.map((_, k) => (
          <button
            key={k}
            type="button"
            onClick={() => setP(k)}
            aria-label={`Photo ${k + 1}`}
            className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-500 ${k === p ? "w-10 bg-white/30" : "w-2 bg-white/50 hover:bg-white/80"}`}
          >
            {k === p && !reduced && (
              <motion.span key={p} className="absolute inset-y-0 left-0 bg-[var(--accent)]" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: AUTOPLAY / 1000, ease: "linear" }} />
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ─── Overview ─────────────────────────────────────────────────────────── */
export function ServiceOverview({ service }: { service: Service }) {
  const d = serviceDetail(service.slug);
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [40, -40]);
  const y2 = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [-30, 50]);
  const imgA = d.gallery[0] ?? service.image;
  const imgB = d.gallery[2] ?? service.image;

  return (
    <section className="section-y bg-[var(--bg)]">
      <div ref={ref} className="container-site grid items-center gap-14 lg:grid-cols-2">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: false, margin: "-15% 0px" }} variants={{ show: { transition: { staggerChildren: 0.12 } } }}>
          <Heading label="Overview" center={false}>
            What&apos;s <span className="text-[var(--accent)]">Included</span>
          </Heading>
          <motion.p variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }} className="mt-6 max-w-xl text-[16px] leading-relaxed text-[var(--ink-body)]">
            {service.description.en}
          </motion.p>
          <motion.ul className="mt-7 space-y-3" variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
            {service.features.map((f) => (
              <motion.li
                key={f.en}
                variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0, transition: { duration: 0.55, ease } } }}
                className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[14.5px] font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)]/40"
              >
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white">
                  <Check size={13} weight="bold" />
                </span>
                {f.en}
              </motion.li>
            ))}
          </motion.ul>
          <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="mt-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-muted)]">Ideal for</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {d.idealFor.map((t) => (
                <span key={t} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[13px] font-medium text-[var(--ink)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* layered photos with parallax */}
        <div className="relative mx-auto h-[460px] w-full max-w-lg md:h-[540px]">
          <motion.div
            style={{ y: y1 }}
            className="absolute start-0 top-0 h-[78%] w-[72%] overflow-hidden rounded-3xl shadow-[0_40px_70px_-40px_rgba(0,0,0,0.5)]"
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            whileInView={{ clipPath: "inset(0 0% 0 0)" }}
            viewport={{ once: false, margin: "-15% 0px" }}
            transition={{ duration: 1.2, ease }}
          >
            <Image src={imgA} alt={service.name.en} fill quality={90} sizes="(max-width: 1024px) 70vw, 30vw" className="object-cover" />
          </motion.div>
          <motion.div
            style={{ y: y2 }}
            className="absolute bottom-0 end-0 h-[56%] w-[58%] overflow-hidden rounded-3xl border-[6px] border-[var(--bg)] shadow-[0_40px_70px_-40px_rgba(0,0,0,0.5)]"
            initial={{ clipPath: "inset(100% 0 0 0)" }}
            whileInView={{ clipPath: "inset(0% 0 0 0)" }}
            viewport={{ once: false, margin: "-15% 0px" }}
            transition={{ duration: 1.2, ease, delay: 0.25 }}
          >
            <Image src={imgB} alt="" fill quality={90} sizes="(max-width: 1024px) 60vw, 25vw" className="object-cover" />
          </motion.div>
          <motion.span
            className="absolute bottom-[18%] start-[4%] grid h-24 w-24 place-items-center rounded-full bg-[var(--accent)] text-center text-white shadow-[0_20px_40px_-16px_var(--accent)]"
            initial={{ scale: 0, rotate: -60 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: false }}
            transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.6 }}
          >
            <span className="font-display text-[12px] leading-tight tracking-[0.12em]">
              ALL
              <br />
              UNDER
              <br />
              ONE ROOF
            </span>
          </motion.span>
        </div>
      </div>
    </section>
  );
}

/* ─── Highlights ───────────────────────────────────────────────────────── */
export function ServiceHighlights({ service }: { service: Service }) {
  const d = serviceDetail(service.slug);
  return (
    <section className="section-y bg-[var(--bg-soft)]">
      <div className="container-site">
        <Heading label="Why It Works">
          The ICCB <span className="text-[var(--accent)]">Difference</span>
        </Heading>
        <motion.ul
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.15 }}
          variants={{ show: { transition: { staggerChildren: 0.13 } } }}
        >
          {d.highlights.map((h, i) => {
            return (
              <motion.li
                key={h.title}
                variants={{ hidden: { opacity: 0, y: 40, scale: 0.94 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease } } }}
                className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-[var(--accent)]/40 hover:shadow-[0_26px_50px_-30px_rgba(0,0,0,0.45)]"
              >
                {/* red wash rising on hover */}
                <span className="absolute inset-x-0 bottom-0 h-0 bg-gradient-to-t from-[var(--accent)]/[0.07] to-transparent transition-all duration-700 group-hover:h-full" />
                <span className="absolute end-6 top-6 font-display text-[40px] leading-none text-[var(--ink)]/[0.06] transition-colors duration-500 group-hover:text-[var(--accent)]/15">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <motion.span
                  variants={{ hidden: { scale: 0, rotate: -120 }, show: { scale: 1, rotate: 0, transition: { type: "spring", stiffness: 260, damping: 17, delay: 0.2 } } }}
                  className="relative grid h-14 w-14 place-items-center"
                >
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--accent)]/15 to-[var(--accent)]/[0.03] ring-1 ring-[var(--accent)]/20 transition-all duration-500 group-hover:rotate-6 group-hover:from-[var(--accent)] group-hover:to-[var(--accent-deep)]" />
                  <ServiceIcon name={h.icon} size={28} weight="duotone" className="relative text-[var(--accent)] transition-colors duration-500 group-hover:text-white" />
                </motion.span>
                <h3 className="relative mt-5 text-[17px] font-semibold text-[var(--ink)]">{h.title}</h3>
                <p className="relative mt-2 text-[14px] leading-relaxed text-[var(--ink-muted)]">{h.text}</p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}

/* ─── Packages (catering & decoration) ────────────────────────────────── */
const PACKAGES: Record<string, { title: string; note: string; link?: { href: string; label: string }; items: { name: string; price: string; tag: string; desc: string }[] }> = {
  catering: {
    title: "Catering Packages",
    note: "Sample pricing per head. Final menu and price confirmed by ICCB.",
    link: { href: "/menu", label: "View full menu" },
    items: [
      { name: "Mughal Classic", price: "৳850", tag: "Popular", desc: "Kacchi biryani, roast, rezala, borhani and traditional desserts." },
      { name: "Continental", price: "৳1,200", tag: "Premium", desc: "Plated starters, continental mains, salads and a dessert bar." },
      { name: "Multi-Cuisine Grand", price: "৳1,800", tag: "Luxury", desc: "Live stations, Mughal and continental spreads, premium desserts." },
    ],
  },
  decoration: {
    title: "Decoration Tiers",
    note: "Sample pricing. Final quote confirmed by the ICCB decoration team.",
    items: [
      { name: "Classic", price: "৳50,000", tag: "Elegant", desc: "Fresh florals, standard draping and table arrangements." },
      { name: "Premium", price: "৳1,20,000", tag: "Popular", desc: "Floral installations, LED uplighting, custom backdrop and centrepieces." },
      { name: "Royal", price: "৳2,50,000", tag: "Grand", desc: "Full hall transformation — chandeliers, custom stage and floral arches." },
    ],
  },
};

export function ServicePackages({ service, locale }: { service: Service; locale: Locale }) {
  const pk = PACKAGES[service.slug];
  if (!pk) return null;
  return (
    <section className="section-y bg-[var(--bg)]">
      <div className="container-site">
        <Heading label="Packages">
          {pk.title.split(" ")[0]} <span className="text-[var(--accent)]">{pk.title.split(" ").slice(1).join(" ")}</span>
        </Heading>
        <motion.div
          className="mx-auto mt-14 grid max-w-5xl gap-5 md:grid-cols-3"
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.2 }}
          variants={{ show: { transition: { staggerChildren: 0.15 } } }}
        >
          {pk.items.map((it, i) => {
            const featured = i === 1;
            return (
              <motion.div
                key={it.name}
                variants={{ hidden: { opacity: 0, y: 50, rotateY: i === 0 ? 20 : i === 2 ? -20 : 0 }, show: { opacity: 1, y: 0, rotateY: 0, transition: { duration: 0.8, ease } } }}
                style={{ perspective: 1000 }}
                className={`group relative overflow-hidden rounded-3xl border p-8 text-center transition-all duration-500 hover:-translate-y-2 ${featured ? "border-transparent bg-gradient-to-b from-[var(--accent)] to-[var(--accent-deep)] text-white shadow-[0_30px_60px_-30px_var(--accent)] md:-my-4 md:py-12" : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--accent)]/40 hover:shadow-[0_26px_50px_-30px_rgba(0,0,0,0.4)]"}`}
              >
                <span className={`inline-block rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.16em] ${featured ? "bg-white/20 text-white" : "bg-[var(--accent)]/10 text-[var(--accent)]"}`}>{it.tag}</span>
                <p className="mt-5 font-display text-[24px] uppercase leading-tight">{it.name}</p>
                <p className="mt-4 font-display text-[44px] leading-none">
                  {it.price}
                  {service.slug === "catering" && <span className={`ms-1 text-[13px] ${featured ? "text-white/70" : "text-[var(--ink-muted)]"}`}>/head</span>}
                </p>
                <span className={`mx-auto mt-5 block h-px w-12 ${featured ? "bg-white/40" : "bg-[var(--line)]"}`} />
                <p className={`mt-5 text-[14px] leading-relaxed ${featured ? "text-white/85" : "text-[var(--ink-muted)]"}`}>{it.desc}</p>
                <Link
                  href="/enquiry"
                  locale={locale}
                  className={`mt-7 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors ${featured ? "bg-white text-[var(--accent)] hover:bg-white/90" : "border border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--accent)]"}`}
                >
                  Enquire <ArrowRight size={13} weight="bold" className="rtl:-scale-x-100" />
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
        <p className="mt-8 text-center text-[12px] text-[var(--ink-muted)]">
          {pk.note}{" "}
          {pk.link && (
            <Link href={pk.link.href} locale={locale} className="font-semibold text-[var(--accent)] hover:underline">
              {pk.link.label} →
            </Link>
          )}
        </p>
      </div>
    </section>
  );
}

/* ─── Steps ────────────────────────────────────────────────────────────── */
export function ServiceSteps({ service }: { service: Service }) {
  const d = serviceDetail(service.slug);
  return (
    <section className="section-y bg-[var(--bg)]">
      <div className="container-site">
        <Heading label="The Process">
          How It <span className="text-[var(--accent)]">Works</span>
        </Heading>
        <ProcessSteps steps={d.steps} />
      </div>
    </section>
  );
}

/* ─── Gallery ──────────────────────────────────────────────────────────── */
export function ServiceGallery({ service }: { service: Service }) {
  const d = serviceDetail(service.slug);
  const imgs = Array.from(new Set([service.image, ...d.gallery])).slice(0, 5);
  const [open, setOpen] = useState<number | null>(null);
  const go = useCallback((dir: number) => setOpen((o) => (o === null ? o : (o + dir + imgs.length) % imgs.length)), [imgs.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, go]);

  return (
    <section className="section-y bg-[var(--bg-soft)]">
      <div className="container-site">
        <Heading label="Gallery">
          In <span className="text-[var(--accent)]">Pictures</span>
        </Heading>
        <motion.div
          className="mt-12 grid auto-rows-[170px] grid-cols-2 gap-3 md:auto-rows-[220px] md:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.15 }}
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        >
          {imgs.map((src, i) => (
            <motion.button
              key={src}
              type="button"
              onClick={() => setOpen(i)}
              variants={{ hidden: { opacity: 0, clipPath: "inset(0 0 100% 0)" }, show: { opacity: 1, clipPath: "inset(0 0 0% 0)", transition: { duration: 1, ease } } }}
              className={`group relative overflow-hidden rounded-2xl bg-black ${i === 0 ? "col-span-2 row-span-2" : ""}`}
              aria-label={`Open photo ${i + 1}`}
            >
              <Image src={src} alt={`${service.name.en} — photo ${i + 1}`} fill quality={90} sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-[1.2s] group-hover:scale-110" />
              <span className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/35" />
              <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-white/90 text-[var(--ink)]">
                  <MagnifyingGlassPlus size={22} />
                </span>
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
          >
            <AnimatePresence mode="wait">
              <motion.div key={open} className="relative h-[78vh] w-full max-w-6xl" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.4, ease }} onClick={(e) => e.stopPropagation()}>
                <Image src={imgs[open]} alt={`${service.name.en} — photo ${open + 1}`} fill sizes="100vw" className="object-contain" />
              </motion.div>
            </AnimatePresence>
            <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="absolute end-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <X size={20} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo" className="absolute start-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <CaretLeft size={22} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo" className="absolute end-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20">
              <CaretRight size={22} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ─── Booking band ────────────────────────────────────────────────────── */
export function ServiceCTA({ service, locale }: { service: Service; locale: Locale }) {
  const d = serviceDetail(service.slug);
  return (
    <section className="relative overflow-hidden bg-black py-20 md:py-28">
      <motion.div className="absolute inset-0" initial={{ scale: 1.15 }} whileInView={{ scale: 1 }} viewport={{ once: false }} transition={{ duration: 2, ease }}>
        <Image src={d.gallery[3] ?? service.image} alt="" fill quality={90} sizes="100vw" className="object-cover opacity-45" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
      <motion.div
        className="relative container-site max-w-3xl text-center"
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, margin: "-10% 0px" }}
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
      >
        <motion.h2 variants={{ hidden: { opacity: 0, y: 24, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease } } }} className="font-display uppercase text-[clamp(2rem,4.6vw,3.6rem)] leading-[1.02] text-white">
          Let&apos;s Plan Your <span className="text-[var(--accent)]">Event</span>
        </motion.h2>
        <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}>
          <Ornament light className="mt-6" />
        </motion.div>
        <motion.p variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="mt-6 text-[16px] text-white/80">
          Tell us your date and guest count — we&apos;ll put together {service.name.en.toLowerCase()} and everything else you need in one proposal.
        </motion.p>
        <motion.div variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }} className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/booking" locale={locale} className="btn btn-primary">
            <CalendarCheck size={16} weight="bold" /> Check Availability
          </Link>
          <Link href="/enquiry" locale={locale} className="inline-flex items-center gap-2 rounded-[var(--radius-btn)] border border-white/40 px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-white hover:text-[var(--ink)]">
            <ChatCircleText size={16} /> Request a Quote
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── Other services ──────────────────────────────────────────────────── */
export function OtherServices({ service, services, locale }: { service: Service; services: Service[]; locale: Locale }) {
  const others = services.filter((s) => s.id !== service.id);
  return (
    <section className="section-y bg-[var(--bg)]">
      <div className="container-site">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Heading label="Explore More" center={false}>
            Other <span className="text-[var(--accent)]">Services</span>
          </Heading>
          <Link href="/services" locale={locale} className="inline-flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink)] hover:text-[var(--accent)]">
            All services <ArrowRight size={14} className="rtl:-scale-x-100" />
          </Link>
        </div>
        <motion.div
          className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.2 }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
        >
          {others.map((s) => {
            return (
              <motion.div key={s.id} variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}>
                <Link href={`/services/${s.slug}`} locale={locale} className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-black">
                  <Image src={s.image} alt={s.name.en} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover opacity-80 transition-all duration-700 group-hover:scale-110 group-hover:opacity-100" />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <span className="absolute start-4 top-4 grid h-11 w-11 place-items-center rounded-xl bg-white/15 text-white backdrop-blur-sm transition-colors duration-500 group-hover:bg-[var(--accent)]">
                    <ServiceIcon name={s.icon} size={22} weight="duotone" />
                  </span>
                  <span className="absolute inset-x-0 bottom-0 p-4">
                    <span className="block font-display text-[18px] uppercase leading-tight text-white">{s.name.en}</span>
                    <span className="mt-1 block max-h-0 overflow-hidden text-[12px] text-white/75 transition-all duration-500 group-hover:max-h-12">{s.tagline.en}</span>
                    <span className="mt-3 block h-[2px] w-8 bg-[var(--accent)] transition-all duration-500 group-hover:w-full" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
