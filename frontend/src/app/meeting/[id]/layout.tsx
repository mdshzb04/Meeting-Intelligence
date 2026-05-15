"use client";

import { use } from "react";
import { MeetingHeader } from "@/components/meeting/meeting-header";

export default function MeetingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div>
      <MeetingHeader meetingId={id} />
      {children}
    </div>
  );
}
