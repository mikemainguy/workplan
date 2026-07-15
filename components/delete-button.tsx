"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface Props {
  entityType: "people" | "projects" | "interactions" | "topics";
  entityId: string;
  entityName: string;
  redirectTo: string;
}

export function DeleteButton(
  { entityType, entityId, entityName, redirectTo }: Props
) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/${entityType}/${entityId}`, {
      method: "DELETE",
    });
    router.push(redirectTo);
  }

  return (
    <>
      <Button variant="destructive" size="sm"
        onClick={() => setOpen(true)}>
        Delete
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete &quot;{entityName}&quot;?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. This will
            permanently delete this item and remove all
            associated links.
          </p>
          <DialogFooter>
            <Button variant="outline"
              onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive"
              disabled={deleting}
              onClick={handleDelete}>
              {deleting
                ? "Deleting..." : "Yes, delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
