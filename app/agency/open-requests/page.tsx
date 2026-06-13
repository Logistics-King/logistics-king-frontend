import { AppShell } from "@/src/shared/layout/AppShell";
import { AgencyOpenRequestsView } from "@/src/features/agency/AgencyOpenRequestsView";

export default function AgencyOpenRequestsPage() {
  return (
    <AppShell role="AGENCY" title="일감 조회" description="화주가 공개한 계약 요청을 확인합니다.">
      <AgencyOpenRequestsView />
    </AppShell>
  );
}
