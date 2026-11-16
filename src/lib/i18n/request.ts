import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

type Messages = Record<string, unknown>;

/** Fill any key missing in a translation with the English text, so a missing key never breaks a page. */
function withFallback(base: Messages, local: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(local)) {
    const b = base[k];
    out[k] =
      v && typeof v === "object" && !Array.isArray(v) && b && typeof b === "object" && !Array.isArray(b)
        ? withFallback(b as Messages, v as Messages)
        : v;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as (typeof routing.locales)[number])) {
    locale = routing.defaultLocale;
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default as Messages;
  if (locale === routing.defaultLocale) return { locale, messages };

  const english = (await import(`../../../messages/en.json`)).default as Messages;
  return { locale, messages: withFallback(english, messages) };
});
