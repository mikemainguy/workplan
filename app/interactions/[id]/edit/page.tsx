"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";

interface Interaction {
  id: string; type: string; subject: string;
  date: string; rawContent?: string; projectId?: string;
}

export default function EditInteractionPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = use(params);
  const router = useRouter();
  const [interaction, setInteraction] =
    useState<Interaction | null>(null);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState("meeting");

  useEffect(() => {
    fetch(`/api/interactions/${id}`)
      .then((r) => r.json())
      .then((i) => { setInteraction(i); setType(i.type); });
  }, [id]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/interactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        subject: fd.get("subject"),
        date: fd.get("date"),
        rawContent: fd.get("rawContent"),
      }),
    });
    router.push(`/interactions/${id}`);
  }

  if (!interaction) return <p>Loading...</p>;
  const dateVal = interaction.date.slice(0, 16);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">
        Edit Interaction
      </h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type}
                  onValueChange={(v) => v && setType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="in-person">
                      In Person
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date & Time *</Label>
                <Input id="date" name="date"
                  type="datetime-local" required
                  defaultValue={dateVal} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input id="subject" name="subject"
                required defaultValue={interaction.subject} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea name="rawContent" rows={10}
              defaultValue={interaction.rawContent ?? ""} />
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button type="button" variant="outline"
            onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
