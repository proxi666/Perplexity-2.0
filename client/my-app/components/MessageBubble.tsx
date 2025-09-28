"use client";

import { memo, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { ExternalLink, Loader2, Sparkles, User } from "lucide-react";

import "highlight.js/styles/github-dark.css";

import { domainFromUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  isSourcesOpen?: boolean;
  onToggleSources?: (messageId: string) => void;
}

const Avatar = ({ role }: { role: Message["role"] }) => {
  if (role === "assistant") {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/90 to-blue-500/80 shadow-inner">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
      <User className="h-5 w-5 text-white" />
    </div>
  );
};

const renderers = {
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="leading-relaxed" {...props} />
  ),
  code({ inline, className, children, ...props }: any) {
    const match = /language-(\w+)/.exec(className || "");
    if (inline) {
      return (
        <code
          className={cn(
            "rounded-md bg-white/10 px-1.5 py-0.5 text-sm font-medium",
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <pre
        className={cn(
          "mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/60 p-4 text-sm",
          className
        )}
        {...props}
      >
        <code className={match ? className : undefined}>{children}</code>
      </pre>
    );
  }
};

export const MessageBubble = memo(({ message, isStreaming, onToggleSources, isSourcesOpen }: MessageBubbleProps) => {
  const isAssistant = message.role === "assistant";
  const showSearch = Boolean(message.searchQuery);
  const citations = useMemo(() => message.citations?.filter(Boolean) ?? [], [message.citations]);

  return (
    <div
      className={cn(
        "flex w-full gap-4",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      {isAssistant && <Avatar role={message.role} />}

      <div
        className={cn(
          "max-w-2xl space-y-3 rounded-3xl border border-white/10 px-6 py-5 shadow-lg shadow-black/10",
          isAssistant
            ? "glass-panel bg-white/10 text-foreground"
            : "bg-gradient-to-br from-sky-500/80 to-blue-500/80 text-white"
        )}
      >
        {!isAssistant ? (
          <p className="text-base leading-relaxed">{message.content}</p>
        ) : (
          <div className="markdown-body text-base">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
              components={renderers as any}
            >
              {message.content || (isStreaming ? "…" : "")}
            </ReactMarkdown>
          </div>
        )}

        {showSearch && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Searching {message.searchQuery}…
          </div>
        )}

        {citations.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {citations.map((url) => (
              <Badge key={url} variant="outline" asChild>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-foreground transition hover:bg-white/20"
                >
                  <ExternalLink className="h-3 w-3" />
                  {domainFromUrl(url)}
                </a>
              </Badge>
            ))}
            {onToggleSources && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="ml-1 h-8 rounded-full border border-white/10 bg-white/10 px-3 text-xs"
                onClick={() => onToggleSources(message.id)}
              >
                {isSourcesOpen ? "Hide Sources" : "Show Sources"}
              </Button>
            )}
          </div>
        )}
      </div>

      {!isAssistant && <Avatar role={message.role} />}
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";
