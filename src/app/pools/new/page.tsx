import type { Metadata } from "next";
import Link from "next/link";
import { Button, Card } from "@/components/ui";

export const metadata: Metadata = {
  title: "Create a pool — Drafted",
};

export default function NewPoolPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-5 py-12">
      <div>
        <h1 className="text-3xl font-black text-ink">Create a pool</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Name your league, set the rules, and invite your crew.
        </p>
      </div>
      <Card className="flex flex-col gap-4 text-sm text-ink-muted">
        <p>
          The full create-a-pool flow — naming, invite codes, and shareable links — arrives in the
          next update.
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
