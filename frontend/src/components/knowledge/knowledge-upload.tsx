"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useUploadKnowledgeDocument } from "@/hooks/use-knowledge";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.txt,.md,.docx";

export function KnowledgeUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadKnowledgeDocument();
  const [title, setTitle] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || upload.isPending) return;
    upload.mutate({ file, title: title.trim() || undefined });
    setTitle("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Optional title"
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
      />
      <button
        type="button"
        disabled={upload.isPending}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
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
          {upload.isPending ? "Uploading…" : "Upload document"}
        </span>
        <span className="text-[11px] text-muted-foreground">
          PDF, TXT, MD, or DOCX — processed in the background
        </span>
      </button>
      {upload.isError && (
        <p className="text-[12px] text-destructive">
          {upload.error instanceof Error ? upload.error.message : "Upload failed"}
        </p>
      )}
    </div>
  );
}
