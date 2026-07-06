import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const person = await prisma.person.findUnique({ where: { id } });
  if (!person) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(person);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json();
  const person = await prisma.person.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.email !== undefined && { email: body.email || null }),
      ...(body.title !== undefined && { title: body.title || null }),
      ...(body.organization !== undefined && {
        organization: body.organization || null,
      }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
      ...(body.archivedAt !== undefined && {
        archivedAt: body.archivedAt ? new Date(body.archivedAt) : null,
      }),
    },
  });
  return NextResponse.json(person);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  await prisma.person.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
