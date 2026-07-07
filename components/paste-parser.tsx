"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface MatchedPerson {
  name: string;
  personId: string | null;
  personName: string | null;
}

interface ParseResult {
  contentType: string;
  subject?: string;
  date?: string;
  interactionType: string;
  cleanedContent: string;
  actionItems: string[];
  matchedPeople: MatchedPerson[];
}

interface Props {
  onParsed: (result: ParseResult, raw: string) => void;
}

export function PasteParser({ onParsed }: Props) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(
    null
  );

  async function handleParse() {
    if (!text.trim()) return;
    setParsing(true);
    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setResult(data);
    onParsed(data, text);
    setParsing(false);
  }

  return (
    <div className="space-y-3">
      <Textarea rows={8} value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste meeting invite, Teams chat,
          or notes here..." />
      <div className="flex items-center gap-3">
        <Button onClick={handleParse} disabled={parsing}
          size="sm">
          {parsing ? "Parsing..." : "Parse & Fill"}
        </Button>
        {result && (
          <Badge variant="secondary">
            Detected: {result.contentType}
          </Badge>
        )}
      </div>
    </div>
  );
}
