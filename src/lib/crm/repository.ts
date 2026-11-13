"use client";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { AuditEntry, BaseRecord } from "@/types/crm";

export const STORAGE_PREFIX = "iccb-crm-v1";

export type SortDir = "asc" | "desc";

export interface ListQuery {
  search?: string;
  /** Equality filters. An array value means "any of". */
  filters?: Record<string, string | number | boolean | null | undefined | (string | number | boolean)[]>;
  sort?: { field: string; dir: SortDir };
  page?: number; // 1-based
  pageSize?: number;
  /** "active" (default) hides soft-deleted rows; "trash" shows only them. */
  scope?: "active" | "trash" | "all";
}

export interface ListResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export type CreateInput<T extends BaseRecord> = Omit<T, "id" | "createdAt" | "updatedAt"> &
  Partial<Pick<T, "id" | "createdAt" | "updatedAt">>;

export type Patch<T> = Partial<T> | ((prev: T) => Partial<T>);

export interface MutationOpts {
  /** Skip the audit log (used for noisy/system writes). */
  silent?: boolean;
  summary?: string;
  action?: AuditEntry["action"];
}

interface RepoState<T> {
  items: T[];
}

export type AuditHook = (e: {
  entity: string;
  entityId: string;
  action: AuditEntry["action"];
  summary: string;
  before?: unknown;
  after?: unknown;
}) => void;

let auditHook: AuditHook | null = null;
export function setAuditHook(fn: AuditHook) {
  auditHook = fn;
}

export interface Repository<T extends BaseRecord> {
  name: string;
  label: string;
  store: UseBoundStore<StoreApi<RepoState<T>>> & {
    persist: { rehydrate: () => Promise<void> | void; hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void };
  };
  all(): T[];
  active(): T[];
  list(q?: ListQuery): ListResult<T>;
  get(id: string): T | undefined;
  create(input: CreateInput<T>, opts?: MutationOpts): T;
  update(id: string, patch: Patch<T>, opts?: MutationOpts): T;
  remove(id: string, opts?: MutationOpts): T;
  restore(id: string, opts?: MutationOpts): T;
  destroy(id: string, opts?: MutationOpts): void;
  bulkUpdate(ids: string[], patch: Partial<T>, opts?: MutationOpts): T[];
  replaceAll(items: T[]): void;
  reset(): void;
}

const nowIso = () => new Date().toISOString();

function getField(row: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => (acc == null ? acc : (acc as Record<string, unknown>)[key]), row);
}

function textOf(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") return Object.values(value as object).map(textOf).join(" ");
  return String(value);
}

export function applyQuery<T extends BaseRecord>(items: T[], q: ListQuery = {}): ListResult<T> {
  const scope = q.scope ?? "active";
  let rows = items.filter((r) => (scope === "all" ? true : scope === "trash" ? !!r.deletedAt : !r.deletedAt));

  if (q.filters) {
    for (const [field, want] of Object.entries(q.filters)) {
      if (want === undefined || want === "" || (Array.isArray(want) && want.length === 0)) continue;
      rows = rows.filter((r) => {
        const v = getField(r, field);
        return Array.isArray(want) ? want.includes(v as never) : v === want;
      });
    }
  }

  if (q.search?.trim()) {
    const needle = q.search.trim().toLowerCase();
    rows = rows.filter((r) => textOf(r).toLowerCase().includes(needle));
  }

  if (q.sort) {
    const { field, dir } = q.sort;
    const mul = dir === "asc" ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const av = getField(a, field);
      const bv = getField(b, field);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * mul;
      return String(av).localeCompare(String(bv), undefined, { numeric: true }) * mul;
    });
  }

  const total = rows.length;
  const pageSize = q.pageSize ?? (total || 1);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, q.page ?? 1), pageCount);
  if (q.pageSize) rows = rows.slice((page - 1) * pageSize, page * pageSize);

  return { rows, total, page, pageSize, pageCount };
}

/**
 * Generic persisted repository. One zustand store per domain, persisted under
 * `iccb-crm-v1:<name>`. Hydration is manual (`skipHydration`) so SSR markup
 * matches the first client render; <CrmHydrator/> rehydrates every store on mount.
 */
export function createRepository<T extends BaseRecord>(name: string, seed: T[] | (() => T[]), label = name): Repository<T> {
  const seedItems = () => (typeof seed === "function" ? seed() : seed).map((s) => ({ ...s }));

  const store = create<RepoState<T>>()(
    persist(() => ({ items: seedItems() }), {
      name: `${STORAGE_PREFIX}:${name}`,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    })
  ) as Repository<T>["store"];

  const setItems = (fn: (items: T[]) => T[]) => store.setState((s) => ({ items: fn(s.items) }));

  const audit = (entityId: string, action: AuditEntry["action"], summary: string, before?: unknown, after?: unknown, opts?: MutationOpts) => {
    if (opts?.silent || !auditHook) return;
    auditHook({ entity: name, entityId, action: opts?.action ?? action, summary: opts?.summary ?? summary, before, after });
  };

  const mustGet = (id: string) => {
    const item = store.getState().items.find((i) => i.id === id);
    if (!item) throw new Error(`${label} not found`);
    return item;
  };

  const repo: Repository<T> = {
    name,
    label,
    store,
    all: () => store.getState().items,
    active: () => store.getState().items.filter((i) => !i.deletedAt),
    list: (q) => applyQuery(store.getState().items, q),
    get: (id) => store.getState().items.find((i) => i.id === id),

    create(input, opts) {
      const ts = nowIso();
      const item = { ...input, id: input.id ?? nanoid(10), createdAt: input.createdAt ?? ts, updatedAt: ts } as T;
      setItems((items) => [item, ...items]);
      audit(item.id, "create", `Created ${label.toLowerCase()}`, undefined, item, opts);
      return item;
    },

    update(id, patch, opts) {
      const before = mustGet(id);
      const changes = typeof patch === "function" ? patch(before) : patch;
      const after = { ...before, ...changes, updatedAt: nowIso() } as T;
      setItems((items) => items.map((i) => (i.id === id ? after : i)));
      const changed = Object.keys(changes).filter((k) => k !== "updatedAt" && k !== "activity");
      if (changed.length) {
        const pick = (o: T) => Object.fromEntries(changed.map((k) => [k, (o as Record<string, unknown>)[k]]));
        audit(id, "update", `Updated ${label.toLowerCase()}: ${changed.join(", ")}`, pick(before), pick(after), opts);
      }
      return after;
    },

    remove(id, opts) {
      const before = mustGet(id);
      const after = { ...before, deletedAt: nowIso() } as T;
      setItems((items) => items.map((i) => (i.id === id ? after : i)));
      audit(id, "delete", `Moved ${label.toLowerCase()} to trash`, before, undefined, opts);
      return after;
    },

    restore(id, opts) {
      const before = mustGet(id);
      const after = { ...before, deletedAt: null, updatedAt: nowIso() } as T;
      setItems((items) => items.map((i) => (i.id === id ? after : i)));
      audit(id, "restore", `Restored ${label.toLowerCase()}`, undefined, after, opts);
      return after;
    },

    destroy(id, opts) {
      const before = mustGet(id);
      setItems((items) => items.filter((i) => i.id !== id));
      audit(id, "delete", `Permanently deleted ${label.toLowerCase()}`, before, undefined, opts);
    },

    bulkUpdate(ids, patch, opts) {
      const ts = nowIso();
      const set = new Set(ids);
      const out: T[] = [];
      setItems((items) =>
        items.map((i) => {
          if (!set.has(i.id)) return i;
          const next = { ...i, ...patch, updatedAt: ts } as T;
          out.push(next);
          return next;
        })
      );
      audit(ids.join(","), "update", `Bulk updated ${ids.length} ${label.toLowerCase()} record(s): ${Object.keys(patch).join(", ")}`, undefined, patch, opts);
      return out;
    },

    replaceAll(items) {
      store.setState({ items });
    },

    reset() {
      store.setState({ items: seedItems() });
    },
  };

  return repo;
}
