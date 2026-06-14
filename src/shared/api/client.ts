import type { ApiEnvelope } from "./types";

const DEFAULT_API_BASE_URL = "http://localhost:8080";

// 프론트에서 백엔드를 호출할 때 쓰는 기본 주소입니다.
// 운영/배포 환경에서는 NEXT_PUBLIC_API_BASE_URL 환경변수로 바꿀 수 있습니다.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL;

type ApiFetchConfig = {
  retryOnUnauthorized?: boolean;
  redirectOnUnauthorized?: boolean;
};

const AUTH_ENTRY_PATHS = new Set([
  "/api/v1/auth/sign-in",
  "/api/v1/auth/sign-up/vendor",
  "/api/v1/auth/sign-up/agency",
  "/api/v1/auth/sign-up/driver",
  "/api/v1/auth/refresh",
  "/api/v1/auth/recovery/login-id",
  "/api/v1/auth/password-reset/request",
  "/api/v1/auth/password-reset/confirm",
]);

let sessionRedirectStarted = false;

// fetch는 실패해도 Error를 자동으로 던지지 않습니다.
// 그래서 백엔드 응답 코드를 화면에서 다루기 쉽게 ApiError로 감싸서 던집니다.
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  config: ApiFetchConfig = {},
): Promise<T> {
  const { retryOnUnauthorized = true, redirectOnUnauthorized = true } = config;
  const response = await request(path, options);
  const body = await parseJson<ApiEnvelope<T>>(response);

  // accessToken은 HttpOnly 쿠키라 JS에서 직접 읽지 않습니다.
  // 401이 오면 refresh API를 한 번 호출해 쿠키를 갱신하고, 원래 요청을 재시도합니다.
  if (response.status === 401 && shouldRefreshAuth(path, retryOnUnauthorized)) {
    try {
      await apiFetch("/api/v1/auth/refresh", { method: "POST" }, { retryOnUnauthorized: false });
      return apiFetch<T>(path, options, { retryOnUnauthorized: false });
    } catch {
      redirectToHomeOnUnauthorized(path, redirectOnUnauthorized);
      throw toApiError(response, body);
    }
  }

  if (response.status === 401) {
    redirectToHomeOnUnauthorized(path, redirectOnUnauthorized);
  }

  if (!response.ok || body?.payload?.code !== "SUCCESS") {
    throw toApiError(response, body);
  }

  // 백엔드는 항상 { payload: { response } } 형태로 감싸서 내려줍니다.
  // 화면에서는 실제 데이터만 쓰기 편하게 payload.response만 반환합니다.
  return body.payload.response as T;
}

async function request(path: string, options: RequestInit): Promise<Response> {
  // credentials: "include"가 있어야 HttpOnly 인증 쿠키가 백엔드로 같이 전송됩니다.
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: options.credentials ?? "include",
    headers: buildHeaders(options),
  });
}

function buildHeaders(options: RequestInit): HeadersInit {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

function shouldRefreshAuth(path: string, retryOnUnauthorized: boolean): boolean {
  return retryOnUnauthorized && !AUTH_ENTRY_PATHS.has(path);
}

function redirectToHomeOnUnauthorized(
  path: string,
  redirectOnUnauthorized: boolean,
) {
  // 로그인 시간이 지나 권한이 풀리면 보호 페이지에 머물지 않고 첫 화면으로 돌려보냅니다.
  if (!redirectOnUnauthorized || AUTH_ENTRY_PATHS.has(path) || sessionRedirectStarted) {
    return;
  }

  if (typeof window === "undefined") {
    return;
  }

  sessionRedirectStarted = true;
  window.location.replace("/");
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function toApiError<T>(
  response: Response,
  body: ApiEnvelope<T> | null,
): ApiError {
  const payload = body?.payload;
  const message =
    payload?.errorMessage ??
    (response.status === 403 ? "권한이 없습니다." : "API request failed");

  return new ApiError(message, response.status, payload?.code);
}
