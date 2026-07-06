import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(
  req: NextRequest, { params }: Params
) {
  const { id } = await params;
  const { personId } = await req.json();
  await prisma.interactionPerson.create({
    data: { interactionId: id, personId },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(
  req: NextRequest, { params }: Params
) {
  const { id } = await params;
  const { personId } = await req.json();
  await prisma.interactionPerson.delete({
    where: {
      interactionId_personId: {
        interactionId: id, personId,
      },
    },
  });
  return NextResponse.json({ ok: true });
}
