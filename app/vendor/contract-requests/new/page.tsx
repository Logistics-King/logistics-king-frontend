import { Suspense } from "react";
import { AppShell } from "@/src/shared/layout/AppShell";
import { VendorContractRequestCreateView } from "@/src/features/vendor/VendorContractRequestsManager";

export default function VendorContractRequestCreatePage() {
  return (
    <AppShell
      role="VENDOR"
      title="계약 요청 등록"
      description="대리점에 보낼 계약 요청을 배송 물품 라인 단위로 등록합니다."
    >
      <Suspense
        fallback={
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
            계약 요청 화면을 불러오는 중입니다.
          </div>
        }
      >
        <VendorContractRequestCreateView />
      </Suspense>
    </AppShell>
  );
}
