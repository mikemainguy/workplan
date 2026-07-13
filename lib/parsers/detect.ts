export type ContentType =
  | "outlook-invite"
  | "teams-meeting"
  | "teams-chat"
  | "freeform";

const TEAMS_MEETING_MARKERS = [
  "Microsoft Teams meeting",
  "teams.microsoft.com/meet",
  "Meeting ID:",
  "Phone conference ID:",
];

const OUTLOOK_INVITE_MARKERS = [
  "Required Attendees:",
  "Optional Attendees:",
  /^Date:\s.+\d{4}/m,
  /^Subject:\s/m,
  /^Location:\s/m,
];

// Multiple chat format detection patterns
const CHAT_PATTERNS: RegExp[] = [
  // Teams Desktop: "LastName, FirstName\ndate time"
  /^[A-Z][a-z]+,\s[A-Z][a-z]+\n\d{1,2}\/\d{1,2}\s\d{1,2}:\d{2}\s[AP]M$/m,
  // ISO log: [2026-09-14T13:22:04Z] Name: message
  /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?\]\s+\w+.*:\s/m,
  // WhatsApp: 1/15/26, 9:41 AM - Name: message
  /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s\d{1,2}:\d{2}\s[AP]M\s[–-]\s.+:/m,
];

export function detectContentType(
  text: string
): ContentType {
  const inviteScore = OUTLOOK_INVITE_MARKERS.filter(
    (m) =>
      m instanceof RegExp
        ? m.test(text) : text.includes(m)
  ).length;
  if (inviteScore >= 2) return "outlook-invite";

  if (CHAT_PATTERNS.some((p) => p.test(text))) {
    return "teams-chat";
  }

  const teamsScore = TEAMS_MEETING_MARKERS.filter(
    (m) => text.includes(m)
  ).length;
  if (teamsScore >= 2) return "teams-meeting";

  return "freeform";
}
