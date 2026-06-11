import { AppShell } from "@/src/shared/layout/AppShell";
import { VendorListView } from "@/src/features/vendor/VendorListView";

export default function VendorProductsPage() {
  return (
    <AppShell role="VENDOR" title="배송 품목" description="화주가 주로 발송하는 상품 정보를 관리합니다.">
      <VendorListView
        resource="products"
        title="배송 품목 목록"
        description="등록된 배송 품목을 페이지 단위로 확인합니다. 필터는 API 확장 후 활성화합니다."
        emptyMessage="등록된 배송 품목이 없습니다."
        filterPlaceholder="품목명, 카테고리 검색"
        fields={[
          { label: "품목명", keys: ["name", "productName"] },
          { label: "카테고리", keys: ["category", "productCategory"] },
          { label: "박스", keys: ["boxSize"] },
          { label: "평균 무게", keys: ["averageWeightGram"] },
        ]}
      />
    </AppShell>
  );
}
