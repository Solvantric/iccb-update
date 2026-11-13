"use client";
import type { BaseRecord } from "@/types/crm";
import { repo, type DbName } from "@/lib/crm/db";
import type { CreateInput, ListQuery, ListResult, MutationOpts, Patch, Repository } from "@/lib/crm/repository";

/** Simulated network latency (150–350 ms) so loading states are real. */
export const latency = (min = 150, max = 350) => new Promise<void>((r) => setTimeout(r, min + Math.random() * (max - min)));

export async function withLatency<T>(fn: () => T): Promise<T> {
  await latency();
  return fn();
}

export interface EntityService<T extends BaseRecord> {
  name: DbName;
  list(q?: ListQuery): Promise<ListResult<T>>;
  all(): Promise<T[]>;
  get(id: string): Promise<T | null>;
  create(input: CreateInput<T>, opts?: MutationOpts): Promise<T>;
  update(id: string, patch: Patch<T>, opts?: MutationOpts): Promise<T>;
  remove(id: string, opts?: MutationOpts): Promise<T>;
  restore(id: string, opts?: MutationOpts): Promise<T>;
  destroy(id: string): Promise<void>;
  bulkUpdate(ids: string[], patch: Partial<T>): Promise<T[]>;
}

/**
 * Async CRUD over a repository. Replace the body of these functions with
 * fetch() calls later — UI code only talks to services + hooks.
 */
export function entityService<T extends BaseRecord>(name: DbName): EntityService<T> {
  const r = () => repo(name) as unknown as Repository<T>;
  return {
    name,
    list: (q) => withLatency(() => r().list(q)),
    all: () => withLatency(() => r().active()),
    get: (id) => withLatency(() => r().get(id) ?? null),
    create: (input, opts) => withLatency(() => r().create(input, opts)),
    update: (id, patch, opts) => withLatency(() => r().update(id, patch, opts)),
    remove: (id, opts) => withLatency(() => r().remove(id, opts)),
    restore: (id, opts) => withLatency(() => r().restore(id, opts)),
    destroy: (id) => withLatency(() => r().destroy(id)),
    bulkUpdate: (ids, patch) => withLatency(() => r().bulkUpdate(ids, patch)),
  };
}
