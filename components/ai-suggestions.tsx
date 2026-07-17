"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { SuggestionItem } from "./suggestion-item";

interface Suggestion {
  id: string;
  type: string;
  payload: string;
  status: string;
}

interface Props {
  interactionId: string;
  projectId?: string;
}

export function AiSuggestions(
  { interactionId }: Props
) {
  const router = useRouter();
  const [items, setItems] = useState<Suggestion[]>([]);

  useEffect(() => {
    fetch(`/api/suggestions?interactionId=${interactionId}&status=pending`)
      .then((r) => r.json())
      .then(setItems)
      .catch(() => {});
  }, [interactionId]);

  async function handleAccept(id: string) {
    await fetch(`/api/suggestions/${id}/accept`, {
      method: "POST",
    });
    setItems((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  async function handleReject(id: string) {
    await fetch(`/api/suggestions/${id}/reject`, {
      method: "POST",
    });
    setItems((prev) => prev.filter((s) => s.id !== id));
  }

  async function dismissAll() {
    await Promise.all(
      items.map((s) =>
        fetch(`/api/suggestions/${s.id}/reject`, {
          method: "POST",
        })
      )
    );
    setItems([]);
  }

  if (!items.length) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <div className="flex items-center
          justify-between">
          <CardTitle className="text-sm">
            AI Suggestions ({items.length})
          </CardTitle>
          <Button variant="ghost" size="sm"
            onClick={dismissAll}>
            Dismiss All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((s) => (
          <SuggestionItem key={s.id}
            suggestion={s}
            onAccept={() => handleAccept(s.id)}
            onReject={() => handleReject(s.id)} />
        ))}
      </CardContent>
    </Card>
  );
}
