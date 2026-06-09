import { AppShell } from "@/src/shared/layout/AppShell";
import { PlaceholderContent } from "@/src/shared/layout/DashboardContent";

export default function AgencyProfilePage() {
  return (
    <AppShell role="AGENCY" title="대리점 프로필" description="택배사, 담당 지역, 집하 조건을 관리합니다.">
      <PlaceholderContent
        title="대리점 프로필 화면"
        description="택배사, 대리점명, 담당 지역, 집하 가능 시간, 월 처리 가능 물량을 입력할 예정입니다."
      />
    </AppShell>
  );
}
