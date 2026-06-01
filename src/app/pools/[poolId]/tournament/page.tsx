import Link from "next/link";
import { TournamentHub } from "@/components/tournament/TournamentHub";
import { getDemoTournamentHub } from "@/lib/hub/demo";

export const dynamic = "force-dynamic"; // live scores + standings are time-sensitive

// TODO(drafted): replace the demo snapshot with live data:
//   1. const supabase = createClient() (server)
//   2. load the pool's tournament id → fixtures/scores from src/lib/football
//   3. recompute group tables + knockout from real results; subscribe the hub
//      to Supabase Realtime so the UI refreshes as matches go live.
export default function TournamentPage({ params }: { params: { poolId: string } }) {
  const data = getDemoTournamentHub();

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-6 pb-24">
      <header className="space-y-1">
        <Link href="/" className="text-xs font-semibold text-ink-muted hover:text-ink">
          ← Shepherd Family Syndicate
        </Link>
        <h1 className="font-display text-3xl font-black tracking-tight text-ink">Tournament Hub</h1>
        <p className="text-sm text-ink-muted">
          World Cup 2026 — the official companion view. Real schedule, group tables, and a projected
          knockout bracket, independent of your pool.
        </p>
      </header>

      <TournamentHub data={data} />
    </main>
  );
}
