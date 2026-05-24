"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.txt,.md,.docx";

type FileResult = { filename: string; status: string; reason?: string };

export function KnowledgeUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [dragOver, setDragOver] = useState(false);
  const [results, setResults] = useState<FileResult[]>([]);

  const upload = useMutation({
    mutationFn: (files: File[]) => api.uploadKnowledgeDocumentsBatch(files),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
      setResults(data.results);
      if (data.queued > 0) {
        toast.success(`${data.queued} document${data.queued !== 1 ? "s" : ""} queued for indexing`);
      }
      const dupes = data.results.filter((r) => r.status === "duplicate").length;
      if (dupes > 0) toast.info(`${dupes} duplicate${dupes !== 1 ? "s" : ""} skipped`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleFiles = (fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : [];
    if (!files.length || upload.isPending) return;
    setResults([]);
    upload.mutate(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const statusIcon = (status: string) => {
    if (status === "queued") return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />;
    if (status === "duplicate") return <AlertCircle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />;
    return <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />;
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "w-full flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
        )}
      >
        {upload.isPending ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="h-5 w-5 text-muted-foreground" />
        )}
        <span className="text-[13px] text-foreground">
          {upload.isPending ? "Uploading…" : "Upload documents"}
        </span>
        <span className="text-[11px] text-muted-foreground">
          PDF, TXT, MD, or DOCX — select multiple files
        </span>
      </button>

      {results.length > 0 && (
        <ul className="space-y-1.5">
          {results.map((r, i) => (
            <li key={i} className="flex items-center gap-2 text-[12px]">
              {statusIcon(r.status)}
              <span className="text-foreground truncate flex-1">{r.filename}</span>
              {r.status === "duplicate" && (
                <span className="text-yellow-400 shrink-0">duplicate</span>
              )}
              {r.status === "error" && (
                <span className="text-destructive shrink-0 truncate max-w-[120px]" title={r.reason}>
                  {r.reason}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
