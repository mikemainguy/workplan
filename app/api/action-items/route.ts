import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const projectId = searchParams.get("projectId");

  const actionItems = await prisma.actionItem.findMany({
    where: {
      ...(status && { status }),
      ...(projectId && { projectId }),
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    include: {
      people: { include: { person: true } },
      project: true,
      interaction: true,
    },
  });
  return NextResponse.json(actionItems);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const actionItem = await prisma.actionItem.create({
    data: {
      description: body.description,
      status: body.status || "open",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      priority: body.priority || null,
      interactionId: body.interactionId || null,
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
      interaction: true,
    },
  });

  return NextResponse.json(actionItem, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (!body.id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const actionItem = await prisma.actionItem.update({
    where: { id: body.id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.description && { description: body.description }),
      ...(body.dueDate !== undefined && {
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      }),
      ...(body.priority !== undefined && { priority: body.priority }),
    },
  });

  return NextResponse.json(actionItem);
}
