import type { Booking } from "@/types/crm";

export type DayState = "free" | "tentative" | "booked" | "completed";

/** Calendar state for a hall on a date, from live (non-closed) bookings. */
export function hallDayState(bookings: Booking[], hallId: string, date: string, ignoreId?: string): { state: DayState; booking?: Booking; preparation?: boolean } {
  let best: { state: DayState; booking?: Booking; preparation?: boolean } = { state: "free" };
  for (const b of bookings) {
    if (b.deletedAt || b.closed || b.id === ignoreId) continue;
    const day = b.days.find((d) => d.hallId === hallId && d.date === date);
    if (!day) continue;
    const state: DayState = b.status === "requested" ? "tentative" : b.status === "completed" ? "completed" : "booked";
    const rank = { free: 0, tentative: 1, completed: 2, booked: 3 };
    if (rank[state] > rank[best.state]) best = { state, booking: b, preparation: day.dayType === "preparation" };
  }
  return best;
}

export const DAY_STATE_LABEL: Record<DayState, string> = {
  free: "Available",
  tentative: "Tentative (requested)",
  booked: "Booked",
  completed: "Completed",
};
