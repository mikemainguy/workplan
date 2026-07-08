import { NextRequest, NextResponse } from "next/server";
import { parseContent } from "@/lib/parsers";
import { prisma } from "@/lib/db";
import {
  isOllamaAvailable, extractWithOllama,
} from "@/lib/parsers/llm-ollama";

async function matchPeople(attendees: string[]) {
  const matched = [];
  for (const name of attendees) {
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
    matched.push({
      name,
      personId: person?.id ?? null,
      personName: person?.name ?? null,
    });
  }
  return matched;
}

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text) {
    return NextResponse.json(
      { error: "text is required" }, { status: 400 }
    );
  }

  // Tier 1: Try Ollama
  if (await isOllamaAvailable()) {
    const llmResult = await extractWithOllama(text);
    if (llmResult) {
      const matchedPeople = await matchPeople(
        llmResult.attendees
      );
      return NextResponse.json({
        ...llmResult,
        interactionType:
          llmResult.contentType === "teams-chat"
            ? "chat" : "meeting",
        method: "ollama",
        matchedPeople,
      });
    }
  }

  // Tier 2: Regex fallback
  const result = parseContent(text);
  const matchedPeople = await matchPeople(
    result.attendees
  );

  return NextResponse.json({
    ...result,
    method: "regex",
    matchedPeople,
  });
}
