import { cacheLife } from "next/cache";

/** Current year, prerendered and refreshed daily (avoids uncached `new Date()`). */
export async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
