import { AppShell } from "@/src/shared/layout/AppShell";
import { PlaceholderContent } from "@/src/shared/layout/DashboardContent";

export default function AgencyContractsPage() {
  return (
    <AppShell role="AGENCY" title="대리점 계약" description="수락된 제안으로 생성된 최종 계약을 확인합니다.">
      <PlaceholderContent
        title="대리점 최종 계약 화면"
        description="계약 단가, 화주 요청 정보, 픽업 조건, 계약 상태를 보여줄 예정입니다."
      />
    </AppShell>
  );
}
