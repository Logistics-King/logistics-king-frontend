import { apiFetch } from "@/src/shared/api/client";
import type { DeliverProfile } from "@/src/features/driver/api";

export type DriverWorkStatus = "OPEN" | "ASSIGNED" | "CANCELLED" | "COMPLETED";

export type DriverWorkApplicationStatus = "APPLIED" | "WITHDRAWN" | "SELECTED" | "REJECTED";

export type DriverWorkRequest = {
  contractId: string;
  title: string;
  serviceRegion: string;
  pickupStartDate: string;
  pickupEndDate: string | null;
  expectedVolume: number;
  unitPrice: number;
  assignedDeliverId: string | null;
  memo: string | null;
};

export type DriverWorkDetail = DriverWorkRequest & {
  driverWorkId: string;
  agencyId: string;
  assignedDeliver: DeliverProfile | null;
  status: DriverWorkStatus;
};

export type DriverWorkPageResponse = {
  contents: DriverWorkDetail[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type DriverWorkFilters = {
  status?: DriverWorkStatus;
  serviceRegion?: string;
  pickupStartDateFrom?: string;
  pickupStartDateTo?: string;
};

export type DriverWorkApplication = {
  applicationId: string;
  driverWorkId: string;
  deliverId: string;
  status: DriverWorkApplicationStatus;
  memo: string | null;
  deliver: DeliverProfile | null;
  driverWork: DriverWorkDetail | null;
};

export type DriverWorkApplicationPageResponse = {
  contents: DriverWorkApplication[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export function createDriverWork(request: DriverWorkRequest): Promise<DriverWorkDetail> {
  return apiFetch("/api/v1/driver-works", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function getAgencyDriverWorks({
  page = 0,
  size = 20,
  ...filters
}: {
  page?: number;
  size?: number;
} & DriverWorkFilters = {}): Promise<DriverWorkPageResponse> {
  return apiFetch(`/api/v1/driver-works/agency/me${toQuery(page, size, filters)}`, {
    credentials: "include",
  });
}

export function getDriverOpenWorks({
  page = 0,
  size = 20,
  ...filters
}: {
  page?: number;
  size?: number;
} & Omit<DriverWorkFilters, "status"> = {}): Promise<DriverWorkPageResponse> {
  return apiFetch(`/api/v1/driver-works/driver/me/open${toQuery(page, size, filters)}`, {
    credentials: "include",
  });
}

export function getDriverAssignedWorks({
  page = 0,
  size = 20,
  ...filters
}: {
  page?: number;
  size?: number;
} & DriverWorkFilters = {}): Promise<DriverWorkPageResponse> {
  return apiFetch(`/api/v1/driver-works/driver/me/assigned${toQuery(page, size, filters)}`, {
    credentials: "include",
  });
}

export function getMyDriverWorkApplications({
  page = 0,
  size = 20,
}: {
  page?: number;
  size?: number;
} = {}): Promise<DriverWorkApplicationPageResponse> {
  return apiFetch(`/api/v1/driver-works/driver/me/applications${toQuery(page, size)}`, {
    credentials: "include",
  });
}

export function getDriverWorkApplications(
  driverWorkId: string,
  {
    page = 0,
    size = 20,
  }: {
    page?: number;
    size?: number;
  } = {},
): Promise<DriverWorkApplicationPageResponse> {
  return apiFetch(`/api/v1/driver-works/${driverWorkId}/applications${toQuery(page, size)}`, {
    credentials: "include",
  });
}

export function applyDriverWork(
  driverWorkId: string,
  memo: string | null,
): Promise<DriverWorkApplication> {
  return apiFetch(`/api/v1/driver-works/${driverWorkId}/applications`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ memo }),
  });
}

export function withdrawMyDriverWorkApplication(
  driverWorkId: string,
): Promise<DriverWorkApplication> {
  return apiFetch(`/api/v1/driver-works/${driverWorkId}/applications/me`, {
    method: "DELETE",
    credentials: "include",
  });
}

export function selectDriverWorkApplication(
  driverWorkId: string,
  applicationId: string,
): Promise<DriverWorkDetail> {
  return apiFetch(`/api/v1/driver-works/${driverWorkId}/applications/${applicationId}/select`, {
    method: "POST",
    credentials: "include",
  });
}

export function assignDriverWork(
  driverWorkId: string,
  deliverId: string,
): Promise<DriverWorkDetail> {
  return apiFetch(`/api/v1/driver-works/${driverWorkId}/assign`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({ deliverId }),
  });
}

export function cancelDriverWork(driverWorkId: string): Promise<DriverWorkDetail> {
  return apiFetch(`/api/v1/driver-works/${driverWorkId}/cancel`, {
    method: "POST",
    credentials: "include",
  });
}

export function completeDriverWork(driverWorkId: string): Promise<DriverWorkDetail> {
  return apiFetch(`/api/v1/driver-works/${driverWorkId}/complete`, {
    method: "POST",
    credentials: "include",
  });
}

function toQuery(
  page: number,
  size: number,
  filters: Record<string, string | undefined> = {},
): string {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  return `?${searchParams.toString()}`;
}
