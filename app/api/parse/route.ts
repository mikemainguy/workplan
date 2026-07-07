import { NextRequest, NextResponse } from "next/server";
import { parseContent } from "@/lib/parsers";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text) {
    return NextResponse.json(
      { error: "text is required" }, { status: 400 }
    );
  }

  const result = parseContent(text);

  // Try to match attendees to existing People
  const matchedPeople = [];
  for (const name of result.attendees) {
    const [first, ...rest] = name.split(" ");
    const lastName = rest.join(" ");
    const person = await prisma.person.findFirst({
      where: {
        OR: [
          { name: { contains: name } },
          { name: { contains: `${lastName}, ${first}` } },
          { name: { contains: lastName } },
        ],
        archivedAt: null,
      },
    });
    matchedPeople.push({
      name,
      personId: person?.id ?? null,
      personName: person?.name ?? null,
    });
  }

  return NextResponse.json({
    ...result,
    matchedPeople,
  });
}
