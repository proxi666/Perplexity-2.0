"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, Send, Square } from "lucide-react";

import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_CHARS = 4000;

export const ChatInput = () => {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { send, stop, isStreaming } = useChatStore((state) => ({
    send: state.send,
    stop: state.stop,
    isStreaming: state.isStreaming
  }));

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    send(trimmed);
    setValue("");
  }, [send, value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [value]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        stop();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [stop]);

  return (
    <div className="glass-panel relative w-full rounded-3xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-xl">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <Textarea
          ref={textareaRef}
          value={value}
          disabled={isStreaming}
          maxLength={MAX_CHARS}
          placeholder={isStreaming ? "Assistant is responding..." : "Ask me anything"}
          className="min-h-[96px] w-full bg-transparent text-base leading-relaxed"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{value.length}/{MAX_CHARS}</span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
              disabled
              title="Voice input coming soon"
            >
              <Mic className="h-4 w-4" />
            </Button>
            {isStreaming ? (
              <Button
                type="button"
                variant="ghost"
                className="gap-2 rounded-full border border-white/20 bg-white/10 px-4 text-sm"
                onClick={() => stop()}
              >
                <Square className="h-3.5 w-3.5" /> Stop
              </Button>
            ) : (
              <Button
                type="submit"
                className={cn(
                  "gap-2 rounded-full bg-primary px-6 text-sm text-primary-foreground shadow hover:bg-primary/90",
                  value.trim() ? "opacity-100" : "opacity-60"
                )}
                disabled={!value.trim()}
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            )}
          </div>
        </div>
      </form>

      {isStreaming && (
        <div className="absolute -top-10 right-6 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Streaming… Press Esc to stop
        </div>
      )}
    </div>
  );
};
