"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";

interface Person { id: string; name: string; }

interface Props {
  people: Person[];
  selected: string[];
  onToggle: (id: string) => void;
  unmatchedNames?: string[];
  onCreatePerson?: (name: string) => void;
}

export function ParticipantPicker(
  { people, selected, onToggle,
    unmatchedNames, onCreatePerson }: Props
) {
  const [creating, setCreating] = useState<string | null>(
    null
  );

  async function handleCreate(name: string) {
    setCreating(name);
    onCreatePerson?.(name);
    setCreating(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {people.length === 0 && !unmatchedNames?.length ? (
          <p className="text-sm text-muted-foreground">
            No people added yet.{" "}
            <a href="/people/new"
              className="text-primary underline">
              Add people
            </a>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {people.map((person) => (
              <Badge key={person.id}
                variant={selected.includes(person.id)
                  ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onToggle(person.id)}>
                {person.name}
              </Badge>
            ))}
          </div>
        )}
        {unmatchedNames && unmatchedNames.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground
              mb-2">
              Detected but not in your contacts:
            </p>
            <div className="flex flex-wrap gap-2">
              {unmatchedNames.map((name) => (
                <Button key={name} variant="outline"
                  size="sm"
                  disabled={creating === name}
                  onClick={() => handleCreate(name)}>
                  + {name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
