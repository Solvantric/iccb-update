"use client";
import { analyticsService } from "@/services/analytics.service";

const VISITOR_KEY = "iccb_visitor_id";
const SESSION_KEY = "iccb_session_id";
const CONSENT_KEY = "iccb_analytics_consent";

function getOrCreate(key: string, generator: () => string): string {
  if (typeof window === "undefined") return "";
  let val = localStorage.getItem(key);
  if (!val) {
    val = generator();
    localStorage.setItem(key, val);
  }
  return val;
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getUTMParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  return utm;
}

export function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "true";
}

export function giveConsent(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, "true");
}

export function revokeConsent(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, "false");
}

export function getVisitorId(): string {
  return getOrCreate(VISITOR_KEY, generateId);
}

export function getSessionId(): string {
  return getOrCreate(SESSION_KEY, generateId);
}

export function track(
  event: string,
  meta?: Record<string, unknown>,
  options?: { leadId?: string }
): void {
  const visitorId = getVisitorId();
  const sessionId = getSessionId();
  const locale = typeof window !== "undefined"
    ? document.documentElement.lang || "en"
    : "en";

  analyticsService.track({
    event,
    visitorId,
    sessionId,
    locale,
    page: typeof window !== "undefined" ? window.location.pathname : undefined,
    leadId: options?.leadId,
    meta: { ...getUTMParams(), ...meta },
  });
}

export function trackPageView(): void {
  track("page_view");
}
