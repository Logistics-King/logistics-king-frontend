import type { ApiEnvelope } from "./types";

const DEFAULT_API_BASE_URL = "http://localhost:8080";

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
]);

let sessionRedirectStarted = false;

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

  return body.payload.response as T;
}

async function request(path: string, options: RequestInit): Promise<Response> {
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
