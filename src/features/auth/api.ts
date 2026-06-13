import { apiFetch } from "@/src/shared/api/client";
import type {
  AuthUser,
  LogoutResponse,
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
  PasswordResetRequest,
  RecoverLoginIdRequest,
  RecoveryAcceptedResponse,
  SignInRequest,
  SignUpRequest,
} from "./types";

export function signUpVendor(request: SignUpRequest): Promise<AuthUser> {
  return apiFetch("/api/v1/auth/sign-up/vendor", {
    method: "POST",
    credentials: "omit",
    body: JSON.stringify(request),
  });
}

export function signUpAgency(request: SignUpRequest): Promise<AuthUser> {
  return apiFetch("/api/v1/auth/sign-up/agency", {
    method: "POST",
    credentials: "omit",
    body: JSON.stringify(request),
  });
}

export function signUpDriver(request: SignUpRequest): Promise<AuthUser> {
  return apiFetch("/api/v1/auth/sign-up/driver", {
    method: "POST",
    credentials: "omit",
    body: JSON.stringify(request),
  });
}

export function signIn(request: SignInRequest): Promise<AuthUser> {
  return apiFetch("/api/v1/auth/sign-in", {
    method: "POST",
    credentials: "include",
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

export function recoverLoginId(
  request: RecoverLoginIdRequest,
): Promise<RecoveryAcceptedResponse> {
  return apiFetch("/api/v1/auth/recovery/login-id", {
    method: "POST",
    credentials: "omit",
    body: JSON.stringify(request),
  });
}

export function requestPasswordReset(
  request: PasswordResetRequest,
): Promise<RecoveryAcceptedResponse> {
  return apiFetch("/api/v1/auth/password-reset/request", {
    method: "POST",
    credentials: "omit",
    body: JSON.stringify(request),
  });
}

export function confirmPasswordReset(
  request: PasswordResetConfirmRequest,
): Promise<PasswordResetConfirmResponse> {
  return apiFetch("/api/v1/auth/password-reset/confirm", {
    method: "POST",
    credentials: "omit",
    body: JSON.stringify(request),
  });
}
