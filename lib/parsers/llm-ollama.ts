const OLLAMA_URL =
  process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const MODEL =
  process.env.OLLAMA_MODEL ?? "llama3.2:1b";

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(), 1000
    );
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export interface LlmParseResult {
  subject?: string;
  date?: string;
  attendees: string[];
  actionItems: string[];
  contentType: string;
  cleanedContent: string;
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

export interface AiAnalysis {
  summary: string;
  attendees: string[];
  actionItems: string[];
}

async function ollamaChat(
  system: string, user: string
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL, stream: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) return "";
  const data = await res.json();
  return data.message?.content ?? "";
}

export async function analyzeWithOllama(
  text: string
): Promise<AiAnalysis | null> {
  if (!(await isOllamaAvailable())) return null;
  try {
    const input = text.slice(0, 3000);
    console.log("[Ollama] Pass 1: summarize");
    const summary = await ollamaChat(
      "Summarize in 2-3 sentences.", input
    );
    console.log("[Ollama] Pass 2: attendees");
    const peopleRaw = await ollamaChat(
      "List only the people names mentioned,"
      + " one per line. No other text.", input
    );
    console.log("[Ollama] Pass 3: action items");
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

export async function extractWithOllama(
  text: string
): Promise<LlmParseResult | null> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        format: "json",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(text) },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data.message?.content;
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
