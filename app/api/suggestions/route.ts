import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const interactionId =
    searchParams.get("interactionId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (interactionId) where.interactionId = interactionId;

  const suggestions =
    await prisma.suggestion.findMany({
      where,
      orderBy: { createdAt: "asc" },
      include: {
        interaction: {
          select: { id: true, subject: true },
        },
      },
    });
  return NextResponse.json(suggestions);
}
