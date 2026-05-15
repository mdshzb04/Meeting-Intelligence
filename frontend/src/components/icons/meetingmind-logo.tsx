import { cn } from "@/lib/utils";
import { MeetingMindMark } from "./meetingmind-mark";

type MeetingMindLogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
};

const markSize = { sm: 26, md: 32, lg: 40 };

/** Brand lockup: wing mark + optional MeetingMind wordmark. */
export function MeetingMindLogo({
  className,
  size = "sm",
  showWordmark = false,
}: MeetingMindLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 shrink-0", className)}>
      <MeetingMindMark size={markSize[size]} />
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-foreground">
          MeetingMind
        </span>
      )}
    </div>
  );
}
