"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PasteParser } from "./paste-parser";
import { InteractionFields } from "./interaction-fields";
import { ParticipantPicker } from "./participant-picker";

interface Person { id: string; name: string; }
interface Project { id: string; name: string; }

export function InteractionForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [project, setProject] = useState("none");
  const [type, setType] = useState("meeting");
  const [rawContent, setRawContent] = useState("");
  const subjectRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

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
      interactionType: string; cleanedContent: string;
      matchedPeople: { personId: string | null }[];
    },
    raw: string
  ) {
    if (result.subject && subjectRef.current) {
      subjectRef.current.value = result.subject;
    }
    if (result.date && dateRef.current) {
      dateRef.current.value =
        result.date.slice(0, 16);
    }
    setType(result.interactionType);
    setRawContent(raw);
    const ids = result.matchedPeople
      .map((p) => p.personId)
      .filter((id): id is string => id !== null);
    if (ids.length) setSelected(ids);
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        subject: fd.get("subject"),
        date: fd.get("date"),
        rawContent: rawContent || fd.get("rawContent"),
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
          <CardTitle>Paste Content</CardTitle>
        </CardHeader>
        <CardContent>
          <PasteParser onParsed={onParsed} />
        </CardContent>
      </Card>
      <InteractionFields
        type={type} setType={setType}
        project={project} setProject={setProject}
        projects={projects}
        subjectRef={subjectRef} dateRef={dateRef} />
      <ParticipantPicker
        people={people} selected={selected}
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
