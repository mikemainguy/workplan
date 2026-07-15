export const OLLAMA_URL =
  process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
export const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL ?? "llama3.2:1b";

export async function isOllamaAvailable(
): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(), 1000
    );
    const res = await fetch(
      `${OLLAMA_URL}/api/tags`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export async function ollamaChat(
  system: string, user: string
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL, stream: false,
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

export async function ollamaChatJson(
  system: string, user: string
): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL, stream: false,
      format: "json",
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
