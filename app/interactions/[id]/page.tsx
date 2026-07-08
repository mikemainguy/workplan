import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  InteractionActions,
} from "@/components/interaction-actions";
import {
  ManageParticipants,
} from "@/components/manage-participants";
import { ArchiveButton } from "@/components/archive-button";
import { DeleteButton } from "@/components/delete-button";
import { AiSuggestions } from "@/components/ai-suggestions";

export default async function InteractionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const interaction = await prisma.interaction.findUnique({
    where: { id },
    include: {
      people: { include: { person: true } },
      project: true,
      actionItems: {
        include: { people: { include: { person: true } } },
      },
    },
  });

  if (!interaction) notFound();

  const personIds = interaction.people.map(
    (p) => p.person.id
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">
              {interaction.subject}
            </h1>
            <Badge variant="outline">
              {interaction.type}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {interaction.date.toLocaleDateString()}{" "}
            {interaction.date.toLocaleTimeString([], {
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex gap-2">
          {interaction.archivedAt && (
            <DeleteButton entityType="interactions"
              entityId={interaction.id}
              entityName={interaction.subject}
              redirectTo="/interactions" />
          )}
          <ArchiveButton entityType="interactions"
            entityId={interaction.id}
            isArchived={!!interaction.archivedAt} />
          <Link href={`/interactions/${interaction.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <ManageParticipants
            interactionId={interaction.id}
            currentPeople={interaction.people.map(
              (p) => p.person
            )}
          />
        </CardContent>
      </Card>

      {interaction.rawContent && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap font-sans">
              {interaction.rawContent}
            </pre>
          </CardContent>
        </Card>
      )}

      <AiSuggestions
        interactionId={interaction.id}
        projectId={interaction.project?.id}
      />

      <InteractionActions
        interactionId={interaction.id}
        projectId={interaction.project?.id}
        personIds={personIds}
        actionItems={interaction.actionItems}
      />
    </div>
  );
}
