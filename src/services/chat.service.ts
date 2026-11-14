/**
 * ICCB AI assistant client → backend `POST /chat`
 * Request:  { message, sessionId, language }
 * Response: { data: { reply, role } }  ·  errors: { message }
 *
 * Uses fetch (not the shared axios client) so the dev mock adapter never
 * intercepts it — the chatbot always talks to the real server.
 */
const CHAT_API = (process.env.NEXT_PUBLIC_CHAT_API_URL || process.env.NEXT_PUBLIC_API_URL || "https://iccbbackend.vercel.app").replace(/\/+$/, "");
/** Free AI models can be slow; give up after this and use the built-in answers. */
const TIMEOUT_MS = 45_000;

export class ChatError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export const chatService = {
  endpoint: `${CHAT_API}/chat`,
  sendMessage: async (message: string, sessionId: string, language: string = "en"): Promise<string> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${CHAT_API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId, language }),
        signal: ctrl.signal,
      });
      const json = (await res.json().catch(() => ({}))) as { data?: { reply?: string }; message?: string };
      if (!res.ok) throw new ChatError(json.message || `Chat failed (${res.status})`, res.status);
      const reply = json.data?.reply?.trim();
      if (!reply) throw new ChatError("Empty reply");
      return reply;
    } catch (e) {
      if (e instanceof ChatError) throw e;
      throw new ChatError(e instanceof DOMException && e.name === "AbortError" ? "Timed out" : "Network error");
    } finally {
      clearTimeout(timer);
    }
  },
};
