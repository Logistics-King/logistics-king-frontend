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
  type VendorContractItem,
  type VendorContractRequestItem,
  type VendorProductItem,
} from "./api";

type DashboardState = {
  products: PageResponse<VendorProductItem> | null;
  contractRequests: PageResponse<VendorContractRequestItem> | null;
  contracts: PageResponse<VendorContractItem> | null;
};

const initialState: DashboardState = {
  products: null,
  contractRequests: null,
  contracts: null,
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
        const [products, contractRequests, contracts] = await Promise.all([
          getVendorProducts({ page: 0, size: 5 }),
          getVendorContractRequests({ page: 0, size: 5 }),
          getVendorContracts({ page: 0, size: 5 }),
        ]);

        if (active) {
          setDashboard({ products, contractRequests, contracts });
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
