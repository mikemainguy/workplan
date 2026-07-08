import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  analyzeWithOllama,
} from "@/lib/parsers/llm-ollama";

export async function POST() {
  const job = await prisma.aiJob.findFirst({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    include: {
      interaction: {
        select: { rawContent: true, subject: true },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ status: "no_jobs" });
  }

  const text = job.interaction.rawContent ?? "";
  if (!text) {
    await prisma.aiJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        completedAt: new Date(),
        result: JSON.stringify({
          summary: "", attendees: [],
          actionItems: [],
        }),
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
    console.log(`[AI] Completed: ${job.id}`);
    return NextResponse.json({
      status: "completed", method: "ollama",
    });
  }

  // Ollama unavailable — leave pending for retry
  console.log("[AI] Ollama offline, will retry later");
  return NextResponse.json({
    status: "ollama_unavailable",
  });
}
