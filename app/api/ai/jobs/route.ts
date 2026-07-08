import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const jobs = await prisma.aiJob.findMany({
    where: status ? { status } : {},
    include: {
      interaction: { select: { subject: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(jobs);
}

// Update job status/result
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  if (!body.id) {
    return NextResponse.json(
      { error: "id required" }, { status: 400 }
    );
  }

  const job = await prisma.aiJob.update({
    where: { id: body.id },
    data: {
      ...(body.status && { status: body.status }),
      ...(body.result !== undefined && {
        result: body.result,
      }),
      ...(body.status === "completed" && {
        completedAt: new Date(),
      }),
    },
  });
  return NextResponse.json(job);
}
