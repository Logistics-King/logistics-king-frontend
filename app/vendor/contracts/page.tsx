import { AppShell } from "@/src/shared/layout/AppShell";
import { VendorListView } from "@/src/features/vendor/VendorListView";

export default function VendorContractsPage() {
  return (
    <AppShell role="VENDOR" title="화주 계약" description="수락한 제안으로 생성된 최종 계약을 확인합니다.">
      <VendorListView
        resource="contracts"
        title="화주 계약 목록"
        description="최종 계약을 페이지 단위로 확인합니다. 대리점/상태/기간 필터는 API 확장 후 활성화합니다."
        emptyMessage="생성된 화주 계약이 없습니다."
        filterPlaceholder="대리점, 상품명, 상태 검색"
        fields={[
          { label: "상품", keys: ["productName", "name"] },
          { label: "대리점", keys: ["agencyName", "agencyId"] },
          { label: "단가", keys: ["unitPrice"] },
          { label: "상태", keys: ["status"] },
        ]}
      />
    </AppShell>
  );
}
