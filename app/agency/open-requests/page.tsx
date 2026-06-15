import { AppShell } from "@/src/shared/layout/AppShell";
import { AgencyOpenRequestsView } from "@/src/features/agency/AgencyOpenRequestsView";

// 이 파일은 "/agency/open-requests" 주소를 만드는 얇은 페이지입니다.
// 공통 대시보드 틀(AppShell)을 씌우고, 실제 화면 로직은 features/agency로 넘깁니다.
export default function AgencyOpenRequestsPage() {
  return (
    <AppShell
      role="AGENCY"
      title="일감 조회"
      description="화주가 공개한 계약 요청과 배송 물품 라인을 확인합니다."
    >
      <AgencyOpenRequestsView />
    </AppShell>
  );
}
