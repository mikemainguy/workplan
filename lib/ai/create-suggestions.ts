import { prisma } from "@/lib/db";
import type { AiAnalysis } from "../parsers/llm-ollama";
import type { SegmentSummary } from "./topic-summarizer";

export async function createAnalysisSuggestions(
  aiJobId: string,
  interactionId: string,
  analysis: AiAnalysis
) {
  const data = [];
  for (const name of analysis.attendees) {
    data.push({
      type: "person",
      payload: JSON.stringify({ name }),
      aiJobId,
      interactionId,
    });
  }
  for (const desc of analysis.actionItems) {
    data.push({
      type: "action-item",
      payload: JSON.stringify({ description: desc }),
      aiJobId,
      interactionId,
    });
  }
  if (data.length > 0) {
    await prisma.suggestion.createMany({ data });
  }
}

export async function createTopicSuggestions(
  aiJobId: string,
  interactionId: string,
  summaries: SegmentSummary[],
  topicIds: string[]
) {
  const data = [];
  for (let i = 0; i < topicIds.length; i++) {
    const s = summaries[i];
    if (!s) continue;
    data.push({
      type: "topic-name" as const,
      payload: JSON.stringify({
        topicId: topicIds[i],
        proposedName: s.topic,
        summary: s.summary,
      }),
      aiJobId,
      interactionId,
    });
  }
  if (data.length > 0) {
    await prisma.suggestion.createMany({ data });
  }
}
