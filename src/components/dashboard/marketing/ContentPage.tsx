"use client";
import { useMemo, useState } from "react";
import { Reorder } from "framer-motion";
import { ArrowSquareOut, DotsSixVertical, Eye, EyeSlash, ImageSquare, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { ContentItem, ContentSection } from "@/types/crm";
import { CONTENT_SECTIONS } from "@/types/crm";
import { db, useRole } from "@/lib/crm/db";
import { can } from "@/lib/crm/permissions";
import { useContent, useCrmCreate, useCrmRemove, useCrmUpdate } from "@/services/crm/hooks";
import { withLatency } from "@/services/crm/base";
import { cn } from "@/lib/utils/cn";
import { Item, Stagger } from "../ui/motion";
import { Badge, Button, EmptyState, Field, Input, PageHeader, Skeleton, Switch, Textarea } from "../ui/core";
import { Drawer, useConfirm } from "../ui/overlay";
import { Tabs } from "../ui/tabs";

const SECTION_LABEL: Record<ContentSection, string> = { hero: "Hero slides", venues: "Venues", services: "Services", ventures: "Ventures", menu: "Menu packages", gallery: "Gallery", news: "News", faq: "FAQ", testimonials: "Testimonials", expo_clients: "Expo clients" };
const PUBLIC_PATH: Record<ContentSection, string> = { hero: "/", venues: "/venues", services: "/services", ventures: "/ventures", menu: "/menu", gallery: "/gallery", news: "/news", faq: "/faq", testimonials: "/", expo_clients: "/expo-zone" };
const FIELD_HINT: Partial<Record<ContentSection, { title: string; subtitle: string; body: string }>> = {
  faq: { title: "Question", subtitle: "Category", body: "Answer" },
  testimonials: { title: "Name", subtitle: "Role, organization", body: "Quote" },
  news: { title: "Headline", subtitle: "Category", body: "Excerpt" },
};

function PreviewCard({ item }: { item: Partial<ContentItem> }) {
  const isFaq = item.section === "faq";
  return (
    <div className="overflow-hidden rounded-xl border border-crm-line bg-crm-surface shadow-sm">
      {item.image && !isFaq ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={item.title ?? ""} className="aspect-[16/9] w-full object-cover" />
      ) : !isFaq ? (
        <div className="grid aspect-[16/9] place-items-center bg-crm-surface-2 text-crm-muted">
          <ImageSquare size={36} weight="duotone" />
        </div>
      ) : null}
      <div className="p-4">
        {item.subtitle && <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-crm-brand">{item.subtitle}</p>}
        <p className="mt-1 text-[15px] font-bold text-crm-ink">{item.title || "Untitled"}</p>
        {item.body && <p className="mt-1.5 line-clamp-4 text-[13px] text-crm-ink-2">{item.body}</p>}
        {!item.published && <Badge tone="grey" className="mt-3">Draft — hidden on site</Badge>}
      </div>
    </div>
  );
}

function Editor({ item, section, onClose }: { item?: ContentItem; section: ContentSection; onClose: () => void }) {
  const [v, setV] = useState<Partial<ContentItem>>(() => item ?? { section, title: "", subtitle: "", body: "", image: "", href: "", published: false });
  const create = useCrmCreate<ContentItem>("content", "Content created");
  const update = useCrmUpdate<ContentItem>("content", "Content saved");
  const hint = FIELD_HINT[section];
  const save = () => {
    if (!v.title?.trim()) return toast.error("Title is required");
    if (item) update.mutate({ id: item.id, patch: v }, { onSuccess: onClose });
    else {
      const order = Math.max(0, ...db.content.active().filter((c) => c.section === section).map((c) => c.order)) + 1;
      create.mutate({ section, title: v.title!, subtitle: v.subtitle, body: v.body, image: v.image, href: v.href, published: !!v.published, order }, { onSuccess: onClose });
    }
  };
  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      title={item ? "Edit content" : `New ${SECTION_LABEL[section].replace(/s$/, "").toLowerCase()}`}
      description={SECTION_LABEL[section]}
      width={720}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={create.isPending || update.isPending} onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <Field label={hint?.title ?? "Title"} required>
            <Input value={v.title ?? ""} onChange={(e) => setV((s) => ({ ...s, title: e.target.value }))} autoFocus />
          </Field>
          <Field label={hint?.subtitle ?? "Subtitle"}>
            <Input value={v.subtitle ?? ""} onChange={(e) => setV((s) => ({ ...s, subtitle: e.target.value }))} />
          </Field>
          <Field label={hint?.body ?? "Body"}>
            <Textarea value={v.body ?? ""} onChange={(e) => setV((s) => ({ ...s, body: e.target.value }))} className="min-h-[120px]" />
          </Field>
          {section !== "faq" && (
            <Field label="Image URL" hint="Unsplash, Cloudinary or /images/... paths">
              <Input value={v.image ?? ""} onChange={(e) => setV((s) => ({ ...s, image: e.target.value }))} />
            </Field>
          )}
          <Field label="Link">
            <Input value={v.href ?? ""} onChange={(e) => setV((s) => ({ ...s, href: e.target.value }))} placeholder="/booking" />
          </Field>
          <Switch checked={!!v.published} onChange={(p) => setV((s) => ({ ...s, published: p }))} label={v.published ? "Published" : "Draft"} />
        </div>
        <div>
          <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-crm-muted">Live preview</p>
          <PreviewCard item={{ ...v, section }} />
        </div>
      </div>
    </Drawer>
  );
}

export function ContentPage() {
  const role = useRole();
  const content = useContent();
  const confirm = useConfirm();
  const [section, setSection] = useState<ContentSection>("hero");
  const [editor, setEditor] = useState<{ item?: ContentItem; key: number } | null>(null);
  const update = useCrmUpdate<ContentItem>("content");
  const remove = useCrmRemove("content", "Content item");
  const canEdit = can(role, "update", "content");

  const items = useMemo(() => (content.data ?? []).filter((c) => c.section === section).sort((a, b) => a.order - b.order), [content.data, section]);
  const [order, setOrder] = useState<string[] | null>(null);
  const ordered = order ? (order.map((id) => items.find((i) => i.id === id)).filter(Boolean) as ContentItem[]) : items;

  const commitOrder = async () => {
    if (!order) return;
    await withLatency(() => order.forEach((id, i) => db.content.update(id, { order: i + 1 }, { silent: true })));
    setOrder(null);
    toast.success("Order saved");
  };

  return (
    <Stagger>
      <Item>
        <PageHeader
          eyebrow="Marketing"
          title="Website content"
          description="Edit what the public website shows. Drag to reorder, toggle publish/draft — changes appear on the site (same browser) instantly."
          actions={
            <>
              <a href={`/en${PUBLIC_PATH[section]}`} target="_blank" rel="noreferrer">
                <Button icon={ArrowSquareOut}>View on site</Button>
              </a>
              {canEdit && (
                <Button variant="primary" icon={Plus} onClick={() => setEditor({ key: Date.now() })}>
                  Add {SECTION_LABEL[section].replace(/s$/, "").toLowerCase()}
                </Button>
              )}
            </>
          }
        />
      </Item>
      <Item>
        <Tabs
          tabs={CONTENT_SECTIONS.map((s) => ({ value: s, label: SECTION_LABEL[s], count: (content.data ?? []).filter((c) => c.section === s).length }))}
          value={section}
          onChange={(s) => {
            setSection(s);
            setOrder(null);
          }}
          className="mb-5"
        />
      </Item>
      <Item>
        {content.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="crm-card">
            <EmptyState icon={ImageSquare} title={`No ${SECTION_LABEL[section].toLowerCase()} yet`} action={canEdit && <Button variant="primary" icon={Plus} onClick={() => setEditor({ key: Date.now() })}>Add the first one</Button>} />
          </div>
        ) : (
          <>
            {order && (
              <div className="mb-3 flex items-center justify-between rounded-xl bg-crm-tint px-4 py-2.5 text-[13px] text-crm-ink">
                Order changed
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setOrder(null)}>
                    Reset
                  </Button>
                  <Button size="sm" variant="primary" onClick={commitOrder}>
                    Save order
                  </Button>
                </div>
              </div>
            )}
            <Reorder.Group axis="y" values={ordered.map((i) => i.id)} onReorder={(ids) => canEdit && setOrder(ids)} className="space-y-2.5">
              {ordered.map((c) => (
                <Reorder.Item key={c.id} value={c.id} className="crm-card flex items-center gap-3 p-3 active:shadow-[var(--crm-shadow-lg)]" whileDrag={{ scale: 1.02 }}>
                  {canEdit && <DotsSixVertical size={20} className="shrink-0 cursor-grab text-crm-muted active:cursor-grabbing" />}
                  {c.image && section !== "faq" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" draggable={false} />
                  ) : (
                    <span className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-crm-surface-2 text-crm-muted">
                      <ImageSquare size={22} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-[14px] font-semibold", c.published ? "text-crm-ink" : "text-crm-muted")}>{c.title}</p>
                    <p className="truncate text-[12.5px] text-crm-muted">{c.subtitle || c.body}</p>
                  </div>
                  <Badge tone={c.published ? "green" : "grey"}>{c.published ? "Published" : "Draft"}</Badge>
                  {canEdit && (
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon-sm" variant="ghost" aria-label={c.published ? "Unpublish" : "Publish"} title={c.published ? "Unpublish" : "Publish"} onClick={() => update.mutate({ id: c.id, patch: { published: !c.published } })}>
                        {c.published ? <EyeSlash size={15} /> : <Eye size={15} />}
                      </Button>
                      <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={() => setEditor({ item: c, key: Date.now() })}>
                        <PencilSimple size={15} />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Delete"
                        onClick={async () => {
                          const r = await confirm({ title: `Delete “${c.title}”?`, tone: "danger", confirmLabel: "Delete" });
                          if (r.ok) remove.mutate(c.id);
                        }}
                      >
                        <Trash size={15} />
                      </Button>
                    </div>
                  )}
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </>
        )}
      </Item>
      {editor && <Editor key={editor.key} item={editor.item} section={section} onClose={() => setEditor(null)} />}
    </Stagger>
  );
}
