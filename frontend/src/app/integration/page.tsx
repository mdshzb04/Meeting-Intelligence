"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Send } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

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
        <h1 className="heading-lg">Integration</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Connect Slack to get notified when meetings finish processing.
        </p>
      </div>

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
    </div>
  );
}
