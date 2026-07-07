// Patterns that indicate start of Teams meeting boilerplate
const TEAMS_BLOCK_START = [
  /^_{10,}$/m,
  /^Microsoft Teams meeting$/m,
];

// Lines to remove individually
const JUNK_PATTERNS = [
  /^Join:\s*https:\/\/teams\.microsoft\.com/,
  /^Meeting ID:\s/,
  /^Passcode:\s/,
  /^Need help\?/,
  /^Dial in by phone$/,
  /^\+\d[\d\s,#-]+/,
  /^Find a local number$/,
  /^Phone conference ID:\s/,
  /^Join on a video conferencing device$/,
  /^Tenant key:\s/,
  /^Video ID:\s/,
  /^More info$/,
  /^For organizers:\s/,
  /^This meeting supports the use of AI/,
  /^Privacy and security$/,
  /^_{10,}$/,
  /^System reference$/,
];

export function stripBoilerplate(text: string): string {
  const lines = text.split("\n");
  const cleaned: string[] = [];
  let inTeamsBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (!inTeamsBlock) cleaned.push("");
      continue;
    }

    // Detect start of Teams block
    if (TEAMS_BLOCK_START.some((p) => p.test(trimmed))) {
      inTeamsBlock = true;
      continue;
    }

    // Inside Teams block: skip until closing line
    if (inTeamsBlock) {
      if (/^_{10,}$/.test(trimmed)) inTeamsBlock = false;
      continue;
    }

    // Outside block: filter individual junk lines
    if (JUNK_PATTERNS.some((p) => p.test(trimmed))) {
      continue;
    }

    cleaned.push(line);
  }

  return cleaned.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
