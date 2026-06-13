import { AppShell } from "@/src/shared/layout/AppShell";
import { DashboardContent } from "@/src/shared/layout/DashboardContent";

export default function DriverPage() {
  return (
    <AppShell
      role="DRIVER"
      title="배송기사 홈"
      description="대리점이 요청한 배송기사 계약과 담당 지역을 확인합니다."
    >
      <DashboardContent
        cards={[
          {
            label: "기사 프로필",
            value: "확인",
            description: "차량번호, 담당 지역, 연락처를 관리합니다.",
          },
          {
            label: "기사 계약",
            value: "수락",
            description: "대리점이 요청한 계약 조건을 확인하고 응답합니다.",
          },
          {
            label: "활동 상태",
            value: "관리",
            description: "집하 가능 여부와 메모를 최신 상태로 유지합니다.",
          },
        ]}
      />
    </AppShell>
  );
}
