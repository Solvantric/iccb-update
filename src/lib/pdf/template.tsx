/**
 * The one shared A4 PDF template: ICCB logo + name on top, thin brand accent
 * line, address/phone footer. Loaded with a dynamic import on click.
 */
import { Document, Font, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import type { Settings } from "@/types/crm";
import type { DocBlock, DocModel } from "./model";

/* PDF colour constants mirror the design tokens (react-pdf can't read CSS variables). */
const BRAND = "#EB2127";
const INK = "#000000";
const BODY = "#30333F";
const MUTED = "#6D6E71";
const LINE = "#E9EAEA";
const SOFT = "#F7F7F7";
const TINT = "#FEF2F2";

const LOGO = "https://res.cloudinary.com/sgufp9aq/image/upload/v1794418824/iccb-logo.png";
const INTER = "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files";

let fontsRegistered = false;
function registerInter() {
  if (fontsRegistered) return;
  Font.register({
    family: "Inter",
    fonts: [
      { src: `${INTER}/inter-latin-400-normal.woff`, fontWeight: 400 },
      { src: `${INTER}/inter-latin-600-normal.woff`, fontWeight: 600 },
      { src: `${INTER}/inter-latin-700-normal.woff`, fontWeight: 700 },
    ],
  });
  Font.registerHyphenationCallback((w) => [w]);
  fontsRegistered = true;
}

function styles(family: string) {
  const bold = family === "Inter" ? { fontFamily: family, fontWeight: 600 as const } : { fontFamily: "Helvetica-Bold" };
  return {
    bold,
    s: StyleSheet.create({
      page: { paddingTop: 34, paddingHorizontal: 40, paddingBottom: 60, fontFamily: family, fontSize: 9.5, color: BODY, lineHeight: 1.45 },
      header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 12 },
      brand: { flexDirection: "row", alignItems: "center" },
      logo: { width: 34, height: 34, marginRight: 10, objectFit: "contain" },
      org: { ...bold, fontSize: 11, color: INK },
      orgSub: { fontSize: 8, color: MUTED, marginTop: 1 },
      accent: { height: 2, backgroundColor: BRAND, marginBottom: 18 },
      titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
      title: { ...bold, fontSize: 18, color: INK },
      metaRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 2 },
      metaKey: { color: MUTED, width: 64, textAlign: "right", marginRight: 8 },
      metaVal: { ...bold, color: INK, textAlign: "right", minWidth: 80 },
      h: { ...bold, fontSize: 10, color: INK, marginTop: 14, marginBottom: 6 },
      kvRow: { flexDirection: "row", flexWrap: "wrap" },
      kvKey: { fontSize: 7.5, color: MUTED, marginBottom: 1 },
      kvVal: { color: INK },
      table: { borderTopWidth: 1, borderTopColor: LINE, marginTop: 2 },
      tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE },
      th: { ...bold, fontSize: 8, color: MUTED, paddingVertical: 6, paddingHorizontal: 4, backgroundColor: SOFT },
      td: { paddingVertical: 6, paddingHorizontal: 4, color: BODY },
      tf: { ...bold, paddingVertical: 6, paddingHorizontal: 4, color: INK },
      totals: { alignSelf: "flex-end", width: "45%", marginTop: 8 },
      totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
      amount: { marginTop: 14, padding: 12, backgroundColor: TINT, borderRadius: 6 },
      sigRow: { flexDirection: "row", marginTop: 46 },
      sig: { flex: 1, marginHorizontal: 14, borderTopWidth: 1, borderTopColor: MUTED, paddingTop: 4, textAlign: "center", fontSize: 8.5, color: MUTED },
      footer: { position: "absolute", bottom: 24, left: 40, right: 40, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 6, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: MUTED },
    }),
  };
}

type Styles = ReturnType<typeof styles>;

function Block({ b, st }: { b: DocBlock; st: Styles }) {
  const { s, bold } = st;
  switch (b.type) {
    case "heading":
      return <Text style={s.h}>{b.text}</Text>;
    case "text":
      return <Text style={{ marginTop: 6, color: b.muted ? MUTED : BODY, fontSize: b.muted ? 8.5 : 9.5 }}>{b.text}</Text>;
    case "kv":
      return (
        <View style={s.kvRow}>
          {b.items.map(([k, v], i) => (
            <View key={i} style={{ width: `${100 / (b.cols ?? 2)}%`, paddingRight: 8, marginBottom: 8 }}>
              <Text style={s.kvKey}>{k}</Text>
              <Text style={s.kvVal}>{v || "—"}</Text>
            </View>
          ))}
        </View>
      );
    case "table": {
      const cell = (i: number) => {
        const c = b.columns[i];
        return { ...(c?.width ? { width: c.width } : { flex: 1 }), textAlign: c?.align === "right" ? ("right" as const) : ("left" as const) };
      };
      return (
        <View style={s.table}>
          <View style={s.tr} fixed>
            {b.columns.map((c, i) => (
              <Text key={i} style={[s.th, cell(i)]}>
                {c.label}
              </Text>
            ))}
          </View>
          {b.rows.map((r, ri) => (
            <View key={ri} style={s.tr} wrap={false}>
              {r.map((v, i) => (
                <Text key={i} style={[s.td, cell(i)]}>
                  {v}
                </Text>
              ))}
            </View>
          ))}
          {b.foot && (
            <View style={s.tr}>
              {b.foot.map((v, i) => (
                <Text key={i} style={[s.tf, cell(i)]}>
                  {v}
                </Text>
              ))}
            </View>
          )}
        </View>
      );
    }
    case "totals":
      return (
        <View style={s.totals}>
          {b.rows.map((r, i) => (
            <View key={i} style={[s.totalRow, r.strong ? { borderTopWidth: 1, borderTopColor: LINE, paddingTop: 5 } : {}]}>
              <Text style={r.strong ? { ...bold, color: INK } : { color: MUTED }}>{r.label}</Text>
              <Text style={r.strong ? { ...bold, color: INK } : { color: BODY }}>{r.value}</Text>
            </View>
          ))}
        </View>
      );
    case "amount":
      return (
        <View style={s.amount}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: BODY }}>{b.label}</Text>
            <Text style={{ ...bold, fontSize: 16, color: INK }}>{b.value}</Text>
          </View>
          {b.words && <Text style={{ marginTop: 4, fontSize: 8.5, color: MUTED }}>In words: {b.words}</Text>}
        </View>
      );
    case "signature":
      return (
        <View style={s.sigRow} wrap={false}>
          {b.labels.map((l) => (
            <Text key={l} style={s.sig}>
              {l}
            </Text>
          ))}
        </View>
      );
  }
}

function Doc({ model, org, family, logo }: { model: DocModel; org: Settings; family: string; logo: boolean }) {
  const st = styles(family);
  const { s } = st;
  return (
    <Document title={`${model.title} — ICCB`} author={org.orgName}>
      <Page size="A4" orientation={model.landscape ? "landscape" : "portrait"} style={s.page}>
        <View style={s.header} fixed>
          <View style={s.brand}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            {logo && <Image src={LOGO} style={s.logo} />}
            <View>
              <Text style={s.org}>{org.orgName}</Text>
              <Text style={s.orgSub}>{org.phone}</Text>
            </View>
          </View>
        </View>
        <View style={s.accent} fixed />
        <View style={s.titleRow}>
          <Text style={s.title}>{model.title}</Text>
          <View>
            {model.meta.map(([k, v]) => (
              <View key={k} style={s.metaRow}>
                <Text style={s.metaKey}>{k}</Text>
                <Text style={s.metaVal}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        {model.blocks.map((b, i) => (
          <Block key={i} b={b} st={st} />
        ))}
        <View style={s.footer} fixed>
          <Text>
            {org.address} · {org.phone}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

/** Render to a Blob. Tries Inter + logo first; falls back to Helvetica without network assets. */
export async function renderPdf(model: DocModel, org: Settings): Promise<Blob> {
  try {
    registerInter();
    return await pdf(<Doc model={model} org={org} family="Inter" logo />).toBlob();
  } catch {
    return await pdf(<Doc model={model} org={org} family="Helvetica" logo={false} />).toBlob();
  }
}
