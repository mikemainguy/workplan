import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const interaction = await prisma.interaction.findUnique({
    where: { id },
    include: {
      people: { include: { person: true } },
      project: true,
      actionItems: true,
    },
  });
  if (!interaction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(interaction);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const interaction = await prisma.interaction.update({
    where: { id },
    data: {
      ...(body.type !== undefined && { type: body.type }),
      ...(body.subject !== undefined && { subject: body.subject }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.rawContent !== undefined && {
        rawContent: body.rawContent || null,
      }),
      ...(body.projectId !== undefined && {
        projectId: body.projectId || null,
      }),
      ...(body.archivedAt !== undefined && {
        archivedAt: body.archivedAt ? new Date(body.archivedAt) : null,
      }),
    },
  });
  return NextResponse.json(interaction);
}

export async function DELETE(
  _req: NextRequest,
  { params }: Params
) {
  const { id } = await params;
  await prisma.interaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
