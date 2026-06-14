import { apiFetch } from "@/src/shared/api/client";
import type {
  BoxSize,
  Carrier,
  ColdChainType,
  PageResponse,
  ProductCategory,
} from "@/src/shared/api/types";

export type ListQuery = {
  page?: number;
  size?: number;
};

export type VendorProductFilters = {
  name?: string;
  category?: ProductCategory;
  boxSize?: BoxSize;
  coldChainType?: ColdChainType;
};

export type VendorAgencySearchScope = "ALL" | "NEARBY";

// 화주가 계약 요청을 보낼 대리점을 찾을 때 쓰는 검색 조건입니다.
// scope=NEARBY면 백엔드가 로그인 화주의 mainRegion 기준으로 인근 대리점을 찾습니다.
export type VendorAgencyFilters = {
  scope?: VendorAgencySearchScope;
  agencyName?: string;
  region?: string;
  carrier?: Carrier;
  saturdayDeliveryAvailable?: boolean;
  returnAvailable?: boolean;
};

export type VendorProductRequest = {
  category: ProductCategory;
  name: string;
  description: string | null;
  averagePrice: number | null;
  averageWeightGram: number | null;
  boxSize: BoxSize | null;
  boxQuantity: number;
  itemQuantity: number;
  destinationPostalCode: string | null;
  destinationAddress: string;
  destinationAddressDetail: string | null;
  fragile: boolean;
  liquid: boolean;
  freshFood: boolean;
  coldChainType: ColdChainType;
};

export type VendorProductItem = VendorProductRequest & {
  productId: string;
  vendorId: string;
};

export type VendorContractRequestItem = Record<string, unknown>;
export type VendorContractItem = Record<string, unknown>;

export type VendorAgencySummary = {
  agencyId: string;
  carrier: Carrier;
  agencyName: string;
  mainRegion: string;
  serviceRegions: string[];
  weekdayPickupStartTime: string | null;
  weekdayPickupEndTime: string | null;
  saturdayPickupAvailable: boolean;
  saturdayDeliveryAvailable: boolean;
  returnAvailable: boolean;
  supportedColdChainTypes: ColdChainType[];
  maxMonthlyVolume: number | null;
};

// 목록 카드보다 더 자세한 대리점 정보입니다.
// 상세 화면이나 계약 요청 대상 확인 화면에서 쓰기 위한 타입입니다.
export type VendorAgencyDetail = VendorAgencySummary & {
  userId: string;
  businessRegistrationNumber: string | null;
  representativeName: string;
  phoneNumber: string;
  postalCode: string | null;
  address: string;
  addressDetail: string | null;
};

export function getVendorProducts({
  page = 0,
  size = 20,
  ...filters
}: ListQuery & VendorProductFilters = {}): Promise<PageResponse<VendorProductItem>> {
  return apiFetch(`/api/v1/vendors/me/products${toPageQuery(page, size, filters)}`, {
    credentials: "include",
  });
}

export function createVendorProduct(
  request: VendorProductRequest,
): Promise<VendorProductItem> {
  return apiFetch("/api/v1/vendors/me/products", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function updateVendorProduct(
  productId: string,
  request: VendorProductRequest,
): Promise<VendorProductItem> {
  return apiFetch(`/api/v1/vendors/me/products/${productId}`, {
    method: "PUT",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function getVendorContractRequests({
  page = 0,
  size = 20,
}: ListQuery = {}): Promise<PageResponse<VendorContractRequestItem>> {
  return apiFetch(`/api/v1/contract-requests${toPageQuery(page, size)}`);
}

export function getVendorContracts({
  page = 0,
  size = 20,
}: ListQuery = {}): Promise<PageResponse<VendorContractItem>> {
  return apiFetch(`/api/v1/contracts/vendor/me${toPageQuery(page, size)}`);
}

export function getVendorAgencies({
  page = 0,
  size = 20,
  ...filters
}: ListQuery & VendorAgencyFilters = {}): Promise<PageResponse<VendorAgencySummary>> {
  // 화주 권한으로 조회하는 대리점 목록 API입니다.
  return apiFetch(`/api/v1/agencies${toPageQuery(page, size, filters)}`, {
    credentials: "include",
  });
}

export function getVendorAgencyDetail(agencyId: string): Promise<VendorAgencyDetail> {
  // 목록에서 선택한 대리점의 상세 정보를 가져옵니다.
  return apiFetch(`/api/v1/agencies/${agencyId}`, {
    credentials: "include",
  });
}

function toPageQuery(
  page: number,
  size: number,
  filters: Record<string, string | boolean | undefined> = {},
): string {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  return `?${searchParams.toString()}`;
}
