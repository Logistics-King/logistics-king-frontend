import { apiFetch } from "@/src/shared/api/client";
import type { ColdChainType, PageResponse, ProductCategory } from "@/src/shared/api/types";

export type ListQuery = {
  page?: number;
  size?: number;
};

export type VendorProductRequest = {
  category: ProductCategory;
  name: string;
  description: string | null;
  averagePrice: number | null;
  averageWeightGram: number | null;
  boxSize: string | null;
  fragile: boolean;
  liquid: boolean;
  freshFood: boolean;
  coldChainType: ColdChainType;
};

export type VendorProductItem = VendorProductRequest & {
  productId: string;
  vendorId: string;
};

export type VendorContractRequestItem = Record<string, unknown>;
export type VendorContractItem = Record<string, unknown>;

export function getVendorProducts({
  page = 0,
  size = 20,
}: ListQuery = {}): Promise<PageResponse<VendorProductItem>> {
  return apiFetch(`/api/v1/vendors/me/products${toPageQuery(page, size)}`, {
    credentials: "include",
  });
}

export function createVendorProduct(
  request: VendorProductRequest,
): Promise<VendorProductItem> {
  return apiFetch("/api/v1/vendors/me/products", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function updateVendorProduct(
  productId: string,
  request: VendorProductRequest,
): Promise<VendorProductItem> {
  return apiFetch(`/api/v1/vendors/me/products/${productId}`, {
    method: "PUT",
    credentials: "include",
    body: JSON.stringify(request),
  });
}

export function getVendorContractRequests({
  page = 0,
  size = 20,
}: ListQuery = {}): Promise<PageResponse<VendorContractRequestItem>> {
  return apiFetch(`/api/v1/contract-requests${toPageQuery(page, size)}`);
}

export function getVendorContracts({
  page = 0,
  size = 20,
}: ListQuery = {}): Promise<PageResponse<VendorContractItem>> {
  return apiFetch(`/api/v1/contracts/vendor/me${toPageQuery(page, size)}`);
}

function toPageQuery(page: number, size: number): string {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return `?${searchParams.toString()}`;
}
