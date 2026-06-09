import { AppShell } from "@/src/shared/layout/AppShell";
import { PlaceholderContent } from "@/src/shared/layout/DashboardContent";

export default function AgencyDeliverContractsPage() {
  return (
    <AppShell role="AGENCY" title="기사 계약" description="대리점이 배송기사에게 요청한 계약을 관리합니다.">
      <PlaceholderContent
        title="배송기사 계약 관리 화면"
        description="배송기사, 담당 지역, 예상 물량, 단가, 계약 상태를 관리할 예정입니다."
      />
    </AppShell>
  );
}
