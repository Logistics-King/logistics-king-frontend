import { AppShell } from "@/src/shared/layout/AppShell";
import { AgencyProposalsView } from "@/src/features/agency/AgencyProposalsView";

export default function AgencyProposalsPage() {
  return (
    <AppShell role="AGENCY" title="내 제안" description="대리점이 제출한 제안을 관리합니다.">
      <AgencyProposalsView />
    </AppShell>
  );
}
