"use client";
import { useState } from "react";
import { DownloadSimple, Printer } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { DocModel } from "@/lib/crm/documents";
import { downloadFile } from "@/lib/crm/db";
import { Button } from "../ui/core";
import { Modal } from "../ui/overlay";
import { DocumentView } from "./DocumentView";

/** Download a DocModel as PDF — react-pdf is loaded only on click. */
export async function downloadPdf(model: DocModel) {
  const { renderPdf } = await import("./pdf");
  const blob = await renderPdf(model);
  downloadFile(`${model.title.replace(/\s+/g, "-")}-${model.number}${model.version ? `-v${model.version}` : ""}.pdf`, blob, "application/pdf");
}

/** Print only the document: render it into a print root, then window.print(). */
export function printDoc(model: DocModel) {
  const host = document.createElement("div");
  host.className = "doc-print-root";
  document.body.appendChild(host);
  import("react-dom/client").then(({ createRoot }) => {
    const root = createRoot(host);
    root.render(<DocumentView model={model} />);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        root.unmount();
        host.remove();
      }, 300);
    }, 350);
  });
}

export function DocumentViewer({ model, onClose }: { model: DocModel | null; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={!!model}
      onOpenChange={(v) => !v && onClose()}
      size="xl"
      title={model ? `${model.title} · ${model.number}${model.version ? ` (v${model.version})` : ""}` : ""}
      description="Print-ready A4 preview"
      footer={
        model && (
          <>
            <Button icon={Printer} onClick={() => printDoc(model)}>
              Print
            </Button>
            <Button
              variant="primary"
              icon={DownloadSimple}
              loading={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await downloadPdf(model);
                  toast.success("PDF downloaded");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "PDF failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Download PDF
            </Button>
          </>
        )
      }
    >
      {model && (
        <div className="overflow-auto rounded-lg bg-crm-surface-2 p-3 sm:p-6">
          <div className="origin-top-left [zoom:0.62] sm:[zoom:0.85] lg:[zoom:1]">
            <DocumentView model={model} />
          </div>
        </div>
      )}
    </Modal>
  );
}

