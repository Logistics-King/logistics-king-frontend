import { AppShell } from "@/src/shared/layout/AppShell";
import { PlaceholderContent } from "@/src/shared/layout/DashboardContent";

export default function DriverProfilePage() {
  return (
    <AppShell role="DRIVER" title="기사 정보" description="배송기사 정보와 담당 지역을 관리합니다.">
      <PlaceholderContent
        title="기사 정보 화면"
        description="기사 정보 등록 API 스펙이 전달되면 소속 대리점, 기사명, 차량번호, 담당 지역, 활동 상태를 연결합니다."
      />
    </AppShell>
  );
}
