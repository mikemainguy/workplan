"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Person {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

export default function NewInteractionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [type, setType] = useState("meeting");

  useEffect(() => {
    Promise.all([fetch("/api/people"), fetch("/api/projects")]).then(
      async ([peopleRes, projectsRes]) => {
        setPeople(await peopleRes.json());
        setProjects(await projectsRes.json());
      }
    );
  }, []);

  function togglePerson(personId: string) {
    setSelectedPeople((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const res = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        subject: formData.get("subject"),
        date: formData.get("date"),
        rawContent: formData.get("rawContent"),
        projectId: selectedProject || null,
        personIds: selectedPeople,
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
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">New Interaction</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => v && setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="in-person">In Person</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date & Time *</Label>
                <Input
                  id="date"
                  name="date"
                  type="datetime-local"
                  required
                  defaultValue={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                name="subject"
                required
                placeholder="Meeting topic or conversation subject"
              />
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={selectedProject}
                onValueChange={(v) => setSelectedProject(v ?? "")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent>
            {people.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No people added yet. You can add people from the{" "}
                <a href="/people/new" className="text-primary underline">
                  People page
                </a>
                .
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {people.map((person) => (
                  <Badge
                    key={person.id}
                    variant={
                      selectedPeople.includes(person.id)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => togglePerson(person.id)}
                  >
                    {person.name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="rawContent"
              rows={10}
              placeholder="Paste meeting notes, chat transcript, or Outlook invite here..."
            />
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Interaction"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
