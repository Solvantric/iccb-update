"use client";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { motion } from "framer-motion";
import {
  Buildings, ForkKnife, Sparkle, CalendarCheck, Crown, Package,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";

const SERVICES = [
  { slug: "venue-rental",      label: "Venue Rental",         icon: Buildings    },
  { slug: "catering",          label: "Catering",             icon: ForkKnife    },
  { slug: "decoration",        label: "Decoration",           icon: Sparkle      },
  { slug: "event-management",  label: "Event Management",     icon: CalendarCheck },
  { slug: "heritage-restaurant", label: "Heritage Restaurant", icon: Crown       },
  { slug: "expo-support",      label: "Expo & Trade Fair",    icon: Package      },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface ServiceStripProps { locale: Locale }

export function ServiceStrip({ locale }: ServiceStripProps) {
  return (
    <section className="bg-[var(--bg)] border-b border-[var(--line)]">
      <div className="container-wide">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 border-s border-[var(--line)]">
          {SERVICES.map(({ slug, label, icon: Icon }, i) => (
            <motion.div
              key={slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
            >
              <Link
                href={slug === "catering" ? "/menu" : `/services/${slug}`}
                locale={locale}
                className={cn(
                  "group flex flex-col items-center gap-3 py-7 px-4 border-e border-b lg:border-b-0 border-[var(--line)]",
                  "transition-colors duration-200 relative overflow-hidden",
                  "hover:bg-[var(--bg-tint)]"
                )}
              >
                {/* Red bar grows from center bottom on hover */}
                <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[var(--accent)] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />

                {/* Icon */}
                <motion.span
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="inline-flex"
                >
                  <Icon
                    size={40}
                    weight="duotone"
                    className="text-[var(--accent)] group-hover:text-[var(--accent-deep)] transition-colors duration-200"
                  />
                </motion.span>

                {/* Label */}
                <span className="text-[13px] font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors duration-200 text-center leading-tight">
                  {label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
