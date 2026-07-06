"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  type: "interaction" | "actionItem" | "person" | "project";
  title: string;
  snippet: string;
  date?: string;
  projectName?: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query.trim())}`
      );
      const data = await res.json();
      setResults(data.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search interactions, action items, people, projects..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-lg"
        />
      </form>

      {loading && (
        <p className="text-sm text-muted-foreground">Searching...</p>
      )}

      {searched && !loading && results.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No results found for &quot;{query}&quot;
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => (
            <Card key={`${result.type}-${result.id}`}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{result.title}</div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {result.snippet}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{result.type}</Badge>
                    {result.projectName && (
                      <Badge variant="secondary">{result.projectName}</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
