import type { BoxSize, ColdChainType, ProductCategory } from "@/src/shared/api/types";

export type ContractVendorSummary = {
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

export type ContractAgencySummary = {
  agencyId: string;
  carrier: string;
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

export type ContractListItem = {
  contractId: string;
  contractRequestId: string;
  proposalId: string;
  vendorId: string;
  agencyId: string;
  pickupRegion: string;
  pickupAddress: string;
  monthlyVolume: number;
  productCategory: ProductCategory;
  productName: string;
  boxSize: BoxSize;
  unitPrice: number;
  pickupStartTime: string | null;
  pickupEndTime: string | null;
  saturdayDeliveryAvailable: boolean;
  returnAvailable: boolean;
  coldChainType: ColdChainType;
  memo: string | null;
  status: "ACTIVE" | string;
  vendor: ContractVendorSummary | null;
  agency: ContractAgencySummary | null;
};
