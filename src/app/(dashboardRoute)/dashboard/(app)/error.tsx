"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Warning } from "@phosphor-icons/react";

/** Any page crash shows the real message here (sidebar stays usable) instead of a blank screen. */
export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="crm-card mx-auto mt-10 max-w-lg p-8 text-center">
      <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-crm-reserved-bg text-crm-reserved-ink">
        <Warning size={24} />
      </span>
      <p className="text-[16px] font-semibold text-crm-ink">This page couldn&apos;t load</p>
      <p className="mt-2 break-words rounded-[8px] bg-crm-surface-2 px-3 py-2 text-start font-mono text-[12.5px] text-crm-ink-2">{message}</p>
      <div className="mt-5 flex justify-center gap-2">
        <button type="button" onClick={() => retry()} className="crm-btn-primary h-10 rounded-[8px] px-4 text-[14px] font-medium">
          Try again
        </button>
        <Link href="/dashboard/admin/settings" className="inline-flex h-10 items-center rounded-[8px] border border-crm-line px-4 text-[14px] text-crm-ink">
          Reset demo data
        </Link>
      </div>
    </div>
  );
}
