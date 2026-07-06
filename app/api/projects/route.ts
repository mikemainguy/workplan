import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { interactions: true, actionItems: true } },
    },
  });
  return NextResponse.json(projects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description || null,
      status: body.status || "active",
    },
  });
  return NextResponse.json(project, { status: 201 });
}
