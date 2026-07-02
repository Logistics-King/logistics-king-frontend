import { DriverWorksView } from "@/src/features/driver-work/DriverWorksView";
import { AppShell } from "@/src/shared/layout/AppShell";

export default function DriverWorksPage() {
  return (
    <AppShell
      role="DRIVER"
      title="기사 일감"
      description="소속 대리점의 공개 일감에 신청하고 배정된 일감을 확인합니다."
    >
      <DriverWorksView mode="DRIVER" />
    </AppShell>
  );
}
