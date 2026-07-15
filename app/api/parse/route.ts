import { NextRequest, NextResponse } from "next/server";
import { parseContent } from "@/lib/parsers";
import { prisma } from "@/lib/db";
import {
  isOllamaAvailable, extractWithOllama,
} from "@/lib/parsers/llm-ollama";
import { findBestMatch } from "@/lib/fuzzy-match";

async function matchPeople(attendees: unknown[]) {
  const allPeople = await prisma.person.findMany({
    where: { archivedAt: null },
    select: { id: true, name: true },
  });
  const matched = [];
  for (const raw of attendees) {
    if (!raw || typeof raw !== "string") continue;
    const name = raw.trim();
    if (!name) continue;
    const result = findBestMatch(name, allPeople);
    matched.push({
      name,
      personId: result.personId,
      personName: result.personName,
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

  // Always run regex parse for segments
  const regexResult = parseContent(text);

  // Tier 1: Try Ollama for smarter extraction
  if (await isOllamaAvailable()) {
    const llmResult = await extractWithOllama(text);
    if (llmResult) {
      const matchedPeople = await matchPeople(
        llmResult.attendees
      );
      return NextResponse.json({
        ...llmResult,
        segments: regexResult.segments,
        interactionType:
          llmResult.contentType === "teams-chat"
            ? "chat" : "meeting",
        method: "ollama",
        matchedPeople,
      });
    }
  }

  // Tier 2: Regex fallback
  const matchedPeople = await matchPeople(
    regexResult.attendees
  );
  return NextResponse.json({
    ...regexResult,
    method: "regex",
    matchedPeople,
  });
}
