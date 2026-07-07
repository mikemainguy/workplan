import { readFileSync } from "fs";
import { join } from "path";
import { parseContent } from "../lib/parsers/index";

const fixtures = [
  "teams-meeting-block.txt",
  "teams-chat.txt",
  "outlook-invite.txt",
  "freeform-notes.txt",
];

const dir = join(__dirname, "..", "test-fixtures");

for (const file of fixtures) {
  const raw = readFileSync(join(dir, file), "utf-8");
  const result = parseContent(raw);

  console.log(`\n=== ${file} ===`);
  console.log(`Type: ${result.contentType}`);
  console.log(`Interaction: ${result.interactionType}`);
  if (result.subject) console.log(`Subject: ${result.subject}`);
  if (result.date) console.log(`Date: ${result.date}`);
  if (result.attendees.length) {
    console.log(`Attendees: ${result.attendees.join(", ")}`);
  }
  if (result.actionItems.length) {
    console.log(`Action items:`);
    result.actionItems.forEach((a) => console.log(`  - ${a}`));
  }
  console.log(`Cleaned content (first 200 chars):`);
  console.log(
    `  ${result.cleanedContent.slice(0, 200).replace(/\n/g, "\n  ")}`
  );
}
