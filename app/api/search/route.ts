import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  // Parallel keyword search across all entity types
  const [interactions, actionItems, people, projects] = await Promise.all([
    prisma.interaction.findMany({
      where: {
        OR: [
          { subject: { contains: q } },
          { rawContent: { contains: q } },
          { parsedContent: { contains: q } },
        ],
      },
      include: { project: true },
      take: 20,
      orderBy: { date: "desc" },
    }),
    prisma.actionItem.findMany({
      where: {
        description: { contains: q },
      },
      include: { project: true },
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
    prisma.person.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { email: { contains: q } },
          { organization: { contains: q } },
          { notes: { contains: q } },
        ],
      },
      take: 20,
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
        ],
      },
      take: 20,
      orderBy: { name: "asc" },
    }),
  ]);

  const results = [
    ...interactions.map((i) => ({
      id: i.id,
      type: "interaction" as const,
      title: i.subject,
      snippet:
        i.rawContent?.substring(0, 150) || i.parsedContent?.substring(0, 150) || "",
      date: i.date.toISOString(),
      projectName: i.project?.name,
    })),
    ...actionItems.map((a) => ({
      id: a.id,
      type: "actionItem" as const,
      title: a.description,
      snippet: `Status: ${a.status}${a.dueDate ? ` | Due: ${a.dueDate.toLocaleDateString()}` : ""}`,
      projectName: a.project?.name,
    })),
    ...people.map((p) => ({
      id: p.id,
      type: "person" as const,
      title: p.name,
      snippet: [p.title, p.organization].filter(Boolean).join(" @ ") || "",
    })),
    ...projects.map((p) => ({
      id: p.id,
      type: "project" as const,
      title: p.name,
      snippet: p.description?.substring(0, 150) || "",
    })),
  ];

  return NextResponse.json({ results });
}
