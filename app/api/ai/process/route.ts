import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeWithOllama } from "@/lib/parsers/llm-ollama";
import { parseTeamsChat } from "@/lib/parsers/teams-chat";
import { segmentByTimeGap } from "@/lib/parsers/segment-chat";
import { summarizeSegments } from "@/lib/ai/topic-summarizer";
import { detectContentType } from "@/lib/parsers/detect";

async function updateTopicNames(
  interactionId: string, text: string
) {
  const contentType = detectContentType(text);
  if (contentType !== "teams-chat") return;
  const parsed = parseTeamsChat(text);
  const segments = segmentByTimeGap(parsed.messages);
  if (segments.length === 0) return;

  const summaries = await summarizeSegments(segments);
  const links = await prisma.interactionTopic.findMany(
    {
      where: { interactionId },
      orderBy: { startTime: "asc" },
      include: { topic: true },
    }
  );

  for (let i = 0; i < links.length; i++) {
    const s = summaries[i];
    if (!s) continue;
    await prisma.topic.update({
      where: { id: links[i].topicId },
      data: { name: s.topic },
    });
    await prisma.interactionTopic.update({
      where: { id: links[i].id },
      data: { summary: s.summary },
    });
  }
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
    const empty = { summary: "", attendees: [], actionItems: [] };
    await prisma.aiJob.update({
      where: { id: job.id },
      data: {
        status: "completed", completedAt: new Date(),
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
    await updateTopicNames(
      job.interaction.id, text
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
