import { AppShell } from "@/src/shared/layout/AppShell";
import { PlaceholderContent } from "@/src/shared/layout/DashboardContent";

export default function AgencyOpenRequestsPage() {
  return (
    <AppShell role="AGENCY" title="제안 가능 요청" description="대리점이 제안할 수 있는 화주 계약 요청을 확인합니다.">
      <PlaceholderContent
        title="제안 가능 계약 요청 화면"
        description="열려 있는 계약 요청의 지역, 물량, 상품 조건을 확인하고 제안 제출로 이어질 예정입니다."
      />
    </AppShell>
  );
}
