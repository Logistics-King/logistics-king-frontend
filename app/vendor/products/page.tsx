import { AppShell } from "@/src/shared/layout/AppShell";
import { VendorProductsManager } from "@/src/features/vendor/VendorProductsManager";

export default function VendorProductsPage() {
  return (
    <AppShell role="VENDOR" title="배송 품목 조회" description="등록된 배송 품목을 확인하고 수정합니다.">
      <VendorProductsManager mode="list" />
    </AppShell>
  );
}
