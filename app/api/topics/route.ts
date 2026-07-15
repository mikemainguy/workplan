import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const showArchived =
    searchParams.get("archived") === "true";

  const topics = await prisma.topic.findMany({
    where: showArchived ? {} : { archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: {
      interactions: {
        include: {
          interaction: {
            select: { id: true, subject: true },
          },
        },
      },
    },
  });
  return NextResponse.json(topics);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const topic = await prisma.topic.create({
    data: {
      name: body.name,
      description: body.description ?? null,
    },
  });
  return NextResponse.json(topic, { status: 201 });
}
