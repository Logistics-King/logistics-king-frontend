"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/src/shared/api/client";
import {
  getAgencyRecommendedVendors,
  type AgencyRecommendedVendorItem,
} from "./api";

const homeRecommendationLimit = 5;

export function AgencyRecommendedVendorsHomeSection() {
  const [items, setItems] = useState<AgencyRecommendedVendorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchRecommendations() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await getAgencyRecommendedVendors(homeRecommendationLimit);

        if (active) {
          setItems(response.items);
        }
      } catch (error) {
        if (active) {
          setItems([]);
          setErrorMessage(getRecommendationErrorMessage(error));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchRecommendations();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-slate-950">추천 화주</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            계약 이력과 지역 매칭 기준으로 제안하기 좋은 화주를 보여줍니다.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-md border border-[#071f46] px-4 text-sm font-bold text-[#071f46] transition hover:bg-[#071f46]/5"
          href="/agency/open-requests"
        >
          일감 조회
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div className="h-32 rounded-md bg-slate-100" key={index} />
          ))}
        </div>
      ) : errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : items.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <RecommendedVendorCard item={item} key={item.vendorId} />
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
          추천할 화주가 없습니다.
        </p>
      )}
    </section>
  );
}

function RecommendedVendorCard({ item }: { item: AgencyRecommendedVendorItem }) {
  return (
    <article className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-950">{item.businessName}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {item.mainRegion} / {item.representativeName}
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
            key={`${item.vendorId}-${reason.type}`}
          >
            {reason.label}
          </span>
        ))}
      </div>

      <p className="text-xs font-semibold text-slate-500">
        {formatAddress(item.address, item.addressDetail)}
      </p>
    </article>
  );
}

function formatAddress(address: string, detail: string | null): string {
  return detail ? `${address} ${detail}` : address;
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

function getRecommendationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "RECOMMENDATION_AGENCY_NOT_FOUND") {
      return "대리점 프로필을 등록하면 추천 화주를 확인할 수 있습니다.";
    }

    return error.message;
  }

  return "추천 화주를 불러오지 못했습니다.";
}
