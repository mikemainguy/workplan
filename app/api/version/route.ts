import { NextResponse } from "next/server";

const REPO = "mikemainguy/workplan";
const RELEASES_URL =
  `https://api.github.com/repos/${REPO}/releases/latest`;

export async function GET() {
  const current = process.env.APP_VERSION ?? "0.0.0";

  try {
    const res = await fetch(RELEASES_URL, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) {
      return NextResponse.json({
        current, latest: current, updateAvailable: false,
      });
    }

    const data = await res.json();
    const latest = (data.tag_name ?? "")
      .replace(/^v/, "");
    const updateAvailable = latest > current;
    const downloadUrl = data.html_url ?? "";

    if (updateAvailable) {
      console.log(
        `[WorkPlan] Update available: v${latest}`
        + ` (current: v${current})`
      );
    }

    return NextResponse.json({
      current, latest, updateAvailable, downloadUrl,
    });
  } catch {
    return NextResponse.json({
      current, latest: current, updateAvailable: false,
    });
  }
}
