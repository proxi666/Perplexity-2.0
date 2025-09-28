"use client";

import { useMemo } from "react";
import { BookOpen, ExternalLink, LinkIcon } from "lucide-react";

import { domainFromUrl } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface SourcesPanelProps {
  message?: Message | null;
  isOpen: boolean;
  onClose: () => void;
}

const SourcesList = ({ citations }: { citations: string[] }) => {
  if (citations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-muted-foreground">
        No sources available yet. When the assistant cites references, they will appear here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {citations.map((url) => (
        <div
          key={url}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10"
        >
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
            <span>{domainFromUrl(url)}</span>
            <Badge variant="outline" className="border-white/15 bg-white/10">
              Source
            </Badge>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-2 text-sm text-foreground underline-offset-4 hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            {url}
          </a>
        </div>
      ))}
    </div>
  );
};

export const SourcesPanel = ({ message, isOpen, onClose }: SourcesPanelProps) => {
  const citations = useMemo(() => {
    const urls = message?.citations ?? [];
    return Array.from(new Set(urls));
  }, [message]);

  const list = <SourcesList citations={citations} />;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
        <SheetContent className="lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Sources</SheetTitle>
          </SheetHeader>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <LinkIcon className="h-4 w-4" /> Sources
            </div>
            <SheetClose asChild>
              <Button variant="secondary" size="sm" className="rounded-full border border-white/20 bg-white/10 px-4">
                Close
              </Button>
            </SheetClose>
          </div>
          <ScrollArea className="mt-6 h-[70vh]">
            {list}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "hidden h-full flex-col rounded-3xl backdrop-blur-xl transition-all duration-300 lg:flex",
          isOpen
            ? "w-80 border border-white/10 bg-white/5 p-6 opacity-100"
            : "w-0 border border-transparent bg-transparent p-0 opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <BookOpen className="h-4 w-4" /> Sources
        </div>
        <ScrollArea className="mt-6">
          {list}
        </ScrollArea>
      </aside>
    </>
  );
};
