import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export default async function TopicsPage() {
  const topics = await prisma.topic.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { interactions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Topics</h1>
      {topics.length === 0 ? (
        <p className="text-muted-foreground">
          No topics yet. Topics are created
          automatically when you paste chat
          transcripts.
        </p>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <Link key={topic.id}
              href={`/topics/${topic.id}`}
              className="flex items-center
                justify-between rounded-md border
                p-3 hover:bg-accent">
              <div>
                <p className="font-medium">
                  {topic.name}
                </p>
                {topic.description && (
                  <p className="text-sm
                    text-muted-foreground">
                    {topic.description}
                  </p>
                )}
              </div>
              <Badge variant="outline">
                {topic._count.interactions} interaction
                {topic._count.interactions !== 1
                  ? "s" : ""}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
