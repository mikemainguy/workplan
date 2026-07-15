import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(
  _req: NextRequest, ctx: Ctx
) {
  const { id } = await ctx.params;
  const topic = await prisma.topic.findUnique({
    where: { id },
    include: {
      interactions: {
        include: {
          interaction: {
            include: {
              people: {
                include: { person: true },
              },
              project: true,
            },
          },
        },
      },
    },
  });
  if (!topic) {
    return NextResponse.json(
      { error: "not found" }, { status: 404 }
    );
  }
  return NextResponse.json(topic);
}

export async function PATCH(
  request: NextRequest, ctx: Ctx
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const topic = await prisma.topic.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      archivedAt: body.archivedAt,
    },
  });
  return NextResponse.json(topic);
}

export async function DELETE(
  _req: NextRequest, ctx: Ctx
) {
  const { id } = await ctx.params;
  await prisma.topic.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
