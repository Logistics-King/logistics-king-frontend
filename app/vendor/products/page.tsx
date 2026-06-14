import { AppShell } from "@/src/shared/layout/AppShell";
import { VendorProductsManager } from "@/src/features/vendor/VendorProductsManager";

// 이 파일은 "/vendor/products" 주소를 만드는 페이지입니다.
// page.tsx는 URL 담당, VendorProductsManager는 조회/수정 화면 로직 담당입니다.
export default function VendorProductsPage() {
  return (
    <AppShell role="VENDOR" title="배송 품목 조회" description="등록된 배송 품목을 확인하고 수정합니다.">
      <VendorProductsManager mode="list" />
    </AppShell>
  );
}
