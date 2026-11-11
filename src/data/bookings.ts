import type { Booking } from "@/types";

const STORAGE_KEY = "iccb_bookings";

function loadFromStorage(): Booking[] {
  if (typeof window === "undefined") return sampleBookings;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return sampleBookings;
}

function saveToStorage(bookings: Booking[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch {}
}

export const sampleBookings: Booking[] = [
  {
    id: "bk-001",
    referenceNumber: "ICCB-2026-001",
    leadId: "lead-001",
    hallId: "gulnaksha",
    date: "2026-02-15",
    shift: "fullday",
    status: "confirmed",
    eventType: "exhibition",
    guests: 2000,
    estimatedTotal: 650000,
    createdAt: "2026-11-01T10:30:00Z",
    isSample: true,
  },
  {
    id: "bk-002",
    referenceNumber: "ICCB-2026-002",
    leadId: "lead-002",
    hallId: "rajdarshan",
    date: "2026-01-20",
    shift: "fullday",
    status: "on_hold",
    holdExpiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    eventType: "conference",
    guests: 800,
    estimatedTotal: 320000,
    createdAt: "2026-10-28T09:00:00Z",
    isSample: true,
  },
];

let _bookings: Booking[] | null = null;

function getBookings(): Booking[] {
  if (!_bookings) _bookings = loadFromStorage();
  return _bookings;
}

export const addBooking = (booking: Booking): void => {
  const bookings = getBookings();
  bookings.unshift(booking);
  _bookings = bookings;
  saveToStorage(bookings);
};

export const updateBooking = (id: string, updates: Partial<Booking>): void => {
  const bookings = getBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx >= 0) {
    bookings[idx] = { ...bookings[idx], ...updates };
    _bookings = bookings;
    saveToStorage(bookings);
  }
};

export const getAllBookings = (): Booking[] => getBookings();
