"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ArchiveToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showArchived = searchParams.get("archived") === "true";

  function toggle() {
    const params = new URLSearchParams(
      searchParams.toString()
    );
    if (showArchived) {
      params.delete("archived");
    } else {
      params.set("archived", "true");
    }
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?");
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggle}>
      {showArchived ? "Hide archived" : "Show archived"}
    </Button>
  );
}
