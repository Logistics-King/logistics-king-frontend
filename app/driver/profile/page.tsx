import { AppShell } from "@/src/shared/layout/AppShell";
import { PlaceholderContent } from "@/src/shared/layout/DashboardContent";

export default function DriverProfilePage() {
  return (
    <AppShell role="DRIVER" title="기사 프로필" description="배송기사 정보와 담당 지역을 관리합니다.">
      <PlaceholderContent
        title="배송기사 프로필 화면"
        description="소속 대리점, 기사명, 차량번호, 담당 지역, 활동 상태를 입력할 예정입니다."
      />
    </AppShell>
  );
}
