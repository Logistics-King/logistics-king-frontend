import { AppShell } from "@/src/shared/layout/AppShell";
import { VendorDashboard } from "@/src/features/vendor/VendorDashboard";

export default function VendorPage() {
  return (
    <AppShell
      role="VENDOR"
      title="화주 홈"
      description="최근 계약 요청과 계약 상태를 확인하고 필요한 메뉴로 이동합니다."
    >
      <VendorDashboard />
    </AppShell>
  );
}
