"use client";

import { useEffect, useState } from "react";
import type { DayOfWeek, PageResponse } from "@/src/shared/api/types";
import { ColdChainBadge } from "@/src/shared/ui/ColdChainBadge";
import type { ContractListItem } from "./types";

type ContractsListViewProps = {
  counterpartyLabel: string;
  counterparty: "VENDOR" | "AGENCY";
  emptyMessage: string;
  loadContracts: (query: { page: number; size: number }) => Promise<PageResponse<ContractListItem>>;
};

const pageSize = 10;

const boxSizeLabels: Record<ContractListItem["boxSize"], string> = {
  SIZE_60: "60사이즈",
  SIZE_80: "80사이즈",
  SIZE_100: "100사이즈",
  SIZE_120: "120사이즈",
  SIZE_140: "140사이즈",
  SIZE_160: "160사이즈",
  CUSTOM: "기타",
};

const dayOfWeekLabels: Record<DayOfWeek, string> = {
  MONDAY: "월",
  TUESDAY: "화",
  WEDNESDAY: "수",
  THURSDAY: "목",
  FRIDAY: "금",
  SATURDAY: "토",
  SUNDAY: "일",
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
      <p className="w-fit rounded-md bg-[#071f46]/10 px-3 py-2 text-sm font-bold text-[#071f46]">
        전체 {formatNumber(pageResponse?.totalElements ?? 0)}건
      </p>

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
  const contractItems = contract.items ?? [];
  const totalBoxQuantity = sumContractLineQuantity(contractItems, "boxQuantity");
  const totalItemQuantity = sumContractLineQuantity(contractItems, "itemQuantity");

  return (
    <article className="grid gap-4 px-5 py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{contract.productName}</h3>
            <span
              className={`rounded-full px-2 py-1 text-xs font-bold ${getContractStatusClassName(
                contract.status,
              )}`}
            >
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
        <InfoItem label="총 박스" value={`${formatNumber(totalBoxQuantity)}개`} />
        <InfoItem label="총 낱개" value={`${formatNumber(totalItemQuantity)}개`} />
        <InfoItem label="픽업 시간" value={formatPickupTime(contract)} />
        <InfoItem label="계약 일정" value={formatContractSchedule(contract)} />
        <InfoItem label="온도 관리" value={<ColdChainBadge type={contract.coldChainType} />} />
        <InfoItem label="토요일 배송" value={contract.saturdayDeliveryAvailable ? "가능" : "불가"} />
        <InfoItem label="반품" value={contract.returnAvailable ? "가능" : "불가"} />
        <InfoItem label="계약 ID" value={shortId(contract.contractId)} />
      </div>

      {contract.memo ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
          {contract.memo}
        </p>
      ) : null}

      {contractItems.length > 0 ? <ContractLineItems items={contractItems} /> : null}
    </article>
  );
}

function ContractLineItems({ items }: { items: ContractListItem["items"] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr_0.9fr] gap-3 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
          <span>계약 물품</span>
          <span>박스 규격</span>
          <span>수량</span>
          <span>단가</span>
          <span>온도</span>
        </div>
        <div className="divide-y divide-slate-100">
          {items.map((item) => (
            <div
              className="grid grid-cols-[1.4fr_0.9fr_0.9fr_0.9fr_0.9fr] gap-3 px-3 py-3 text-sm text-slate-700"
              key={item.itemId}
            >
              <span className="font-semibold text-slate-950">{item.productName}</span>
              <span>{boxSizeLabels[item.boxSize]}</span>
              <span>{formatContractLineQuantity(item)}</span>
              <span>{formatCurrency(item.unitPrice)}</span>
              <span>
                <ColdChainBadge type={item.coldChainType} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
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

function getContractStatusClassName(status: ContractListItem["status"]): string {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-amber-50 text-amber-700";
}

function formatPickupTime(contract: ContractListItem): string {
  if (!contract.pickupStartTime && !contract.pickupEndTime) {
    return "-";
  }

  return `${contract.pickupStartTime ?? "-"} ~ ${contract.pickupEndTime ?? "-"}`;
}

function formatContractSchedule(contract: ContractListItem): string {
  if (contract.contractType === "RECURRING") {
    if (contract.recurringPickupCycle === "WEEKLY") {
      const days =
        contract.recurringPickupDaysOfWeek.length > 0
          ? contract.recurringPickupDaysOfWeek.map((day) => dayOfWeekLabels[day]).join(", ")
          : "-";

      return `정기 / 매주 ${days}`;
    }

    return `정기 / 매월 ${contract.recurringPickupDayOfMonth ?? "-"}일`;
  }

  return [
    `단건`,
    `회수 ${formatDateRange(contract.pickupDateFrom, contract.pickupDateTo)}`,
    `배송 ${formatDateRange(contract.deliveryDateFrom, contract.deliveryDateTo)}`,
  ].join(" / ");
}

function formatDateRange(from: string | null | undefined, to: string | null | undefined): string {
  if (!from && !to) {
    return "-";
  }

  return `${from ?? "-"} ~ ${to ?? "-"}`;
}

function sumContractLineQuantity(
  items: ContractListItem["items"],
  key: "boxQuantity" | "itemQuantity",
): number {
  if (items.length === 0) {
    return 0;
  }

  return items.reduce((sum, item) => sum + item[key], 0);
}

function formatContractLineQuantity(item: ContractListItem["items"][number]): string {
  const quantities = [];

  if (item.boxQuantity > 0) {
    quantities.push(`박스 ${formatNumber(item.boxQuantity)}개`);
  }

  if (item.itemQuantity > 0) {
    quantities.push(`낱개 ${formatNumber(item.itemQuantity)}개`);
  }

  return quantities.length > 0 ? quantities.join(" / ") : "-";
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
