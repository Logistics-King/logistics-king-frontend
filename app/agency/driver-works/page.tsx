import { DriverWorksView } from "@/src/features/driver-work/DriverWorksView";
import { AppShell } from "@/src/shared/layout/AppShell";

export default function AgencyDriverWorksPage() {
  return (
    <AppShell
      role="AGENCY"
      title="기사 일감"
      description="최종 계약 물량을 소속 배송기사에게 공개하거나 직접 배정합니다."
    >
      <DriverWorksView mode="AGENCY" />
    </AppShell>
  );
}
