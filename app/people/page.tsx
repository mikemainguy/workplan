import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { ArchiveToggle } from "@/components/archive-toggle";

interface Props {
  searchParams: Promise<{ archived?: string }>;
}

export default async function PeoplePage(
  { searchParams }: Props
) {
  const { archived } = await searchParams;
  const showArchived = archived === "true";

  const people = await prisma.person.findMany({
    where: showArchived ? {} : { archivedAt: null },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { interactions: true, actionItems: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">People</h1>
          <ArchiveToggle />
        </div>
        <Link href="/people/new">
          <Button>Add Person</Button>
        </Link>
      </div>

      {people.length === 0 ? (
        <Card>
          <CardContent
            className="py-8 text-center text-muted-foreground">
            No people yet. Add someone to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <Link key={person.id}
              href={`/people/${person.id}`}>
              <Card className={`transition-colors hover:bg-accent
                ${person.archivedAt ? "opacity-60" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      {person.name}
                    </CardTitle>
                    {person.archivedAt && (
                      <Badge variant="secondary">
                        archived
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {[person.title, person.organization]
                      .filter(Boolean)
                      .join(" @ ") || "No details"}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {person._count.interactions} interactions
                    &middot; {person._count.actionItems} actions
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
