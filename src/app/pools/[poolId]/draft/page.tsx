import type { Metadata } from "next";
import { DraftRoomLoader } from "@/components/draft/DraftRoomLoader";

export const dynamic = "force-dynamic"; // live clock + realtime picks are time-sensitive

export const metadata: Metadata = {
  title: "The Draft — Drafted",
};

export default function DraftPage({ params }: { params: { poolId: string } }) {
  return <DraftRoomLoader poolId={params.poolId} />;
}
