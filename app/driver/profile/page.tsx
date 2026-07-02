import { AppShell } from "@/src/shared/layout/AppShell";
import { DriverProfileForm } from "@/src/features/driver/DriverProfileForm";

export default function DriverProfilePage() {
  return (
    <AppShell role="DRIVER" title="기사 정보" description="배송기사 정보와 담당 지역을 관리합니다.">
      <DriverProfileForm />
    </AppShell>
  );
}
