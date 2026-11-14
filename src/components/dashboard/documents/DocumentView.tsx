"use client";
import type { DocBlock, DocModel } from "@/lib/crm/documents";
import { ICCB_FOOTER } from "@/lib/crm/documents";

const LOGO = "https://res.cloudinary.com/sgufp9aq/image/upload/v1794418824/iccb-logo.png";

function Block({ b }: { b: DocBlock }) {
  switch (b.type) {
    case "heading":
      return <h3 style={{ margin: "14px 0 6px", fontSize: "10.5pt", fontWeight: 700, color: "#EB2127", textTransform: "uppercase", letterSpacing: "0.06em" }}>{b.text}</h3>;
    case "text":
      return <p style={{ margin: "6px 0", color: b.muted ? "#8A8690" : "#2B2A2E", fontSize: b.muted ? "9pt" : "10pt" }}>{b.text}</p>;
    case "kv":
      return (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${b.cols ?? 2}, 1fr)`, gap: "6px 16px", margin: "6px 0" }}>
          {b.items.map(([k, v], i) => (
            <div key={i}>
              <div style={{ fontSize: "8pt", color: "#8A8690" }}>{k}</div>
              <div style={{ fontSize: "10pt", color: "#2B2A2E", fontWeight: 500 }}>{v || "—"}</div>
            </div>
          ))}
        </div>
      );
    case "amount":
      return (
        <div style={{ margin: "10px 0", padding: "10px 12px", border: "1px solid #F7A3A6", background: "#FEF2F3", borderRadius: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "10pt", color: "#55525A" }}>{b.label}</span>
            <span style={{ fontSize: "16pt", fontWeight: 700, color: "#2B2A2E" }}>{b.value}</span>
          </div>
          {b.words && <div style={{ marginTop: 4, fontSize: "9.5pt", fontStyle: "italic", color: "#55525A" }}>In words: {b.words}</div>}
        </div>
      );
    case "image":
      return (
        <div style={{ margin: "10px 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.src} alt={b.caption} style={{ height: 60, border: "1px solid #E8E6EA", borderRadius: 4, background: "#fff" }} />
          <div style={{ fontSize: "8pt", color: "#8A8690" }}>{b.caption}</div>
        </div>
      );
    case "table":
      return (
        <table style={{ margin: "6px 0" }}>
          <thead>
            <tr>
              {b.columns.map((c, i) => (
                <th key={i} style={{ width: c.width, textAlign: c.align === "end" ? "right" : c.align === "center" ? "center" : "left" }}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} style={{ textAlign: b.columns[j]?.align === "end" ? "right" : b.columns[j]?.align === "center" ? "center" : "left", whiteSpace: b.columns[j]?.align === "end" ? "nowrap" : undefined }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {b.foot && (
            <tfoot>
              {b.foot.map((f, i) => (
                <tr key={i}>
                  <td colSpan={b.columns.length - 1} style={{ textAlign: "right", fontWeight: f.strong ? 700 : 500, background: f.strong ? "#FEF2F3" : undefined }}>
                    {f.label}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: f.strong ? 700 : 500, whiteSpace: "nowrap", background: f.strong ? "#FEF2F3" : undefined }}>{f.value}</td>
                </tr>
              ))}
            </tfoot>
          )}
        </table>
      );
  }
}

/** Print-ready A4 page in ICCB format. */
export function DocumentView({ model }: { model: DocModel }) {
  return (
    <div className="doc-a4" style={{ position: "relative", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "3px solid #EB2127", paddingBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="ICCB" style={{ height: 46, width: 46, objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: "14pt", fontWeight: 700, color: "#2B2A2E", lineHeight: 1.15 }}>International Convention City Bashundhara</div>
            <div style={{ fontSize: "8.5pt", color: "#8A8690" }}>ICCB · A concern of Bashundhara Group</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "13pt", fontWeight: 700, color: "#EB2127", textTransform: "uppercase", letterSpacing: "0.04em" }}>{model.title}</div>
          <div style={{ fontSize: "9pt", color: "#55525A" }}>
            No: <strong>{model.number}</strong>
            {model.version ? ` · v${model.version}` : ""}
          </div>
          <div style={{ fontSize: "9pt", color: "#55525A" }}>Date: {model.date}</div>
        </div>
      </div>

      {/* Meta */}
      {model.meta.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 18px", margin: "12px 0 6px", padding: "10px 12px", background: "#FAFAFB", border: "1px solid #E8E6EA", borderRadius: 6 }}>
          {model.meta.map(([k, v]) => (
            <div key={k} style={{ display: "flex", gap: 6, fontSize: "9.5pt" }}>
              <span style={{ color: "#8A8690", minWidth: 120 }}>{k}:</span>
              <span style={{ color: "#2B2A2E", fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }}>
        {model.blocks.map((b, i) => (
          <Block key={i} b={b} />
        ))}
      </div>

      {/* Signatures */}
      {model.signatures.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${model.signatures.length}, 1fr)`, gap: 24, marginTop: 36 }}>
          {model.signatures.map((s) => (
            <div key={s} style={{ borderTop: "1px solid #55525A", paddingTop: 4, fontSize: "9pt", color: "#55525A", textAlign: "center" }}>
              {s}
            </div>
          ))}
        </div>
      )}
      {model.official && (
        <div style={{ marginTop: 14, display: "inline-block", alignSelf: "flex-end", border: "2px solid #12B76A", color: "#067647", borderRadius: 6, padding: "4px 10px", fontSize: "9pt", fontWeight: 700, transform: "rotate(-3deg)" }}>
          OFFICIAL USE: {model.official}
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 18, borderTop: "1px solid #E8E6EA", paddingTop: 6, fontSize: "8pt", color: "#8A8690", display: "flex", justifyContent: "space-between" }}>
        <span>ICCB, Kuril Bishwa Road, {ICCB_FOOTER}</span>
        <span>+88-02-41091551 · iccb@bga-bd.com</span>
      </div>
    </div>
  );
}
