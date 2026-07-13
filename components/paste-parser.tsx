"use client";

import { useState, useRef } from "react";
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
  attendees?: string[];
  method?: string;
}

interface Props {
  onParsed: (result: ParseResult, raw: string) => void;
}

export function PasteParser({ onParsed }: Props) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [result, setResult] =
    useState<ParseResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function parse(content: string) {
    setParsing(true);
    const res = await fetch("/api/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: content }),
    });
    const data = await res.json();
    setResult(data);
    onParsed(data, content);
    setParsing(false);
  }

  async function handleFile(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    setText(content);
    await parse(content);
  }

  return (
    <div className="space-y-3">
      <Textarea rows={8} value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste meeting notes, invite,
          chat, or any text here..." />
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={() => parse(text)}
          disabled={parsing || !text.trim()} size="sm">
          {parsing ? "Parsing..." : "Parse & Fill"}
        </Button>
        <Button variant="outline" size="sm"
          onClick={() => fileRef.current?.click()}>
          Upload File
        </Button>
        <input ref={fileRef} type="file"
          className="hidden"
          accept=".txt,.md,.html,.ics,.json,.csv"
          onChange={handleFile} />
        {result && (
          <>
            <Badge variant="secondary">
              {result.contentType}
            </Badge>
            <Badge variant="outline">
              via {result.method ?? "regex"}
            </Badge>
          </>
        )}
      </div>
    </div>
  );
}
