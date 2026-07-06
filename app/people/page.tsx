import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PeoplePage() {
  const people = await prisma.person.findMany({
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
        <h1 className="text-2xl font-bold">People</h1>
        <Link href="/people/new">
          <Button>Add Person</Button>
        </Link>
      </div>

      {people.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No people yet. Add someone to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <Link key={person.id} href={`/people/${person.id}`}>
              <Card className="transition-colors hover:bg-accent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{person.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {[person.title, person.organization]
                      .filter(Boolean)
                      .join(" @ ") || "No details"}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {person._count.interactions} interactions &middot;{" "}
                    {person._count.actionItems} action items
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
