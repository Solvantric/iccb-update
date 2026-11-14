"use client";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { BaseRecord } from "@/types/crm";

/** Bumped to v4 (richer bill & clients): older `iccb-crm-*` data is cleared on first load. */
export const STORAGE_PREFIX = "iccb-crm-v4";

export type CreateInput<T extends BaseRecord> = Omit<T, "id" | "createdAt"> & Partial<Pick<T, "id" | "createdAt">>;

interface RepoState<T> {
  items: T[];
}

type PersistedStore<S> = UseBoundStore<StoreApi<S>> & {
  persist: { rehydrate: () => Promise<void> | void; hasHydrated: () => boolean };
};

export interface Repository<T extends BaseRecord> {
  name: string;
  store: PersistedStore<RepoState<T>>;
  all(): T[];
  get(id: string): T | undefined;
  create(input: CreateInput<T>): T;
  update(id: string, patch: Partial<T> | ((prev: T) => Partial<T>)): T;
  remove(id: string): T | undefined;
  insert(item: T, index?: number): void;
  replaceAll(items: T[]): void;
  reset(): void;
}

/**
 * Generic persisted repository: one zustand store per entity under
 * `iccb-crm-v4:<name>`. Hydration is manual (`skipHydration`) so the SSR
 * markup matches the first client render.
 */
export function createRepository<T extends BaseRecord>(name: string, seed: () => T[]): Repository<T> {
  const store = create<RepoState<T>>()(
    persist(() => ({ items: seed() }), {
      name: `${STORAGE_PREFIX}:${name}`,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    })
  ) as PersistedStore<RepoState<T>>;

  const set = (fn: (items: T[]) => T[]) => store.setState((s) => ({ items: fn(s.items) }));

  return {
    name,
    store,
    all: () => store.getState().items,
    get: (id) => store.getState().items.find((i) => i.id === id),
    create(input) {
      const item = { ...input, id: input.id ?? nanoid(10), createdAt: input.createdAt ?? new Date().toISOString() } as T;
      set((items) => [item, ...items]);
      return item;
    },
    update(id, patch) {
      const prev = store.getState().items.find((i) => i.id === id);
      if (!prev) throw new Error(`${name}: record not found`);
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
      set((items) => items.map((i) => (i.id === id ? next : i)));
      return next;
    },
    remove(id) {
      const prev = store.getState().items.find((i) => i.id === id);
      set((items) => items.filter((i) => i.id !== id));
      return prev;
    },
    insert(item, index = 0) {
      set((items) => {
        const copy = items.filter((i) => i.id !== item.id);
        copy.splice(Math.min(index, copy.length), 0, item);
        return copy;
      });
    },
    replaceAll(items) {
      store.setState({ items });
    },
    reset() {
      store.setState({ items: seed() });
    },
  };
}
