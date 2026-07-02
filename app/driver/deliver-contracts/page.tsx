import { AppShell } from "@/src/shared/layout/AppShell";
import { DeliverContractsView } from "@/src/features/driver/DeliverContractsView";

export default function DriverDeliverContractsPage() {
  return (
    <AppShell role="DRIVER" title="내 기사 계약" description="대리점이 요청한 배송기사 계약을 확인합니다.">
      <DeliverContractsView mode="DRIVER" />
    </AppShell>
  );
}
