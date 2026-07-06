import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArchiveToggle } from "@/components/archive-toggle";

interface Props {
  searchParams: Promise<{ archived?: string }>;
}

export default async function InteractionsPage(
  { searchParams }: Props
) {
  const { archived } = await searchParams;
  const showArchived = archived === "true";

  const interactions = await prisma.interaction.findMany({
    where: showArchived ? {} : { archivedAt: null },
    orderBy: { date: "desc" },
    include: {
      people: { include: { person: true } },
      project: true,
      _count: { select: { actionItems: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Interactions</h1>
          <ArchiveToggle />
        </div>
        <Link href="/interactions/new">
          <Button>Add Interaction</Button>
        </Link>
      </div>

      {interactions.length === 0 ? (
        <Card>
          <CardContent
            className="py-8 text-center text-muted-foreground">
            No interactions yet.{" "}
            <Link href="/interactions/new"
              className="text-primary underline">
              Add your first interaction
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {interactions.map((interaction) => (
            <Link key={interaction.id}
              href={`/interactions/${interaction.id}`}>
              <Card className={`transition-colors
                hover:bg-accent
                ${interaction.archivedAt
                  ? "opacity-60" : ""}`}>
                <CardContent
                  className="flex items-center
                    justify-between py-4">
                  <div>
                    <div className="font-medium flex
                      items-center gap-2">
                      {interaction.subject}
                      {interaction.archivedAt && (
                        <Badge variant="secondary">
                          archived
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm
                      text-muted-foreground">
                      {interaction.date.toLocaleDateString()}
                      {" "}
                      {interaction.date.toLocaleTimeString(
                        [], {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                      {" "}&middot; {interaction.type}
                      {" "}&middot; {interaction.people
                        .map((p) => p.person.name)
                        .join(", ") || "No attendees"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {interaction._count.actionItems > 0 && (
                      <Badge variant="outline">
                        {interaction._count.actionItems}
                        {" "}actions
                      </Badge>
                    )}
                    {interaction.project && (
                      <Badge variant="secondary">
                        {interaction.project.name}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
