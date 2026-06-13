import { VendorProfileForm } from "@/src/features/profile/VendorProfileForm";
import { AppShell } from "@/src/shared/layout/AppShell";

export default function VendorProfilePage() {
  return (
    <AppShell role="VENDOR" title="화주 정보" description="사업자 정보와 주 발송 지역을 등록합니다.">
      <VendorProfileForm />
    </AppShell>
  );
}
