import type { ChatMessage } from "./teams-chat";

export interface ChatSegment {
  startTime: string;
  endTime: string;
  messages: ChatMessage[];
  participants: string[];
  startIdx: number;
  endIdx: number;
}

const GAP_MS = 30 * 60 * 1000; // 30 minutes

function parseTs(ts: string): Date {
  const d = new Date(ts);
  if (!isNaN(d.getTime())) return d;
  // Fallback: append current year for "9/14 1:22 PM"
  const year = new Date().getFullYear();
  return new Date(`${ts} ${year}`);
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function segmentByTimeGap(
  messages: ChatMessage[],
  gapMs = GAP_MS
): ChatSegment[] {
  if (!messages.length) return [];

  const segments: ChatSegment[] = [];
  let start = 0;

  for (let i = 1; i < messages.length; i++) {
    const prev = parseTs(messages[i - 1].timestamp);
    const curr = parseTs(messages[i].timestamp);
    const gap = curr.getTime() - prev.getTime();
    const newDay = dayKey(prev) !== dayKey(curr);

    if (gap > gapMs || newDay) {
      segments.push(buildSegment(messages, start, i - 1));
      start = i;
    }
  }
  segments.push(buildSegment(messages, start, messages.length - 1));
  return segments;
}

function buildSegment(
  msgs: ChatMessage[], start: number, end: number
): ChatSegment {
  const slice = msgs.slice(start, end + 1);
  return {
    startTime: slice[0].timestamp,
    endTime: slice[slice.length - 1].timestamp,
    messages: slice,
    participants: [...new Set(
      slice.map((m) => m.sender)
    )],
    startIdx: start,
    endIdx: end,
  };
}
