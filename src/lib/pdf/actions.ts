"use client";
/** One-call PDF downloads for every record (reads the current store state). */
import type { Booking, Meeting, Payment } from "@/types/crm";
import { isBillPayment } from "@/types/crm";
import { db, getSettings } from "@/lib/crm/db";
import { calcBill } from "@/lib/crm/bill";
import { downloadPdf } from "./index";
import { billDoc, bookingDoc, bookingsListDoc, clientStatementDoc, eventSheetDoc, invoicesListDoc, meetingDoc, receiptDoc } from "./model";
import type { Client } from "@/types/crm";

export function currentBill(b: Booking) {
  const paid = db.payments.all().filter((p) => p.bookingId === b.id && isBillPayment(p.kind)).reduce((s, p) => s + p.amount, 0);
  return calcBill(b, billRatesNow(), paid);
}

export function billRatesNow() {
  const st = getSettings();
  return { halls: db.halls.all(), specials: db.specials.all(), menus: db.menus.all(), services: db.services.all(), addOns: st.addOnRates, weekendDays: st.weekendDays, foodVatPercent: st.foodVatPercent, securityByType: st.securityByType };
}

const hallOf = (id?: string) => (id ? db.halls.get(id) : undefined);
const bookingOf = (id?: string) => (id ? db.bookings.get(id) : undefined);

export const pdfBooking = (b: Booking) => downloadPdf(bookingDoc(b, hallOf(b.hallId), currentBill(b)));
export const pdfBill = (b: Booking) => downloadPdf(billDoc(b, hallOf(b.hallId), currentBill(b)));
export function pdfReceipt(p: Payment) {
  const b = bookingOf(p.bookingId);
  return downloadPdf(receiptDoc(p, b, hallOf(b?.hallId)));
}
export function pdfMeeting(mt: Meeting) {
  const b = bookingOf(mt.bookingId);
  return downloadPdf(meetingDoc(mt, b, hallOf(b?.hallId)));
}
export const pdfBookingList = (rows: Booking[], filterText: string) => downloadPdf(bookingsListDoc(rows.map((b) => ({ b, hall: hallOf(b.hallId), bill: currentBill(b) })), filterText));
export const pdfPaymentList = (rows: Payment[], filterText: string) => downloadPdf(invoicesListDoc(rows.map((p) => ({ p, b: bookingOf(p.bookingId) })), filterText));
export const pdfEventSheet = (b: Booking) =>
  downloadPdf(eventSheetDoc(b, hallOf(b.hallId), (id) => (id ? db.menus.get(id)?.name : undefined), (id) => db.services.get(id)?.name));
export function pdfClientStatement(c: Client) {
  const rows = db.bookings.all().filter((b) => b.clientId === c.id).sort((x, y) => y.date.localeCompare(x.date));
  return downloadPdf(clientStatementDoc(c, rows.map((b) => ({ b, hall: hallOf(b.hallId), bill: currentBill(b) }))));
}
