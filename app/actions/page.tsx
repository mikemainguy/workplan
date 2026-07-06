import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "outline",
  "in-progress": "default",
  done: "secondary",
  cancelled: "secondary",
};

export default async function ActionsPage() {
  const actionItems = await prisma.actionItem.findMany({
    orderBy: [
      { status: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      people: { include: { person: true } },
      project: true,
      interaction: true,
    },
  });

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Action Items</h1>
      </div>

      {actionItems.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No action items yet. They&apos;ll appear here when created from
            interactions.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {actionItems.map((item) => {
            const isOverdue =
              item.dueDate &&
              item.dueDate < now &&
              item.status !== "done" &&
              item.status !== "cancelled";

            return (
              <Card
                key={item.id}
                className={isOverdue ? "border-destructive/30" : ""}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {item.dueDate && (
                        <span className={isOverdue ? "text-destructive" : ""}>
                          Due {item.dueDate.toLocaleDateString()}
                        </span>
                      )}
                      {item.people.length > 0 && (
                        <>
                          {item.dueDate && " \u00B7 "}
                          {item.people.map((p) => p.person.name).join(", ")}
                        </>
                      )}
                      {item.interaction && (
                        <>
                          {" \u00B7 "}
                          <Link
                            href={`/interactions/${item.interaction.id}`}
                            className="underline hover:text-foreground"
                          >
                            {item.interaction.subject}
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.priority && (
                      <Badge variant="outline">{item.priority}</Badge>
                    )}
                    <Badge variant={statusColors[item.status] ?? "outline"}>
                      {item.status}
                    </Badge>
                    {item.project && (
                      <Badge variant="secondary">{item.project.name}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
