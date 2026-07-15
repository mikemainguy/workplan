import type { ChatSegment } from "../parsers/segment-chat";
import { ollamaChatJson } from "./ollama-client";

export interface SegmentSummary {
  topic: string;
  summary: string;
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function fallbackTopicName(
  seg: { startTime: string }
): string {
  return `Chat — ${formatDate(seg.startTime)}`;
}

export async function summarizeSegments(
  segments: ChatSegment[]
): Promise<SegmentSummary[]> {
  const input = segments.map((seg, i) => {
    const preview = seg.messages.slice(0, 5)
      .map((m) => `${m.sender}: ${m.text}`)
      .join("\n");
    return `Segment ${i + 1}:\n${preview}`;
  }).join("\n\n");

  try {
    const raw = await ollamaChatJson(
      "For each conversation segment, provide a short "
      + "topic name (under 8 words) and a 1-sentence "
      + "summary. Return JSON: "
      + '{"segments":[{"topic":"...","summary":"..."}]}',
      input.slice(0, 3000)
    );
    if (!raw) return segments.map(fallbackResult);
    const parsed = JSON.parse(raw);
    const results = parsed.segments ?? [];
    return segments.map((seg, i) => ({
      topic: results[i]?.topic
        ?? fallbackTopicName(seg),
      summary: results[i]?.summary ?? "",
    }));
  } catch {
    return segments.map(fallbackResult);
  }
}

function fallbackResult(
  seg: ChatSegment
): SegmentSummary {
  return { topic: fallbackTopicName(seg), summary: "" };
}
