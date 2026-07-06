import { NextResponse } from "next/server";

export async function POST() {
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.json(
      { error: "Shutdown only available in standalone mode" },
      { status: 403 }
    );
  }

  // Respond before exiting
  const response = NextResponse.json({ ok: true });

  setTimeout(() => {
    console.log("Shutdown requested via UI. Exiting.");
    process.exit(0);
  }, 500);

  return response;
}
