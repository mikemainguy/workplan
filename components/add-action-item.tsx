"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  interactionId: string;
  projectId?: string;
  personIds?: string[];
}

export function AddActionItem(
  { interactionId, projectId, personIds }: Props
) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" size="sm"
        onClick={() => setOpen(true)}>
        + Add Action Item
      </Button>
    );
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await fetch("/api/action-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: fd.get("description"),
        dueDate: fd.get("dueDate") || null,
        interactionId,
        projectId: projectId || null,
        personIds: personIds || [],
      }),
    });
    setOpen(false);
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}
      className="flex items-end gap-2 border rounded-md p-3">
      <div className="flex-1 space-y-1">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description"
          required placeholder="What needs to be done?" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="dueDate">Due date</Label>
        <Input id="dueDate" name="dueDate" type="date" />
      </div>
      <Button type="submit" size="sm" disabled={saving}>
        {saving ? "Adding..." : "Add"}
      </Button>
      <Button type="button" variant="ghost" size="sm"
        onClick={() => setOpen(false)}>
        Cancel
      </Button>
    </form>
  );
}
