"use client";

import { useState, useEffect } from "react";

interface VersionInfo {
  current: string;
  latest: string;
  updateAvailable: boolean;
  downloadUrl?: string;
}

export function UpdateBanner() {
  const [info, setInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    fetch("/api/version")
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => {});
  }, []);

  if (!info?.updateAvailable) return null;

  return (
    <div className="mx-3 mb-2 rounded-md border
      border-primary/30 bg-primary/5 p-2">
      <p className="text-xs text-primary font-medium">
        v{info.latest} available
      </p>
      {info.downloadUrl && (
        <a href={info.downloadUrl} target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline">
          Download update
        </a>
      )}
    </div>
  );
}
