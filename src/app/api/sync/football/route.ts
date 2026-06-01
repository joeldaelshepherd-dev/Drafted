import { NextRequest, NextResponse } from "next/server";
import { runFootballSync } from "@/lib/football/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Vercel Cron target (see vercel.json — every 2 min). Protected by a shared
 * secret so only the scheduler (and admins) can trigger a sync.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (!process.env.SYNC_CRON_SECRET || secret !== process.env.SYNC_CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const result = await runFootballSync();
    return NextResponse.json({ ok: true, ...result, at: new Date().toISOString() });
  } catch (err) {
    console.error("[drafted] football sync failed", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
