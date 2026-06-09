import { apiFetch } from "@/src/shared/api/client";
import type {
  AuthUser,
  LogoutResponse,
  SignInRequest,
  SignUpRequest,
} from "./types";

export function signUpVendor(request: SignUpRequest): Promise<AuthUser> {
  return apiFetch("/api/v1/auth/sign-up/vendor", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function signUpAgency(request: SignUpRequest): Promise<AuthUser> {
  return apiFetch("/api/v1/auth/sign-up/agency", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function signUpDriver(request: SignUpRequest): Promise<AuthUser> {
  return apiFetch("/api/v1/auth/sign-up/driver", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function signIn(request: SignInRequest): Promise<AuthUser> {
  return apiFetch("/api/v1/auth/sign-in", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export function refreshAuth(): Promise<AuthUser> {
  return apiFetch("/api/v1/auth/refresh", {
    method: "POST",
  });
}

export function logout(): Promise<LogoutResponse> {
  return apiFetch("/api/v1/auth/logout", {
    method: "POST",
  });
}
