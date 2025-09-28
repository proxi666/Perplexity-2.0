export type SSEEvent =
  | { type: "checkpoint"; checkpoint_id: string }
  | { type: "content"; content: string }
  | { type: "search_start"; query: string }
  | { type: "search_results"; urls: string[] }
  | { type: "end" };

type OpenChatStreamParams = {
  apiBaseUrl: string;
  message: string;
  checkpointId?: string;
  onEvent: (event: SSEEvent) => void;
  onError?: (error: Event) => void;
};

export const openChatStream = ({
  apiBaseUrl,
  message,
  checkpointId,
  onEvent,
  onError
}: OpenChatStreamParams): { close: () => void } => {
  const baseUrl = apiBaseUrl || "http://localhost:8000";
  const url = new URL(`${baseUrl.replace(/\/$/, "")}/chat_stream/${encodeURIComponent(message)}`);

  if (checkpointId) {
    url.searchParams.set("checkpoint_id", checkpointId);
  }

  const eventSource = new EventSource(url.toString());

  eventSource.onmessage = (event: MessageEvent<string>) => {
    const raw = event.data?.trim();
    if (!raw) return;

    if (raw === "[DONE]") {
      onEvent({ type: "end" });
      return;
    }

    try {
      const payload = JSON.parse(raw) as SSEEvent;
      if (!payload?.type) return;
      onEvent(payload);
    } catch (error) {
      // Some backends send keep-alive comments or other non-JSON payloads.
      console.warn("Skipping non-JSON SSE payload", { data: raw, error });
    }
  };

  eventSource.onerror = (event) => {
    console.debug("SSE stream error", event);
    onError?.(event);
    eventSource.close();
  };

  return {
    close: () => {
      eventSource.close();
    }
  };
};
