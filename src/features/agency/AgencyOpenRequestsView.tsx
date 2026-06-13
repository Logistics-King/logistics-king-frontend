"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/src/shared/api/client";
import type { BoxSize, ColdChainType, PageResponse, ProductCategory } from "@/src/shared/api/types";
import { ProfileRequiredNotice } from "@/src/shared/profile/ProfileRequiredNotice";
import { getAgencyOpenContractRequests, type AgencyOpenContractRequestItem } from "./api";

const pageSize = 10;

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

export function AgencyOpenRequestsView() {
  const [page, setPage] = useState(0);
  const [pageResponse, setPageResponse] =
    useState<PageResponse<AgencyOpenContractRequestItem> | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [needsAgencyProfile, setNeedsAgencyProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchOpenRequests() {
      setIsLoading(true);
      setErrorMessage("");
      setNeedsAgencyProfile(false);

      try {
        const response = await getAgencyOpenContractRequests({ page, size: pageSize });

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

    fetchOpenRequests();

    return () => {
      active = false;
    };
  }, [page]);

  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">일감 조회</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              화주가 공개한 계약 요청을 확인하고 제안할 일감을 고릅니다.
            </p>
          </div>
          <p className="rounded-md bg-[#071f46]/10 px-3 py-2 text-sm font-bold text-[#071f46]">
            전체 {formatNumber(pageResponse?.totalElements ?? 0)}건
          </p>
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
            {pageResponse.items.map((item) => (
              <article className="grid gap-4 px-5 py-5" key={item.contractRequestId}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-950">{item.productName}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                        {productCategoryLabels[item.productCategory]}
                      </span>
                      <span className="rounded-full bg-[#071f46]/10 px-2 py-1 text-xs font-bold text-[#071f46]">
                        {coldChainTypeLabels[item.coldChainType]}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.pickupRegion}</p>
                  </div>
                  <button
                    className="h-10 rounded-md bg-slate-200 px-4 text-sm font-bold text-slate-500"
                    disabled
                    type="button"
                  >
                    제안 준비중
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <InfoItem label="월 물량" value={`${formatNumber(item.monthlyVolume)}건`} />
                  <InfoItem label="희망 단가" value={formatCurrency(item.targetUnitPrice)} />
                  <InfoItem label="박스 크기" value={boxSizeLabels[item.boxSize]} />
                  <InfoItem label="집하 시간" value={formatPickupTime(item)} />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <InfoItem label="토요일 배송" value={item.saturdayDeliveryRequired ? "필요" : "무관"} />
                  <InfoItem label="반품" value={item.returnRequired ? "필요" : "무관"} />
                  <InfoItem label="상세 주소" value={item.pickupAddress} />
                </div>

                {item.memo ? (
                  <p className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                    {item.memo}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-slate-500">조회 가능한 일감이 없습니다.</p>
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatPickupTime(item: AgencyOpenContractRequestItem): string {
  if (!item.pickupStartTime && !item.pickupEndTime) {
    return "-";
  }

  return `${item.pickupStartTime ?? "-"} ~ ${item.pickupEndTime ?? "-"}`;
}

function formatCurrency(value: number | null): string {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}원`;
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
  return error instanceof ApiError && error.code === "AGENCY_NOT_FOUND";
}
