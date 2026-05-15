"use client";

import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isAuthPage = pathname === "/login";
  const isWidePage =
    pathname.startsWith("/meeting/") ||
    pathname.startsWith("/workspace/") ||
    pathname.startsWith("/knowledge");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-[240px] transition-all duration-200">
        <div
          className={cn(
            "mx-auto px-8 py-8",
            isWidePage ? "max-w-5xl" : "max-w-4xl"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
