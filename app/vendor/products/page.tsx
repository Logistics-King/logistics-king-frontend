import { AppShell } from "@/src/shared/layout/AppShell";
import { PlaceholderContent } from "@/src/shared/layout/DashboardContent";

export default function VendorProductsPage() {
  return (
    <AppShell role="VENDOR" title="배송 품목" description="화주가 주로 발송하는 상품 정보를 관리합니다.">
      <PlaceholderContent
        title="배송 품목 관리 화면"
        description="상품 카테고리, 평균 가격, 평균 무게, 박스 크기, 파손/냉장 여부를 등록할 예정입니다."
      />
    </AppShell>
  );
}
