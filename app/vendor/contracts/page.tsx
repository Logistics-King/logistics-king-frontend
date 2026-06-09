import { AppShell } from "@/src/shared/layout/AppShell";
import { PlaceholderContent } from "@/src/shared/layout/DashboardContent";

export default function VendorContractsPage() {
  return (
    <AppShell role="VENDOR" title="화주 계약" description="수락한 제안으로 생성된 최종 계약을 확인합니다.">
      <PlaceholderContent
        title="화주 최종 계약 화면"
        description="계약 단가, 픽업 조건, 계약 상태와 연결된 계약 요청 정보를 보여줄 예정입니다."
      />
    </AppShell>
  );
}
