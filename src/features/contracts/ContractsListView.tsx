"use client";

import { useEffect, useState } from "react";
import type { PageResponse } from "@/src/shared/api/types";
import type { ContractListItem } from "./types";

type ContractsListViewProps = {
  counterpartyLabel: string;
  counterparty: "VENDOR" | "AGENCY";
  emptyMessage: string;
  loadContracts: (query: { page: number; size: number }) => Promise<PageResponse<ContractListItem>>;
};

const pageSize = 10;

const coldChainTypeLabels: Record<ContractListItem["coldChainType"], string> = {
  NONE: "일반",
  REFRIGERATED: "냉장",
  FROZEN: "냉동",
};

const boxSizeLabels: Record<ContractListItem["boxSize"], string> = {
  SIZE_60: "60사이즈",
  SIZE_80: "80사이즈",
  SIZE_100: "100사이즈",
  SIZE_120: "120사이즈",
  SIZE_140: "140사이즈",
  SIZE_160: "160사이즈",
  CUSTOM: "기타",
};

export function ContractsListView({
  counterparty,
  counterpartyLabel,
  emptyMessage,
  loadContracts,
}: ContractsListViewProps) {
  const [page, setPage] = useState(0);
  const [pageResponse, setPageResponse] = useState<PageResponse<ContractListItem> | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchContracts() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await loadContracts({ page, size: pageSize });

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

    fetchContracts();

    return () => {
      active = false;
    };
  }, [loadContracts, page]);

  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">최종 계약 목록</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              수락된 제안으로 확정된 계약의 단가, 집하 조건, 상태를 확인합니다.
            </p>
          </div>
          <p className="rounded-md bg-[#071f46]/10 px-3 py-2 text-sm font-bold text-[#071f46]">
            전체 {formatNumber(pageResponse?.totalElements ?? 0)}건
          </p>
        </div>
      </div>

      {errorMessage ? (
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
            {pageResponse.items.map((contract) => (
              <ContractCard
                contract={contract}
                counterparty={counterparty}
                counterpartyLabel={counterpartyLabel}
                key={contract.contractId}
              />
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

function ContractCard({
  contract,
  counterparty,
  counterpartyLabel,
}: {
  contract: ContractListItem;
  counterparty: "VENDOR" | "AGENCY";
  counterpartyLabel: string;
}) {
  return (
    <article className="grid gap-4 px-5 py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{contract.productName}</h3>
            <span className="rounded-full bg-[#071f46]/10 px-2 py-1 text-xs font-bold text-[#071f46]">
              {formatContractStatus(contract.status)}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
              {boxSizeLabels[contract.boxSize]}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{contract.pickupAddress}</p>
        </div>
        <div className="rounded-md bg-[#071f46]/10 px-4 py-3 text-right text-sm font-bold text-[#071f46]">
          {formatCurrency(contract.unitPrice)}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <InfoItem label={counterpartyLabel} value={formatCounterparty(contract, counterparty)} />
        <InfoItem label="집하 지역" value={contract.pickupRegion} />
        <InfoItem label="월 물량" value={`${formatNumber(contract.monthlyVolume)}개`} />
        <InfoItem label="픽업 시간" value={formatPickupTime(contract)} />
        <InfoItem label="온도 관리" value={coldChainTypeLabels[contract.coldChainType]} />
        <InfoItem label="토요일 배송" value={contract.saturdayDeliveryAvailable ? "가능" : "불가"} />
        <InfoItem label="반품" value={contract.returnAvailable ? "가능" : "불가"} />
        <InfoItem label="계약 ID" value={shortId(contract.contractId)} />
      </div>

      {contract.memo ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
          {contract.memo}
        </p>
      ) : null}
    </article>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatCounterparty(
  contract: ContractListItem,
  counterparty: "VENDOR" | "AGENCY",
): string {
  if (counterparty === "AGENCY") {
    if (contract.agency) {
      return `${contract.agency.agencyName} / ${contract.agency.carrier}`;
    }

    return shortId(contract.agencyId);
  }

  if (contract.vendor) {
    return contract.vendor.businessName;
  }

  return shortId(contract.vendorId);
}

function formatContractStatus(status: ContractListItem["status"]): string {
  const labels: Record<string, string> = {
    ACTIVE: "계약 활성",
  };

  return labels[status] ?? status;
}

function formatPickupTime(contract: ContractListItem): string {
  if (!contract.pickupStartTime && !contract.pickupEndTime) {
    return "-";
  }

  return `${contract.pickupStartTime ?? "-"} ~ ${contract.pickupEndTime ?? "-"}`;
}

function formatCurrency(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

function shortId(value: string): string {
  return value.slice(0, 8);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "계약 목록을 불러오지 못했습니다.";
}
