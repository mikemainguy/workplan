import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const people = await prisma.person.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { interactions: true, actionItems: true } },
    },
  });
  return NextResponse.json(people);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const person = await prisma.person.create({
    data: {
      name: body.name,
      email: body.email || null,
      title: body.title || null,
      organization: body.organization || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(person, { status: 201 });
}
