import { apiFetch } from "@/src/shared/api/client";
import type {
  BoxSize,
  ColdChainType,
  PageResponse,
  ProductCategory,
} from "@/src/shared/api/types";

export type ContractRequestType = "VENDOR_OFFER" | "AGENCY_OFFER";

export type ContractPartyType = "VENDOR" | "AGENCY";

export type ContractRequestStatus = "OPEN" | "CANCELED" | "REJECTED" | "CONTRACTED";

export type AgencyOpenContractRequestItem = {
  contractRequestId: string;
  vendorId: string | null;
  agencyId: string | null;
  type: ContractRequestType;
  requesterType: ContractPartyType;
  requesterId: string;
  approverType: ContractPartyType;
  approverId: string | null;
  productId: string | null;
  pickupRegion: string;
  pickupAddress: string;
  monthlyVolume: number;
  productCategory: ProductCategory;
  productName: string;
  boxSize: BoxSize;
  pickupStartTime: string | null;
  pickupEndTime: string | null;
  saturdayDeliveryRequired: boolean;
  returnRequired: boolean;
  coldChainType: ColdChainType;
  targetUnitPrice: number | null;
  memo: string | null;
  status: ContractRequestStatus;
};

export type AgencyVendorProductFilters = {
  scope?: AgencySearchScope;
  name?: string;
  category?: ProductCategory;
  boxSize?: BoxSize;
  coldChainType?: ColdChainType;
};

export type AgencySearchScope = "ALL" | "NEARBY";

export type AgencyVendorSummary = {
  vendorId: string;
  userId: string;
  businessName: string;
  businessRegistrationNumber: string | null;
  representativeName: string;
  phoneNumber: string;
  postalCode: string | null;
  address: string;
  addressDetail: string | null;
  mainRegion: string;
};

// 대리점 일감 조회 화면에서 보여줄 화주 배송 품목 데이터입니다.
// 백엔드 GET /api/v1/vendors/products 응답의 items 한 건과 맞춥니다.
export type AgencyVendorProductItem = {
  productId: string;
  vendorId: string;
  vendor?: AgencyVendorSummary | null;
  category: ProductCategory;
  name: string;
  description: string | null;
  averagePrice: number | null;
  averageWeightGram: number | null;
  boxSize: BoxSize | null;
  destinationPostalCode: string | null;
  destinationAddress: string;
  destinationAddressDetail: string | null;
  fragile: boolean;
  liquid: boolean;
  freshFood: boolean;
  coldChainType: ColdChainType;
};

export function getAgencyOpenContractRequests({
  page = 0,
  size = 20,
}: {
  page?: number;
  size?: number;
} = {}): Promise<PageResponse<AgencyOpenContractRequestItem>> {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch(`/api/v1/contract-requests/open?${searchParams.toString()}`);
}

export function getAgencyVendorProducts(
  {
    page = 0,
    size = 20,
    ...filters
  }: {
    page?: number;
    size?: number;
  } & AgencyVendorProductFilters = {},
): Promise<PageResponse<AgencyVendorProductItem>> {
  // 대리점이 모든 화주의 배송 품목을 보는 API입니다.
  // scope=NEARBY를 넘기면 백엔드가 현재 대리점 프로필의 담당 지역 기준으로 필터링합니다.
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  return apiFetch(`/api/v1/vendors/products?${searchParams.toString()}`);
}

export function getAgencyVendorProductsByVendorId(
  vendorId: string,
  {
    page = 0,
    size = 20,
    ...filters
  }: {
    page?: number;
    size?: number;
  } & AgencyVendorProductFilters = {},
): Promise<PageResponse<AgencyVendorProductItem>> {
  // 특정 화주 ID를 이미 알고 있을 때만 쓰는 좁은 조회 API입니다.
  // 일반적인 "일감 조회" 화면은 getAgencyVendorProducts를 사용합니다.
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  return apiFetch(`/api/v1/vendors/${vendorId}/products?${searchParams.toString()}`);
}
