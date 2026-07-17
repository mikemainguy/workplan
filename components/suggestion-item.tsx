"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Suggestion {
  id: string;
  type: string;
  payload: string;
  status: string;
}

interface Props {
  suggestion: Suggestion;
  onAccept: () => void;
  onReject: () => void;
}

function getLabel(s: Suggestion): string {
  const data = JSON.parse(s.payload);
  if (s.type === "person") return data.name;
  if (s.type === "action-item") return data.description;
  if (s.type === "topic-name") return data.proposedName;
  return s.payload;
}

function getTypeLabel(type: string): string {
  if (type === "person") return "Person";
  if (type === "action-item") return "Action Item";
  if (type === "topic-name") return "Topic";
  return type;
}

export function SuggestionItem(
  { suggestion, onAccept, onReject }: Props
) {
  const label = getLabel(suggestion);

  return (
    <div className="flex items-center justify-between
      text-sm border rounded p-2 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <Badge variant="outline" className="shrink-0
          text-xs">
          {getTypeLabel(suggestion.type)}
        </Badge>
        <span className="truncate">{label}</span>
      </div>
      <div className="flex gap-1 shrink-0">
        <Button variant="ghost" size="sm"
          onClick={onAccept}>
          Accept
        </Button>
        <Button variant="ghost" size="sm"
          className="text-muted-foreground"
          onClick={onReject}>
          Reject
        </Button>
      </div>
    </div>
  );
}
