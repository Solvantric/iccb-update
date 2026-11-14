"use client";
import { useMemo } from "react";
import type { Booking, Hall } from "@/types/crm";
import { isBillPayment } from "@/types/crm";
import { db, useSettings } from "./db";
import { calcBill, type BillRates } from "./bill";

export const useBookings = () => db.bookings.store((s) => s.items);
export const usePayments = () => db.payments.store((s) => s.items);
export const useMeetings = () => db.meetings.store((s) => s.items);
export const useEnquiries = () => db.enquiries.store((s) => s.items);
export const useHalls = () => db.halls.store((s) => s.items);
export const useSpecials = () => db.specials.store((s) => s.items);
export const useClients = () => db.clients.store((s) => s.items);
export const useMenus = () => db.menus.store((s) => s.items);
export const useServices = () => db.services.store((s) => s.items);
export const useUsers = () => db.users.store((s) => s.items);
export const useSettingsValue = () => useSettings((s) => s.settings);

export function useHallMap(): Map<string, Hall> {
  const halls = useHalls();
  return useMemo(() => new Map(halls.map((h) => [h.id, h])), [halls]);
}

export function useBillRates(): BillRates {
  const halls = useHalls();
  const specials = useSpecials();
  const menus = useMenus();
  const services = useServices();
  const settings = useSettingsValue();
  return useMemo(
    () => ({ halls, specials, menus, services, addOns: settings.addOnRates, weekendDays: settings.weekendDays, foodVatPercent: settings.foodVatPercent, securityByType: settings.securityByType }),
    [halls, specials, menus, services, settings]
  );
}

/** Paid amount per booking id (bill payments only; security money is separate). */
export function usePaidMap(): Map<string, number> {
  const payments = usePayments();
  return useMemo(() => {
    const m = new Map<string, number>();
    for (const p of payments) if (isBillPayment(p.kind)) m.set(p.bookingId, (m.get(p.bookingId) ?? 0) + p.amount);
    return m;
  }, [payments]);
}

/** Security money held per booking id (deposits minus refunds). */
export function useSecurityHeld(): Map<string, number> {
  const payments = usePayments();
  return useMemo(() => {
    const m = new Map<string, number>();
    for (const p of payments) {
      if (p.kind === "Security deposit") m.set(p.bookingId, (m.get(p.bookingId) ?? 0) + p.amount);
      if (p.kind === "Security refund") m.set(p.bookingId, (m.get(p.bookingId) ?? 0) - p.amount);
    }
    return m;
  }, [payments]);
}

/** Bill for every booking, keyed by id (total / paid / due). */
export function useBills(bookings: Booking[]) {
  const rates = useBillRates();
  const paid = usePaidMap();
  return useMemo(() => new Map(bookings.map((b) => [b.id, calcBill(b, rates, paid.get(b.id) ?? 0)])), [bookings, rates, paid]);
}

export function useBill(booking: Booking | undefined) {
  const rates = useBillRates();
  const paid = usePaidMap();
  return useMemo(() => (booking ? calcBill(booking, rates, paid.get(booking.id) ?? 0) : null), [booking, rates, paid]);
}
