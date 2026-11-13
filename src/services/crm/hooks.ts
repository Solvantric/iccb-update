"use client";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  AnalyticsEvent,
  AuditEntry,
  BaseRecord,
  Booking,
  CancellationRule,
  CapacityRow,
  Client,
  ContentItem,
  DecorationCategory,
  Enquiry,
  ExpoZoneTariff,
  Hall,
  HallTariff,
  IccbService,
  Invoice,
  Lead,
  MenuPackage,
  Notification,
  Payment,
  RadarEvent,
  SecurityRule,
  ServiceCharge,
  Settings,
  Task,
  TaxRule,
  User,
} from "@/types/crm";
import type { DbName } from "@/lib/crm/db";
import type { CreateInput, ListQuery, ListResult, Patch } from "@/lib/crm/repository";
import { entityService } from "./base";

export const crmKey = (name: DbName, ...rest: unknown[]): QueryKey => ["crm", name, ...rest];

/* ─── Reads ──────────────────────────────────────────────────────────────── */

export function useCrmAll<T extends BaseRecord>(name: DbName) {
  return useQuery({ queryKey: crmKey(name, "all"), queryFn: () => entityService<T>(name).all() });
}

export function useCrmList<T extends BaseRecord>(name: DbName, q: ListQuery = {}) {
  return useQuery({ queryKey: crmKey(name, "list", q), queryFn: () => entityService<T>(name).list(q), placeholderData: (prev) => prev });
}

export function useCrmGet<T extends BaseRecord>(name: DbName, id?: string | null) {
  return useQuery({ queryKey: crmKey(name, "get", id), queryFn: () => entityService<T>(name).get(id!), enabled: !!id });
}

/* ─── Writes ─────────────────────────────────────────────────────────────── */

type Msg<R> = string | ((r: R) => string) | false;
const msg = <R,>(m: Msg<R> | undefined, r: R) => (typeof m === "function" ? m(r) : m);

export function errorText(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong";
}

/** Wrap any async service call: loading state + success/error toasts. */
export function useCrmAction<A, R>(fn: (args: A) => Promise<R>, opts: { success?: Msg<R>; error?: string; onSuccess?: (r: R, a: A) => void } = {}) {
  return useMutation({
    mutationFn: fn,
    onSuccess: (r, a) => {
      const m = msg(opts.success, r);
      if (m) toast.success(m);
      opts.onSuccess?.(r, a);
    },
    onError: (e) => {
      toast.error(opts.error ?? errorText(e));
    },
  });
}

export function useCrmCreate<T extends BaseRecord>(name: DbName, success: Msg<T> = "Saved") {
  return useCrmAction((input: CreateInput<T>) => entityService<T>(name).create(input), { success });
}

/** Optimistic update with rollback. */
export function useCrmUpdate<T extends BaseRecord>(name: DbName, success: Msg<T> = false) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Patch<T> }) => entityService<T>(name).update(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: crmKey(name) });
      const snapshot = qc.getQueriesData({ queryKey: crmKey(name) });
      const apply = (row: T) => (row.id === id ? { ...row, ...(typeof patch === "function" ? patch(row) : patch) } : row);
      qc.setQueriesData({ queryKey: crmKey(name) }, (old: unknown) => {
        if (!old) return old;
        if (Array.isArray(old)) return (old as T[]).map(apply);
        if (typeof old === "object" && "rows" in (old as object)) return { ...(old as ListResult<T>), rows: (old as ListResult<T>).rows.map(apply) };
        if (typeof old === "object" && (old as T).id === id) return apply(old as T);
        return old;
      });
      return { snapshot };
    },
    onError: (e, _v, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(errorText(e));
    },
    onSuccess: (r) => {
      const m = msg(success, r);
      if (m) toast.success(m);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: crmKey(name) }),
  });
}

/** Soft delete with an 8-second Undo toast. */
export function useCrmRemove(name: DbName, label = "Item") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entityService(name).remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: crmKey(name) });
      const snapshot = qc.getQueriesData({ queryKey: crmKey(name) });
      qc.setQueriesData({ queryKey: crmKey(name) }, (old: unknown) => {
        if (Array.isArray(old)) return (old as BaseRecord[]).filter((r) => r.id !== id);
        if (old && typeof old === "object" && "rows" in (old as object)) {
          const o = old as ListResult<BaseRecord>;
          return { ...o, rows: o.rows.filter((r) => r.id !== id), total: o.total - 1 };
        }
        return old;
      });
      return { snapshot };
    },
    onError: (e, _id, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(errorText(e));
    },
    onSuccess: (_r, id) => {
      toast(`${label} moved to trash`, {
        duration: 8000,
        action: { label: "Undo", onClick: () => entityService(name).restore(id).then(() => toast.success(`${label} restored`)) },
      });
    },
  });
}

export function useCrmRestore(name: DbName, label = "Item") {
  return useCrmAction((id: string) => entityService(name).restore(id), { success: `${label} restored` });
}

export function useCrmDestroy(name: DbName, label = "Item") {
  return useCrmAction((id: string) => entityService(name).destroy(id), { success: `${label} permanently deleted` });
}

/* ─── Named hooks ────────────────────────────────────────────────────────── */

export const useBookings = () => useCrmAll<Booking>("bookings");
export const useBooking = (id?: string) => useCrmGet<Booking>("bookings", id);
export const useUpdateBooking = () => useCrmUpdate<Booking>("bookings");
export const useClients = () => useCrmAll<Client>("clients");
export const usePayments = () => useCrmAll<Payment>("payments");
export const useInvoices = () => useCrmAll<Invoice>("invoices");
export const useEnquiries = () => useCrmAll<Enquiry>("enquiries");
export const useLeads = () => useCrmAll<Lead>("leads");
export const useTasks = () => useCrmAll<Task>("tasks");
export const useNotifications = () => useCrmAll<Notification>("notifications");
export const useRadar = () => useCrmAll<RadarEvent>("radar");
export const useAnalytics = () => useCrmAll<AnalyticsEvent>("analytics");
export const useContent = () => useCrmAll<ContentItem>("content");
export const useAudit = () => useCrmAll<AuditEntry>("audit");
export const useUsers = () => useCrmAll<User>("users");
export const useHalls = () => useCrmAll<Hall>("halls");
export const useTariffs = () => useCrmAll<HallTariff>("tariffs");
export const useSecurityRules = () => useCrmAll<SecurityRule>("security");
export const useServiceCharges = () => useCrmAll<ServiceCharge>("charges");
export const useDecoration = () => useCrmAll<DecorationCategory>("decoration");
export const useExpoZones = () => useCrmAll<ExpoZoneTariff>("expo");
export const useCancellation = () => useCrmAll<CancellationRule>("cancellation");
export const useTaxes = () => useCrmAll<TaxRule>("taxes");
export const useCapacities = () => useCrmAll<CapacityRow>("capacities");
export const useMenus = () => useCrmAll<MenuPackage>("menus");
export const useIccbServices = () => useCrmAll<IccbService>("iccbServices");
export const useSettings = () => {
  const q = useCrmAll<Settings>("settings");
  return { ...q, data: q.data?.[0] };
};
