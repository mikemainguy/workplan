"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";

interface AiJob {
  id: string;
  interactionId: string;
  status: string;
  result: string | null;
}

interface Analysis {
  summary?: string;
  attendees?: string[];
  actionItems?: string[];
}

interface Props {
  interactionId: string;
  projectId?: string;
}

export function AiSuggestions(
  { interactionId, projectId }: Props
) {
  const router = useRouter();
  const [job, setJob] = useState<AiJob | null>(null);
  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  useEffect(() => {
    fetch("/api/ai/jobs?status=completed")
      .then((r) => r.json())
      .then((jobs: AiJob[]) => {
        const match = jobs.find(
          (j) => j.interactionId === interactionId
        );
        if (match?.result) {
          setJob(match);
          const parsed = JSON.parse(match.result);
          if (parsed.attendees) {
            parsed.attendees = [...new Set(
              parsed.attendees
            )];
          }
          if (parsed.actionItems) {
            parsed.actionItems = [...new Set(
              parsed.actionItems
            )];
          }
          setAnalysis(parsed);
        }
      })
      .catch(() => {});
  }, [interactionId]);

  async function acceptAttendee(name: string) {
    // Create person + link to interaction
    const pRes = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const person = await pRes.json();
    await fetch(
      `/api/interactions/${interactionId}/people`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId: person.id }),
      }
    );
    setAnalysis((a) => a ? {
      ...a,
      attendees: a.attendees?.filter((n) => n !== name),
    } : a);
    router.refresh();
  }

  async function acceptAction(desc: string) {
    await fetch("/api/action-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: desc,
        interactionId,
        projectId: projectId ?? null,
      }),
    });
    setAnalysis((a) => a ? {
      ...a,
      actionItems: a.actionItems?.filter(
        (d) => d !== desc
      ),
    } : a);
    router.refresh();
  }

  async function dismiss() {
    if (!job) return;
    await fetch("/api/ai/jobs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: job.id, status: "reviewed",
      }),
    });
    setJob(null);
    setAnalysis(null);
  }

  if (!analysis) return null;
  const hasItems = (analysis.attendees?.length ?? 0)
    + (analysis.actionItems?.length ?? 0) > 0;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">
            AI Suggestions
          </CardTitle>
          <Button variant="ghost" size="sm"
            onClick={dismiss}>
            Dismiss All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {analysis.summary && (
          <div>
            <p className="text-xs font-medium
              text-muted-foreground mb-1">
              Summary
            </p>
            <p className="text-sm">{analysis.summary}</p>
          </div>
        )}
        {analysis.attendees?.length ? (
          <div>
            <p className="text-xs font-medium
              text-muted-foreground mb-1">
              Suggested People
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.attendees.map((name) => (
                <Badge key={name} variant="outline"
                  className="cursor-pointer
                    hover:bg-primary/10"
                  onClick={() => acceptAttendee(name)}>
                  + {name}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
        {analysis.actionItems?.length ? (
          <div>
            <p className="text-xs font-medium
              text-muted-foreground mb-1">
              Suggested Action Items
            </p>
            <div className="space-y-1">
              {analysis.actionItems.map((item) => (
                <div key={item}
                  className="flex items-center
                    justify-between text-sm border
                    rounded p-2">
                  <span>{item}</span>
                  <Button variant="ghost" size="sm"
                    onClick={() => acceptAction(item)}>
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {!hasItems && !analysis.summary && (
          <p className="text-sm text-muted-foreground">
            No suggestions available.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
