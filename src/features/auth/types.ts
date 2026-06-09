import type { UserRole } from "@/src/shared/api/types";

export type AuthUser = {
  userId: string;
  role: UserRole;
};

export type SignUpRequest = {
  loginId: string;
  email: string;
  password: string;
  name: string;
};

export type SignInRequest = {
  loginId: string;
  password: string;
};

export type LogoutResponse = {
  loggedOut: boolean;
};
