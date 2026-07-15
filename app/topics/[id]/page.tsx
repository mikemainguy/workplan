import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { ArchiveButton } from "@/components/archive-button";
import { DeleteButton } from "@/components/delete-button";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      interactions: {
        orderBy: { startTime: "desc" },
        include: {
          interaction: { select: {
            id: true, subject: true, type: true,
          }},
        },
      },
    },
  });
  if (!topic) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {topic.name}
          </h1>
          {topic.description && (
            <p className="text-muted-foreground">
              {topic.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {topic.archivedAt && (
            <DeleteButton entityType="topics"
              entityId={topic.id}
              entityName={topic.name}
              redirectTo="/topics" />
          )}
          <ArchiveButton entityType="topics"
            entityId={topic.id}
            isArchived={!!topic.archivedAt} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topic.interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No linked interactions.
            </p>
          ) : (
            topic.interactions.map((link) => {
              const int = link.interaction;
              return (
                <Link key={link.id}
                  href={`/interactions/${int.id}`}
                  className="flex items-center
                    justify-between rounded-md border
                    p-3 hover:bg-accent">
                  <div>
                    <p className="font-medium">
                      {int.subject}
                    </p>
                    <p className="text-xs
                      text-muted-foreground">
                      {link.startTime
                        .toLocaleDateString()}{" "}
                      {link.summary ?? ""}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {int.type}
                  </Badge>
                </Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
