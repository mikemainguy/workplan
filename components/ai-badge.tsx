"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface Counts {
  pending: number;
  completed: number;
}

export function AiBadge() {
  const [counts, setCounts] = useState<Counts>(
    { pending: 0, completed: 0 }
  );

  useEffect(() => {
    async function check() {
      try {
        const [p, c] = await Promise.all([
          fetch("/api/ai/jobs?status=pending"),
          fetch("/api/ai/jobs?status=completed"),
        ]);
        setCounts({
          pending: (await p.json()).length,
          completed: (await c.json()).length,
        });
      } catch { /* ignore */ }
    }
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  const { pending, completed } = counts;
  if (!pending && !completed) return null;

  if (completed > 0) {
    return (
      <Badge variant="default"
        className="ml-auto text-xs px-1.5 py-0">
        {completed} ready
      </Badge>
    );
  }

  if (pending > 0) {
    return (
      <Badge variant="secondary"
        className="ml-auto text-xs px-1.5 py-0"
        title="Waiting for Ollama">
        {pending} queued
      </Badge>
    );
  }

  return null;
}
