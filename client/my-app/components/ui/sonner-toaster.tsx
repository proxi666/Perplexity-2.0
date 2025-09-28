"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      theme="dark"
      toastOptions={{
        classNames: {
          toast: "bg-card/90 border border-white/10 backdrop-blur-xl text-sm text-foreground",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-transparent text-muted-foreground"
        }
      }}
    />
  );
}
