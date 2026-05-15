"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  ListChecks,
  Scale,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Plug,
  BookOpen,
} from "lucide-react";
import { MeetingMindLogo } from "@/components/icons/meetingmind-logo";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

function reloadHome() {
  window.location.href = "/";
}

const navItems = [{ href: "/", label: "Dashboard", icon: LayoutDashboard }];

const workspaceNav = [
  { globalHref: "/workspace/chat", label: "Memory Chat", icon: MessageSquare, key: "chat" as const },
  { globalHref: "/workspace/actions", label: "Action Items", icon: ListChecks, key: "actions" as const },
  { globalHref: "/workspace/decisions", label: "Decisions", icon: Scale, key: "decisions" as const },
];

function getMeetingId(pathname: string): string | null {
  const m = pathname.match(/^\/meeting\/([^/]+)/);
  return m?.[1] ?? null;
}

function getActiveWorkspaceKey(pathname: string): string | null {
  if (pathname.startsWith("/workspace/chat") || /\/meeting\/[^/]+\/chat$/.test(pathname)) {
    return "chat";
  }
  if (pathname.startsWith("/workspace/actions") || /\/meeting\/[^/]+\/actions$/.test(pathname)) {
    return "actions";
  }
  if (pathname.startsWith("/workspace/decisions") || /\/meeting\/[^/]+\/decisions$/.test(pathname)) {
    return "decisions";
  }
  return null;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const meetingId = getMeetingId(pathname);
  const activeKey = getActiveWorkspaceKey(pathname);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col border-r border-border bg-background"
    >
      <div className="flex h-14 items-center gap-2.5 px-4 border-b border-border">
        <button
          type="button"
          onClick={reloadHome}
          className="flex items-center gap-2.5 min-w-0 rounded-md hover:opacity-80 transition-opacity"
          aria-label="MeetingMind home"
        >
          <MeetingMindLogo size="sm" showWordmark={!collapsed} />
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        {!collapsed && (
          <p className="px-2.5 pt-4 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Meeting workspace
          </p>
        )}

        <Link
          href="/knowledge"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
            pathname === "/knowledge"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <BookOpen className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Knowledge Base</span>}
        </Link>

        <Link
          href="/integration"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
            pathname === "/integration"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          <Plug className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Integration</span>}
        </Link>

        {workspaceNav.map((item) => {
          const Icon = item.icon;
          const href = meetingId
            ? `/meeting/${meetingId}/${item.key === "chat" ? "chat" : item.key}`
            : item.globalHref;
          const isActive = activeKey === item.key;

          return (
            <Link
              key={item.key}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                isActive
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-2 border-t border-border space-y-0.5 mt-auto">
        <button
          type="button"
          onClick={logout}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors",
            collapsed && "justify-center px-0"
          )}
          title="Log out"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-md py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
        {user && (
          <div
            className={cn(
              "rounded-md bg-muted/40 px-2.5 py-2",
              collapsed && "flex justify-center px-1"
            )}
            title={user.name}
          >
            {!collapsed ? (
              <>
                <p className="text-[13px] font-medium text-foreground truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {user.email}
                </p>
              </>
            ) : (
              <span className="text-[11px] font-semibold text-foreground">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
}
