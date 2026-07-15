"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { PasteParser } from "./paste-parser";
import { InteractionFields } from "./interaction-fields";
import { ParticipantPicker } from "./participant-picker";

interface Person { id: string; name: string; }
interface Project { id: string; name: string; }

interface MatchedPerson {
  name: string;
  personId: string | null;
}

export function InteractionForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [project, setProject] = useState("none");
  const [type, setType] = useState("meeting");
  const [rawContent, setRawContent] = useState("");
  const [segments, setSegments] = useState<unknown[]>([]);
  const [subject, setSubject] = useState("");
  const now = new Date().toISOString().slice(0, 16);
  const [date, setDate] = useState(now);

  useEffect(() => {
    Promise.all([
      fetch("/api/people"), fetch("/api/projects"),
    ]).then(async ([pRes, prRes]) => {
      setPeople(await pRes.json());
      setProjects(await prRes.json());
    });
  }, []);

  function onParsed(
    result: {
      subject?: string; date?: string;
      interactionType: string;
      cleanedContent: string;
      matchedPeople: MatchedPerson[];
      segments?: unknown[];
    },
    raw: string
  ) {
    if (result.subject) setSubject(result.subject);
    if (result.date) setDate(result.date.slice(0, 16));
    setType(result.interactionType);
    setRawContent(raw);
    setSegments(result.segments ?? []);

    const matched = result.matchedPeople
      .filter((p) => p.personId)
      .map((p) => p.personId as string);
    if (matched.length) setSelected(matched);

    const unmatchedNames = result.matchedPeople
      .filter((p) => !p.personId)
      .map((p) => p.name);
    setUnmatched(unmatchedNames);
  }

  async function handleCreatePerson(name: string) {
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const person = await res.json();
    setPeople((prev) => [...prev, person]);
    setSelected((prev) => [...prev, person.id]);
    setUnmatched((prev) =>
      prev.filter((n) => n !== name)
    );
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type, subject, date, rawContent, segments,
        projectId: project === "none" ? null : project,
        personIds: selected,
      }),
    });
    if (res.ok) {
      const interaction = await res.json();
      router.push(`/interactions/${interaction.id}`);
    } else {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Paste or Upload Content</CardTitle>
        </CardHeader>
        <CardContent>
          <PasteParser onParsed={onParsed} />
        </CardContent>
      </Card>
      <InteractionFields
        type={type} setType={setType}
        project={project} setProject={setProject}
        projects={projects}
        subject={subject} setSubject={setSubject}
        date={date} setDate={setDate} />
      <ParticipantPicker
        people={people} selected={selected}
        unmatchedNames={unmatched}
        onCreatePerson={handleCreatePerson}
        onToggle={(id) => setSelected((prev) =>
          prev.includes(id)
            ? prev.filter((x) => x !== id)
            : [...prev, id]
        )} />
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Interaction"}
        </Button>
        <Button type="button" variant="outline"
          onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
