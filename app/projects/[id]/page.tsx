import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { ArchiveButton } from "@/components/archive-button";
import { DeleteButton } from "@/components/delete-button";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      interactions: {
        include: {
          people: { include: { person: true } },
        },
        orderBy: { date: "desc" },
      },
      actionItems: {
        include: {
          people: { include: { person: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) notFound();

  // Collect unique people from interactions
  const peopleMap = new Map<string, { id: string; name: string }>();
  for (const interaction of project.interactions) {
    for (const ip of interaction.people) {
      peopleMap.set(ip.person.id, ip.person);
    }
  }
  const people = Array.from(peopleMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const openActions = project.actionItems.filter(
    (a) => a.status === "open" || a.status === "in-progress"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <Badge
              variant={
                project.status === "active"
                  ? "default" : "secondary"
              }
            >
              {project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="text-muted-foreground mt-1">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {project.archivedAt && (
            <DeleteButton entityType="projects"
              entityId={project.id}
              entityName={project.name}
              redirectTo="/projects" />
          )}
          <ArchiveButton entityType="projects"
            entityId={project.id}
            isArchived={!!project.archivedAt} />
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
        </div>
      </div>

      {/* People involved */}
      {people.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>People ({people.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {people.map((person) => (
                <Link key={person.id} href={`/people/${person.id}`}>
                  <Badge
                    variant="secondary"
                    className="cursor-pointer hover:bg-accent"
                  >
                    {person.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open Action Items */}
      {openActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Open Action Items ({openActions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {openActions.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {item.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.dueDate &&
                        `Due ${item.dueDate.toLocaleDateString()} \u00B7 `}
                      {item.people.map((p) => p.person.name).join(", ")}
                    </div>
                  </div>
                  <Badge variant="outline">{item.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactions Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>
            Interactions ({project.interactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No interactions yet.
            </p>
          ) : (
            <div className="space-y-2">
              {project.interactions.map((interaction) => (
                <Link
                  key={interaction.id}
                  href={`/interactions/${interaction.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {interaction.subject}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {interaction.date.toLocaleDateString()} &middot;{" "}
                      {interaction.type} &middot;{" "}
                      {interaction.people
                        .map((p) => p.person.name)
                        .join(", ")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
