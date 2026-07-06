"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface Person { id: string; name: string; }

interface Props {
  interactionId: string;
  currentPeople: Person[];
}

export function ManageParticipants(
  { interactionId, currentPeople }: Props
) {
  const router = useRouter();
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const currentIds = new Set(currentPeople.map((p) => p.id));

  useEffect(() => {
    fetch("/api/people")
      .then((r) => r.json())
      .then(setAllPeople);
  }, []);

  async function addPerson(personId: string) {
    await fetch(
      `/api/interactions/${interactionId}/people`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId }),
      }
    );
    router.refresh();
  }

  async function removePerson(personId: string) {
    await fetch(
      `/api/interactions/${interactionId}/people`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personId }),
      }
    );
    router.refresh();
  }

  const available = allPeople.filter(
    (p) => !currentIds.has(p.id)
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {currentPeople.map((person) => (
          <Badge key={person.id} variant="secondary"
            className="cursor-pointer hover:bg-destructive/20"
            onClick={() => removePerson(person.id)}>
            {person.name} ✕
          </Badge>
        ))}
      </div>
      {available.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {available.map((person) => (
            <Badge key={person.id} variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => addPerson(person.id)}>
              + {person.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
