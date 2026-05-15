"use client";

import type { Meeting } from "@/lib/api";

export function SummaryPanel({ meeting }: { meeting: Meeting }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      {meeting.summary && (
        <div>
          <h3 className="text-[11px] uppercase tracking-wider text-[#555] font-medium mb-3">
            Summary
          </h3>
          <p className="text-[13px] text-[#ccc] leading-relaxed whitespace-pre-line">
            {meeting.summary}
          </p>
        </div>
      )}

      {/* Highlights */}
      {meeting.highlights && (
        <div className="border-t border-[#1f1f1f] pt-6">
          <h3 className="text-[11px] uppercase tracking-wider text-[#555] font-medium mb-3">
            Key Highlights
          </h3>
          <div className="text-[13px] text-[#aaa] leading-relaxed space-y-1.5">
            {meeting.highlights.split("\n").filter(Boolean).map((line, i) => (
              <p key={i} className="flex gap-2">
                <span className="text-[#333] shrink-0">—</span>
                <span>{line.replace(/^[-•]\s*/, "")}</span>
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {meeting.next_steps && (
        <div className="border-t border-[#1f1f1f] pt-6">
          <h3 className="text-[11px] uppercase tracking-wider text-[#555] font-medium mb-3">
            Next Steps
          </h3>
          <div className="text-[13px] text-[#aaa] leading-relaxed space-y-1.5">
            {meeting.next_steps.split("\n").filter(Boolean).map((line, i) => (
              <p key={i} className="flex gap-2">
                <span className="text-[#333] shrink-0">—</span>
                <span>{line.replace(/^[-•]\s*/, "")}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
