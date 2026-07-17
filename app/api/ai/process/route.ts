import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeWithOllama } from "@/lib/parsers/llm-ollama";
import { parseTeamsChat } from "@/lib/parsers/teams-chat";
import { segmentByTimeGap } from "@/lib/parsers/segment-chat";
import { summarizeSegments } from "@/lib/ai/topic-summarizer";
import { detectContentType } from "@/lib/parsers/detect";
import {
  createAnalysisSuggestions,
  createTopicSuggestions,
} from "@/lib/ai/create-suggestions";

async function createTopicNameSuggestions(
  aiJobId: string, interactionId: string, text: string
) {
  if (detectContentType(text) !== "teams-chat") return;
  const parsed = parseTeamsChat(text);
  const segments = segmentByTimeGap(parsed.messages);
  if (!segments.length) return;

  const summaries = await summarizeSegments(segments);
  const links = await prisma.interactionTopic.findMany({
    where: { interactionId },
    orderBy: { startTime: "asc" },
  });
  const topicIds = links.map((l) => l.topicId);
  await createTopicSuggestions(
    aiJobId, interactionId, summaries, topicIds
  );
}

export async function POST() {
  const job = await prisma.aiJob.findFirst({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    include: {
      interaction: {
        select: {
          id: true, rawContent: true, subject: true,
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ status: "no_jobs" });
  }

  const text = job.interaction.rawContent ?? "";
  if (!text) {
    const empty = {
      summary: "", attendees: [], actionItems: [],
    };
    await prisma.aiJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        result: JSON.stringify(empty),
      },
    });
    return NextResponse.json({ status: "completed" });
  }

  console.log(
    `[AI] Processing "${job.interaction.subject}"`
  );
  const analysis = await analyzeWithOllama(text);

  if (analysis) {
    await prisma.aiJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        result: JSON.stringify(analysis),
      },
    });
    await createAnalysisSuggestions(
      job.id, job.interaction.id, analysis
    );
    await createTopicNameSuggestions(
      job.id, job.interaction.id, text
    );
    console.log(`[AI] Completed: ${job.id}`);
    return NextResponse.json({
      status: "completed", method: "ollama",
    });
  }

  console.log("[AI] Ollama offline, will retry later");
  return NextResponse.json({
    status: "ollama_unavailable",
  });
}
