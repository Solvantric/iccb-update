import apiClient from "@/lib/api/axios";

export const chatService = {
  sendMessage: async (message: string, sessionId: string, language: string = "en"): Promise<string> => {
    const { data } = await apiClient.post<{ data: { reply: string } }>("/chat", {
      message,
      sessionId,
      language,
    });
    return data.data.reply;
  },
};
