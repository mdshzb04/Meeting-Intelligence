"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileAudio, Loader2, X, Mic, Type } from "lucide-react";
import { useCreateMeeting, useUploadMeeting } from "@/hooks/use-meetings";
import { toast } from "sonner";

type InputMode = "audio" | "text";

export function NewMeetingForm() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("text");
  const [title, setTitle] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const createMeeting = useCreateMeeting();
  const uploadMeeting = useUploadMeeting();
  const isSubmitting = createMeeting.isPending || uploadMeeting.isPending;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) {
      const ext = dropped.name.split(".").pop()?.toLowerCase();
      if (["mp3", "wav", "m4a"].includes(ext || "")) {
        setFile(dropped);
      } else {
        toast.error("Please upload mp3, wav, or m4a files");
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = () => {
    if (mode === "text") {
      if (!transcriptText.trim() || transcriptText.trim().length < 10) {
        toast.error("Please enter a transcript (minimum 10 characters)");
        return;
      }
      createMeeting.mutate(
        { title: title || "Untitled Meeting", transcript_text: transcriptText },
        {
          onSuccess: (meeting) => {
            toast.success("Meeting created — processing in background");
            router.push(`/meeting/${meeting.id}/chat`);
          },
          onError: (err) => {
            toast.error(err.message || "Failed to create meeting");
          },
        }
      );
    } else {
      if (!file) {
        toast.error("Please select an audio file");
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 25MB");
        return;
      }
      uploadMeeting.mutate(
        { file, title: title || undefined },
        {
          onSuccess: (meeting) => {
            toast.success("Upload received — processing in background");
            router.push(`/meeting/${meeting.id}/chat`);
          },
          onError: (err) => {
            toast.error(err.message || "Failed to upload meeting");
          },
        }
      );
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="heading-lg mb-1">New Meeting</h2>
        <p className="text-[13px] text-muted-foreground">
          Upload audio or paste a transcript — processing runs in the background
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="flex gap-1 bg-card border border-border rounded-md p-0.5"
      >
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-[5px] py-1.5 text-[13px] transition-colors ${
            mode === "text"
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Type className="h-3.5 w-3.5" />
          Paste Transcript
        </button>
        <button
          type="button"
          onClick={() => setMode("audio")}
          className={`flex-1 flex items-center justify-center gap-2 rounded-[5px] py-1.5 text-[13px] transition-colors ${
            mode === "audio"
              ? "bg-primary text-primary-foreground font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mic className="h-3.5 w-3.5" />
          Upload Audio
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <label className="text-[12px] text-muted-foreground block mb-1.5">
          Meeting Title (optional)
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Weekly Standup, Q4 Planning..."
          className="w-full px-3 py-2 text-[13px] bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <AnimatePresence mode="wait">
          {mode === "text" ? (
            <motion.div
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                placeholder="Paste your meeting transcript here..."
                className="w-full h-[240px] px-3 py-2.5 text-[13px] font-mono bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors resize-y"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {transcriptText.length > 0
                  ? `${transcriptText.split(/\s+/).filter(Boolean).length} words`
                  : "Minimum 10 characters"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="audio"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("audio-input")?.click()}
                className={`flex flex-col items-center justify-center rounded-lg border border-dashed py-12 transition-colors cursor-pointer ${
                  dragActive
                    ? "border-ring bg-muted/30"
                    : "border-border hover:border-ring bg-transparent"
                }`}
              >
                <input
                  id="audio-input"
                  type="file"
                  accept=".mp3,.wav,.m4a"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileAudio className="h-8 w-8 text-muted-foreground" />
                    <p className="text-[13px] text-foreground font-medium">{file.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-[13px] text-muted-foreground">
                      Drop audio file or click to browse
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      MP3, WAV, M4A — max 25MB
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isSubmitting || (mode === "text" ? transcriptText.trim().length < 10 : !file)
          }
          className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-[13px] font-medium px-4 py-2.5 hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {isSubmitting ? "Starting..." : "start"}
        </button>
      </motion.div>
    </div>
  );
}
