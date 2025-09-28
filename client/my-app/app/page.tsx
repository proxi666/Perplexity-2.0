"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, History, Zap } from "lucide-react";
import { toast } from "sonner";

import { MessageBubble } from "@/components/MessageBubble";
import { ChatInput } from "@/components/ChatInput";
import { Sidebar } from "@/components/Sidebar";
import { SourcesPanel } from "@/components/SourcesPanel";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/store/chat";

const DEV_MODE = process.env.NODE_ENV !== "production";
const QUICK_PROMPTS = [
  "What’s the weather in Delhi today?",
  "Summarize the latest breakthrough in AI research.",
  "Suggest a 3-day itinerary for Kyoto.",
  "Explain quantum computing like I'm five."
];

export default function HomePage() {
  const {
    threads,
    activeThreadId,
    isStreaming,
    sourcesMessageId,
    openSources,
    send,
    error,
    acknowledgeError,
    retry
  } = useChatStore((state) => ({
    threads: state.threads,
    activeThreadId: state.activeThreadId,
    isStreaming: state.isStreaming,
    sourcesMessageId: state.sourcesMessageId,
    openSources: state.openSources,
    send: state.send,
    error: state.error,
    acknowledgeError: state.acknowledgeError,
    retry: state.retry
  }));

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId]
  );
  const messages = activeThread?.messages ?? [];

  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [lastUpdated, setLastUpdated] = useState("--:--");

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isStreaming, messages[messages.length - 1]?.content]);

  useEffect(() => {
    if (!error) return;

    const id = toast.error(error, {
      action: {
        label: "Retry",
        onClick: () => retry()
      }
    });

    return () => toast.dismiss(id);
  }, [error, retry]);

  useEffect(() => {
    if (!error) {
      return;
    }
    acknowledgeError();
  }, [error, acknowledgeError]);

  useEffect(() => {
    const updateTime = () => {
      setLastUpdated(
        new Intl.DateTimeFormat(undefined, {
          hour: "2-digit",
          minute: "2-digit"
        }).format(new Date())
      );
    };

    updateTime();
  }, [messages.length, isStreaming]);

  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === sourcesMessageId) ?? null,
    [messages, sourcesMessageId]
  );

  const handleToggleSources = useCallback(
    (messageId: string) => {
      openSources(sourcesMessageId === messageId ? null : messageId);
    },
    [openSources, sourcesMessageId]
  );

  const showEmptyState = messages.length === 0;

  return (
    <main className="flex min-h-screen w-full flex-col">
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-4 px-4 pb-6 pt-6 lg:gap-8 lg:px-8">
        <Sidebar />

        <section className="flex flex-1 flex-col gap-6">
          <header className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-white/5 px-6 py-6 text-center backdrop-blur-xl">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              Perplexity 2.0
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Ask, explore and cite with confidence.</h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              A Perplexity-inspired assistant that researches live, streams answers, and keeps sources at your fingertips.
            </p>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
              <History className="h-4 w-4" />
              <span>Last updated {lastUpdated}</span>
            </div>
          </header>

          {DEV_MODE && (
            <div className="flex flex-wrap items-center gap-2 rounded-3xl border border-dashed border-white/10 bg-white/5 px-5 py-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-accent" /> Quick prompts
              </div>
              {QUICK_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  size="sm"
                  variant="ghost"
                  className="rounded-full border border-white/10 bg-white/5 text-xs hover:bg-white/10"
                  disabled={isStreaming}
                  onClick={() => send(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          )}

          <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black/20 backdrop-blur-xl">
            <ScrollArea className="h-full" viewportRef={scrollRef}>
              <div className="flex flex-col gap-6 px-6 py-8">
                {showEmptyState ? (
                  <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-center text-muted-foreground">
                    <Sparkles className="h-6 w-6 text-accent" />
                    <p className="text-lg font-semibold text-foreground">Start your next research journey.</p>
                    <p className="text-sm">
                      Ask a question and I’ll search, synthesize and cite credible sources in real time.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        layout
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MessageBubble
                          message={message}
                          isStreaming={isStreaming && message.role === "assistant"}
                          isSourcesOpen={sourcesMessageId === message.id}
                          onToggleSources={message.role === "assistant" && message.citations?.length ? handleToggleSources : undefined}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={endRef} />
              </div>
            </ScrollArea>
          </div>

          <ChatInput />
        </section>

        <SourcesPanel
          message={selectedMessage}
          isOpen={Boolean(sourcesMessageId)}
          onClose={() => openSources(null)}
        />
      </div>
    </main>
  );
}
