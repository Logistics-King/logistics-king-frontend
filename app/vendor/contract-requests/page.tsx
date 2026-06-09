import { AppShell } from "@/src/shared/layout/AppShell";
import { PlaceholderContent } from "@/src/shared/layout/DashboardContent";

export default function VendorContractRequestsPage() {
  return (
    <AppShell role="VENDOR" title="계약 요청" description="대리점 제안을 받기 위한 계약 요청을 관리합니다.">
      <PlaceholderContent
        title="계약 요청 목록 화면"
        description="픽업 지역, 월 예상 물량, 상품 정보, 희망 단가와 요청 상태를 보여줄 예정입니다."
      />
    </AppShell>
  );
}
