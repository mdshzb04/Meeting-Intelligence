"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { MeetingMindLogo } from "@/components/icons/meetingmind-logo";
import { cn } from "@/lib/utils";

type Mode = "signup" | "signin";

export default function LoginPage() {
  const { login, register, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (mode === "signup") await register(name.trim(), email, password);
      else await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-[480px] w-[720px] rounded-full bg-[color-mix(in_srgb,var(--brand-blue)_12%,transparent)] blur-3xl" />
      </div>

      <header className="relative z-10 flex h-14 items-center px-8 border-b border-border/60">
        <button
          type="button"
          onClick={() => {
            window.location.href = "/login";
          }}
          className="hover:opacity-90 transition-opacity"
        >
          <MeetingMindLogo size="md" showWordmark />
        </button>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center px-6 py-16 sm:py-24">
        <div className="w-full max-w-md">
          <h1 className="font-heading text-[2.25rem] sm:text-[2.75rem] leading-[1.1] tracking-tight text-foreground text-center">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-4 text-center text-[15px] text-muted-foreground leading-relaxed">
            {mode === "signup"
              ? "Sign up with email to save meetings, chat with memory, and track action items."
              : "Sign in to continue to your meeting workspace."}
          </p>

          <div className="mt-8 flex rounded-full border border-border bg-card/50 p-1">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={cn(
                "flex-1 rounded-full py-2 text-[13px] font-medium transition-colors",
                mode === "signup"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={cn(
                "flex-1 rounded-full py-2 text-[13px] font-medium transition-colors",
                mode === "signin"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign in
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-[12px] text-muted-foreground block mb-1.5">
                  Your name
                </label>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Alex"
                  className="w-full px-4 py-2.5 text-[14px] bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                />
              </div>
            )}
            <div>
              <label className="text-[12px] text-muted-foreground block mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 text-[14px] bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
              />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground block mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 text-[14px] bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
              />
            </div>

            {error && (
              <p className="text-[13px] text-destructive text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary text-primary-foreground text-[14px] font-medium py-2.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Please wait…
                </span>
              ) : mode === "signup" ? (
                "Get started"
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
