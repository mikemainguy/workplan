import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const interactions = await prisma.interaction.findMany({
    orderBy: { date: "desc" },
    include: {
      people: { include: { person: true } },
      project: true,
      _count: { select: { actionItems: true } },
    },
  });
  return NextResponse.json(interactions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const interaction = await prisma.interaction.create({
    data: {
      type: body.type,
      subject: body.subject,
      date: new Date(body.date),
      rawContent: body.rawContent || null,
      parsedContent: body.parsedContent || null,
      projectId: body.projectId || null,
      people: body.personIds?.length
        ? {
            create: body.personIds.map((personId: string) => ({
              personId,
            })),
          }
        : undefined,
    },
    include: {
      people: { include: { person: true } },
      project: true,
    },
  });

  return NextResponse.json(interaction, { status: 201 });
}
