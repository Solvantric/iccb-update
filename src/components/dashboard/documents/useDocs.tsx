"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { DocKind, Invoice } from "@/types/crm";
import { buildDocModel, type DocModel } from "@/lib/crm/documents";
import { docInputFor } from "@/services/crm/bookings.service";
import { DocumentViewer, downloadPdf, printDoc } from "./DocumentViewer";

/** Model for a saved document version (frozen snapshot, or rebuilt for seed records). */
export function modelForInvoice(inv: Invoice): DocModel {
  if (inv.snapshot) return inv.snapshot as DocModel;
  return buildDocModel(inv.kind, docInputFor(inv.bookingId, inv.number, { version: inv.version, paymentId: inv.paymentId, generatedAt: inv.createdAt }));
}

export function liveModel(bookingId: string, kind: DocKind, number = "DRAFT", paymentId?: string): DocModel {
  return buildDocModel(kind, docInputFor(bookingId, number, { paymentId }));
}

/** Preview / print / download any document from anywhere. */
export function useDocs() {
  const [model, setModel] = useState<DocModel | null>(null);
  const safe = (fn: () => DocModel) => {
    try {
      return fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't build the document");
      return null;
    }
  };
  return {
    viewer: <DocumentViewer model={model} onClose={() => setModel(null)} />,
    preview: (inv: Invoice) => setModel(safe(() => modelForInvoice(inv))),
    previewLive: (bookingId: string, kind: DocKind, number?: string, paymentId?: string) => setModel(safe(() => liveModel(bookingId, kind, number, paymentId))),
    download: async (inv: Invoice) => {
      const m = safe(() => modelForInvoice(inv));
      if (!m) return;
      const id = toast.loading("Preparing PDF…");
      try {
        await downloadPdf(m);
        toast.success("PDF downloaded", { id });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "PDF failed", { id });
      }
    },
    print: (inv: Invoice) => {
      const m = safe(() => modelForInvoice(inv));
      if (m) printDoc(m);
    },
  };
}
