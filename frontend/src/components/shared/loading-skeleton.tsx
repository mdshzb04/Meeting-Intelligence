"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function MeetingCardSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 px-4">
      <Skeleton className="h-1.5 w-1.5 rounded-full animate-shimmer" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-48 animate-shimmer" />
        <Skeleton className="h-3 w-72 animate-shimmer" />
      </div>
      <Skeleton className="h-3 w-14 animate-shimmer" />
    </div>
  );
}

export function MeetingDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56 animate-shimmer" />
        <Skeleton className="h-3.5 w-32 animate-shimmer" />
      </div>
      <Skeleton className="h-9 w-full rounded-md animate-shimmer" />
      <Skeleton className="h-48 w-full rounded-lg animate-shimmer" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32 animate-shimmer" />
        <Skeleton className="h-8 w-28 animate-shimmer" />
      </div>
      <div className="grid grid-cols-4 gap-px bg-[#1f1f1f] rounded-lg border border-[#1f1f1f] overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#0a0a0a] p-4 space-y-2">
            <Skeleton className="h-3 w-16 animate-shimmer" />
            <Skeleton className="h-7 w-10 animate-shimmer" />
          </div>
        ))}
      </div>
      <div className="space-y-1 border-t border-[#1f1f1f] pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <MeetingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
