"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";

interface Person { id: string; name: string; }

interface Props {
  people: Person[];
  selected: string[];
  onToggle: (id: string) => void;
}

export function ParticipantPicker(
  { people, selected, onToggle }: Props
) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants</CardTitle>
      </CardHeader>
      <CardContent>
        {people.length === 0 ? (
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
      </CardContent>
    </Card>
  );
}
