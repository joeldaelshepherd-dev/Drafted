import { DraftSetupWizard } from "@/components/draft/DraftSetupWizard";

export default function DraftSetupPage({
  params,
}: {
  params: { poolId: string; draftId: string };
}) {
  return <DraftSetupWizard poolId={params.poolId} draftId={params.draftId} />;
}
