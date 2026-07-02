import type { DeliverEmploymentType } from "@/src/features/driver/api";
import type { Carrier, ColdChainType, UserRole } from "@/src/shared/api/types";

export type AuthUser = {
  userId: string;
  loginId?: string;
  email?: string;
  role: UserRole;
};

export type SignUpRequest = {
  loginId: string;
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  businessName?: string;
  businessRegistrationNumber?: string | null;
  representativeName?: string;
  phoneNumber?: string;
  postalCode?: string | null;
  address?: string;
  addressDetail?: string | null;
  mainRegion?: string;
  carrier?: Carrier;
  agencyName?: string;
  weekdayPickupStartTime?: string | null;
  weekdayPickupEndTime?: string | null;
  saturdayPickupAvailable?: boolean;
  saturdayDeliveryAvailable?: boolean;
  returnAvailable?: boolean;
  supportedColdChainTypes?: ColdChainType[];
  maxMonthlyVolume?: number | null;
  employmentType?: DeliverEmploymentType;
  agencyId?: string | null;
  driverName?: string;
  vehicleNumber?: string | null;
  serviceRegions?: string[];
  active?: boolean;
  memo?: string | null;
};

export type SignInRequest = {
  loginId: string;
  password: string;
};

export type RecoverLoginIdRequest = {
  name: string;
  email: string;
};

export type PasswordResetRequest = {
  loginId: string;
  email: string;
};

export type PasswordResetConfirmRequest = {
  token: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type RecoveryAcceptedResponse = {
  accepted: boolean;
  message: string;
};

export type PasswordResetConfirmResponse = {
  reset: boolean;
};

export type LogoutResponse = {
  loggedOut: boolean;
};
