import { apiFetch } from "@/src/shared/api/client";
import type {
  BoxSize,
  Carrier,
  ColdChainType,
  PageResponse,
  ProductCategory,
} from "@/src/shared/api/types";
import type { ContractListItem } from "@/src/features/contracts/types";

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
export type VendorContractItem = ContractListItem;

export type ContractRequestType = "VENDOR_OFFER" | "AGENCY_OFFER";

export type ContractRequestStatus = "OPEN" | "CANCELED" | "REJECTED" | "CONTRACTED";
export type VendorProposalStatus =
  | "SUBMITTED"
  | "NEGOTIATING"
  | "WITHDRAWN"
  | "ACCEPTED"
  | "REJECTED"
  | string;

export type VendorContractRequestLine = {
  itemId?: string;
  productId: string | null;
  productCategory: ProductCategory;
  productName: string;
  boxSize: BoxSize;
  boxQuantity: number;
  itemQuantity: number;
  averageWeightGram: number | null;
  fragile: boolean;
  liquid: boolean;
  freshFood: boolean;
  coldChainType: ColdChainType;
  targetUnitPrice: number | null;
};

export type VendorContractRequestPayload = {
  type?: ContractRequestType;
  approverId?: string | null;
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
  items: VendorContractRequestLine[];
};

export type VendorContractRequestDetail = VendorContractRequestPayload & {
  contractRequestId: string;
  vendorId: string | null;
  agencyId: string | null;
  requesterType: "VENDOR" | "AGENCY";
  requesterId: string;
  approverType: "VENDOR" | "AGENCY";
  status: ContractRequestStatus;
};

export type VendorProposalItem = {
  proposalId: string;
  contractRequestId: string;
  vendorId: string;
  agencyId: string;
  agency: VendorAgencySummary | null;
  unitPrice: number;
  initialUnitPrice: number;
  finalUnitPrice: number | null;
  pendingNegotiationId: string | null;
  nextSequence: number;
  pickupStartTime: string | null;
  pickupEndTime: string | null;
  saturdayDeliveryAvailable: boolean;
  returnAvailable: boolean;
  coldChainType: ColdChainType;
  memo: string | null;
  status: VendorProposalStatus;
};

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
}: ListQuery = {}): Promise<PageResponse<VendorContractRequestDetail>> {
  return apiFetch(`/api/v1/contract-requests${toPageQuery(page, size)}`);
}

export function getVendorContractRequestDetail(
  contractRequestId: string,
): Promise<VendorContractRequestDetail> {
  return apiFetch(`/api/v1/contract-requests/${contractRequestId}`);
}

export function getVendorContractRequestProposals(
  contractRequestId: string,
  { page = 0, size = 20 }: ListQuery = {},
): Promise<PageResponse<VendorProposalItem>> {
  return apiFetch(
    `/api/v1/contract-requests/${contractRequestId}/proposals${toPageQuery(page, size)}`,
  );
}

export function acceptVendorProposal(proposalId: string): Promise<VendorContractItem> {
  return apiFetch(`/api/v1/proposals/${proposalId}/accept`, {
    method: "POST",
    credentials: "include",
  });
}

export function createVendorContractRequest(
  request: VendorContractRequestPayload,
): Promise<VendorContractRequestDetail> {
  return apiFetch("/api/v1/contract-requests", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      type: "VENDOR_OFFER",
      ...request,
    }),
  });
}

export function updateVendorContractRequest(
  contractRequestId: string,
  request: VendorContractRequestPayload,
): Promise<VendorContractRequestDetail> {
  return apiFetch(`/api/v1/contract-requests/${contractRequestId}`, {
    method: "PUT",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function cancelVendorContractRequest(
  contractRequestId: string,
): Promise<VendorContractRequestDetail> {
  return apiFetch(`/api/v1/contract-requests/${contractRequestId}/cancel`, {
    method: "POST",
    credentials: "include",
  });
}

export function getVendorContracts({
  page = 0,
  size = 20,
}: ListQuery = {}): Promise<PageResponse<VendorContractItem>> {
  return apiFetch(`/api/v1/contracts/vendor/me${toPageQuery(page, size)}`, {
    credentials: "include",
  });
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
