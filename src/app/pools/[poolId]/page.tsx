import type { Metadata } from "next";
import { PoolDetailClient } from "@/components/pools/PoolDetailClient";

export const metadata: Metadata = {
  title: "Pool — Drafted",
};

export default function PoolDetailPage({ params }: { params: { poolId: string } }) {
  return <PoolDetailClient poolId={params.poolId} />;
}
