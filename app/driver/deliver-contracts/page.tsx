import { AppShell } from "@/src/shared/layout/AppShell";
import { PlaceholderContent } from "@/src/shared/layout/DashboardContent";

export default function DriverDeliverContractsPage() {
  return (
    <AppShell role="DRIVER" title="내 기사 계약" description="대리점이 요청한 배송기사 계약을 확인합니다.">
      <PlaceholderContent
        title="내 배송기사 계약 화면"
        description="계약 단가, 담당 지역, 시작일, 종료일, 수락/거절 상태를 보여줄 예정입니다."
      />
    </AppShell>
  );
}
