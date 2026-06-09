import { AppShell } from "@/src/shared/layout/AppShell";
import { DashboardContent } from "@/src/shared/layout/DashboardContent";

export default function VendorPage() {
  return (
    <AppShell
      role="VENDOR"
      title="화주 홈"
      description="배송 품목, 계약 요청, 최종 계약을 한 곳에서 관리합니다."
    >
      <DashboardContent
        cards={[
          {
            label: "배송 품목",
            value: "등록",
            description: "상품군, 박스 크기, 냉장 필요 여부를 관리합니다.",
          },
          {
            label: "계약 요청",
            value: "작성",
            description: "월 물량과 픽업 조건으로 대리점 제안을 받습니다.",
          },
          {
            label: "최종 계약",
            value: "확인",
            description: "수락한 제안과 계약 조건을 확인합니다.",
          },
        ]}
      />
    </AppShell>
  );
}
