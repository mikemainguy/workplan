"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";

interface Project { id: string; name: string; }

interface Props {
  type: string;
  setType: (v: string) => void;
  project: string;
  setProject: (v: string) => void;
  projects: Project[];
  subject: string;
  setSubject: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
}

export function InteractionFields(props: Props) {
  const { type, setType, project, setProject,
    projects, subject, setSubject, date, setDate,
  } = props;

  return (
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
              value={date}
              onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Input id="subject" name="subject" required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Meeting topic or subject" />
        </div>
        <div className="space-y-2">
          <Label>Project</Label>
          <Select value={project}
            onValueChange={(v) => setProject(v ?? "")}>
            <SelectTrigger>
              <SelectValue
                placeholder="Select project (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No project</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
