import { detectContentType, type ContentType } from "./detect";
import { stripBoilerplate } from "./strip-boilerplate";
import {
  parseOutlookInvite, normalizeAttendeeName,
} from "./outlook-invite";
import { parseTeamsChat } from "./teams-chat";

export interface ParseResult {
  contentType: ContentType;
  subject?: string;
  date?: string;
  interactionType: string; // meeting, chat, etc.
  attendees: string[];     // normalized names
  cleanedContent: string;
  actionItems: string[];
}

const ACTION_PATTERNS = [
  /^[-*]\s*\[[ ]\]\s*(.+)$/gm,
  /^(?:Action|TODO|Action item):\s*(.+)$/gim,
  /^[-*]\s+(?:TODO|Action):\s*(.+)$/gim,
  /^[-*]\s+\S+\s+to\s+(.+)$/gm,
];

function extractActionItems(text: string): string[] {
  const items: string[] = [];
  for (const pattern of ACTION_PATTERNS) {
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      items.push(match[1].trim());
    }
  }
  return [...new Set(items)];
}

export function parseContent(rawText: string): ParseResult {
  const contentType = detectContentType(rawText);

  if (contentType === "outlook-invite") {
    const parsed = parseOutlookInvite(rawText);
    return {
      contentType,
      subject: parsed.subject,
      date: parsed.date,
      interactionType: "meeting",
      attendees: parsed.attendees.map(normalizeAttendeeName),
      cleanedContent: parsed.cleanedBody,
      actionItems: extractActionItems(rawText),
    };
  }

  if (contentType === "teams-chat") {
    const parsed = parseTeamsChat(rawText);
    // Use first message timestamp as the date
    // Format is "2/4 9:30 AM" — no year, assume current
    const firstTs = parsed.dateRange?.first;
    let chatDate: string | undefined;
    if (firstTs) {
      let d = new Date(firstTs);
      if (isNaN(d.getTime())) {
        // Fallback: "2/4 9:30 AM" needs current year
        const year = new Date().getFullYear();
        d = new Date(`${firstTs} ${year}`);
      }
      if (!isNaN(d.getTime())) {
        chatDate = d.toISOString();
      }
    }
    return {
      contentType,
      date: chatDate,
      interactionType: "chat",
      attendees: parsed.participants.map(normalizeAttendeeName),
      cleanedContent: parsed.messages
        .map((m) => `${m.sender} (${m.timestamp}):\n${m.text}`)
        .join("\n\n"),
      actionItems: extractActionItems(rawText),
    };
  }

  // teams-meeting or freeform
  return {
    contentType,
    interactionType:
      contentType === "teams-meeting" ? "meeting" : "other",
    attendees: [],
    cleanedContent: stripBoilerplate(rawText),
    actionItems: extractActionItems(rawText),
  };
}
