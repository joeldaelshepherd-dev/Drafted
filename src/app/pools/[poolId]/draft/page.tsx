"use client";

/**
 * Legacy draft-room route → redirect.
 *
 * Kept so old links resolve: routes to the pool's newest draft room, or back to
 * the pool page if the pool has no drafts yet. Client-side because the draft
 * registry lives in localStorage.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { newestDraftForPool } from "@/lib/draft/drafts-store";

export default function LegacyDraftRoomRedirect({
  params,
}: {
  params: { poolId: string };
}) {
  const router = useRouter();

  useEffect(() => {
    const existing = newestDraftForPool(params.poolId);
    router.replace(
      existing
        ? `/pools/${params.poolId}/draft/${existing.id}`
        : `/pools/${params.poolId}`,
    );
  }, [params.poolId, router]);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-5 py-6">
      <div className="skeleton h-8 w-56 rounded-xl" />
      <div className="skeleton h-32 w-full rounded-2xl" />
      <div className="skeleton h-64 w-full rounded-2xl" />
    </main>
  );
}
