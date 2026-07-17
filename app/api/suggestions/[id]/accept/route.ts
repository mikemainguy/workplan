import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(
  _req: NextRequest, ctx: Ctx
) {
  const { id } = await ctx.params;
  const suggestion = await prisma.suggestion.findUnique(
    { where: { id } }
  );
  if (!suggestion || suggestion.status !== "pending") {
    return NextResponse.json(
      { error: "not found or already reviewed" },
      { status: 404 }
    );
  }

  const payload = JSON.parse(suggestion.payload);
  let linkedEntityId: string | null = null;

  if (suggestion.type === "person") {
    const person = await prisma.person.create({
      data: { name: payload.name, source: "ai" },
    });
    await prisma.interactionPerson.create({
      data: {
        interactionId: suggestion.interactionId,
        personId: person.id,
      },
    });
    linkedEntityId = person.id;
  } else if (suggestion.type === "action-item") {
    const item = await prisma.actionItem.create({
      data: {
        description: payload.description,
        interactionId: suggestion.interactionId,
        projectId: payload.projectId ?? null,
        source: "ai",
      },
    });
    linkedEntityId = item.id;
  } else if (suggestion.type === "topic-name") {
    await prisma.topic.update({
      where: { id: payload.topicId },
      data: { name: payload.proposedName },
    });
    if (payload.summary) {
      await prisma.interactionTopic.updateMany({
        where: {
          topicId: payload.topicId,
          interactionId: suggestion.interactionId,
        },
        data: { summary: payload.summary },
      });
    }
    linkedEntityId = payload.topicId;
  }

  const updated = await prisma.suggestion.update({
    where: { id },
    data: {
      status: "accepted",
      linkedEntityId,
      reviewedAt: new Date(),
    },
  });
  return NextResponse.json(updated);
}
