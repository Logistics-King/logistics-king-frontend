import { AppShell } from "@/src/shared/layout/AppShell";
import { PlaceholderContent } from "@/src/shared/layout/DashboardContent";

export default function VendorProfilePage() {
  return (
    <AppShell role="VENDOR" title="화주 프로필" description="사업자 정보와 주 배송 지역을 관리합니다.">
      <PlaceholderContent
        title="화주 프로필 화면"
        description="사업자명, 사업자등록번호, 대표자명, 주소, 주 배송 지역 입력 폼이 들어갈 예정입니다."
      />
    </AppShell>
  );
}
