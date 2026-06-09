import { AppShell } from "@/src/shared/layout/AppShell";
import { DashboardContent } from "@/src/shared/layout/DashboardContent";

export default function AdminPage() {
  return (
    <AppShell
      role="ADMIN"
      title="관리자 홈"
      description="화주, 대리점, 배송기사 메뉴를 모두 확인하고 운영 흐름을 점검합니다."
    >
      <DashboardContent
        cards={[
          {
            label: "화주 영역",
            value: "전체",
            description: "프로필, 품목, 계약 요청, 최종 계약 메뉴를 확인합니다.",
          },
          {
            label: "대리점 영역",
            value: "전체",
            description: "제안 가능 요청, 내 제안, 기사 계약 메뉴를 확인합니다.",
          },
          {
            label: "배송기사 영역",
            value: "전체",
            description: "기사 프로필과 기사 계약 메뉴를 확인합니다.",
          },
        ]}
      />
    </AppShell>
  );
}
