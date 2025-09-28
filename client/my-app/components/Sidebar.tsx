"use client";

import { useMemo, useState } from "react";
import { Menu, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const ThreadList = ({ onSelect }: { onSelect?: () => void }) => {
  const {
    threads,
    activeThreadId,
    setActiveThread,
    deleteThread,
    deleteAllThreads,
    renameThread,
    newThread,
    stop
  } =
    useChatStore((state) => ({
      threads: state.threads,
      activeThreadId: state.activeThreadId,
      setActiveThread: state.setActiveThread,
      deleteThread: state.deleteThread,
      deleteAllThreads: state.deleteAllThreads,
      renameThread: state.renameThread,
      newThread: state.newThread,
      stop: state.stop
    }));

  const items = useMemo(
    () =>
      threads.map((thread) => ({
        id: thread.id,
        title: thread.title || "New Chat",
        updatedAt: thread.updatedAt
      })),
    [threads]
  );

  const handleRename = (id: string, title: string) => {
    if (!title) return;
    setActiveThread(id);
    renameThread(title);
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <Button
        variant="secondary"
        className="w-full justify-center rounded-2xl bg-white/10 text-sm font-medium text-foreground hover:bg-white/20"
        onClick={() => {
          newThread();
          onSelect?.();
        }}
      >
        <Plus className="mr-2 h-4 w-4" /> New Chat
      </Button>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 pb-16">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-sm text-muted-foreground">
              No threads yet. Start a new conversation.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "group relative flex w-full cursor-pointer items-center justify-between rounded-2xl border border-transparent bg-white/5 px-4 py-3 text-sm transition hover:border-white/10 hover:bg-white/10",
                  activeThreadId === item.id && "border-white/20 bg-white/15"
                )}
                onClick={() => {
                  setActiveThread(item.id);
                  onSelect?.();
                }}
              >
                <div className="flex w-full flex-col gap-1 pr-10">
                  <span className="truncate font-medium text-foreground">{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="absolute right-3 top-1/2 flex -translate-y-1/2 gap-1 opacity-0 transition group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={(event) => {
                      event.stopPropagation();
                      const next = window.prompt("Rename thread", item.title);
                      if (next && next.trim()) {
                        handleRename(item.id, next.trim());
                      }
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (window.confirm("Delete this thread?")) {
                        deleteThread(item.id);
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="sticky bottom-0 -mb-4 mt-auto flex justify-center pt-4">
        <Button
          type="button"
          variant="ghost"
          className="gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-white/10"
          onClick={() => {
            if (!threads.length) return;
            if (window.confirm("Clear all threads?")) {
              deleteAllThreads();
              stop();
            }
          }}
        >
          Clear history
        </Button>
      </div>
    </div>
  );
};

export const Sidebar = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 shrink-0 rounded-full border border-white/10 bg-white/5 text-foreground hover:bg-white/10 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full max-w-xs bg-background/95 backdrop-blur-xl lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Threads</SheetTitle>
          </SheetHeader>
          <div className="mt-10 flex items-center gap-2 text-sm font-semibold text-foreground">
            <MessageCircle className="h-4 w-4" /> Threads
          </div>
          <div className="mt-6">
            <ThreadList onSelect={() => setOpen(false)} />
          </div>
          <SheetClose asChild>
            <Button variant="secondary" className="mt-6 w-full">
              Close
            </Button>
          </SheetClose>
        </SheetContent>
      </Sheet>

      <aside className="hidden w-72 shrink-0 flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl lg:flex">
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <MessageCircle className="h-4 w-4" /> Threads
        </div>
        <ThreadList />
      </aside>
    </>
  );
};
