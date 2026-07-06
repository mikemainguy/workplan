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

export default async function PersonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const person = await prisma.person.findUnique({
    where: { id },
    include: {
      interactions: {
        include: {
          interaction: {
            include: { project: true },
          },
        },
        orderBy: { interaction: { date: "desc" } },
        take: 20,
      },
      actionItems: {
        include: {
          actionItem: {
            include: { project: true },
          },
        },
      },
    },
  });

  if (!person) notFound();

  const openActions = person.actionItems.filter(
    (ai) =>
      ai.actionItem.status === "open" || ai.actionItem.status === "in-progress"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{person.name}</h1>
          <p className="text-muted-foreground">
            {[person.title, person.organization]
              .filter(Boolean).join(" @ ")}
          </p>
          {person.email && (
            <p className="text-sm text-muted-foreground">
              {person.email}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {person.archivedAt && (
            <DeleteButton entityType="people"
              entityId={person.id}
              entityName={person.name}
              redirectTo="/people" />
          )}
          <ArchiveButton entityType="people"
            entityId={person.id}
            isArchived={!!person.archivedAt} />
          <Link href={`/people/${person.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
        </div>
      </div>

      {person.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{person.notes}</p>
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
              {openActions.map(({ actionItem }) => (
                <div
                  key={actionItem.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {actionItem.description}
                    </div>
                    {actionItem.dueDate && (
                      <div className="text-xs text-muted-foreground">
                        Due {actionItem.dueDate.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{actionItem.status}</Badge>
                    {actionItem.project && (
                      <Badge variant="secondary">
                        {actionItem.project.name}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interaction History */}
      <Card>
        <CardHeader>
          <CardTitle>
            Interaction History ({person.interactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {person.interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No interactions recorded yet.
            </p>
          ) : (
            <div className="space-y-2">
              {person.interactions.map(({ interaction }) => (
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
                      {interaction.type}
                    </div>
                  </div>
                  {interaction.project && (
                    <Badge variant="secondary">
                      {interaction.project.name}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
