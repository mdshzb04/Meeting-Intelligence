"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

type MeetingMindMarkProps = {
  className?: string;
  size?: number;
};

/** Blue flowing wing mark — minimalist SVG, theme brand gradient. */
export function MeetingMindMark({ className, size = 28 }: MeetingMindMarkProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `mm-wing-${uid}`;

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gradId}
          x1="6"
          y1="42"
          x2="42"
          y2="6"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="var(--brand-blue-deep)" />
          <stop offset="55%" stopColor="var(--brand-blue)" />
          <stop offset="100%" stopColor="var(--brand-blue-bright)" />
        </linearGradient>
      </defs>
      {/* Wing blades — left, tapering */}
      <path
        d="M8 32h14"
        stroke={`url(#${gradId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M8 24h20"
        stroke={`url(#${gradId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M8 16h11"
        stroke={`url(#${gradId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Flowing C / wing curve */}
      <path
        d="M18 14c0-4 3.5-8 10-8 9 0 14 6 14 14s-5 14-14 14c-5 0-9-2-11-5"
        stroke={`url(#${gradId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M22 18c0-2 2-4 6-4 5 0 8 3 8 7s-3 7-8 7"
        stroke={`url(#${gradId})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
}
