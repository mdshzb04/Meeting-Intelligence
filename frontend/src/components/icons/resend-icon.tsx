import { cn } from "@/lib/utils";

type ResendIconProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

/** Resend-style skeuomorphic envelope mark (theme-driven colors). */
export function ResendIcon({ className, size = "sm" }: ResendIconProps) {
  const gradientId = `resend-env-${size}`;

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[22%] border border-border bg-card shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--foreground)_8%,transparent)]",
        sizeMap[size],
        className
      )}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-foreground/10 to-transparent" />
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="absolute inset-0 h-full w-full p-[18%]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`${gradientId}-top`} x1="16" y1="6" x2="16" y2="18" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--foreground)" stopOpacity="0.95" />
            <stop offset="1" stopColor="var(--muted-foreground)" stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id={`${gradientId}-flap`} x1="16" y1="8" x2="16" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--foreground)" />
            <stop offset="1" stopColor="var(--muted-foreground)" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id={`${gradientId}-body`} x1="16" y1="12" x2="16" y2="26" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--muted-foreground)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--foreground)" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <rect
          x="4"
          y="10"
          width="24"
          height="14"
          rx="2"
          fill={`url(#${gradientId}-body)`}
          stroke="var(--border)"
          strokeWidth="0.5"
        />
        <path
          d="M4 12.5L16 20.5L28 12.5"
          stroke={`url(#${gradientId}-top)`}
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 10.5L16 18.5L28 10.5"
          fill={`url(#${gradientId}-flap)`}
          stroke="var(--foreground)"
          strokeOpacity="0.2"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}
