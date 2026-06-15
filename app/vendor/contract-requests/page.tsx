import { AppShell } from "@/src/shared/layout/AppShell";
import { VendorContractRequestsManager } from "@/src/features/vendor/VendorContractRequestsManager";

export default function VendorContractRequestsPage() {
  return (
    <AppShell
      role="VENDOR"
      title="계약 요청"
      description="대리점 제안을 받기 위한 계약 요청을 등록하고 관리합니다."
    >
      <VendorContractRequestsManager />
    </AppShell>
  );
}
