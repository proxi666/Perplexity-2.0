"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { appendChunk } from "@/lib/format";
import { openChatStream, type SSEEvent } from "@/lib/sse";
import type { Message, Thread } from "@/types/chat";

const STORAGE_KEY = "perplexity-threads-v1";
const MAX_THREADS = 10;
const defaultTitle = "New Chat";

const deriveTitle = (messages: Message[]): string => {
  const firstUser = messages.find((message) => message.role === "user");
  if (firstUser?.content?.trim()) {
    return firstUser.content.trim().slice(0, 48);
  }

  const firstAssistant = messages.find((message) => message.role === "assistant");
  if (firstAssistant?.content?.trim()) {
    return firstAssistant.content.trim().slice(0, 48);
  }

  return defaultTitle;
};

const trimThreads = (threads: Thread[]): Thread[] => {
  const sorted = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);
  return sorted.slice(0, MAX_THREADS);
};

const dedupe = <T,>(values: T[]): T[] => Array.from(new Set(values));

type ActiveStream = {
  close: () => void;
  messageId: string;
  threadId: string;
};

type ChatStore = {
  threads: Thread[];
  activeThreadId: string | null;
  isStreaming: boolean;
  activeStream: ActiveStream | null;
  error: string | null;
  sourcesMessageId: string | null;
  lastUserMessage: string | null;
  newThread: () => string;
  setActiveThread: (threadId: string) => void;
  renameThread: (title: string) => void;
  deleteThread: (threadId: string) => void;
  deleteAllThreads: () => void;
  openSources: (messageId: string | null) => void;
  send: (message: string) => void;
  stop: () => void;
  retry: () => void;
  acknowledgeError: () => void;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      threads: [],
      activeThreadId: null,
      isStreaming: false,
      activeStream: null,
      error: null,
      sourcesMessageId: null,
      lastUserMessage: null,

      newThread: () => {
        const id = crypto.randomUUID();
        const now = Date.now();

        const thread: Thread = {
          id,
          checkpointId: null,
          title: defaultTitle,
          messages: [],
          createdAt: now,
          updatedAt: now
        };

        set((state) => ({
          threads: trimThreads([thread, ...state.threads.filter((item) => item.id !== id)]),
          activeThreadId: id,
          error: null,
          sourcesMessageId: null
        }));

        return id;
      },

      setActiveThread: (threadId) => {
        const threadExists = get().threads.some((thread) => thread.id === threadId);
        if (!threadExists) return;
        set({ activeThreadId: threadId, error: null, sourcesMessageId: null });
      },

      renameThread: (title) => {
        const trimmed = title.trim();
        if (!trimmed) return;

        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === state.activeThreadId
              ? {
                  ...thread,
                  title: trimmed,
                  updatedAt: Date.now()
                }
              : thread
          )
        }));
      },

      deleteThread: (threadId) => {
        set((state) => {
          const filtered = state.threads.filter((thread) => thread.id !== threadId);
          const activeThreadId = state.activeThreadId === threadId ? filtered[0]?.id ?? null : state.activeThreadId;
          const shouldCancelStream = state.activeStream?.threadId === threadId;

          if (shouldCancelStream) {
            state.activeStream?.close();
          }

          return {
            threads: trimThreads(filtered),
            activeThreadId,
            isStreaming: shouldCancelStream ? false : state.isStreaming,
            activeStream: shouldCancelStream ? null : state.activeStream,
            sourcesMessageId: null
          };
        });
      },

      deleteAllThreads: () => {
        set((state) => {
          state.activeStream?.close?.();
          return {
            threads: [],
            activeThreadId: null,
            isStreaming: false,
            activeStream: null,
            sourcesMessageId: null
          };
        });
      },

      openSources: (messageId) => set({ sourcesMessageId: messageId }),

      stop: () => {
        const { activeStream } = get();
        if (!activeStream) return;
        activeStream.close();
        set({ isStreaming: false, activeStream: null });
      },

      retry: () => {
        const { lastUserMessage } = get();
        if (!lastUserMessage) return;
        get().send(lastUserMessage);
      },

      acknowledgeError: () => set({ error: null }),

      send: (rawMessage: string) => {
        const message = rawMessage.trim();
        if (!message || get().isStreaming) {
          return;
        }

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

        let threadId = get().activeThreadId;
        const currentThreads = get().threads;
        let thread = currentThreads.find((item) => item.id === threadId);

        if (!thread) {
          threadId = get().newThread();
          thread = get().threads.find((item) => item.id === threadId) ?? null;
        }

        if (!thread || !threadId) return;

        const userMessage: Message = {
          id: crypto.randomUUID(),
          role: "user",
          content: message
        };

        const assistantMessageId = crypto.randomUUID();
        const assistantDraft: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          citations: [],
          searchQuery: null
        };

        const now = Date.now();

        set((state) => {
          const updatedThreads = state.threads.map((item) => {
            if (item.id !== threadId) return item;
            const messages = [...item.messages, userMessage, assistantDraft];
            return {
              ...item,
              messages,
              updatedAt: now,
              title: deriveTitle(messages)
            };
          });

          return {
            threads: trimThreads(updatedThreads),
            isStreaming: true,
            error: null,
            lastUserMessage: message,
            sourcesMessageId: null
          };
        });

        get().activeStream?.close();

        const applyEvent = (event: SSEEvent) => {
          set((state) => {
            const threads = state.threads.map((item) => {
              if (item.id !== threadId) return item;

              let updatedMessages = item.messages.map((msg) => {
                if (msg.id !== assistantMessageId) return msg;

                switch (event.type) {
                  case "content":
                    return {
                      ...msg,
                      content: appendChunk(msg.content, event.content)
                    };
                  case "search_start":
                    return {
                      ...msg,
                      searchQuery: event.query
                    };
                  case "search_results":
                    return {
                      ...msg,
                      citations: dedupe([...(msg.citations ?? []), ...event.urls])
                    };
                  case "end":
                    return {
                      ...msg,
                      searchQuery: null
                    };
                  default:
                    return msg;
                }
              });

              if (!updatedMessages.some((msg) => msg.id === assistantMessageId)) {
                updatedMessages = [...updatedMessages, {
                  id: assistantMessageId,
                  role: "assistant",
                  content: "",
                  citations: [],
                  searchQuery: null
                }];
              }

              if (event.type === "checkpoint") {
                return {
                  ...item,
                  checkpointId: event.checkpoint_id,
                  messages: updatedMessages,
                  updatedAt: Date.now()
                };
              }

              if (event.type === "end") {
                return {
                  ...item,
                  messages: updatedMessages,
                  updatedAt: Date.now()
                };
              }

              return {
                ...item,
                messages: updatedMessages
              };
            });

            const finished = event.type === "end";

            return {
              threads: trimThreads(threads),
              isStreaming: finished ? false : state.isStreaming,
              activeStream: finished ? null : state.activeStream,
              error: finished ? null : state.error
            };
          });
        };

        const stream = openChatStream({
          apiBaseUrl,
          message,
          checkpointId: thread.checkpointId ?? undefined,
          onEvent: applyEvent,
          onError: () => {
            set({ error: "Stream error. Please try again.", isStreaming: false, activeStream: null });
          }
        });

        set({
          activeStream: { close: stream.close, messageId: assistantMessageId, threadId },
          activeThreadId: threadId
        });
      }
    }),
    {
      name: STORAGE_KEY,
      storage: typeof window === "undefined" ? undefined : createJSONStorage(() => localStorage),
      partialize: (state) => ({
        threads: trimThreads(state.threads),
        activeThreadId: state.activeThreadId
      })
    }
  )
);
