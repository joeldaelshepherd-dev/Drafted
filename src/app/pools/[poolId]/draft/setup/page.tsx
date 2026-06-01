import type { Metadata } from "next";
import { DraftSetupWizard } from "@/components/draft/DraftSetupWizard";

export const metadata: Metadata = {
  title: "Set up the draft — Drafted",
};

export default function DraftSetupPage({ params }: { params: { poolId: string } }) {
  return <DraftSetupWizard poolId={params.poolId} />;
}
