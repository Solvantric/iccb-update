"use client";
/**
 * "Shortcut" translation for every public page: when the visitor picks বাংলা / العربية / 中文, Google's
 * website translator translates whatever text the page has (English source). Content we translated by hand
 * (the home page) is marked `translate="no"` so Google leaves it alone. Switching back to English clears it.
 */
import { useEffect } from "react";
import type { Locale } from "@/lib/i18n/routing";

const TARGET: Partial<Record<Locale, string>> = { bn: "bn", ar: "ar", zh: "zh-CN" };

declare global {
  interface Window {
    google?: { translate?: { TranslateElement: new (opts: Record<string, unknown>, id: string) => unknown } };
    googleTranslateElementInit?: () => void;
  }
}

function setCookie(value: string | null) {
  const host = window.location.hostname;
  const base = value ? `googtrans=${value}; path=/` : "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = base;
  document.cookie = `${base}; domain=${host}`;
  document.cookie = `${base}; domain=.${host.split(".").slice(-2).join(".")}`;
}

/** Google wraps text in <font> tags, which can make React crash when it later removes nodes. Make removals tolerant. */
function patchDomForTranslate() {
  const w = window as unknown as { __gtPatched?: boolean };
  if (w.__gtPatched) return;
  w.__gtPatched = true;
  const remove = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return remove.call(this, child) as T;
  };
  const insert = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return insert.call(this, node, null) as T;
    return insert.call(this, node, ref) as T;
  };
}

function applyLanguage(target: string) {
  const combo = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
  if (!combo) return false;
  if (combo.value !== target) {
    combo.value = target;
    combo.dispatchEvent(new Event("change"));
  }
  return true;
}

export function AutoTranslate({ locale }: { locale: Locale }) {
  useEffect(() => {
    const target = TARGET[locale];
    const translated = document.documentElement.classList.contains("translated-ltr") || document.documentElement.classList.contains("translated-rtl");

    if (!target) {
      // English: drop Google's translation if it was on
      if (document.cookie.includes("googtrans=")) setCookie(null);
      if (translated) window.location.reload();
      return;
    }

    patchDomForTranslate();
    setCookie(`/en/${target}`);

    if (window.google?.translate) {
      // widget already loaded — just switch language
      let tries = 0;
      const t = setInterval(() => {
        if (applyLanguage(target) || ++tries > 20) clearInterval(t);
      }, 150);
      return () => clearInterval(t);
    }

    window.googleTranslateElementInit = () => {
      if (!window.google?.translate) return;
      new window.google.translate.TranslateElement({ pageLanguage: "en", includedLanguages: "bn,ar,zh-CN", autoDisplay: false }, "google_translate_element");
    };
    if (!document.getElementById("google-translate-script")) {
      const s = document.createElement("script");
      s.id = "google-translate-script";
      s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      s.async = true;
      document.body.appendChild(s);
    }
  }, [locale]);

  return <div id="google_translate_element" className="hidden" aria-hidden />;
}
