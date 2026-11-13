import type { Metadata } from "next";
import { Suspense } from "react";
import { CrmRoot } from "@/components/dashboard/CrmRoot";

export const metadata: Metadata = {
  title: { default: "ICCB CRM", template: "%s — ICCB CRM" },
  robots: { index: false, follow: false },
};

/**
 * The dashboard is client-rendered (data lives in localStorage) and its shell
 * reads URL data (usePathname / useParams / useSearchParams). With
 * `cacheComponents` enabled, that must sit inside a <Suspense> boundary so
 * prerendering can stream it instead of failing the build.
 */
export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="crm min-h-screen w-full" />}>
      <CrmRoot>{children}</CrmRoot>
    </Suspense>
  );
}
