import Link from "next/link";
import { DEMO_DRAFT_USER, createDemoDraft } from "@/lib/draft/demo";
import { DraftRoom } from "@/components/draft/DraftRoom";

export const dynamic = "force-dynamic"; // live clock + realtime picks are time-sensitive

// TODO(drafted): replace the demo draft with live data:
//   1. const supabase = createClient() (server)
//   2. load pool + members → DraftParticipant[], the draft row (settings/order/picks)
//   3. hydrate DraftState; subscribe DraftRoom to Supabase Realtime instead of
//      the offline reducer in useDraft.
export default function DraftPage({ params }: { params: { poolId: string } }) {
  const initialState = createDemoDraft();

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-6 pb-24">
      <header className="space-y-1">
        <Link href="/" className="text-xs font-semibold text-ink-muted hover:text-ink">
          ← Shepherd Family Syndicate
        </Link>
        <h1 className="font-display text-3xl font-black tracking-tight text-ink">The Draft</h1>
        <p className="text-sm text-ink-muted">
          Live snake draft — pick your nations, work your queue, and watch the board fill up.
        </p>
      </header>

      <DraftRoom
        initialState={initialState}
        currentUserId={DEMO_DRAFT_USER}
        poolName="Shepherd Family Syndicate"
      />
    </main>
  );
}
