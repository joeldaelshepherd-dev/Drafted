import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Join a pool — Drafted",
};

export default function JoinPoolPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-12">
      <div>
        <h1 className="text-3xl font-black text-ink">Join a pool</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Got an invite code or link? You&apos;ll be in your pool in seconds.
        </p>
      </div>
      <Card className="flex flex-col gap-4 text-sm text-ink-muted">
        <p>
          Joining by invite code and shareable link — including links that drop you straight into a
          pool — arrives in the next update.
        </p>
        <Link href="/">
          <Button variant="secondary" className="w-full justify-center">
            Back to dashboard
          </Button>
        </Link>
      </Card>
    </main>
  );
}
