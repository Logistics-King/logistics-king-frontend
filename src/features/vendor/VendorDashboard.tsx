"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/src/shared/api/client";
import type { PageResponse } from "@/src/shared/api/types";
import { ProfileRequiredNotice } from "@/src/shared/profile/ProfileRequiredNotice";
import {
  getVendorContractRequests,
  getVendorContracts,
  getVendorProducts,
  getVendorRecommendedAgencies,
  type VendorContractItem,
  type VendorContractRequestItem,
  type VendorProductItem,
  type VendorRecommendedAgencyItem,
} from "./api";

type DashboardState = {
  products: PageResponse<VendorProductItem> | null;
  contractRequests: PageResponse<VendorContractRequestItem> | null;
  contracts: PageResponse<VendorContractItem> | null;
  recommendedAgencies: VendorRecommendedAgencyItem[];
};

const initialState: DashboardState = {
  products: null,
  contractRequests: null,
  contracts: null,
  recommendedAgencies: [],
};

export function VendorDashboard() {
  const [dashboard, setDashboard] = useState<DashboardState>(initialState);
  const [errorMessage, setErrorMessage] = useState("");
  const [needsVendorProfile, setNeedsVendorProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function fetchDashboard() {
      setIsLoading(true);
      setErrorMessage("");
      setNeedsVendorProfile(false);

      try {
        const [products, contractRequests, contracts, recommendedAgencies] = await Promise.all([
          getVendorProducts({ page: 0, size: 5 }),
          getVendorContractRequests({ page: 0, size: 5 }),
          getVendorContracts({ page: 0, size: 5 }),
          getVendorRecommendedAgencies(5),
        ]);

        if (active) {
          setDashboard({
            products,
            contractRequests,
            contracts,
            recommendedAgencies: recommendedAgencies.items,
          });
        }
      } catch (error) {
        if (active) {
          setNeedsVendorProfile(isVendorProfileMissing(error));
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      active = false;
    };
  }, []);

  const summaryCards = [
    {
      label: "배송 품목 조회",
      value: dashboard.products?.totalElements ?? 0,
      href: "/vendor/products",
    },
    {
      label: "계약 요청",
      value: dashboard.contractRequests?.totalElements ?? 0,
      href: "/vendor/contract-requests",
    },
    {
      label: "화주 계약",
      value: dashboard.contracts?.totalElements ?? 0,
      href: "/vendor/contracts",
    },
  ];

  return (
    <section className="grid gap-5">
      {needsVendorProfile ? <ProfileRequiredNotice role="VENDOR" /> : null}

      {errorMessage && !needsVendorProfile ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Link
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-[#071f46]/30 hover:shadow-md"
            href={card.href}
            key={card.label}
          >
            <p className="text-sm font-semibold text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">
              {isLoading ? "-" : formatNumber(card.value)}
            </p>
            <p className="mt-2 text-sm text-slate-600">전체 보기</p>
          </Link>
        ))}
      </div>

      <RecommendedAgenciesSection
        isLoading={isLoading}
        items={dashboard.recommendedAgencies}
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardList
          title="최근 계약 요청"
          href="/vendor/contract-requests"
          emptyMessage="계약 요청이 없습니다."
          items={dashboard.contractRequests?.items ?? []}
          fields={["productName", "pickupRegion", "status"]}
          isLoading={isLoading}
        />
        <DashboardList
          title="최근 화주 계약"
          href="/vendor/contracts"
          emptyMessage="화주 계약이 없습니다."
          items={dashboard.contracts?.items ?? []}
          fields={["productName", "agencyName", "status"]}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}

function DashboardList({
  title,
  href,
  emptyMessage,
  items,
  fields,
  isLoading,
}: {
  title: string;
  href: string;
  emptyMessage: string;
  items: Array<Record<string, unknown>>;
  fields: string[];
  isLoading: boolean;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-bold text-slate-950">{title}</h2>
        <Link className="text-sm font-semibold text-[#071f46]" href={href}>
          전체 보기
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-3 p-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="h-16 rounded-md bg-slate-100" key={index} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {items.slice(0, 5).map((item, index) => (
            <div className="grid gap-1 px-5 py-4" key={getItemKey(item, index)}>
              <p className="text-sm font-bold text-slate-950">{formatValue(readField(item, fields))}</p>
              <p className="text-xs font-medium text-slate-500">{formatStatus(item.status)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-10 text-center text-sm font-semibold text-slate-500">
          {emptyMessage}
        </p>
      )}
    </article>
  );
}

function RecommendedAgenciesSection({
  isLoading,
  items,
}: {
  isLoading: boolean;
  items: VendorRecommendedAgencyItem[];
}) {
  return (
    <article className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-950">추천 대리점</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            계약 이력과 지역 매칭 기준으로 계약 요청을 보내기 좋은 대리점을 보여줍니다.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-[#071f46] px-4 text-sm font-bold text-[#071f46] transition hover:bg-[#071f46]/5"
          href="/vendor/contract-requests/new"
        >
          계약 요청 등록
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div className="h-32 rounded-md bg-slate-100" key={index} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <RecommendedAgencyCard item={item} key={item.agencyId} />
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
          추천할 대리점이 없습니다.
        </p>
      )}
    </article>
  );
}

function RecommendedAgencyCard({ item }: { item: VendorRecommendedAgencyItem }) {
  return (
    <article className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-950">{item.agencyName}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {item.carrier} / {item.mainRegion}
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
          추천 점수 {formatNumber(item.score)}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.reasons.map((reason) => (
          <span
            className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600"
            key={`${item.agencyId}-${reason.type}`}
          >
            {reason.label}
          </span>
        ))}
      </div>

      <div className="grid gap-2 text-xs font-semibold text-slate-500">
        <p>{formatAddress(item.address, item.addressDetail)}</p>
        <p>담당 가능 지역 {formatNumber(item.serviceRegions.length)}개</p>
      </div>
    </article>
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

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function formatStatus(value: unknown): string {
  const labels: Record<string, string> = {
    OPEN: "진행중",
    CANCELED: "취소됨",
    REJECTED: "거절됨",
    CONTRACTED: "계약 완료",
    SUBMITTED: "제안 제출",
    WITHDRAWN: "철회됨",
    ACCEPTED: "수락됨",
  };

  if (!value) {
    return "상태 정보 없음";
  }

  return labels[String(value)] ?? `상태 ${String(value)}`;
}

function formatAddress(address: string, detail: string | null): string {
  return detail ? `${address} ${detail}` : address;
}

function getItemKey(item: Record<string, unknown>, index: number): string {
  const id = item.id ?? item.contractRequestId ?? item.contractId ?? item.productId;

  return id ? String(id) : String(index);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "화주 홈 정보를 불러오지 못했습니다.";
}

function isVendorProfileMissing(error: unknown): boolean {
  return error instanceof ApiError && error.code === "VENDOR_NOT_FOUND";
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}
