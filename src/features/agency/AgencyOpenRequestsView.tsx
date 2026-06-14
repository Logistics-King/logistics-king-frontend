"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/src/shared/api/client";
import type { BoxSize, ColdChainType, PageResponse, ProductCategory } from "@/src/shared/api/types";
import { ProfileRequiredNotice } from "@/src/shared/profile/ProfileRequiredNotice";
import {
  getAgencyVendorProducts,
  type AgencySearchScope,
  type AgencyVendorProductItem,
  type AgencyVendorSummary,
} from "./api";

type ProductFilterState = {
  scope: AgencySearchScope;
  name: string;
  category: ProductCategory | "";
  boxSize: BoxSize | "";
  coldChainType: ColdChainType | "";
};

const pageSize = 10;

const initialFilterState: ProductFilterState = {
  scope: "ALL",
  name: "",
  category: "",
  boxSize: "",
  coldChainType: "",
};

const productCategoryOptions: Array<{ value: ProductCategory; label: string }> = [
  { value: "CLOTHING", label: "의류" },
  { value: "GENERAL_GOODS", label: "생활용품" },
  { value: "FOOD", label: "식품" },
  { value: "ELECTRONICS", label: "전자제품" },
  { value: "DOCUMENT", label: "문서" },
  { value: "COSMETIC", label: "화장품" },
  { value: "ETC", label: "기타" },
];

const boxSizeOptions: Array<{ value: BoxSize; label: string }> = [
  { value: "SIZE_60", label: "60사이즈" },
  { value: "SIZE_80", label: "80사이즈" },
  { value: "SIZE_100", label: "100사이즈" },
  { value: "SIZE_120", label: "120사이즈" },
  { value: "SIZE_140", label: "140사이즈" },
  { value: "SIZE_160", label: "160사이즈" },
  { value: "CUSTOM", label: "기타" },
];

const coldChainOptions: Array<{ value: ColdChainType; label: string }> = [
  { value: "NONE", label: "일반" },
  { value: "REFRIGERATED", label: "냉장" },
  { value: "FROZEN", label: "냉동" },
];

const scopeOptions: Array<{ value: AgencySearchScope; label: string }> = [
  { value: "ALL", label: "전체보기" },
  { value: "NEARBY", label: "인근 일감" },
];

const productCategoryLabels: Record<ProductCategory, string> = {
  CLOTHING: "의류",
  GENERAL_GOODS: "생활용품",
  FOOD: "식품",
  ELECTRONICS: "전자제품",
  DOCUMENT: "문서",
  COSMETIC: "화장품",
  ETC: "기타",
};

const boxSizeLabels: Record<BoxSize, string> = {
  SIZE_60: "60사이즈",
  SIZE_80: "80사이즈",
  SIZE_100: "100사이즈",
  SIZE_120: "120사이즈",
  SIZE_140: "140사이즈",
  SIZE_160: "160사이즈",
  CUSTOM: "기타",
};

const coldChainTypeLabels: Record<ColdChainType, string> = {
  NONE: "일반",
  REFRIGERATED: "냉장",
  FROZEN: "냉동",
};

// 대리점의 "일감 조회" 화면입니다.
// 현재는 계약 요청 목록이 아니라, 화주들이 등록한 배송 품목 공개 목록을 조회합니다.
// scope=ALL이면 전체, scope=NEARBY이면 대리점 담당 지역 기준 인근 일감만 조회합니다.
export function AgencyOpenRequestsView() {
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<ProductFilterState>(initialFilterState);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilterState>(initialFilterState);
  const [pageResponse, setPageResponse] =
    useState<PageResponse<AgencyVendorProductItem> | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [needsAgencyProfile, setNeedsAgencyProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<AgencyVendorSummary | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchProducts() {
      setIsLoading(true);
      setErrorMessage("");
      setNeedsAgencyProfile(false);

      try {
        // getAgencyVendorProducts는 GET /api/v1/vendors/products를 호출합니다.
        // 백엔드가 role=AGENCY인지 확인하므로 credentials 쿠키가 필요합니다.
        const response = await getAgencyVendorProducts({
          page,
          size: pageSize,
          ...toProductFilterQuery(appliedFilters),
        });

        if (active) {
          setPageResponse(response);
        }
      } catch (error) {
        if (active) {
          setNeedsAgencyProfile(isAgencyProfileMissing(error));
          setErrorMessage(getErrorMessage(error));
          setPageResponse(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      active = false;
    };
  }, [appliedFilters, page]);

  function handleSearch() {
    setPage(0);
    setAppliedFilters(filters);
  }

  function handleReset() {
    setPage(0);
    setFilters(initialFilterState);
    setAppliedFilters(initialFilterState);
  }

  function handleScopeChange(scope: AgencySearchScope) {
    const nextFilters = { ...filters, scope };

    // 전체/인근 토글은 조회 버튼 없이 즉시 반영합니다.
    setPage(0);
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">일감 조회</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              전체 배송 품목과 대리점 담당 지역에 맞는 인근 일감을 나눠 확인합니다.
            </p>
          </div>
          <p className="rounded-md bg-[#071f46]/10 px-3 py-2 text-sm font-bold text-[#071f46]">
            전체 {formatNumber(pageResponse?.totalElements ?? 0)}건
          </p>
        </div>

        <div className="mt-5 inline-grid grid-cols-2 rounded-md border border-slate-200 bg-slate-50 p-1">
          {scopeOptions.map((option) => {
            const active = filters.scope === option.value;

            return (
              <button
                className={`h-10 rounded px-4 text-sm font-bold transition ${
                  active
                    ? "bg-[#071f46] text-white shadow-sm"
                    : "text-slate-500 hover:bg-white hover:text-slate-900"
                }`}
                key={option.value}
                onClick={() => handleScopeChange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(180px,1fr)_180px_180px_180px_auto_auto]">
          <input
            className={inputClassName}
            placeholder="품목명 검색"
            type="search"
            value={filters.name}
            onChange={(event) => setFilters({ ...filters, name: event.target.value })}
          />
          <select
            className={inputClassName}
            value={filters.category}
            onChange={(event) =>
              setFilters({ ...filters, category: event.target.value as ProductCategory | "" })
            }
          >
            <option value="">카테고리 전체</option>
            {productCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={inputClassName}
            value={filters.boxSize}
            onChange={(event) =>
              setFilters({ ...filters, boxSize: event.target.value as BoxSize | "" })
            }
          >
            <option value="">박스 전체</option>
            {boxSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={inputClassName}
            value={filters.coldChainType}
            onChange={(event) =>
              setFilters({ ...filters, coldChainType: event.target.value as ColdChainType | "" })
            }
          >
            <option value="">온도 전체</option>
            {coldChainOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            className="h-11 rounded-md bg-[#071f46] px-4 text-sm font-bold text-white transition hover:bg-[#0a2d63]"
            onClick={handleSearch}
            type="button"
          >
            조회
          </button>
          <button
            className="h-11 rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:border-slate-500"
            onClick={handleReset}
            type="button"
          >
            초기화
          </button>
        </div>
      </div>

      {needsAgencyProfile ? <ProfileRequiredNotice role="AGENCY" /> : null}

      {errorMessage && !needsAgencyProfile ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="grid gap-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="h-32 rounded-md bg-slate-100" key={index} />
            ))}
          </div>
        ) : pageResponse && pageResponse.items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {pageResponse.items.map((product) => (
              <article className="grid gap-4 px-5 py-5" key={product.productId}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-950">{product.name}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                        {productCategoryLabels[product.category]}
                      </span>
                      <span className="rounded-full bg-[#071f46]/10 px-2 py-1 text-xs font-bold text-[#071f46]">
                        {coldChainTypeLabels[product.coldChainType]}
                      </span>
                    </div>
                    <VendorNameLink product={product} onClick={setSelectedVendor} />
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {formatProductAddress(product)}
                    </p>
                  </div>
                  <button
                    className="h-10 rounded-md bg-slate-200 px-4 text-sm font-bold text-slate-500"
                    disabled
                    type="button"
                  >
                    계약 요청 준비중
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <InfoItem label="화주 지역" value={formatVendorRegion(product)} />
                  <InfoItem label="화주 연락처" value={formatVendorPhone(product)} />
                  <InfoItem label="평균 상품 가격" value={formatCurrency(product.averagePrice)} />
                  <InfoItem label="평균 무게" value={formatWeight(product.averageWeightGram)} />
                </div>

                <div className="grid gap-3 md:grid-cols-1">
                  <InfoItem label="박스 크기" value={formatBoxSize(product.boxSize)} />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <InfoItem label="박스 수량" value={formatQuantity(product.boxQuantity)} />
                  <InfoItem label="낱개 수량" value={formatQuantity(product.itemQuantity)} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Flag active={product.fragile} label="파손 주의" />
                  <Flag active={product.liquid} label="액체" />
                  <Flag active={product.freshFood} label="신선식품" />
                </div>

                {product.description ? (
                  <p className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                    {product.description}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-slate-500">조회 가능한 배송 품목이 없습니다.</p>
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

      {selectedVendor ? (
        <VendorDetailModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />
      ) : null}
    </section>
  );
}

function VendorNameLink({
  product,
  onClick,
}: {
  product: AgencyVendorProductItem;
  onClick: (vendor: AgencyVendorSummary) => void;
}) {
  if (!product.vendor) {
    return <p className="mt-2 text-sm font-semibold text-slate-500">화주 정보 미제공</p>;
  }

  return (
    <button
      className="mt-2 text-left text-sm font-bold text-[#071f46] underline decoration-[#071f46]/30 underline-offset-4 transition hover:text-[#0a2d63] hover:decoration-[#0a2d63]"
      onClick={() => onClick(product.vendor as AgencyVendorSummary)}
      type="button"
    >
      {product.vendor.businessName}
    </button>
  );
}

function VendorDetailModal({
  vendor,
  onClose,
}: {
  vendor: AgencyVendorSummary;
  onClose: () => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-lg bg-white shadow-[0_24px_80px_rgba(15,23,42,0.32)]">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-bold text-[#071f46]">화주 정보</p>
            <h3 className="mt-1 text-xl font-bold text-slate-950">{vendor.businessName}</h3>
          </div>
          <button
            className="h-9 rounded-md border border-slate-300 px-3 text-sm font-bold text-slate-600 transition hover:border-[#071f46] hover:text-[#071f46]"
            onClick={onClose}
            type="button"
          >
            닫기
          </button>
        </div>

        <div className="grid gap-3 px-5 py-5 sm:grid-cols-2">
          <InfoItem label="대표자명" value={vendor.representativeName} />
          <InfoItem label="연락처" value={vendor.phoneNumber} />
          <InfoItem label="사업자등록번호" value={vendor.businessRegistrationNumber ?? "-"} />
          <InfoItem label="주 발송 지역" value={vendor.mainRegion} />
          <InfoItem label="우편번호" value={vendor.postalCode ?? "-"} />
          <InfoItem label="사업장 주소" value={formatVendorAddress(vendor)} />
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Flag({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex h-8 items-center justify-center rounded-md border px-2 text-xs font-bold ${
        active
          ? "border-[#071f46] bg-[#071f46] text-white"
          : "border-slate-200 bg-slate-50 text-slate-400"
      }`}
    >
      {label}
    </span>
  );
}

function toProductFilterQuery(filters: ProductFilterState) {
  // 빈 문자열은 query param에서 제외해서 백엔드 기본값을 쓰게 합니다.
  return {
    scope: filters.scope,
    name: blankToUndefined(filters.name),
    category: filters.category || undefined,
    boxSize: filters.boxSize || undefined,
    coldChainType: filters.coldChainType || undefined,
  };
}

function blankToUndefined(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

function formatCurrency(value: number | null): string {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}원`;
}

function formatWeight(value: number | null): string {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}g`;
}

function formatBoxSize(value: BoxSize | null): string {
  return value ? boxSizeLabels[value] : "-";
}

function formatQuantity(value: number): string {
  return `${value.toLocaleString("ko-KR")}개`;
}

function formatVendorRegion(product: AgencyVendorProductItem): string {
  return product.vendor?.mainRegion ?? "-";
}

function formatVendorPhone(product: AgencyVendorProductItem): string {
  return product.vendor?.phoneNumber ?? "-";
}

function formatVendorAddress(vendor: AgencyVendorSummary): string {
  const detail = vendor.addressDetail ? ` ${vendor.addressDetail}` : "";

  return `${vendor.address}${detail}`;
}

function formatProductAddress(product: AgencyVendorProductItem): string {
  const postalCode = product.destinationPostalCode
    ? `(${product.destinationPostalCode}) `
    : "";
  const detail = product.destinationAddressDetail ? ` ${product.destinationAddressDetail}` : "";

  return `${postalCode}${product.destinationAddress}${detail}`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "일감을 불러오지 못했습니다.";
}

function isAgencyProfileMissing(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === "AGENCY_NOT_FOUND" || error.code === "VENDOR_AGENCY_NOT_FOUND")
  );
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#071f46] focus:ring-3 focus:ring-[#071f46]/10";
