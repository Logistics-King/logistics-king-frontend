import { AppShell } from "@/src/shared/layout/AppShell";
import { DeliverContractsView } from "@/src/features/driver/DeliverContractsView";

export default function AgencyDeliverContractsPage() {
  return (
    <AppShell role="AGENCY" title="기사 계약" description="대리점이 배송기사에게 요청한 계약을 관리합니다.">
      <DeliverContractsView mode="AGENCY" />
    </AppShell>
  );
}
