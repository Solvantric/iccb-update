"use client";
import { toast } from "sonner";
import { getSettings } from "@/lib/crm/db";
import type { DocModel } from "./model";

export * from "./model";

/** Build the PDF on click (dynamic import keeps @react-pdf out of the page bundle) and download it. */
export async function downloadPdf(model: DocModel) {
  const id = toast.loading(`Preparing ${model.fileName}…`);
  try {
    const { renderPdf } = await import("./template");
    const blob = await renderPdf(model, getSettings());
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = model.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    toast.success(`${model.fileName} downloaded`, { id });
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Couldn't create the PDF", { id });
  }
}
