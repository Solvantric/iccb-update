/**
 * PDF version of a DocModel (dynamically imported on "Download PDF").
 * Uses the built-in Helvetica font, so "৳" is written as "Tk" in PDFs.
 */
import { Document, Page, StyleSheet, Text, View, Image, pdf } from "@react-pdf/renderer";
import type { DocBlock, DocModel } from "@/lib/crm/documents";
import { ICCB_FOOTER } from "@/lib/crm/documents";

const BRAND = "#EB2127";
const INK = "#2B2A2E";
const MUTED = "#8A8690";
const LINE = "#D9D6DC";

const s = StyleSheet.create({
  page: { padding: 32, paddingBottom: 48, fontFamily: "Helvetica", fontSize: 9.5, color: INK, lineHeight: 1.4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 3, borderBottomColor: BRAND, paddingBottom: 8 },
  logoBox: { width: 38, height: 38, borderRadius: 6, backgroundColor: BRAND, alignItems: "center", justifyContent: "center", marginRight: 8 },
  logoText: { color: "#fff", fontFamily: "Helvetica-Bold", fontSize: 10 },
  org: { fontFamily: "Helvetica-Bold", fontSize: 12.5 },
  sub: { fontSize: 8, color: MUTED },
  title: { fontFamily: "Helvetica-Bold", fontSize: 12, color: BRAND, textAlign: "right", textTransform: "uppercase" },
  metaBox: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, marginBottom: 4, padding: 8, backgroundColor: "#FAFAFB", borderWidth: 1, borderColor: "#E8E6EA", borderRadius: 4 },
  metaItem: { width: "50%", flexDirection: "row", marginBottom: 2 },
  metaKey: { width: 100, color: MUTED },
  metaVal: { flex: 1, fontFamily: "Helvetica-Bold" },
  h: { marginTop: 10, marginBottom: 4, fontFamily: "Helvetica-Bold", fontSize: 9.5, color: BRAND, textTransform: "uppercase" },
  table: { borderWidth: 1, borderColor: LINE, marginVertical: 4 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE },
  th: { padding: 3, fontFamily: "Helvetica-Bold", fontSize: 8, backgroundColor: "#FEF2F3" },
  td: { padding: 3, fontSize: 8.5 },
  amount: { marginVertical: 8, padding: 8, backgroundColor: "#FEF2F3", borderWidth: 1, borderColor: "#F7A3A6", borderRadius: 4 },
  sigRow: { flexDirection: "row", marginTop: 30 },
  sig: { flex: 1, marginHorizontal: 10, borderTopWidth: 1, borderTopColor: "#55525A", paddingTop: 3, textAlign: "center", fontSize: 8.5, color: "#55525A" },
  footer: { position: "absolute", bottom: 18, left: 32, right: 32, borderTopWidth: 1, borderTopColor: "#E8E6EA", paddingTop: 4, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: MUTED },
});

const tk = (v: string) => v.replace(/৳\s?/g, "Tk ");

function colWidth(b: Extract<DocBlock, { type: "table" }>, i: number) {
  const w = b.columns[i]?.width;
  return w ? { width: w } : { flex: 1 };
}

function PdfBlock({ b }: { b: DocBlock }) {
  switch (b.type) {
    case "heading":
      return <Text style={s.h}>{b.text}</Text>;
    case "text":
      return <Text style={{ marginVertical: 3, color: b.muted ? MUTED : INK, fontSize: b.muted ? 8 : 9.5 }}>{tk(b.text)}</Text>;
    case "kv":
      return (
        <View style={{ flexDirection: "row", flexWrap: "wrap", marginVertical: 3 }}>
          {b.items.map(([k, v], i) => (
            <View key={i} style={{ width: `${100 / (b.cols ?? 2)}%`, marginBottom: 4, paddingRight: 6 }}>
              <Text style={{ fontSize: 7.5, color: MUTED }}>{k}</Text>
              <Text>{tk(v || "—")}</Text>
            </View>
          ))}
        </View>
      );
    case "amount":
      return (
        <View style={s.amount}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ color: "#55525A" }}>{b.label}</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 14 }}>{tk(b.value)}</Text>
          </View>
          {b.words && <Text style={{ marginTop: 3, fontFamily: "Helvetica-Oblique", fontSize: 8.5 }}>In words: {b.words}</Text>}
        </View>
      );
    case "image":
      return (
        <View style={{ marginVertical: 6 }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={b.src} style={{ height: 50, width: 150, objectFit: "contain" }} />
          <Text style={{ fontSize: 7.5, color: MUTED }}>{b.caption}</Text>
        </View>
      );
    case "table":
      return (
        <View style={s.table}>
          <View style={s.tr} fixed>
            {b.columns.map((c, i) => (
              <Text key={i} style={[s.th, colWidth(b, i), { textAlign: c.align === "end" ? "right" : "left" }]}>
                {c.label}
              </Text>
            ))}
          </View>
          {b.rows.map((r, ri) => (
            <View key={ri} style={s.tr} wrap={false}>
              {r.map((cell, ci) => (
                <Text key={ci} style={[s.td, colWidth(b, ci), { textAlign: b.columns[ci]?.align === "end" ? "right" : "left" }]}>
                  {tk(cell)}
                </Text>
              ))}
            </View>
          ))}
          {b.foot?.map((f, i) => (
            <View key={`f${i}`} style={[s.tr, { backgroundColor: f.strong ? "#FEF2F3" : undefined }]} wrap={false}>
              <Text style={[s.td, { flex: 1, textAlign: "right", fontFamily: f.strong ? "Helvetica-Bold" : "Helvetica" }]}>{f.label}</Text>
              <Text style={[s.td, { width: "22%", textAlign: "right", fontFamily: f.strong ? "Helvetica-Bold" : "Helvetica" }]}>{tk(f.value)}</Text>
            </View>
          ))}
        </View>
      );
  }
}

function PdfDoc({ model }: { model: DocModel }) {
  return (
    <Document title={`${model.title} ${model.number}`} author="ICCB" creator="ICCB CRM">
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={s.logoBox}>
              <Text style={s.logoText}>ICCB</Text>
            </View>
            <View>
              <Text style={s.org}>International Convention City Bashundhara</Text>
              <Text style={s.sub}>ICCB · A concern of Bashundhara Group</Text>
            </View>
          </View>
          <View>
            <Text style={s.title}>{model.title}</Text>
            <Text style={{ textAlign: "right", fontSize: 8.5 }}>
              No: {model.number}
              {model.version ? ` · v${model.version}` : ""}
            </Text>
            <Text style={{ textAlign: "right", fontSize: 8.5 }}>Date: {model.date}</Text>
          </View>
        </View>
        {model.meta.length > 0 && (
          <View style={s.metaBox}>
            {model.meta.map(([k, v]) => (
              <View key={k} style={s.metaItem}>
                <Text style={s.metaKey}>{k}:</Text>
                <Text style={s.metaVal}>{tk(v)}</Text>
              </View>
            ))}
          </View>
        )}
        {model.blocks.map((b, i) => (
          <PdfBlock key={i} b={b} />
        ))}
        {model.signatures.length > 0 && (
          <View style={s.sigRow} wrap={false}>
            {model.signatures.map((x) => (
              <Text key={x} style={s.sig}>
                {x}
              </Text>
            ))}
          </View>
        )}
        {model.official && <Text style={{ marginTop: 12, alignSelf: "flex-end", borderWidth: 2, borderColor: "#12B76A", color: "#067647", padding: 4, fontFamily: "Helvetica-Bold", fontSize: 8.5 }}>OFFICIAL USE: {model.official}</Text>}
        <View style={s.footer} fixed>
          <Text>ICCB, Kuril Bishwa Road, {ICCB_FOOTER}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber}/${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function renderPdf(model: DocModel): Promise<Blob> {
  return pdf(<PdfDoc model={model} />).toBlob();
}
