"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";

interface Person {
  id: string; name: string; email?: string;
  title?: string; organization?: string; notes?: string;
}

export default function EditPersonPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = use(params);
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/people/${id}`)
      .then((r) => r.json())
      .then(setPerson);
  }, [id]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    await fetch(`/api/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        email: fd.get("email"),
        title: fd.get("title"),
        organization: fd.get("organization"),
        notes: fd.get("notes"),
      }),
    });
    router.push(`/people/${id}`);
  }

  if (!person) return <p>Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Edit Person</h1>
      <Card>
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" name="name"
                required defaultValue={person.name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email"
                type="email" defaultValue={person.email ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Title / Role</Label>
              <Input id="title" name="title"
                defaultValue={person.title ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input id="organization" name="organization"
                defaultValue={person.organization ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes"
                rows={3} defaultValue={person.notes ?? ""} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button type="button" variant="outline"
                onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
