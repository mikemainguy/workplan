import {
  isOllamaAvailable as checkOllama,
  ollamaChat, ollamaChatJson,
} from "../ai/ollama-client";

export { checkOllama as isOllamaAvailable };

export interface LlmParseResult {
  subject?: string;
  date?: string;
  attendees: string[];
  actionItems: string[];
  contentType: string;
  cleanedContent: string;
}

export interface AiAnalysis {
  summary: string;
  attendees: string[];
  actionItems: string[];
}

export async function analyzeWithOllama(
  text: string
): Promise<AiAnalysis | null> {
  if (!(await checkOllama())) return null;
  try {
    const input = text.slice(0, 3000);
    const summary = await ollamaChat(
      "Summarize in 2-3 sentences.", input
    );
    const peopleRaw = await ollamaChat(
      "List only the people names mentioned,"
      + " one per line. No other text.", input
    );
    const actionsRaw = await ollamaChat(
      "List action items or TODOs,"
      + " one per line. No other text.", input
    );
    const attendees = peopleRaw.split("\n")
      .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
      .filter((l) => l.length > 1 && l.length < 60);
    const actionItems = actionsRaw.split("\n")
      .map((l) => l.replace(/^[-*\d.)\s]+/, "").trim())
      .filter((l) => l.length > 3 && l.length < 200);
    return { summary, attendees, actionItems };
  } catch (err) {
    console.error("[Ollama] Error:", err);
    return null;
  }
}

const SYSTEM_PROMPT = `You extract structured data from
meeting notes, calendar invites, and chat transcripts.
Return JSON only. No explanation.`;

function buildPrompt(text: string): string {
  return `Extract from this text:
- subject (meeting topic or conversation subject)
- date (ISO 8601 if found)
- attendees (list of names)
- actionItems (list of action item descriptions)
- contentType (one of: outlook-invite, teams-chat,
  teams-meeting, freeform)
- cleanedContent (the useful content with boilerplate
  removed)

Text:
${text.slice(0, 3000)}`;
}

export async function extractWithOllama(
  text: string
): Promise<LlmParseResult | null> {
  try {
    const content = await ollamaChatJson(
      SYSTEM_PROMPT, buildPrompt(text)
    );
    if (!content) return null;
    const parsed = JSON.parse(content);
    return {
      subject: parsed.subject ?? undefined,
      date: parsed.date ?? undefined,
      attendees: parsed.attendees ?? [],
      actionItems: parsed.actionItems ?? [],
      contentType: parsed.contentType ?? "freeform",
      cleanedContent:
        parsed.cleanedContent ?? text,
    };
  } catch {
    return null;
  }
}
