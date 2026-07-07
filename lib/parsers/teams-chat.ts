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

const NAME_RE = /^[A-Z][a-z]+,\s[A-Z][a-z]+$/;
const TIME_RE = /^\d{1,2}\/\d{1,2}\s\d{1,2}:\d{2}\s[AP]M$/;
const PREVIEW_RE = /^.+\sby\s([A-Z][a-z]+,\s[A-Z][a-z]+)$/;

export function parseTeamsChat(text: string): ParsedChat {
  const lines = text.split("\n");
  const messages: ChatMessage[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]?.trim();
    const previewMatch = line?.match(PREVIEW_RE);

    if (!previewMatch) { i++; continue; }

    // After preview: name+time in either order
    const a = lines[i + 1]?.trim() ?? "";
    const b = lines[i + 2]?.trim() ?? "";
    let sender = "";
    let timestamp = "";

    if (NAME_RE.test(a) && TIME_RE.test(b)) {
      sender = a; timestamp = b; i += 3;
    } else if (TIME_RE.test(a) && NAME_RE.test(b)) {
      timestamp = a; sender = b; i += 3;
    } else {
      i++; continue;
    }

    // Collect message lines until next preview
    const msgLines: string[] = [];
    while (i < lines.length) {
      const next = lines[i]?.trim();
      if (next === "has context menu") { i++; continue; }
      if (next?.match(PREVIEW_RE)) break;
      msgLines.push(lines[i]);
      i++;
    }

    messages.push({
      sender,
      timestamp,
      text: msgLines.join("\n").trim(),
    });
  }

  const participants = [
    ...new Set(messages.map((m) => m.sender)),
  ];
  const timestamps = messages.map((m) => m.timestamp);

  return {
    messages,
    participants,
    dateRange: timestamps.length
      ? { first: timestamps[0], last: timestamps.at(-1)! }
      : undefined,
  };
}
