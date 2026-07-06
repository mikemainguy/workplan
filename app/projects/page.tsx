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

export default async function ProjectsPage(
  { searchParams }: Props
) {
  const { archived } = await searchParams;
  const showArchived = archived === "true";

  const projects = await prisma.project.findMany({
    where: showArchived ? {} : { archivedAt: null },
    orderBy: { updatedAt: "desc" },
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
          <h1 className="text-2xl font-bold">Projects</h1>
          <ArchiveToggle />
        </div>
        <Link href="/projects/new">
          <Button>Add Project</Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent
            className="py-8 text-center text-muted-foreground">
            No projects yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id}
              href={`/projects/${project.id}`}>
              <Card className={`transition-colors
                hover:bg-accent
                ${project.archivedAt ? "opacity-60" : ""}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">
                      {project.name}
                    </CardTitle>
                    {project.archivedAt && (
                      <Badge variant="secondary">
                        archived
                      </Badge>
                    )}
                    <Badge variant={
                      project.status === "active"
                        ? "default" : "secondary"
                    }>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.description && (
                    <p className="text-sm text-muted-foreground
                      line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="mt-2 text-xs
                    text-muted-foreground">
                    {project._count.interactions} interactions
                    &middot; {project._count.actionItems} actions
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
