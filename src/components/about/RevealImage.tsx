"use client";
/** Image that "opens" (clip-path wipe + zoom-out) when its RevealGroup/RevealItem becomes visible. */
import Image from "next/image";
import { motion } from "framer-motion";

export function RevealImage({ src, alt, className = "", sizes = "300px" }: { src: string; alt: string; className?: string; sizes?: string }) {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      variants={{
        hidden: { clipPath: "inset(0 0 100% 0)" },
        visible: { clipPath: "inset(0 0 0% 0)", transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
      }}
    >
      <motion.div
        className="absolute inset-0"
        variants={{ hidden: { scale: 1.25 }, visible: { scale: 1, transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] } } }}
      >
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover transition-transform duration-700 group-hover:scale-110" />
      </motion.div>
    </motion.div>
  );
}
