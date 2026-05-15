"use client";

import { AllDecisionsBoard } from "@/components/workspace/all-decisions-board";

export default function WorkspaceDecisionsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="heading-lg">Decisions</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          All decisions from every meeting — Todo, In progress, Done.
        </p>
      </div>
      <AllDecisionsBoard />
    </div>
  );
}
