"use client";
import { useEffect } from "react";
import { create } from "zustand";
import { CircleNotch, DownloadSimple, ArrowSquareOut } from "@phosphor-icons/react";
import { downloadPdf, pdfBlobUrl, type DocModel } from "@/lib/pdf";
import { Button } from "./core";
import { Modal } from "./overlay";

interface ViewerState {
  model: DocModel | null;
  url: string | null;
  error: string | null;
  open: (model: DocModel) => void;
  close: () => void;
}

/** One PDF viewer for the whole dashboard: `usePdfViewer.getState().open(model)`. */
export const usePdfViewer = create<ViewerState>((set, get) => ({
  model: null,
  url: null,
  error: null,
  open: (model) => {
    const prev = get().url;
    if (prev) URL.revokeObjectURL(prev);
    set({ model, url: null, error: null });
    pdfBlobUrl(model)
      .then((url) => (get().model === model ? set({ url }) : URL.revokeObjectURL(url)))
      .catch((e) => set({ error: e instanceof Error ? e.message : "Couldn't create the PDF" }));
  },
  close: () => {
    const prev = get().url;
    if (prev) URL.revokeObjectURL(prev);
    set({ model: null, url: null, error: null });
  },
}));

export const viewPdf = (model: DocModel) => usePdfViewer.getState().open(model);

export function PdfViewer() {
  const { model, url, error, close } = usePdfViewer();
  useEffect(() => () => usePdfViewer.getState().close(), []);
  return (
    <Modal
      open={!!model}
      onOpenChange={(v) => !v && close()}
      size="xl"
      title={model?.title ?? "PDF"}
      description={model?.fileName}
      footer={
        <>
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-[8px] px-4 text-[14px] font-medium text-crm-ink-2 transition-colors hover:bg-crm-surface-2">
              <ArrowSquareOut size={17} /> Open in new tab
            </a>
          )}
          <Button variant="primary" icon={DownloadSimple} disabled={!model} onClick={() => model && downloadPdf(model)}>
            Download
          </Button>
        </>
      }
    >
      <div className="h-[70vh] overflow-hidden rounded-[10px] border border-crm-line bg-crm-surface-2">
        {error ? (
          <p className="p-6 text-[14px] text-crm-danger">{error}</p>
        ) : url ? (
          <iframe src={url} title={model?.title ?? "PDF preview"} className="h-full w-full" />
        ) : (
          <div className="grid h-full place-items-center text-[14px] text-crm-muted">
            <span className="flex items-center gap-2">
              <CircleNotch size={18} className="animate-spin" /> Preparing PDF…
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
