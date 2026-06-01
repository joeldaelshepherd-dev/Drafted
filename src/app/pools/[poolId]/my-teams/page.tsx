import Link from "next/link";
import { getDemoMyTeams } from "@/lib/teams/demo";
import { TeamSummaryBar } from "@/components/teams/TeamSummaryBar";
import { LiveHighlight } from "@/components/teams/LiveHighlight";
import { MyTeamsBoard } from "@/components/teams/MyTeamsBoard";

export const dynamic = "force-dynamic"; // countdowns/live data are time-sensitive

// TODO(drafted): replace getDemoMyTeams() with live data:
//   1. const supabase = createClient() (server)
//   2. load pool, tournament config, fixtures, teams, full roster, members
//   3. buildMyTeams(withPoolOverrides(config, ...), { currentUserId, ... })
export default function MyTeamsPage({ params }: { params: { poolId: string } }) {
  const view = getDemoMyTeams();
  const liveCard = view.liveHighlight
    ? view.cards.find((c) => c.live?.fixture.id === view.liveHighlight!.fixture.id)
    : null;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-5 py-6 pb-24">
      <header className="space-y-1">
        <Link href="/" className="text-xs font-semibold text-ink-muted hover:text-ink">
          ← Shepherd Family Syndicate
        </Link>
        <h1 className="font-display text-3xl font-black tracking-tight text-ink">My Teams</h1>
        <p className="text-sm text-ink-muted">
          Your drafted squad, live points, and who in the pool you&rsquo;re up against next.
        </p>
      </header>

      {view.liveHighlight && liveCard && (
        <LiveHighlight
          live={view.liveHighlight}
          teamName={liveCard.team.name}
          teamFlag={liveCard.team.flagUrl}
          teamCode={liveCard.team.shortCode}
        />
      )}

      <TeamSummaryBar summary={view.summary} />

      <MyTeamsBoard cards={view.cards} />
    </main>
  );
}
