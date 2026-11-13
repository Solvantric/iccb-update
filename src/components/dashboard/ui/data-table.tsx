"use client";
import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowsDownUp, CaretLeft, CaretRight, Columns, DownloadSimple, Tray, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils/cn";
import { downloadFile, toCsv } from "@/lib/crm/db";
import { m } from "./motion";
import { Button, Checkbox, EmptyState, SearchInput, Select, Skeleton } from "./core";

export interface Column<T> {
  id: string;
  header: React.ReactNode;
  cell: (row: T) => React.ReactNode;
  /** Value used for sorting and CSV export. */
  value?: (row: T) => string | number | null | undefined;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  /** Hidden by default (user can show it). */
  hidden?: boolean;
  /** Can't be hidden. */
  pinned?: boolean;
  /** Shown as the title line in mobile cards. */
  primary?: boolean;
  /** Hide in mobile card view. */
  hideOnMobile?: boolean;
  align?: "start" | "end" | "center";
}

export interface DataTableProps<T extends { id: string; createdAt?: string }> {
  rows: T[] | undefined;
  columns: Column<T>[];
  loading?: boolean;
  search?: boolean;
  searchPlaceholder?: string;
  searchText?: (row: T) => string;
  toolbar?: React.ReactNode;
  initialSort?: { id: string; dir: "asc" | "desc" };
  pageSize?: number;
  selectable?: boolean;
  bulkActions?: (selected: T[], clear: () => void) => React.ReactNode;
  rowActions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  empty?: { icon: Icon; title: string; description?: string; action?: React.ReactNode };
  exportName?: string;
  className?: string;
  dense?: boolean;
  rowClassName?: (row: T) => string | undefined;
}

export function DataTable<T extends { id: string; createdAt?: string }>({
  rows,
  columns,
  loading,
  search = true,
  searchPlaceholder,
  searchText,
  toolbar,
  initialSort,
  pageSize: initialPageSize = 10,
  selectable,
  bulkActions,
  rowActions,
  onRowClick,
  empty,
  exportName,
  className,
  dense,
  rowClassName,
}: DataTableProps<T>) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [hidden, setHidden] = useState<Set<string>>(() => new Set(columns.filter((c) => c.hidden).map((c) => c.id)));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [colMenu, setColMenu] = useState(false);
  const [mountedAt] = useState(() => Date.now());

  const visibleCols = columns.filter((c) => !hidden.has(c.id));

  const filtered = useMemo(() => {
    let out = rows ?? [];
    if (q.trim()) {
      const needle = q.trim().toLowerCase();
      out = out.filter((r) => (searchText ? searchText(r) : columns.map((c) => c.value?.(r) ?? "").join(" ")).toLowerCase().includes(needle));
    }
    if (sort) {
      const col = columns.find((c) => c.id === sort.id);
      if (col?.value) {
        const mul = sort.dir === "asc" ? 1 : -1;
        out = [...out].sort((a, b) => {
          const av = col.value!(a);
          const bv = col.value!(b);
          if (av == null) return 1;
          if (bv == null) return -1;
          if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
          return String(av).localeCompare(String(bv), undefined, { numeric: true }) * mul;
        });
      }
    }
    return out;
  }, [rows, q, sort, columns, searchText]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedRows = (rows ?? []).filter((r) => selected.has(r.id));
  const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const toggleSort = (c: Column<T>) => {
    if (!c.value || c.sortable === false) return;
    setSort((s) => (s?.id !== c.id ? { id: c.id, dir: "asc" } : s.dir === "asc" ? { id: c.id, dir: "desc" } : undefined));
  };

  const exportCsv = () => {
    const data = filtered.map((r) => Object.fromEntries(columns.filter((c) => c.value).map((c) => [typeof c.header === "string" ? c.header : c.id, c.value!(r)])));
    downloadFile(`${exportName ?? "export"}.csv`, toCsv(data), "text/csv");
  };

  const isNew = (r: T) => !!r.createdAt && new Date(r.createdAt).getTime() > mountedAt;
  const alignCls = (a?: Column<T>["align"]) => (a === "end" ? "text-end" : a === "center" ? "text-center" : "text-start");

  return (
    <div className={cn("crm-card overflow-hidden", className)}>
      {/* Toolbar */}
      {(search || toolbar || exportName) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-crm-line px-3 py-2.5">
          {search && (
            <SearchInput
              value={q}
              onChange={(v) => {
                setQ(v);
                setPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full sm:w-64"
            />
          )}
          {toolbar}
          <div className="ms-auto flex items-center gap-1.5">
            <div className="relative hidden md:block">
              <Button size="sm" variant="ghost" icon={Columns} onClick={() => setColMenu((v) => !v)}>
                Columns
              </Button>
              <AnimatePresence>
                {colMenu && (
                  <m.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute end-0 top-9 z-20 w-56 rounded-xl border border-crm-line bg-crm-surface p-2 shadow-[var(--crm-shadow-lg)]" onMouseLeave={() => setColMenu(false)}>
                    {columns
                      .filter((c) => !c.pinned)
                      .map((c) => (
                        <Checkbox
                          key={c.id}
                          className="rounded-md px-2 py-1.5 hover:bg-crm-surface-2"
                          checked={!hidden.has(c.id)}
                          onChange={(v) =>
                            setHidden((h) => {
                              const n = new Set(h);
                              if (v) n.delete(c.id);
                              else n.add(c.id);
                              return n;
                            })
                          }
                          label={typeof c.header === "string" ? c.header : c.id}
                        />
                      ))}
                  </m.div>
                )}
              </AnimatePresence>
            </div>
            {exportName && (
              <Button size="sm" variant="ghost" icon={DownloadSimple} onClick={exportCsv}>
                <span className="hidden sm:inline">CSV</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Bulk bar */}
      <AnimatePresence>
        {selectable && selected.size > 0 && (
          <m.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-crm-line bg-crm-tint">
            <div className="flex flex-wrap items-center gap-2 px-4 py-2 text-[13px] text-crm-ink">
              <span className="font-semibold">{selected.size} selected</span>
              {bulkActions?.(selectedRows, () => setSelected(new Set()))}
              <Button size="sm" variant="ghost" className="ms-auto" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto crm-scroll max-h-[calc(100vh-260px)] min-h-[120px]">
        <table className="w-full text-[13.5px]">
          <thead className="sticky top-0 z-10 bg-crm-surface-2">
            <tr className="border-b border-crm-line">
              {selectable && (
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={allOnPage}
                    onChange={(v) =>
                      setSelected((s) => {
                        const n = new Set(s);
                        pageRows.forEach((r) => (v ? n.add(r.id) : n.delete(r.id)));
                        return n;
                      })
                    }
                  />
                </th>
              )}
              {visibleCols.map((c) => {
                const active = sort?.id === c.id;
                const sortable = !!c.value && c.sortable !== false;
                return (
                  <th key={c.id} className={cn("px-3 py-2.5 text-[12px] font-semibold text-crm-muted whitespace-nowrap", alignCls(c.align), c.headerClassName)}>
                    {sortable ? (
                      <button onClick={() => toggleSort(c)} className={cn("inline-flex items-center gap-1 hover:text-crm-ink", active && "text-crm-ink")}>
                        {c.header}
                        {active ? sort!.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <ArrowsDownUp size={12} className="opacity-40" />}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
              {rowActions && <th className="w-12" />}
            </tr>
          </thead>
          <tbody>
            {loading && !rows
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-crm-line last:border-0">
                    {selectable && <td className="px-3 py-3" />}
                    {visibleCols.map((c) => (
                      <td key={c.id} className="px-3 py-3">
                        <Skeleton className={cn("h-4", i % 2 ? "w-3/4" : "w-1/2")} />
                      </td>
                    ))}
                    {rowActions && <td />}
                  </tr>
                ))
              : (
                  <AnimatePresence initial={false}>
                    {pageRows.map((r) => (
                      <m.tr
                        key={r.id}
                        layout="position"
                        initial={isNew(r) ? { opacity: 0, x: -16, backgroundColor: "var(--crm-tint-2)" } : false}
                        animate={{ opacity: 1, x: 0, backgroundColor: "rgba(0,0,0,0)" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, backgroundColor: { duration: 1.6 } }}
                        onClick={onRowClick ? () => onRowClick(r) : undefined}
                        className={cn("group border-b border-crm-line last:border-0 transition-colors hover:!bg-crm-surface-2", onRowClick && "cursor-pointer", selected.has(r.id) && "!bg-crm-tint/60", rowClassName?.(r))}
                      >
                        {selectable && (
                          <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selected.has(r.id)}
                              onChange={(v) =>
                                setSelected((s) => {
                                  const n = new Set(s);
                                  if (v) n.add(r.id);
                                  else n.delete(r.id);
                                  return n;
                                })
                              }
                            />
                          </td>
                        )}
                        {visibleCols.map((c) => (
                          <td key={c.id} className={cn("px-3 text-crm-ink-2", dense ? "py-2" : "py-2.5", alignCls(c.align), c.className)}>
                            {c.cell(r)}
                          </td>
                        ))}
                        {rowActions && (
                          <td className="px-2 py-2 text-end" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">{rowActions(r)}</div>
                          </td>
                        )}
                      </m.tr>
                    ))}
                  </AnimatePresence>
                )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-crm-line">
        {loading && !rows
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))
          : pageRows.map((r) => {
              const primary = visibleCols.find((c) => c.primary) ?? visibleCols[0];
              return (
                <div key={r.id} onClick={onRowClick ? () => onRowClick(r) : undefined} className={cn("p-4", onRowClick && "active:bg-crm-surface-2")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 text-crm-ink">{primary?.cell(r)}</div>
                    {rowActions && (
                      <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                        {rowActions(r)}
                      </div>
                    )}
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {visibleCols
                      .filter((c) => c !== primary && !c.hideOnMobile)
                      .map((c) => (
                        <div key={c.id} className="min-w-0">
                          <dt className="text-[11px] text-crm-muted">{c.header}</dt>
                          <dd className="text-[13px] text-crm-ink-2 truncate">{c.cell(r)}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
              );
            })}
      </div>

      {!loading && rows && filtered.length === 0 && (
        <EmptyState icon={empty?.icon ?? Tray} title={q ? "No matches" : empty?.title ?? "Nothing here yet"} description={q ? `Nothing matches “${q}”.` : empty?.description} action={q ? undefined : empty?.action} />
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-crm-line px-3 py-2 text-[12.5px] text-crm-muted">
          <span className="tabular">
            {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <Select
              value={String(pageSize)}
              onChange={(v) => {
                setPageSize(Number(v));
                setPage(1);
              }}
              options={[10, 25, 50, 100].map((n) => ({ value: String(n), label: `${n} / page` }))}
              className="h-8 w-[110px] text-[12.5px]"
            />
            <Button size="icon-sm" variant="ghost" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page">
              <CaretLeft size={14} className="rtl:rotate-180" />
            </Button>
            <span className="tabular">
              {safePage}/{pageCount}
            </span>
            <Button size="icon-sm" variant="ghost" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)} aria-label="Next page">
              <CaretRight size={14} className="rtl:rotate-180" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
