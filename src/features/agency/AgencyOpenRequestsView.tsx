"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/src/shared/api/client";
import type {
  BoxSize,
  ColdChainType,
  DayOfWeek,
  PageResponse,
  ProductCategory,
} from "@/src/shared/api/types";
import { ProfileRequiredNotice } from "@/src/shared/profile/ProfileRequiredNotice";
import {
  getAgencyOpenContractRequests,
  submitAgencyProposal,
  type AgencyOpenRequestFilters,
  type AgencyOpenRequestScope,
  type AgencyContractRequestLineItem,
  type AgencyOpenContractRequestItem,
  type AgencyProposalRequest,
} from "./api";

const pageSize = 10;

type ProposalFormState = {
  unitPrice: string;
  items: ProposalLinePriceFormState[];
  pickupStartTime: string;
  pickupEndTime: string;
  saturdayDeliveryAvailable: boolean;
  returnAvailable: boolean;
  coldChainType: ColdChainType;
  memo: string;
};

type ProposalLinePriceFormState = {
  contractRequestItemId: string;
  unitPrice: string;
};

type OpenRequestFilterFormState = {
  scope: AgencyOpenRequestScope;
  pickupRegion: string;
  name: string;
  category: "" | ProductCategory;
  boxSize: "" | BoxSize;
  coldChainType: "" | ColdChainType;
  saturdayDeliveryRequired: BooleanFilterValue;
  returnRequired: BooleanFilterValue;
  minTargetUnitPrice: string;
  maxTargetUnitPrice: string;
  vendorName: string;
};

type BooleanFilterValue = "" | "true" | "false";

const initialFilterForm: OpenRequestFilterFormState = {
  scope: "ALL",
  pickupRegion: "",
  name: "",
  category: "",
  boxSize: "",
  coldChainType: "",
  saturdayDeliveryRequired: "",
  returnRequired: "",
  minTargetUnitPrice: "",
  maxTargetUnitPrice: "",
  vendorName: "",
};

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

const dayOfWeekLabels: Record<DayOfWeek, string> = {
  MONDAY: "월",
  TUESDAY: "화",
  WEDNESDAY: "수",
  THURSDAY: "목",
  FRIDAY: "금",
  SATURDAY: "토",
  SUNDAY: "일",
};

// 대리점의 "일감 조회" 화면입니다.
// 일감 기준 API는 GET /api/v1/contract-requests/open 입니다.
// 배송 물품 상세는 top-level 대표 필드가 아니라 request.items[] 기준으로 렌더링합니다.
export function AgencyOpenRequestsView() {
  const [page, setPage] = useState(0);
  const [pageResponse, setPageResponse] =
    useState<PageResponse<AgencyOpenContractRequestItem> | null>(null);
  const [filters, setFilters] = useState<OpenRequestFilterFormState>(initialFilterForm);
  const [appliedFilters, setAppliedFilters] =
    useState<OpenRequestFilterFormState>(initialFilterForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [needsAgencyProfile, setNeedsAgencyProfile] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AgencyOpenContractRequestItem | null>(null);
  const [proposalForm, setProposalForm] = useState<ProposalFormState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchOpenRequests() {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      setNeedsAgencyProfile(false);

      try {
        const response = await getAgencyOpenContractRequests({
          page,
          size: pageSize,
          ...toOpenRequestFilters(appliedFilters),
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

    fetchOpenRequests();

    return () => {
      active = false;
    };
  }, [appliedFilters, page]);

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setAppliedFilters(filters);
  }

  function resetFilters() {
    setFilters(initialFilterForm);
    setAppliedFilters(initialFilterForm);
    setPage(0);
  }

  function openProposalForm(request: AgencyOpenContractRequestItem) {
    const itemPrices = request.items.map((item) => ({
      contractRequestItemId: getRequestItemId(item),
      unitPrice:
        item.targetUnitPrice === null
          ? request.targetUnitPrice === null
            ? ""
            : String(request.targetUnitPrice)
          : String(item.targetUnitPrice),
    }));

    setSelectedRequest(request);
    setProposalForm({
      unitPrice: String(calculateWeightedUnitPrice(itemPrices, request.items)),
      items: itemPrices,
      pickupStartTime: request.pickupStartTime ?? "",
      pickupEndTime: request.pickupEndTime ?? "",
      saturdayDeliveryAvailable: request.saturdayDeliveryRequired,
      returnAvailable: request.returnRequired,
      coldChainType: request.coldChainType,
      memo: "",
    });
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeProposalForm() {
    setSelectedRequest(null);
    setProposalForm(null);
    setIsSubmittingProposal(false);
  }

  async function handleSubmitProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedRequest || !proposalForm) {
      return;
    }

    const unitPrice = Number(normalizeIntegerInput(proposalForm.unitPrice));

    if (!unitPrice || unitPrice < 0) {
      setErrorMessage("제안 단가는 1원 이상 입력해야 합니다.");
      return;
    }

    const invalidLine = proposalForm.items.find((item) => {
      const lineUnitPrice = Number(normalizeIntegerInput(item.unitPrice));

      return !lineUnitPrice || lineUnitPrice < 1;
    });

    if (invalidLine) {
      setErrorMessage("배송 물품 라인별 단가는 모두 1원 이상 입력해야 합니다.");
      return;
    }

    setIsSubmittingProposal(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await submitAgencyProposal(selectedRequest.contractRequestId, toProposalRequest(proposalForm));
      setSuccessMessage("제안을 등록했습니다.");
      closeProposalForm();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmittingProposal(false);
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">일감 조회</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              화주가 공개한 계약 요청을 확인하고 배송 물품 라인별 조건을 비교합니다.
            </p>
          </div>
          <p className="rounded-md bg-[#071f46]/10 px-3 py-2 text-sm font-bold text-[#071f46]">
            전체 {formatNumber(pageResponse?.totalElements ?? 0)}건
          </p>
        </div>
      </div>

      <form
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={handleFilterSubmit}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-950">일감 필터</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              인근 일감, 품목 조건, 화주명, 단가 범위로 조회합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:border-slate-500"
              onClick={resetFilters}
              type="button"
            >
              초기화
            </button>
            <button
              className="h-10 rounded-md bg-[#071f46] px-4 text-sm font-bold text-white transition hover:bg-[#0a2d63]"
              type="submit"
            >
              조회
            </button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <Field label="조회 범위">
            <select
              className={inputClassName}
              value={filters.scope}
              onChange={(event) =>
                setFilters({ ...filters, scope: event.target.value as AgencyOpenRequestScope })
              }
            >
              <option value="ALL">전체 일감</option>
              <option value="NEARBY">인근 일감</option>
            </select>
          </Field>
          <Field label="픽업 지역">
            <input
              className={inputClassName}
              placeholder="안산"
              value={filters.pickupRegion}
              onChange={(event) => setFilters({ ...filters, pickupRegion: event.target.value })}
            />
          </Field>
          <Field label="화주명">
            <input
              className={inputClassName}
              placeholder="안산 의류상사"
              value={filters.vendorName}
              onChange={(event) => setFilters({ ...filters, vendorName: event.target.value })}
            />
          </Field>
          <Field label="품목명">
            <input
              className={inputClassName}
              placeholder="의류"
              value={filters.name}
              onChange={(event) => setFilters({ ...filters, name: event.target.value })}
            />
          </Field>
          <Field label="카테고리">
            <select
              className={inputClassName}
              value={filters.category}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  category: event.target.value as "" | ProductCategory,
                })
              }
            >
              <option value="">전체</option>
              {Object.entries(productCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="박스 규격">
            <select
              className={inputClassName}
              value={filters.boxSize}
              onChange={(event) =>
                setFilters({ ...filters, boxSize: event.target.value as "" | BoxSize })
              }
            >
              <option value="">전체</option>
              {Object.entries(boxSizeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="온도 관리">
            <select
              className={inputClassName}
              value={filters.coldChainType}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  coldChainType: event.target.value as "" | ColdChainType,
                })
              }
            >
              <option value="">전체</option>
              {Object.entries(coldChainTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="희망 단가 최소">
            <input
              className={inputClassName}
              inputMode="numeric"
              placeholder="1,800"
              value={formatIntegerInput(filters.minTargetUnitPrice)}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  minTargetUnitPrice: normalizeIntegerInput(event.target.value),
                })
              }
            />
          </Field>
          <Field label="희망 단가 최대">
            <input
              className={inputClassName}
              inputMode="numeric"
              placeholder="2,500"
              value={formatIntegerInput(filters.maxTargetUnitPrice)}
              onChange={(event) =>
                setFilters({
                  ...filters,
                  maxTargetUnitPrice: normalizeIntegerInput(event.target.value),
                })
              }
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <BooleanFilterField
            label="토요일 배송 필요"
            value={filters.saturdayDeliveryRequired}
            onChange={(value) => setFilters({ ...filters, saturdayDeliveryRequired: value })}
          />
          <BooleanFilterField
            label="반품 필요"
            value={filters.returnRequired}
            onChange={(value) => setFilters({ ...filters, returnRequired: value })}
          />
        </div>
      </form>

      {needsAgencyProfile ? <ProfileRequiredNotice role="AGENCY" /> : null}

      {errorMessage && !needsAgencyProfile ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {successMessage}
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
            {pageResponse.items.map((request) => (
              <ContractRequestCard
                key={request.contractRequestId}
                onProposalClick={openProposalForm}
                request={request}
              />
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

      {selectedRequest && proposalForm ? (
        <ProposalModal
          form={proposalForm}
          isSubmitting={isSubmittingProposal}
          onChange={setProposalForm}
          onLinePriceChange={(contractRequestItemId, unitPrice) =>
            setProposalForm((current) =>
              current
                ? syncRepresentativeUnitPrice(
                    {
                      ...current,
                      items: current.items.map((item) =>
                        item.contractRequestItemId === contractRequestItemId
                          ? { ...item, unitPrice }
                          : item,
                      ),
                    },
                    selectedRequest.items,
                  )
                : current,
            )
          }
          onClose={closeProposalForm}
          onSubmit={handleSubmitProposal}
          request={selectedRequest}
        />
      ) : null}
    </section>
  );
}

function ContractRequestCard({
  onProposalClick,
  request,
}: {
  onProposalClick: (request: AgencyOpenContractRequestItem) => void;
  request: AgencyOpenContractRequestItem;
}) {
  return (
    <article className="grid gap-4 px-5 py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{request.productName}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
              {request.pickupRegion}
            </span>
            <span className="rounded-full bg-[#071f46]/10 px-2 py-1 text-xs font-bold text-[#071f46]">
              {formatContractRequestStatus(request.status)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{request.pickupAddress}</p>
        </div>
        <button
          className="h-10 rounded-md bg-[#071f46] px-4 text-sm font-bold text-white transition hover:bg-[#0a2d63]"
          onClick={() => onProposalClick(request)}
          type="button"
        >
          제안 등록
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoItem label="집하지" value={request.pickupAddress || request.pickupRegion} />
        <InfoItem label="목적지" value="목적지 정보 없음" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <InfoItem label="총 박스" value={formatQuantity(sumBoxQuantity(request.items))} />
        <InfoItem label="총 낱개" value={formatQuantity(sumItemQuantity(request.items))} />
        <InfoItem label="픽업 시간" value={formatPickupTime(request)} />
        <InfoItem label="계약 일정" value={formatContractSchedule(request)} />
        <InfoItem label="희망 단가" value={formatCurrency(request.targetUnitPrice)} />
      </div>

      <div className="grid gap-3">
        {request.items.map((item, index) => (
          <LineItemCard index={index} item={item} key={item.itemId ?? index} />
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoItem label="토요일 배송" value={request.saturdayDeliveryRequired ? "필요" : "무관"} />
        <InfoItem label="반품" value={request.returnRequired ? "필요" : "무관"} />
      </div>

      {request.memo ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
          {request.memo}
        </p>
      ) : null}
    </article>
  );
}

function ProposalModal({
  form,
  isSubmitting,
  onChange,
  onClose,
  onLinePriceChange,
  onSubmit,
  request,
}: {
  form: ProposalFormState;
  isSubmitting: boolean;
  onChange: (form: ProposalFormState) => void;
  onClose: () => void;
  onLinePriceChange: (contractRequestItemId: string, unitPrice: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  request: AgencyOpenContractRequestItem;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 px-4 py-6">
      <form
        className="grid max-h-[90vh] w-full max-w-2xl gap-5 overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold text-slate-400">제안 등록</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{request.productName}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{request.pickupAddress}</p>
          </div>
          <button
            className="h-10 rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700"
            onClick={onClose}
            type="button"
          >
            닫기
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="제안 단가">
            <input
              className={inputClassName}
              disabled
              inputMode="numeric"
              value={formatIntegerInput(form.unitPrice)}
              readOnly
            />
          </Field>
          <Field label="온도 관리">
            <select
              className={inputClassName}
              value={form.coldChainType}
              onChange={(event) =>
                onChange({ ...form, coldChainType: event.target.value as ColdChainType })
              }
            >
              {Object.entries(coldChainTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="픽업 시작">
            <input
              className={inputClassName}
              type="time"
              value={form.pickupStartTime}
              onChange={(event) => onChange({ ...form, pickupStartTime: event.target.value })}
            />
          </Field>
          <Field label="픽업 종료">
            <input
              className={inputClassName}
              type="time"
              value={form.pickupEndTime}
              onChange={(event) => onChange({ ...form, pickupEndTime: event.target.value })}
            />
          </Field>
        </div>

        <div className="grid gap-3 rounded-lg border border-slate-200 p-4">
          <div>
            <h3 className="text-base font-bold text-slate-950">배송 물품 라인별 단가</h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              각 배송 물품 라인의 단가를 입력하면 대표 제안 단가는 박스 수량 기준으로 자동 계산됩니다.
            </p>
          </div>
          {request.items.map((item, index) => (
            <ProposalLinePriceField
              index={index}
              item={item}
              key={getRequestItemId(item)}
              unitPrice={
                form.items.find(
                  (priceItem) => priceItem.contractRequestItemId === getRequestItemId(item),
                )
                  ?.unitPrice ?? ""
              }
              onChange={(unitPrice) => onLinePriceChange(getRequestItemId(item), unitPrice)}
            />
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <BooleanField
            checked={form.saturdayDeliveryAvailable}
            label="토요일 배송 가능"
            onChange={(checked) => onChange({ ...form, saturdayDeliveryAvailable: checked })}
          />
          <BooleanField
            checked={form.returnAvailable}
            label="반품 가능"
            onChange={(checked) => onChange({ ...form, returnAvailable: checked })}
          />
        </div>

        <Field label="제안 메모">
          <textarea
            className={`${inputClassName} min-h-24 resize-y py-3`}
            value={form.memo}
            onChange={(event) => onChange({ ...form, memo: event.target.value })}
          />
        </Field>

        <div className="flex justify-end">
          <button
            className="h-11 rounded-md bg-[#071f46] px-5 text-sm font-bold text-white transition hover:bg-[#0a2d63] disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "등록 중" : "제안 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function BooleanField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-12 items-center justify-between rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">
      <span>{label}</span>
      <input
        checked={checked}
        className="h-5 w-5 accent-[#071f46]"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function BooleanFilterField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: BooleanFilterValue) => void;
  value: BooleanFilterValue;
}) {
  return (
    <Field label={label}>
      <select
        className={inputClassName}
        value={value}
        onChange={(event) => onChange(event.target.value as BooleanFilterValue)}
      >
        <option value="">전체</option>
        <option value="true">예</option>
        <option value="false">아니오</option>
      </select>
    </Field>
  );
}

function LineItemCard({ index, item }: { index: number; item: AgencyContractRequestLineItem }) {
  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-slate-950">
          라인 {index + 1}. {item.productName}
        </p>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">
          {productCategoryLabels[item.productCategory]}
        </span>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">
          {boxSizeLabels[item.boxSize]}
        </span>
        <span className="rounded-full bg-[#071f46]/10 px-2 py-1 text-xs font-bold text-[#071f46]">
          {coldChainTypeLabels[item.coldChainType]}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        <InfoItem label="박스 수량" value={formatQuantity(item.boxQuantity)} />
        <InfoItem label="낱개 수량" value={formatQuantity(item.itemQuantity)} />
        <InfoItem label="평균 무게" value={formatWeight(item.averageWeightGram)} />
        <InfoItem label="희망 단가" value={formatCurrency(item.targetUnitPrice)} />
        <InfoItem label="온도" value={coldChainTypeLabels[item.coldChainType]} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Flag active={item.fragile} label="파손 주의" />
        <Flag active={item.liquid} label="액체" />
        <Flag active={item.freshFood} label="신선식품" />
      </div>
    </div>
  );
}

function ProposalLinePriceField({
  index,
  item,
  onChange,
  unitPrice,
}: {
  index: number;
  item: AgencyContractRequestLineItem;
  onChange: (unitPrice: string) => void;
  unitPrice: string;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-3 md:grid-cols-[1fr_180px] md:items-center">
      <div>
        <p className="text-sm font-bold text-slate-950">
          라인 {index + 1}. {item.productName}
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {boxSizeLabels[item.boxSize]} / {formatLineQuantity(item)} / 희망{" "}
          {formatCurrency(item.targetUnitPrice)}
        </p>
      </div>
      <input
        className={inputClassName}
        inputMode="numeric"
        placeholder="라인 단가"
        value={formatIntegerInput(unitPrice)}
        onChange={(event) => onChange(normalizeIntegerInput(event.target.value))}
      />
    </div>
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

function Flag({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex h-8 items-center justify-center rounded-md border px-2 text-xs font-bold ${
        active
          ? "border-[#071f46] bg-[#071f46] text-white"
          : "border-slate-200 bg-white text-slate-400"
      }`}
    >
      {label}
    </span>
  );
}

function sumBoxQuantity(items: AgencyContractRequestLineItem[]): number {
  return items.reduce((sum, item) => sum + item.boxQuantity, 0);
}

function sumItemQuantity(items: AgencyContractRequestLineItem[]): number {
  return items.reduce((sum, item) => sum + item.itemQuantity, 0);
}

function formatPickupTime(request: AgencyOpenContractRequestItem): string {
  if (!request.pickupStartTime && !request.pickupEndTime) {
    return "-";
  }

  return `${request.pickupStartTime ?? "-"} ~ ${request.pickupEndTime ?? "-"}`;
}

function formatContractSchedule(request: AgencyOpenContractRequestItem): string {
  if (request.contractType === "RECURRING") {
    if (request.recurringPickupCycle === "WEEKLY") {
      const days =
        request.recurringPickupDaysOfWeek.length > 0
          ? request.recurringPickupDaysOfWeek.map((day) => dayOfWeekLabels[day]).join(", ")
          : "-";

      return `정기 / 매주 ${days}`;
    }

    return `정기 / 매월 ${request.recurringPickupDayOfMonth ?? "-"}일`;
  }

  return [
    `단건`,
    `회수 ${formatDateRange(request.pickupDateFrom, request.pickupDateTo)}`,
    `배송 ${formatDateRange(request.deliveryDateFrom, request.deliveryDateTo)}`,
  ].join(" / ");
}

function formatDateRange(from: string | null | undefined, to: string | null | undefined): string {
  if (!from && !to) {
    return "-";
  }

  return `${from ?? "-"} ~ ${to ?? "-"}`;
}

function formatCurrency(value: number | null): string {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}원`;
}

function formatWeight(value: number | null): string {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}g`;
}

function formatQuantity(value: number): string {
  return `${value.toLocaleString("ko-KR")}개`;
}

function formatLineQuantity(item: AgencyContractRequestLineItem): string {
  const quantities = [
    item.boxQuantity > 0 ? `박스 ${formatNumber(item.boxQuantity)}개` : "",
    item.itemQuantity > 0 ? `낱개 ${formatNumber(item.itemQuantity)}개` : "",
  ].filter(Boolean);

  return quantities.length > 0 ? quantities.join(" / ") : "-";
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

function formatContractRequestStatus(status: AgencyOpenContractRequestItem["status"]): string {
  const labels: Record<AgencyOpenContractRequestItem["status"], string> = {
    OPEN: "진행중",
    CANCELED: "취소됨",
    REJECTED: "거절됨",
    CONTRACTED: "계약 완료",
  };

  return labels[status];
}

function toProposalRequest(form: ProposalFormState): AgencyProposalRequest {
  return {
    unitPrice: Number(normalizeIntegerInput(form.unitPrice)),
    items: form.items.map((item) => ({
      contractRequestItemId: item.contractRequestItemId,
      unitPrice: Number(normalizeIntegerInput(item.unitPrice)),
    })),
    pickupStartTime: blankToNull(form.pickupStartTime),
    pickupEndTime: blankToNull(form.pickupEndTime),
    saturdayDeliveryAvailable: form.saturdayDeliveryAvailable,
    returnAvailable: form.returnAvailable,
    coldChainType: form.coldChainType,
    memo: blankToNull(form.memo),
  };
}

function syncRepresentativeUnitPrice(
  form: ProposalFormState,
  requestItems: AgencyContractRequestLineItem[],
): ProposalFormState {
  return {
    ...form,
    unitPrice: String(calculateWeightedUnitPrice(form.items, requestItems)),
  };
}

function calculateWeightedUnitPrice(
  priceItems: ProposalLinePriceFormState[],
  requestItems: AgencyContractRequestLineItem[],
): number {
  const priceByRequestItemId = new Map(
    priceItems.map((item) => [
      item.contractRequestItemId,
      Number(normalizeIntegerInput(item.unitPrice)),
    ]),
  );
  let totalBoxQuantity = 0;
  let weightedTotal = 0;

  for (const item of requestItems) {
    const unitPrice = priceByRequestItemId.get(getRequestItemId(item));

    if (!unitPrice || unitPrice < 1 || item.boxQuantity <= 0) {
      continue;
    }

    totalBoxQuantity += item.boxQuantity;
    weightedTotal += unitPrice * item.boxQuantity;
  }

  if (totalBoxQuantity === 0) {
    const firstValidPrice = priceItems
      .map((item) => Number(normalizeIntegerInput(item.unitPrice)))
      .find((unitPrice) => unitPrice > 0);

    return firstValidPrice ?? 0;
  }

  return Math.round(weightedTotal / totalBoxQuantity);
}

function getRequestItemId(item: AgencyContractRequestLineItem): string {
  return item.contractRequestItemId ?? item.itemId;
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function normalizeIntegerInput(value: string): string {
  return value.replace(/,/g, "").replace(/\D/g, "");
}

function formatIntegerInput(value: string): string {
  return value ? Number(value).toLocaleString("ko-KR") : "";
}

function toOpenRequestFilters(form: OpenRequestFilterFormState): AgencyOpenRequestFilters {
  return {
    scope: form.scope,
    pickupRegion: blankToUndefined(form.pickupRegion),
    name: blankToUndefined(form.name),
    category: form.category || undefined,
    boxSize: form.boxSize || undefined,
    coldChainType: form.coldChainType || undefined,
    saturdayDeliveryRequired: booleanFilterToValue(form.saturdayDeliveryRequired),
    returnRequired: booleanFilterToValue(form.returnRequired),
    minTargetUnitPrice: numberFilterToValue(form.minTargetUnitPrice),
    maxTargetUnitPrice: numberFilterToValue(form.maxTargetUnitPrice),
    vendorName: blankToUndefined(form.vendorName),
  };
}

function blankToUndefined(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

function booleanFilterToValue(value: BooleanFilterValue): boolean | undefined {
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function numberFilterToValue(value: string): number | undefined {
  if (!value) {
    return undefined;
  }

  return Number(value);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "일감을 불러오지 못했습니다.";
}

function isAgencyProfileMissing(error: unknown): boolean {
  return error instanceof ApiError && error.code === "VENDOR_AGENCY_NOT_FOUND";
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#071f46] focus:ring-3 focus:ring-[#071f46]/10";
