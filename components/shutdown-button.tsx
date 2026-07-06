"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export function ShutdownButton() {
  const [open, setOpen] = useState(false);

  // Only show in production (standalone mode)
  if (process.env.NODE_ENV !== "production") return null;

  async function handleShutdown() {
    await fetch("/api/shutdown", { method: "POST" });
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm"
        className="w-full" onClick={() => setOpen(true)}>
        Shutdown Server
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shutdown WorkPlan?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will stop the server. You can restart
            it by running the launcher again.
          </p>
          <DialogFooter>
            <Button variant="outline"
              onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive"
              onClick={handleShutdown}>
              Shutdown
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
