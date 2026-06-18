import { Suspense } from "react";
import { AppShell } from "@/src/shared/layout/AppShell";
import { VendorContractRequestListView } from "@/src/features/vendor/VendorContractRequestsManager";

export default function VendorContractRequestsPage() {
  return (
    <AppShell
      role="VENDOR"
      title="계약 요청 조회"
      description="등록한 계약 요청의 진행 상태를 보고, 진행중 요청을 수정하거나 삭제합니다."
    >
      <Suspense
        fallback={
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
            계약 요청 목록을 불러오는 중입니다.
          </div>
        }
      >
        <VendorContractRequestListView />
      </Suspense>
    </AppShell>
  );
}
