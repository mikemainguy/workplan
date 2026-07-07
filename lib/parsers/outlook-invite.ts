import { stripBoilerplate } from "./strip-boilerplate";

export interface ParsedInvite {
  subject?: string;
  date?: string;       // ISO string
  attendees: string[]; // "LastName, FirstName" format
  cleanedBody: string;
}

export function parseOutlookInvite(
  text: string
): ParsedInvite {
  const result: ParsedInvite = {
    attendees: [],
    cleanedBody: stripBoilerplate(text),
  };

  // Extract subject
  const subjectMatch = text.match(
    /^Subject:\s*(.+)$/m
  );
  if (subjectMatch) result.subject = subjectMatch[1].trim();

  // Extract date/time — handle "Date: Day, Month D, YYYY
  // H:MM PM - H:MM PM (UTC...)" format
  const dateMatch = text.match(
    /^Date:\s*(.+?)\s*(?:-\s*\d{1,2}:\d{2}\s*[AP]M)?\s*(?:\(UTC[^)]*\).*)?$/m
  );
  if (dateMatch) {
    const dateStr = dateMatch[1].trim();
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      result.date = parsed.toISOString();
    }
  }

  // Extract attendees from Required/Optional lines
  const attendeePatterns = [
    /^Required Attendees:\s*(.+)$/m,
    /^Optional Attendees:\s*(.+)$/m,
  ];
  for (const pattern of attendeePatterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const names = match[1]
      .split(";")
      .map((n) => n.trim())
      .filter(Boolean);
    result.attendees.push(...names);
  }

  return result;
}

// Normalize "LastName, FirstName" to "FirstName LastName"
export function normalizeAttendeeName(
  name: string
): string {
  const parts = name.split(",").map((s) => s.trim());
  if (parts.length === 2) {
    return `${parts[1]} ${parts[0]}`;
  }
  return name;
}
