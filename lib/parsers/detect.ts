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

// Teams chat: "LastName, FirstName\n<date> <time>\n"
const TEAMS_CHAT_PATTERN =
  /^[A-Z][a-z]+,\s[A-Z][a-z]+\n\d{1,2}\/\d{1,2}\s\d{1,2}:\d{2}\s[AP]M$/m;

export function detectContentType(text: string): ContentType {
  // Check for Outlook invite first (may contain Teams block)
  const inviteScore = OUTLOOK_INVITE_MARKERS.filter((m) =>
    m instanceof RegExp ? m.test(text) : text.includes(m)
  ).length;
  if (inviteScore >= 2) return "outlook-invite";

  // Check for Teams chat format
  if (TEAMS_CHAT_PATTERN.test(text)) return "teams-chat";

  // Check for standalone Teams meeting block
  const teamsScore = TEAMS_MEETING_MARKERS.filter(
    (m) => text.includes(m)
  ).length;
  if (teamsScore >= 2) return "teams-meeting";

  return "freeform";
}
