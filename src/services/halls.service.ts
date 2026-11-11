import apiClient from "@/lib/api/axios";
import type { Hall, AvailabilitySlot } from "@/types";

export const hallsService = {
  getAll: async (): Promise<Hall[]> => {
    const { data } = await apiClient.get<{ data: Hall[] }>("/halls");
    return data.data;
  },

  getBySlug: async (slug: string): Promise<Hall> => {
    const { data } = await apiClient.get<{ data: Hall }>(`/halls/${slug}`);
    return data.data;
  },

  getAvailability: async (hallId: string, month: string): Promise<AvailabilitySlot[]> => {
    const { data } = await apiClient.get<{ data: AvailabilitySlot[] }>(
      `/availability?hallId=${hallId}&month=${month}`
    );
    return data.data;
  },

  updateAvailability: async (slot: AvailabilitySlot): Promise<void> => {
    await apiClient.post("/availability/update", slot);
  },
};
