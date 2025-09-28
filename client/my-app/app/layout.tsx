import type { Metadata } from "next";

import "./globals.css";

import { AppToaster } from "@/components/ui/sonner-toaster";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Perplexity 2.0",
  description: "A Perplexity-inspired conversational research assistant."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={cn("min-h-screen bg-background font-sans text-foreground antialiased")}>
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
