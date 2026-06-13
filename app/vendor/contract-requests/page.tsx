import { AppShell } from "@/src/shared/layout/AppShell";
import { VendorListView } from "@/src/features/vendor/VendorListView";

export default function VendorContractRequestsPage() {
  return (
    <AppShell role="VENDOR" title="계약 요청" description="대리점 제안을 받기 위한 계약 요청을 관리합니다.">
      <VendorListView
        resource="contractRequests"
        title="계약 요청 목록"
        description="내가 등록한 계약 요청을 페이지 단위로 확인합니다. 상태/기간 필터는 API 확장 후 활성화합니다."
        emptyMessage="등록된 계약 요청이 없습니다."
        filterPlaceholder="상품명, 지역, 상태 검색"
        fields={[
          { label: "상품", keys: ["productName", "name"] },
          { label: "픽업 지역", keys: ["pickupRegion", "mainRegion"] },
          { label: "월 물량", keys: ["monthlyVolume"] },
          { label: "상태", keys: ["status"] },
        ]}
      />
    </AppShell>
  );
}
