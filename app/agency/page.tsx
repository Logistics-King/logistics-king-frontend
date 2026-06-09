import { AppShell } from "@/src/shared/layout/AppShell";
import { DashboardContent } from "@/src/shared/layout/DashboardContent";

export default function AgencyPage() {
  return (
    <AppShell
      role="AGENCY"
      title="대리점 홈"
      description="제안 가능한 요청, 내 제안, 배송기사 계약을 관리합니다."
    >
      <DashboardContent
        cards={[
          {
            label: "제안 가능 요청",
            value: "탐색",
            description: "담당 가능한 화주 계약 요청을 확인합니다.",
          },
          {
            label: "내 제안",
            value: "관리",
            description: "제출한 단가와 서비스 조건을 수정하거나 철회합니다.",
          },
          {
            label: "기사 계약",
            value: "연결",
            description: "배송기사 계약 요청과 수락 상태를 관리합니다.",
          },
        ]}
      />
    </AppShell>
  );
}
