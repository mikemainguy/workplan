import Link from "next/link";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function Dashboard() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const [todayInteractions, overdueActions, recentInteractions, stats] =
    await Promise.all([
      prisma.interaction.findMany({
        where: {
          date: { gte: startOfDay, lt: endOfDay },
          archivedAt: null,
        },
        include: {
          people: { include: { person: true } },
          project: true,
        },
        orderBy: { date: "asc" },
      }),
      prisma.actionItem.findMany({
        where: {
          status: { in: ["open", "in-progress"] },
          dueDate: { lt: now },
          archivedAt: null,
        },
        include: {
          people: { include: { person: true } },
          project: true,
        },
        orderBy: { dueDate: "asc" },
      }),
      prisma.interaction.findMany({
        where: { archivedAt: null },
        take: 5,
        orderBy: { date: "desc" },
        include: {
          people: { include: { person: true } },
          project: true,
        },
      }),
      Promise.all([
        prisma.person.count({
          where: { archivedAt: null },
        }),
        prisma.project.count({
          where: { status: "active", archivedAt: null },
        }),
        prisma.actionItem.count({
          where: {
            status: { in: ["open", "in-progress"] },
            archivedAt: null,
          },
        }),
      ]).then(([people, projects, openActions]) => ({
        people,
        projects,
        openActions,
      })),
    ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              People
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.people}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openActions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Meetings */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Meetings</CardTitle>
        </CardHeader>
        <CardContent>
          {todayInteractions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No meetings scheduled for today.
            </p>
          ) : (
            <div className="space-y-3">
              {todayInteractions.map((interaction) => (
                <Link
                  key={interaction.id}
                  href={`/interactions/${interaction.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <div className="font-medium">{interaction.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      {interaction.date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      &middot;{" "}
                      {interaction.people
                        .map((p) => p.person.name)
                        .join(", ") || "No attendees"}
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

      {/* Overdue Action Items */}
      {overdueActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">
              Overdue Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueActions.map((action) => (
                <Link
                  key={action.id}
                  href="/actions"
                  className="flex items-center justify-between rounded-md border border-destructive/20 p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <div className="font-medium">{action.description}</div>
                    <div className="text-sm text-muted-foreground">
                      Due{" "}
                      {action.dueDate?.toLocaleDateString() ?? "no date"}{" "}
                      &middot;{" "}
                      {action.people
                        .map((p) => p.person.name)
                        .join(", ")}
                    </div>
                  </div>
                  {action.project && (
                    <Badge variant="secondary">{action.project.name}</Badge>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Interactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Interactions</CardTitle>
        </CardHeader>
        <CardContent>
          {recentInteractions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No interactions yet.{" "}
              <Link
                href="/interactions/new"
                className="text-primary underline"
              >
                Add your first interaction
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              {recentInteractions.map((interaction) => (
                <Link
                  key={interaction.id}
                  href={`/interactions/${interaction.id}`}
                  className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent"
                >
                  <div>
                    <div className="font-medium">{interaction.subject}</div>
                    <div className="text-sm text-muted-foreground">
                      {interaction.date.toLocaleDateString()}{" "}
                      &middot; {interaction.type} &middot;{" "}
                      {interaction.people
                        .map((p) => p.person.name)
                        .join(", ") || "No attendees"}
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
