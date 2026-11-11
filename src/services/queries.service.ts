import apiClient from "@/lib/api/axios";
import type { AskForm } from "@/types";
import type { Query } from "@/data/queries";

export const queriesService = {
  getAll: async (): Promise<Query[]> => {
    const { data } = await apiClient.get<{ data: Query[] }>("/queries");
    return data.data;
  },

  submitAsk: async (form: AskForm): Promise<Query> => {
    const { data } = await apiClient.post<{ data: Query }>("/ask", form);
    return data.data;
  },

  update: async (id: string, updates: Partial<Query>): Promise<void> => {
    await apiClient.patch(`/queries/${id}`, updates);
  },
};
