import apiClient from "@/lib/api/axios";
import type { Lead, EnquiryForm } from "@/types";

export const leadsService = {
  getAll: async (): Promise<Lead[]> => {
    const { data } = await apiClient.get<{ data: Lead[] }>("/leads");
    return data.data;
  },

  create: async (lead: Partial<Lead>): Promise<Lead> => {
    const { data } = await apiClient.post<{ data: Lead }>("/leads", lead);
    return data.data;
  },

  update: async (id: string, updates: Partial<Lead>): Promise<void> => {
    await apiClient.patch(`/leads/${id}`, updates);
  },

  submitEnquiry: async (form: EnquiryForm): Promise<{ referenceNumber: string; leadId: string }> => {
    const { data } = await apiClient.post<{ data: { referenceNumber: string; leadId: string } }>(
      "/enquiry",
      form
    );
    return data.data;
  },
};
