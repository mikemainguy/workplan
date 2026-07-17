import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  fallbackTopicName,
} from "@/lib/ai/topic-summarizer";

interface SegmentInput {
  startTime: string;
  endTime: string;
  startIdx: number;
  endIdx: number;
  participants: string[];
}

export async function GET() {
  const interactions =
    await prisma.interaction.findMany({
      orderBy: { date: "desc" },
      include: {
        people: { include: { person: true } },
        project: true,
        _count: { select: { actionItems: true } },
      },
    });
  return NextResponse.json(interactions);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const interaction = await prisma.interaction.create({
    data: {
      type: body.type,
      subject: body.subject,
      date: new Date(body.date),
      rawContent: body.rawContent || null,
      parsedContent: body.parsedContent || null,
      projectId: body.projectId || null,
      people: body.personIds?.length
        ? {
            create: body.personIds.map(
              (personId: string) => ({ personId })
            ),
          }
        : undefined,
    },
    include: {
      people: { include: { person: true } },
      project: true,
    },
  });

  // Create Topics from segments
  const segments: SegmentInput[] =
    body.segments ?? [];
  for (const seg of segments) {
    const topic = await prisma.topic.create({
      data: {
        name: fallbackTopicName(seg),
        source: "ai",
      },
    });
    await prisma.interactionTopic.create({
      data: {
        interactionId: interaction.id,
        topicId: topic.id,
        startTime: new Date(seg.startTime),
        endTime: new Date(seg.endTime),
        messageRange: JSON.stringify({
          startIdx: seg.startIdx,
          endIdx: seg.endIdx,
        }),
      },
    });
  }

  if (body.rawContent) {
    await prisma.aiJob.create({
      data: { interactionId: interaction.id },
    });
  }

  return NextResponse.json(
    interaction, { status: 201 }
  );
}
