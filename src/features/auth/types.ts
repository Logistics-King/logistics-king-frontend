import type { UserRole } from "@/src/shared/api/types";

export type AuthUser = {
  userId: string;
  role: UserRole;
};

export type SignUpRequest = {
  loginId: string;
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
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
