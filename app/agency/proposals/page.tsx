import { AppShell } from "@/src/shared/layout/AppShell";
import { PlaceholderContent } from "@/src/shared/layout/DashboardContent";

export default function AgencyProposalsPage() {
  return (
    <AppShell role="AGENCY" title="내 제안" description="대리점이 제출한 제안을 관리합니다.">
      <PlaceholderContent
        title="내 제안 목록 화면"
        description="제안 단가, 픽업 시간, 서비스 조건, 제출/철회 상태를 보여줄 예정입니다."
      />
    </AppShell>
  );
}
