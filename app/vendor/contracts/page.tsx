import { AppShell } from "@/src/shared/layout/AppShell";
import { VendorContractsView } from "@/src/features/vendor/VendorContractsView";

export default function VendorContractsPage() {
  return (
    <AppShell role="VENDOR" title="화주 계약" description="수락한 제안으로 생성된 최종 계약을 확인합니다.">
      <VendorContractsView />
    </AppShell>
  );
}
