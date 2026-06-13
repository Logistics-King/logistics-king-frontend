"use client";

import { useEffect, useState } from "react";
import type { PageResponse } from "@/src/shared/api/types";
import {
  getVendorContractRequests,
  getVendorContracts,
  getVendorProducts,
} from "./api";

type FieldDescriptor = {
  label: string;
  keys: string[];
  format?: "currency";
};

type VendorListViewProps = {
  resource: VendorListResource;
  title: string;
  description: string;
  emptyMessage: string;
  fields: FieldDescriptor[];
  filterPlaceholder?: string;
};

type VendorListResource = "products" | "contractRequests" | "contracts";

const pageSize = 10;

export function VendorListView({
  resource,
  title,
  description,
  emptyMessage,
  fields,
  filterPlaceholder = "이름, 상태, 지역으로 검색",
}: VendorListViewProps) {
  const [page, setPage] = useState(0);
  const [pageResponse, setPageResponse] = useState<PageResponse<Record<string, unknown>> | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchPage() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await loadVendorPage(resource, { page, size: pageSize });

        if (active) {
          setPageResponse(response);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error));
          setPageResponse(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchPage();

    return () => {
      active = false;
    };
  }, [page, resource]);

  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-[220px_140px]">
            <input
              className="h-11 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-950 outline-none transition focus:border-[#071f46] focus:ring-3 focus:ring-[#071f46]/10"
              placeholder={filterPlaceholder}
              type="search"
              disabled
            />
            <select
              className="h-11 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-500 outline-none"
              disabled
              defaultValue=""
            >
              <option value="">상태 전체</option>
            </select>
          </div>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-700">
            전체 {formatNumber(pageResponse?.totalElements ?? 0)}건
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="h-20 rounded-md bg-slate-100" key={index} />
            ))}
          </div>
        ) : pageResponse && pageResponse.items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {pageResponse.items.map((item, index) => (
              <article className="grid gap-3 px-5 py-4 lg:grid-cols-4" key={getItemKey(item, index)}>
                {fields.map((field) => (
                  <div key={field.label}>
                    <p className="text-xs font-bold text-slate-400">{field.label}</p>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                      {formatValue(readField(item, field.keys), field.format)}
                    </p>
                  </div>
                ))}
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-slate-500">{emptyMessage}</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">
            {formatNumber((pageResponse?.page ?? page) + 1)} /{" "}
            {formatNumber(Math.max(pageResponse?.totalPages ?? 1, 1))}
          </p>
          <div className="flex gap-2">
            <button
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:text-slate-300"
              disabled={!pageResponse?.hasPrevious || isLoading}
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              type="button"
            >
              이전
            </button>
            <button
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:text-slate-300"
              disabled={!pageResponse?.hasNext || isLoading}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function readField(item: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (item[key] !== undefined && item[key] !== null) {
      return item[key];
    }
  }

  return null;
}

function loadVendorPage(
  resource: VendorListResource,
  query: { page: number; size: number },
): Promise<PageResponse<Record<string, unknown>>> {
  const loaders = {
    products: getVendorProducts,
    contractRequests: getVendorContractRequests,
    contracts: getVendorContracts,
  };

  return loaders[resource](query);
}

function formatValue(value: unknown, format?: FieldDescriptor["format"]): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (format === "currency" && typeof value === "number") {
    return `${value.toLocaleString("ko-KR")}원`;
  }

  if (typeof value === "number") {
    return value.toLocaleString("ko-KR");
  }

  if (typeof value === "boolean") {
    return value ? "예" : "아니오";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

function getItemKey(item: Record<string, unknown>, index: number): string {
  const id =
    item.id ??
    item.productId ??
    item.contractRequestId ??
    item.contractId ??
    item.proposalId;

  return id ? String(id) : String(index);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "목록을 불러오지 못했습니다.";
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}
