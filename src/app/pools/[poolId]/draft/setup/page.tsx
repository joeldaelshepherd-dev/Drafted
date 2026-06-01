"use client";

/**
 * Legacy setup route → redirect.
 *
 * Drafts are now keyed by draftId. This old per-pool URL is kept so any saved
 * link still resolves: it routes to the pool's newest draft setup, creating a
 * fresh draft if the pool has none yet. Runs client-side because the draft
 * registry lives in localStorage.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createDraftRecord, newestDraftForPool } from "@/lib/draft/drafts-store";

export default function LegacyDraftSetupRedirect({
  params,
}: {
  params: { poolId: string };
}) {
  const router = useRouter();

  useEffect(() => {
    const existing = newestDraftForPool(params.poolId);
    const draftId = existing ? existing.id : createDraftRecord(params.poolId).id;
    router.replace(`/pools/${params.poolId}/draft/${draftId}/setup`);
  }, [params.poolId, router]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-5 py-8">
      <div className="skeleton h-6 w-40 rounded-lg" />
      <div className="skeleton h-2 w-full rounded-full" />
      <div className="skeleton h-48 w-full rounded-2xl" />
    </main>
  );
}
