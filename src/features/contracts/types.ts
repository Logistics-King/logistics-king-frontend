import type { BoxSize, ColdChainType, ProductCategory } from "@/src/shared/api/types";

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
};
