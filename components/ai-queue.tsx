"use client";

import { useEffect, useRef } from "react";

export function AiQueue() {
  const running = useRef(false);

  useEffect(() => {
    async function processNext() {
      if (running.current) return;
      running.current = true;

      try {
        const res = await fetch("/api/ai/process", {
          method: "POST",
        });
        const data = await res.json();

        if (data.status === "no_jobs") {
          console.log("[AiQueue] No pending jobs");
        } else if (data.status === "completed") {
          console.log(
            "[AiQueue] Job completed via Ollama"
          );
        } else if (data.status === "ollama_unavailable") {
          console.log(
            "[AiQueue] Ollama offline, will retry"
          );
        }
      } catch (err) {
        console.error("[AiQueue] Error:", err);
      }
      running.current = false;
    }

    processNext();
    const interval = setInterval(processNext, 15000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
