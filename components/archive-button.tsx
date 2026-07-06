"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  entityType: "people" | "projects" | "interactions";
  entityId: string;
  isArchived: boolean;
}

export function ArchiveButton(
  { entityType, entityId, isArchived }: Props
) {
  const router = useRouter();

  async function handleToggle() {
    await fetch(`/api/${entityType}/${entityId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        archivedAt: isArchived ? null : new Date().toISOString(),
      }),
    });
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle}>
      {isArchived ? "Unarchive" : "Archive"}
    </Button>
  );
}
