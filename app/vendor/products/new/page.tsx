import { VendorProductsManager } from "@/src/features/vendor/VendorProductsManager";
import { AppShell } from "@/src/shared/layout/AppShell";

export default function VendorProductCreatePage() {
  return (
    <AppShell role="VENDOR" title="배송 품목 등록" description="계약 요청에 사용할 배송 품목을 등록합니다.">
      <VendorProductsManager mode="create" />
    </AppShell>
  );
}
