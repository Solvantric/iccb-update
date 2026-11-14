"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ChatCircleDots, Plus, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { useChatStore } from "@/components/chatbot/chat-store";

// WhatsApp SVG glyph
function WhatsAppIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

interface FloatingDockProps {
  whatsappNumber?: string;
  phone?: string;
  onChatOpen?: () => void;
}

export function FloatingDock({ whatsappNumber, phone, onChatOpen }: FloatingDockProps) {
  const [expanded, setExpanded] = useState(false);
  const toggleChat = useChatStore((s) => s.toggle);
  const wa = whatsappNumber || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8801991197719";
  const tel = phone || process.env.NEXT_PUBLIC_PHONE_PRIMARY || "+88-02-41091551";
  const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent("Hello, I'd like to enquire about an event at ICCB.")}`;

  const dockItems = [
    {
      icon: <WhatsAppIcon size={22} />,
      label: "WhatsApp",
      href: waUrl,
      color: "#25D366",
      target: "_blank" as const,
    },
    {
      icon: <Phone size={22} weight="light" />,
      label: "Call us",
      href: `tel:${tel.replace(/\s/g, "")}`,
      color: "var(--accent)",
    },
    {
      icon: <ChatCircleDots size={22} weight="light" />,
      label: "AI Chat",
      onClick: () => {
        setExpanded(false);
        if (onChatOpen) onChatOpen();
        else toggleChat();
      },
      color: "var(--accent)",
    },
  ];

  return (
    <div className="fixed bottom-6 end-6 z-40 flex flex-col items-end gap-3 no-print">
      {/* Mobile: FAB expand */}
      <div className="md:hidden">
        <AnimatePresence>
          {expanded && (
            <>
              {dockItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className="flex items-center gap-3 mb-3"
                >
                  <span className="bg-[var(--surface)] text-[var(--ink)] text-[12px] px-3 py-1.5 rounded-full shadow-sm border border-[var(--line)] whitespace-nowrap">
                    {item.label}
                  </span>
                  {item.href ? (
                    <a
                      href={item.href}
                      target={item.target}
                      rel={item.target ? "noopener noreferrer" : undefined}
                      className="w-13 h-13 rounded-full flex items-center justify-center shadow-lg border border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-md text-[var(--ink)] hover:scale-110 transition-transform"
                      style={{ "--hover-color": item.color } as React.CSSProperties}
                    >
                      {item.icon}
                    </a>
                  ) : (
                    <button
                      onClick={item.onClick}
                      className="w-13 h-13 rounded-full flex items-center justify-center shadow-lg border border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-md text-[var(--ink)] hover:scale-110 transition-transform"
                    >
                      {item.icon}
                    </button>
                  )}
                </motion.div>
              ))}
            </>
          )}
        </AnimatePresence>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-14 h-14 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shadow-lg hover:bg-[var(--accent-hover)] transition-colors"
          aria-label={expanded ? "Close contact options" : "Open contact options"}
          style={{ boxShadow: "0 8px 30px rgba(235,33,39,.35)" }}
        >
          {expanded ? <X size={22} /> : <Plus size={22} />}
        </button>
      </div>

      {/* Desktop: always visible dock — buttons share one vertical axis */}
      <div className="hidden md:flex flex-col items-end gap-3">
        {dockItems.map((item, i) => (
          <div key={i} className="group relative flex items-center">
            <span
              className="absolute end-full me-3 top-1/2 -translate-y-1/2 bg-[var(--surface)] text-[var(--ink)] text-[12px] px-3 py-1.5 rounded-full shadow-sm border border-[var(--line)] whitespace-nowrap opacity-0 translate-x-2 rtl:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none"
            >
              {item.label}
            </span>
            {item.href ? (
              <a
                href={item.href}
                target={item.target}
                rel={item.target ? "noopener noreferrer" : undefined}
                aria-label={item.label}
                className={cn(
                  "w-[52px] h-[52px] rounded-full flex items-center justify-center",
                  "bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--line)]",
                  "text-[var(--ink)] hover:text-[var(--accent)]",
                  "hover:scale-110 hover:shadow-[0_8px_30px_rgba(235,33,39,.35)]",
                  "transition-all duration-300 shadow-sm"
                )}
              >
                {item.icon}
              </a>
            ) : (
              <button
                onClick={item.onClick}
                aria-label={item.label}
                className={cn(
                  "w-[52px] h-[52px] rounded-full flex items-center justify-center",
                  "bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--line)]",
                  "text-[var(--ink)] hover:text-[var(--accent)]",
                  "hover:scale-110 hover:shadow-[0_8px_30px_rgba(235,33,39,.35)]",
                  "transition-all duration-300 shadow-sm"
                )}
              >
                {item.icon}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
