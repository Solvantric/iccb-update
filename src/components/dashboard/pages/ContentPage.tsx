"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Reorder, useDragControls } from "framer-motion";
import { DotsSixVertical, ImageSquare, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import type { ContentItem, ContentSection } from "@/types/crm";
import { db } from "@/lib/crm/db";
import { reorderContent } from "@/services/crm";
import { isAllowedImage } from "@/lib/crm/cms";
import { Button, EmptyState, Field, FilterRow, Input, PageHeader, SearchInput, Switch, Textarea } from "../ui/core";
import { FilterSelect } from "../ui/filters";
import { Tabs } from "../ui/data";
import { Modal, useConfirm } from "../ui/overlay";

const SECTIONS: { value: ContentSection; label: string; singular: string; image: boolean; body: boolean; subtitle: string }[] = [
  { value: "hero", label: "Hero slides", singular: "slide", image: true, body: false, subtitle: "Subtitle" },
  { value: "venues", label: "Venues", singular: "venue", image: true, body: true, subtitle: "Capacity line" },
  { value: "gallery", label: "Gallery", singular: "image", image: true, body: false, subtitle: "Caption" },
  { value: "faq", label: "FAQ", singular: "question", image: false, body: true, subtitle: "Category" },
  { value: "testimonials", label: "Testimonials", singular: "testimonial", image: false, body: true, subtitle: "Role / organisation" },
];

const safeImage = isAllowedImage;

function Row({ item, onEdit, onDelete, onDragEnd }: { item: ContentItem; onEdit: () => void; onDelete: () => void; onDragEnd: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={item} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} className="relative flex items-center gap-3 border-b border-crm-line bg-crm-surface px-3 py-3 last:border-0 sm:px-4" whileDrag={{ scale: 1.01, boxShadow: "var(--crm-shadow-hover)", zIndex: 5 }}>
      <button type="button" onPointerDown={(e) => controls.start(e)} className="grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center text-crm-muted active:cursor-grabbing" aria-label="Drag to reorder">
        <DotsSixVertical size={18} weight="bold" />
      </button>
      {item.image !== undefined || item.section === "hero" || item.section === "gallery" ? (
        <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-[8px] bg-crm-surface-2">
          {safeImage(item.image) ? <Image src={item.image!} alt="" fill sizes="64px" className="object-cover" /> : <ImageSquare size={18} className="absolute inset-0 m-auto text-crm-muted" />}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-crm-ink">{item.title}</p>
        <p className="truncate text-[12.5px] text-crm-muted">{item.subtitle || item.body || "—"}</p>
      </div>
      <span className="hidden text-[12px] text-crm-muted sm:inline">{item.published ? "Published" : "Hidden"}</span>
      <Switch checked={item.published} onChange={(v) => db.content.update(item.id, { published: v })} label="Published" />
      <Button size="icon-sm" variant="ghost" aria-label="Edit" onClick={onEdit}>
        <PencilSimple size={16} />
      </Button>
      <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={onDelete}>
        <Trash size={16} />
      </Button>
    </Reorder.Item>
  );
}

export function ContentPage() {
  const all = db.content.store((s) => s.items);
  const confirm = useConfirm();
  const [section, setSection] = useState<ContentSection>("hero");
  const [editing, setEditing] = useState<Partial<ContentItem> | null>(null);
  const meta = SECTIONS.find((s) => s.value === section)!;
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const sectionItems = useMemo(() => all.filter((c) => c.section === section).sort((a, b) => a.order - b.order), [all, section]);
  const filtering = !!q.trim() || !!status;
  const items = useMemo(() => {
    const n = q.trim().toLowerCase();
    return sectionItems.filter((c) => (!status || (status === "published") === c.published) && (!n || [c.title, c.subtitle, c.body].join(" ").toLowerCase().includes(n)));
  }, [sectionItems, q, status]);
  // Local order while dragging; resets whenever the stored items change.
  const [drag, setDrag] = useState<{ src: ContentItem[]; list: ContentItem[] }>({ src: items, list: items });
  const order = drag.src === items ? drag.list : items;

  const save = () => {
    if (!editing?.title?.trim()) return toast.error("Please enter a title.");
    const data = { title: editing.title.trim(), subtitle: editing.subtitle?.trim() || undefined, body: editing.body?.trim() || undefined, image: editing.image?.trim() || undefined };
    if (editing.id) db.content.update(editing.id, data);
    else db.content.create({ ...data, section, published: true, order: sectionItems.length });
    toast.success("Saved — the website shows it now");
    setEditing(null);
  };

  return (
    <>
      <PageHeader
        title="Website content"
        description="Edit what visitors see. Changes show on the website right away."
        action={
          <Button variant="primary" icon={Plus} onClick={() => setEditing({})}>
            Add {meta.singular}
          </Button>
        }
      />
      <Tabs id="content" value={section} onChange={setSection} className="mb-6" tabs={SECTIONS.map((s) => ({ value: s.value, label: s.label }))} />
      <FilterRow>
        <SearchInput value={q} onChange={setQ} placeholder={`Search ${meta.label.toLowerCase()}…`} />
        <FilterSelect label="Status" all="Published & hidden" value={status} onChange={setStatus} options={[{ value: "published", label: "Published" }, { value: "hidden", label: "Hidden" }]} />
        <span className="text-[13px] text-crm-muted sm:ms-auto">
          {sectionItems.filter((c) => c.published).length} of {sectionItems.length} published
        </span>
      </FilterRow>
      {items.length === 0 ? (
        <div className="crm-card">
          <EmptyState icon={ImageSquare} text={`No ${meta.label.toLowerCase()} yet.`} action={<Button onClick={() => setEditing({})}>Add {meta.singular}</Button>} />
        </div>
      ) : (
        <Reorder.Group axis="y" values={order} onReorder={(list: ContentItem[]) => !filtering && setDrag({ src: items, list })} className="crm-card overflow-hidden">
          {order.map((item) => (
            <Row
              key={item.id}
              item={item}
              onEdit={() => setEditing(item)}
              onDragEnd={() => reorderContent(section, order.map((o) => o.id))}
              onDelete={async () => {
                if (await confirm({ title: `Delete this ${meta.singular}?`, description: item.title, confirmLabel: "Delete", danger: true })) {
                  db.content.remove(item.id);
                  toast("Deleted");
                }
              }}
            />
          ))}
        </Reorder.Group>
      )}
      <p className="mt-3 text-[12.5px] text-crm-muted">{filtering ? "Clear the search and status filter to reorder." : "Drag ⋮⋮ to change the order on the website."}</p>

      <Modal
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        title={editing?.id ? `Edit ${meta.singular}` : `Add ${meta.singular}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save}>
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <Field label={section === "faq" ? "Question" : section === "testimonials" ? "Name" : "Title"} required>
              <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} autoFocus />
            </Field>
            <Field label={meta.subtitle}>
              <Input value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
            </Field>
            {meta.body && (
              <Field label={section === "faq" ? "Answer" : section === "testimonials" ? "Quote" : "Description"}>
                <Textarea value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
              </Field>
            )}
            {meta.image && (
              <Field label="Image URL" hint="Unsplash, Cloudinary, iccbbg.com or /images/… paths.">
                <Input value={editing.image ?? ""} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="https://…" />
              </Field>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
