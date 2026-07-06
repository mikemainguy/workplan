import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
        include: {
          people: { include: { person: true } },
        },
      },
    },
  });

  if (!interaction) notFound();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{interaction.subject}</h1>
          <Badge variant="outline">{interaction.type}</Badge>
        </div>
        <p className="text-muted-foreground">
          {interaction.date.toLocaleDateString()}{" "}
          {interaction.date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {/* Participants */}
      {interaction.people.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {interaction.people.map(({ person }) => (
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

      {/* Project */}
      {interaction.project && (
        <Card>
          <CardHeader>
            <CardTitle>Project</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/projects/${interaction.project.id}`}>
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-accent"
              >
                {interaction.project.name}
              </Badge>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {interaction.rawContent && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap font-sans">
              {interaction.rawContent}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {interaction.actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Action Items ({interaction.actionItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {interaction.actionItems.map((item) => (
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
    </div>
  );
}
