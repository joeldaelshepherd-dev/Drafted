import type { Metadata } from "next";
import { Suspense } from "react";
import { JoinPoolClient } from "@/components/pools/JoinPoolClient";

export const metadata: Metadata = {
  title: "Join a pool — Drafted",
};

function JoinFallback() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-5 py-12">
      <div className="skeleton h-9 w-40 rounded-xl" />
      <div className="skeleton h-44 w-full rounded-2xl" />
    </main>
  );
}

export default function JoinPoolPage() {
  return (
    <Suspense fallback={<JoinFallback />}>
      <JoinPoolClient />
    </Suspense>
  );
}
