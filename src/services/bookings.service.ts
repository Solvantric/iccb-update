import apiClient from "@/lib/api/axios";
import type { Booking } from "@/types";

export const bookingsService = {
  getAll: async (): Promise<Booking[]> => {
    const { data } = await apiClient.get<{ data: Booking[] }>("/bookings");
    return data.data;
  },

  create: async (booking: Partial<Booking>): Promise<Booking> => {
    const { data } = await apiClient.post<{ data: Booking }>("/bookings", booking);
    return data.data;
  },

  update: async (id: string, updates: Partial<Booking>): Promise<void> => {
    await apiClient.patch(`/bookings/${id}`, updates);
  },

  confirmHold: async (id: string): Promise<void> => {
    await apiClient.patch(`/bookings/${id}`, { status: "on_hold" });
  },

  confirmBooking: async (id: string): Promise<void> => {
    await apiClient.patch(`/bookings/${id}`, { status: "confirmed" });
  },

  release: async (id: string): Promise<void> => {
    await apiClient.patch(`/bookings/${id}`, { status: "cancelled" });
  },
};
