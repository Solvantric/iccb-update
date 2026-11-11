import apiClient from "@/lib/api/axios";
import type { AnalyticsEvent } from "@/types";

const queue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  apiClient.post("/analytics/events", batch).catch(() => {});
}

export const analyticsService = {
  track: (event: Omit<AnalyticsEvent, "timestamp">): void => {
    queue.push({ ...event, timestamp: new Date().toISOString() });
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 2000);
  },

  flushNow: (): void => {
    if (flushTimer) clearTimeout(flushTimer);
    flush();
  },

  getOverview: async () => {
    const { data } = await apiClient.get<{ data: unknown }>("/analytics/overview");
    return data.data;
  },

  getVisitors: async () => {
    const { data } = await apiClient.get<{ data: unknown }>("/analytics/visitors");
    return data.data;
  },

  getDemandHeatmap: async (hallId: string, month: string) => {
    const { data } = await apiClient.get<{ data: Record<string, number> }>(
      `/demand-heatmap?hallId=${hallId}&month=${month}`
    );
    return data.data;
  },
};
