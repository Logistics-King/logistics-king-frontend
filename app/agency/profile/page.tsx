import { AgencyProfileForm } from "@/src/features/profile/AgencyProfileForm";
import { AppShell } from "@/src/shared/layout/AppShell";

export default function AgencyProfilePage() {
  return (
    <AppShell role="AGENCY" title="대리점 정보" description="택배사, 담당 지역, 집하 조건을 등록하고 수정합니다.">
      <AgencyProfileForm />
    </AppShell>
  );
}
