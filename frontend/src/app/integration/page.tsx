"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send, Mail, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const EMAIL_EVENTS = [
  { label: "Welcome email", desc: "Sent when you create your account" },
  { label: "Meeting processed", desc: "Sent when AI analysis completes" },
  { label: "Transcript ready", desc: "Sent after audio transcription finishes" },
  { label: "Meeting shared", desc: "Sent when someone shares a meeting with you" },
  { label: "Workspace invitation", desc: "Sent when you're invited to a workspace" },
];

export default function IntegrationPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["integrations", "slack"],
    queryFn: () => api.getSlackIntegration(),
  });

  const [webhookUrl, setWebhookUrl] = useState("");

  const save = useMutation({
    mutationFn: () =>
      api.updateSlackIntegration(webhookUrl.trim() ? webhookUrl.trim() : null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations", "slack"] });
      setWebhookUrl("");
      toast.success("Slack webhook saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const test = useMutation({
    mutationFn: () => api.testSlackIntegration(),
    onSuccess: () => toast.success("Test message sent to Slack"),
    onError: (e: Error) => toast.error(e.message),
  });

  const disconnect = useMutation({
    mutationFn: () => api.updateSlackIntegration(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations", "slack"] });
      toast.success("Slack disconnected");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="heading-lg">Integrations</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Connect tools and manage notifications for your workspace.
        </p>
      </div>

      {/* ── Slack ── */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-[14px] font-medium text-foreground">Slack</h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            Paste an Incoming Webhook URL from your Slack workspace. Create one in
            Slack → Apps → Incoming Webhooks.
          </p>
        </div>

        {data?.configured && (
          <p className="text-[12px] text-muted-foreground">
            Connected: <span className="text-foreground">{data.webhook_url_masked}</span>
          </p>
        )}

        <div>
          <label className="text-[12px] text-muted-foreground block mb-1.5">
            Webhook URL
          </label>
          <input
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full px-3 py-2 text-[13px] bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending || !webhookUrl.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground text-[13px] font-medium px-4 py-2 hover:opacity-90 disabled:opacity-40"
          >
            {save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save webhook
          </button>
          {data?.configured && (
            <>
              <button
                type="button"
                onClick={() => test.mutate()}
                disabled={test.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-border text-[13px] px-4 py-2 hover:bg-muted/50 disabled:opacity-40"
              >
                {test.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Send test
              </button>
              <button
                type="button"
                onClick={() => disconnect.mutate()}
                disabled={disconnect.isPending}
                className="text-[13px] text-muted-foreground hover:text-destructive px-2"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </section>

      {/* ── Email Notifications ── */}
      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <h2 className="text-[14px] font-medium text-foreground">Email Notifications</h2>
            </div>
            <p className="text-[12px] text-muted-foreground mt-1">
              Transactional emails are sent automatically to your account email.
              No configuration needed.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-medium px-2.5 py-1 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        </div>

        <ul className="space-y-2.5">
          {EMAIL_EVENTS.map((ev) => (
            <li key={ev.label} className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] text-foreground font-medium">{ev.label}</p>
                <p className="text-[12px] text-muted-foreground">{ev.desc}</p>
              </div>
            </li>
          ))}
        </ul>


      </section>
    </div>
  );
}
