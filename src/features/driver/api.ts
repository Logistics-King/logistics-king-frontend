import { apiFetch } from "@/src/shared/api/client";
import type { Carrier, ColdChainType, PageResponse } from "@/src/shared/api/types";

export type DeliverContractStatus = "REQUESTED" | "ACCEPTED" | "REJECTED" | "CANCELLED";
export type DeliverEmploymentType = "AGENCY_AFFILIATED" | "FREELANCER";

export type DeliverAgencySummary = {
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

export type DeliverAgencyDetail = DeliverAgencySummary & {
  userId: string;
  businessRegistrationNumber: string | null;
  representativeName: string;
  phoneNumber: string;
  postalCode: string | null;
  address: string;
  addressDetail: string | null;
};

export type DeliverProfileRequest = {
  employmentType: DeliverEmploymentType;
  agencyId: string | null;
  driverName: string;
  phoneNumber: string;
  vehicleNumber: string;
  serviceRegions: string[];
  active: boolean;
  memo: string | null;
};

export type DeliverProfile = DeliverProfileRequest & {
  deliverId: string;
  userId: string;
  agency: DeliverAgencySummary | null;
};

export type DeliverSummary = {
  deliverId: string;
  userId: string;
  employmentType: DeliverEmploymentType;
  agencyId: string | null;
  driverName: string;
  phoneNumber: string;
  vehicleNumber: string;
  serviceRegions: string[];
  active: boolean;
  memo?: string | null;
  agency?: DeliverAgencySummary | null;
};

export type DeliverContractRequest = {
  deliverId: string;
  serviceRegion: string;
  expectedMonthlyVolume: number;
  unitPrice: number;
  startDate: string;
  endDate: string;
  memo: string | null;
};

export type DeliverContractUpdateRequest = Omit<DeliverContractRequest, "deliverId">;

export type DeliverContractItem = DeliverContractUpdateRequest & {
  deliverContractId: string;
  agencyId: string;
  deliverId: string;
  status: DeliverContractStatus;
  agency: DeliverAgencySummary | null;
  deliver: DeliverSummary | null;
};

export type AgencyDeliverFilters = {
  active?: boolean;
  serviceRegion?: string;
  driverName?: string;
  vehicleNumber?: string;
};

export type DeliverContractFilters = {
  status?: DeliverContractStatus;
  serviceRegion?: string;
  startDateFrom?: string;
  startDateTo?: string;
};

export type AgencySearchFilters = {
  agencyName?: string;
  region?: string;
  carrier?: Carrier;
  saturdayDeliveryAvailable?: boolean;
  returnAvailable?: boolean;
  scope?: "ALL" | "NEARBY";
};

export function getMyDeliverProfile(): Promise<DeliverProfile> {
  return apiFetch("/api/v1/delivers/me", {
    credentials: "include",
  });
}

export function searchAgencies({
  page = 0,
  size = 20,
  scope = "ALL",
  ...filters
}: {
  page?: number;
  size?: number;
} & AgencySearchFilters = {}): Promise<PageResponse<DeliverAgencySummary>> {
  return apiFetch(`/api/v1/agencies${toQuery(page, size, { scope, ...filters })}`, {
    credentials: "include",
  });
}

export function getAgencyDetail(agencyId: string): Promise<DeliverAgencyDetail> {
  return apiFetch(`/api/v1/agencies/${agencyId}`, {
    credentials: "include",
  });
}

export function createMyDeliverProfile(request: DeliverProfileRequest): Promise<DeliverProfile> {
  return apiFetch("/api/v1/delivers/me", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function updateMyDeliverProfile(request: DeliverProfileRequest): Promise<DeliverProfile> {
  return apiFetch("/api/v1/delivers/me", {
    method: "PUT",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function getAgencyDelivers({
  page = 0,
  size = 20,
  ...filters
}: {
  page?: number;
  size?: number;
} & AgencyDeliverFilters = {}): Promise<PageResponse<DeliverSummary>> {
  return apiFetch(`/api/v1/delivers/agency/me${toQuery(page, size, filters)}`, {
    credentials: "include",
  });
}

export function getFreelancerDelivers({
  page = 0,
  size = 20,
  ...filters
}: {
  page?: number;
  size?: number;
} & AgencyDeliverFilters = {}): Promise<PageResponse<DeliverSummary>> {
  return apiFetch(`/api/v1/delivers/freelancers${toQuery(page, size, filters)}`, {
    credentials: "include",
  });
}

export function createDeliverContract(
  request: DeliverContractRequest,
): Promise<DeliverContractItem> {
  return apiFetch("/api/v1/deliver-contracts", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function getAgencyDeliverContracts({
  page = 0,
  size = 20,
  ...filters
}: {
  page?: number;
  size?: number;
} & DeliverContractFilters = {}): Promise<PageResponse<DeliverContractItem>> {
  return apiFetch(`/api/v1/deliver-contracts/agency/me${toQuery(page, size, filters)}`, {
    credentials: "include",
  });
}

export function getDriverDeliverContracts({
  page = 0,
  size = 20,
  ...filters
}: {
  page?: number;
  size?: number;
} & DeliverContractFilters = {}): Promise<PageResponse<DeliverContractItem>> {
  return apiFetch(`/api/v1/deliver-contracts/driver/me${toQuery(page, size, filters)}`, {
    credentials: "include",
  });
}

export function updateDeliverContract(
  deliverContractId: string,
  request: DeliverContractUpdateRequest,
): Promise<DeliverContractItem> {
  return apiFetch(`/api/v1/deliver-contracts/${deliverContractId}`, {
    method: "PUT",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function acceptDeliverContract(deliverContractId: string): Promise<DeliverContractItem> {
  return apiFetch(`/api/v1/deliver-contracts/${deliverContractId}/accept`, {
    method: "POST",
    credentials: "include",
  });
}

export function rejectDeliverContract(deliverContractId: string): Promise<DeliverContractItem> {
  return apiFetch(`/api/v1/deliver-contracts/${deliverContractId}/reject`, {
    method: "POST",
    credentials: "include",
  });
}

export function cancelDeliverContract(deliverContractId: string): Promise<DeliverContractItem> {
  return apiFetch(`/api/v1/deliver-contracts/${deliverContractId}/cancel`, {
    method: "POST",
    credentials: "include",
  });
}

function toQuery(
  page: number,
  size: number,
  filters: Record<string, boolean | string | undefined> = {},
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
