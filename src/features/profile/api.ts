import { apiFetch } from "@/src/shared/api/client";
import type { Carrier, ColdChainType } from "@/src/shared/api/types";

export type VendorProfileRequest = {
  businessName: string;
  businessRegistrationNumber: string | null;
  representativeName: string;
  phoneNumber: string;
  postalCode: string | null;
  address: string;
  addressDetail: string | null;
  mainRegion: string;
};

export type VendorProfile = VendorProfileRequest & {
  vendorId: string;
  userId: string;
};

export type AgencyProfileRequest = {
  carrier: Carrier;
  agencyName: string;
  businessRegistrationNumber: string | null;
  representativeName: string;
  phoneNumber: string;
  postalCode: string | null;
  address: string;
  addressDetail: string | null;
  mainRegion: string;
  serviceRegions: string[];
  weekdayPickupStartTime: string | null;
  weekdayPickupEndTime: string | null;
  saturdayPickupAvailable: boolean;
  saturdayDeliveryAvailable: boolean;
  returnAvailable: boolean;
  coldChainType: ColdChainType;
  maxMonthlyVolume: number | null;
};

export type AgencyProfile = AgencyProfileRequest & {
  agencyId: string;
  userId: string;
};

export function createVendorProfile(
  request: VendorProfileRequest,
): Promise<VendorProfile> {
  return apiFetch("/api/v1/vendors/me", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function getVendorProfile(): Promise<VendorProfile> {
  return apiFetch("/api/v1/vendors/me", {
    credentials: "include",
  });
}

export function createAgencyProfile(
  request: AgencyProfileRequest,
): Promise<AgencyProfile> {
  return apiFetch("/api/v1/agencies/me", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function getAgencyProfile(): Promise<AgencyProfile> {
  return apiFetch("/api/v1/agencies/me", {
    credentials: "include",
  });
}

export function updateAgencyProfile(
  request: AgencyProfileRequest,
): Promise<AgencyProfile> {
  return apiFetch("/api/v1/agencies/me", {
    method: "PUT",
    credentials: "include",
    body: JSON.stringify(request),
  });
}
