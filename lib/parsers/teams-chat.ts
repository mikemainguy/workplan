import { parseTeamsDesktop } from "./chat-teams-desktop";

export interface ChatMessage {
  sender: string;
  timestamp: string;
  text: string;
}

export interface ParsedChat {
  messages: ChatMessage[];
  participants: string[];
  dateRange?: { first: string; last: string };
}

// [2026-09-14T13:22:04Z] Morgan Reed: message
const ISO_RE =
  /^\[(\d{4}-\d{2}-\d{2}T[^\]]+)\]\s+(.+?):\s(.+)$/;
// 1/15/26, 9:41 AM - Morgan Reed: message
const WA_RE =
  /^(\d{1,2}\/\d{1,2}\/\d{2,4},?\s\d{1,2}:\d{2}(?:\s[AP]M)?)\s[–-]\s(.+?):\s(.+)$/;
// Teams Desktop: "text by LastName, FirstName"
const TD_RE =
  /^.+\sby\s[A-Z][a-z]+,\s[A-Z][a-z]+$/;

type ChatFormat =
  | "iso" | "whatsapp" | "teams-desktop" | "unknown";

function detectFormat(lines: string[]): ChatFormat {
  const sample = lines.slice(0, 30);
  const isoN = sample.filter(
    (l) => ISO_RE.test(l.trim())
  ).length;
  if (isoN >= 3) return "iso";

  const waN = sample.filter(
    (l) => WA_RE.test(l.trim())
  ).length;
  if (waN >= 3) return "whatsapp";

  const tdN = sample.filter(
    (l) => TD_RE.test(l.trim())
  ).length;
  if (tdN >= 2) return "teams-desktop";

  return "unknown";
}

function buildResult(msgs: ChatMessage[]): ParsedChat {
  const participants = [
    ...new Set(msgs.map((m) => m.sender)),
  ];
  const ts = msgs.map((m) => m.timestamp);
  return {
    messages: msgs,
    participants,
    dateRange: ts.length
      ? { first: ts[0], last: ts.at(-1)! }
      : undefined,
  };
}

function parseLineFormat(
  text: string, re: RegExp
): ParsedChat {
  const msgs: ChatMessage[] = [];
  let last: ChatMessage | null = null;
  for (const line of text.split("\n")) {
    const m = line.trim().match(re);
    if (m) {
      last = {
        timestamp: m[1], sender: m[2], text: m[3],
      };
      msgs.push(last);
    } else if (last && line.trim()) {
      last.text += "\n" + line.trim();
    }
  }
  return buildResult(msgs);
}

export function parseTeamsChat(
  text: string
): ParsedChat {
  const lines = text.split("\n");
  const format = detectFormat(lines);
  switch (format) {
    case "iso": return parseLineFormat(text, ISO_RE);
    case "whatsapp": return parseLineFormat(text, WA_RE);
    case "teams-desktop": return parseTeamsDesktop(text);
    default: return buildResult([]);
  }
}
