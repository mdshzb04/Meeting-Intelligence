"use client";

import { AllActionItemsBoard } from "@/components/workspace/all-action-items-board";

export default function WorkspaceActionsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="heading-lg">Action items</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          All tasks from every meeting — Todo, In progress, Done.
        </p>
      </div>
      <AllActionItemsBoard />
    </div>
  );
}
