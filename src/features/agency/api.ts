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
