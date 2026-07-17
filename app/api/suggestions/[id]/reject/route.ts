import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(
  _req: NextRequest, ctx: Ctx
) {
  const { id } = await ctx.params;
  const updated = await prisma.suggestion.update({
    where: { id },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
    },
  });
  return NextResponse.json(updated);
}
