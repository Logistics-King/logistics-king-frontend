import { apiFetch } from "@/src/shared/api/client";
import type {
  BoxSize,
  Carrier,
  ColdChainType,
  ContractRequestContractType,
  DayOfWeek,
  PageResponse,
  ProductCategory,
  RecurringPickupCycle,
} from "@/src/shared/api/types";
import type { ContractListItem } from "@/src/features/contracts/types";

export type ContractRequestType = "VENDOR_OFFER" | "AGENCY_OFFER";

export type ContractPartyType = "VENDOR" | "AGENCY";

export type ContractRequestStatus = "OPEN" | "CANCELED" | "REJECTED" | "CONTRACTED";

export type AgencyContractRequestLineItem = {
  itemId: string;
  contractRequestItemId?: string;
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
  contractType: ContractRequestContractType;
  pickupDateFrom: string | null;
  pickupDateTo: string | null;
  deliveryDateFrom: string | null;
  deliveryDateTo: string | null;
  recurringPickupCycle: RecurringPickupCycle | null;
  recurringPickupDaysOfWeek: DayOfWeek[];
  recurringPickupDayOfMonth: number | null;
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
  items: AgencyContractRequestLineItem[];
  status: ContractRequestStatus;
};

export type AgencyOpenRequestScope = "ALL" | "NEARBY";

export type AgencyOpenRequestFilters = {
  scope?: AgencyOpenRequestScope;
  pickupRegion?: string;
  name?: string;
  category?: ProductCategory;
  boxSize?: BoxSize;
  coldChainType?: ColdChainType;
  saturdayDeliveryRequired?: boolean;
  returnRequired?: boolean;
  minTargetUnitPrice?: number;
  maxTargetUnitPrice?: number;
  vendorName?: string;
};

export type AgencyProposalRequest = {
  unitPrice: number;
  items: AgencyProposalLinePriceRequest[];
  pickupStartTime: string | null;
  pickupEndTime: string | null;
  saturdayDeliveryAvailable: boolean;
  returnAvailable: boolean;
  coldChainType: ColdChainType;
  memo: string | null;
};

export type AgencyProposalLinePriceRequest = {
  contractRequestItemId: string;
  unitPrice: number;
};

export type AgencyProposalLinePriceItem = AgencyProposalLinePriceRequest & {
  itemId: string;
};

export type AgencySummary = {
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

export type AgencyProposalStatus =
  | "SUBMITTED"
  | "NEGOTIATING"
  | "WITHDRAWN"
  | "ACCEPTED"
  | "REJECTED"
  | string;

export type AgencyProposalItem = Omit<AgencyProposalRequest, "items"> & {
  proposalId: string;
  contractRequestId: string;
  vendorId: string;
  agencyId: string;
  initialUnitPrice: number;
  finalUnitPrice: number | null;
  pendingNegotiationId: string | null;
  nextSequence: number;
  items: AgencyProposalLinePriceItem[];
  status: AgencyProposalStatus;
  agency: AgencySummary | null;
  vendor: AgencyVendorSummary | null;
};

export function getAgencyOpenContractRequests({
  page = 0,
  size = 20,
  ...filters
}: {
  page?: number;
  size?: number;
} & AgencyOpenRequestFilters = {}): Promise<PageResponse<AgencyOpenContractRequestItem>> {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  appendSearchParam(searchParams, "scope", filters.scope);
  appendSearchParam(searchParams, "pickupRegion", filters.pickupRegion);
  appendSearchParam(searchParams, "name", filters.name);
  appendSearchParam(searchParams, "category", filters.category);
  appendSearchParam(searchParams, "boxSize", filters.boxSize);
  appendSearchParam(searchParams, "coldChainType", filters.coldChainType);
  appendSearchParam(
    searchParams,
    "saturdayDeliveryRequired",
    filters.saturdayDeliveryRequired,
  );
  appendSearchParam(searchParams, "returnRequired", filters.returnRequired);
  appendSearchParam(searchParams, "minTargetUnitPrice", filters.minTargetUnitPrice);
  appendSearchParam(searchParams, "maxTargetUnitPrice", filters.maxTargetUnitPrice);
  appendSearchParam(searchParams, "vendorName", filters.vendorName);

  return apiFetch(`/api/v1/contract-requests/open?${searchParams.toString()}`);
}

export function submitAgencyProposal(
  contractRequestId: string,
  request: AgencyProposalRequest,
): Promise<AgencyProposalItem> {
  return apiFetch(`/api/v1/contract-requests/${contractRequestId}/proposals`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function getAgencyContractRequest(
  contractRequestId: string,
): Promise<AgencyOpenContractRequestItem> {
  return apiFetch(`/api/v1/contract-requests/${contractRequestId}`, {
    credentials: "include",
  });
}

export function getAgencyProposals({
  page = 0,
  size = 20,
}: {
  page?: number;
  size?: number;
} = {}): Promise<PageResponse<AgencyProposalItem>> {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch(`/api/v1/proposals/me?${searchParams.toString()}`, {
    credentials: "include",
  });
}

export function updateAgencyProposal(
  proposalId: string,
  request: AgencyProposalRequest,
): Promise<AgencyProposalItem> {
  return apiFetch(`/api/v1/proposals/${proposalId}`, {
    method: "PUT",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function withdrawAgencyProposal(proposalId: string): Promise<AgencyProposalItem> {
  return apiFetch(`/api/v1/proposals/${proposalId}/withdraw`, {
    method: "POST",
    credentials: "include",
  });
}

export function getAgencyContracts({
  page = 0,
  size = 20,
}: {
  page?: number;
  size?: number;
} = {}): Promise<PageResponse<ContractListItem>> {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch(`/api/v1/contracts/agency/me?${searchParams.toString()}`, {
    credentials: "include",
  });
}

function appendSearchParam(
  searchParams: URLSearchParams,
  key: string,
  value: boolean | number | string | null | undefined,
) {
  if (value === null || value === undefined || value === "") {
    return;
  }

  searchParams.set(key, String(value));
}
