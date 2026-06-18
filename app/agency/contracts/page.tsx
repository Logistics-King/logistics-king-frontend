import { AppShell } from "@/src/shared/layout/AppShell";
import { AgencyContractsView } from "@/src/features/agency/AgencyContractsView";

export default function AgencyContractsPage() {
  return (
    <AppShell role="AGENCY" title="대리점 계약" description="수락된 제안으로 생성된 최종 계약을 확인합니다.">
      <AgencyContractsView />
    </AppShell>
  );
}
