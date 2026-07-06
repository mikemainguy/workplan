"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  id: string;
  status: string;
}

const transitions: Record<string, { label: string; to: string }[]> = {
  open: [
    { label: "Start", to: "in-progress" },
    { label: "Done", to: "done" },
    { label: "Cancel", to: "cancelled" },
  ],
  "in-progress": [
    { label: "Done", to: "done" },
    { label: "Cancel", to: "cancelled" },
  ],
  done: [{ label: "Reopen", to: "open" }],
  cancelled: [{ label: "Reopen", to: "open" }],
};

export function ActionItemStatus({ id, status }: Props) {
  const router = useRouter();

  async function updateStatus(newStatus: string) {
    await fetch("/api/action-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    router.refresh();
  }

  const actions = transitions[status] ?? [];

  return (
    <div className="flex gap-1">
      {actions.map((action) => (
        <Button key={action.to} variant="ghost" size="sm"
          onClick={() => updateStatus(action.to)}>
          {action.label}
        </Button>
      ))}
    </div>
  );
}
