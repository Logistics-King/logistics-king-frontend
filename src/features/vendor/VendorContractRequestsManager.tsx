"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/src/shared/api/client";
import type { BoxSize, ColdChainType, PageResponse, ProductCategory } from "@/src/shared/api/types";
import { ProfileRequiredNotice } from "@/src/shared/profile/ProfileRequiredNotice";
import {
  createVendorContractRequest,
  getVendorAgencies,
  getVendorContractRequests,
  type VendorAgencySummary,
  type VendorContractRequestDetail,
  type VendorContractRequestLine,
  type VendorContractRequestPayload,
} from "./api";

type ContractRequestFormState = {
  approverId: string;
  pickupRegion: string;
  pickupAddress: string;
  pickupStartTime: string;
  pickupEndTime: string;
  saturdayDeliveryRequired: boolean;
  returnRequired: boolean;
  memo: string;
  items: ContractRequestLineFormState[];
};

type ContractRequestLineFormState = {
  productName: string;
  productCategory: ProductCategory;
  boxSize: BoxSize;
  boxQuantity: string;
  itemQuantity: string;
  averageWeightGram: string;
  fragile: boolean;
  liquid: boolean;
  freshFood: boolean;
  coldChainType: ColdChainType;
  targetUnitPrice: string;
};

const pageSize = 10;

const initialLineState: ContractRequestLineFormState = {
  productName: "",
  productCategory: "CLOTHING",
  boxSize: "SIZE_60",
  boxQuantity: "1",
  itemQuantity: "0",
  averageWeightGram: "",
  fragile: false,
  liquid: false,
  freshFood: false,
  coldChainType: "NONE",
  targetUnitPrice: "",
};

const initialFormState: ContractRequestFormState = {
  approverId: "",
  pickupRegion: "",
  pickupAddress: "",
  pickupStartTime: "",
  pickupEndTime: "",
  saturdayDeliveryRequired: false,
  returnRequired: false,
  memo: "",
  items: [initialLineState],
};

const productCategoryOptions: Array<{ value: ProductCategory; label: string }> = [
  { value: "CLOTHING", label: "의류/패션" },
  { value: "GENERAL_GOODS", label: "생활용품/잡화" },
  { value: "FOOD", label: "식품" },
  { value: "ELECTRONICS", label: "전자제품" },
  { value: "DOCUMENT", label: "문서/책자" },
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

export function VendorContractRequestsManager() {
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [form, setForm] = useState<ContractRequestFormState>(initialFormState);
  const [agencies, setAgencies] = useState<VendorAgencySummary[]>([]);
  const [pageResponse, setPageResponse] =
    useState<PageResponse<VendorContractRequestDetail> | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [needsVendorProfile, setNeedsVendorProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalBoxQuantity = useMemo(
    () => form.items.reduce((sum, item) => sum + toRequiredQuantity(item.boxQuantity), 0),
    [form.items],
  );
  const totalItemQuantity = useMemo(
    () => form.items.reduce((sum, item) => sum + toRequiredQuantity(item.itemQuantity), 0),
    [form.items],
  );

  useEffect(() => {
    let active = true;

    async function fetchInitialData() {
      setIsLoading(true);
      setErrorMessage("");
      setNeedsVendorProfile(false);

      try {
        const [agencyPage, requestPage] = await Promise.all([
          getVendorAgencies({ page: 0, size: 100 }),
          getVendorContractRequests({ page, size: pageSize }),
        ]);

        if (active) {
          setAgencies(agencyPage.items);
          setPageResponse(requestPage);
        }
      } catch (error) {
        if (active) {
          setNeedsVendorProfile(isVendorProfileMissing(error));
          setErrorMessage(getErrorMessage(error));
          setPageResponse(null);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchInitialData();

    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setNeedsVendorProfile(false);

    const validationMessage = validateForm(form);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      await createVendorContractRequest(toRequestPayload(form));
      setSuccessMessage("계약 요청을 등록했습니다.");
      setForm(initialFormState);
      setPage(0);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setNeedsVendorProfile(isVendorProfileMissing(error));
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateLine(index: number, nextLine: ContractRequestLineFormState) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? nextLine : item)),
    }));
  }

  function addLine() {
    setForm((current) => {
      const lastLine = current.items[current.items.length - 1] ?? initialLineState;

      return {
        ...current,
        items: [...current.items, { ...lastLine }],
      };
    });
  }

  function removeLine(index: number) {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  return (
    <section className="grid gap-5">
      <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">계약 요청 등록</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              여러 배송 물품 라인을 묶어서 한 번에 대리점에 계약 요청합니다.
            </p>
          </div>
          <div className="grid gap-2 rounded-md bg-[#071f46]/10 px-4 py-3 text-sm font-bold text-[#071f46] sm:grid-cols-2">
            <span>총 박스 {formatNumber(totalBoxQuantity)}개</span>
            <span>총 낱개 {formatNumber(totalItemQuantity)}개</span>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Field label="요청 대상 대리점">
            <select
              className={inputClassName}
              value={form.approverId}
              onChange={(event) => setForm({ ...form, approverId: event.target.value })}
            >
              <option value="">공개 요청</option>
              {agencies.map((agency) => (
                <option key={agency.agencyId} value={agency.agencyId}>
                  {agency.agencyName} / {agency.mainRegion}
                </option>
              ))}
            </select>
          </Field>

          <Field label="픽업 지역">
            <input
              className={inputClassName}
              placeholder="경기도 안산시 일동"
              value={form.pickupRegion}
              onChange={(event) => setForm({ ...form, pickupRegion: event.target.value })}
            />
          </Field>

          <Field label="픽업 주소">
            <input
              className={inputClassName}
              placeholder="경기도 안산시 상록구 일동 101호"
              value={form.pickupAddress}
              onChange={(event) => setForm({ ...form, pickupAddress: event.target.value })}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="픽업 시작">
              <input
                className={inputClassName}
                type="time"
                value={form.pickupStartTime}
                onChange={(event) => setForm({ ...form, pickupStartTime: event.target.value })}
              />
            </Field>
            <Field label="픽업 종료">
              <input
                className={inputClassName}
                type="time"
                value={form.pickupEndTime}
                onChange={(event) => setForm({ ...form, pickupEndTime: event.target.value })}
              />
            </Field>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <BooleanField
            checked={form.saturdayDeliveryRequired}
            label="토요일 배송 필요"
            onChange={(checked) => setForm({ ...form, saturdayDeliveryRequired: checked })}
          />
          <BooleanField
            checked={form.returnRequired}
            label="반품 처리 필요"
            onChange={(checked) => setForm({ ...form, returnRequired: checked })}
          />
        </div>

        <Field label="요청 메모">
          <textarea
            className={`${inputClassName} min-h-24 resize-y py-3`}
            placeholder="상온/냉장/냉동 혼합 발송입니다."
            value={form.memo}
            onChange={(event) => setForm({ ...form, memo: event.target.value })}
          />
        </Field>

        <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-950">배송 물품 라인</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                같은 조건의 묶음 단위로 라인을 나눕니다.
              </p>
            </div>
            <button
              className="h-10 rounded-md bg-[#071f46] px-4 text-sm font-bold text-white transition hover:bg-[#0a2d63]"
              onClick={addLine}
              type="button"
            >
              + 품목 라인 추가
            </button>
          </div>

          {form.items.map((item, index) => (
            <LineCard
              canRemove={form.items.length > 1}
              index={index}
              item={item}
              key={index}
              onChange={(nextLine) => updateLine(index, nextLine)}
              onRemove={() => removeLine(index)}
            />
          ))}
        </div>

        {errorMessage && !needsVendorProfile ? (
          <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end">
          <button
            className="h-11 rounded-md bg-[#071f46] px-5 text-sm font-bold text-white transition hover:bg-[#0a2d63] disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "등록 중" : "계약 요청 등록"}
          </button>
        </div>
      </form>

      {needsVendorProfile ? <ProfileRequiredNotice role="VENDOR" /> : null}

      <ContractRequestList
        isLoading={isLoading}
        page={page}
        pageResponse={pageResponse}
        setPage={setPage}
      />
    </section>
  );
}

function LineCard({
  canRemove,
  index,
  item,
  onChange,
  onRemove,
}: {
  canRemove: boolean;
  index: number;
  item: ContractRequestLineFormState;
  onChange: (item: ContractRequestLineFormState) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-950">라인 {index + 1}</p>
        {canRemove ? (
          <button
            className="h-8 rounded-md border border-slate-300 px-3 text-xs font-bold text-slate-600 transition hover:border-red-400 hover:text-red-600"
            onClick={onRemove}
            type="button"
          >
            삭제
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Field label="품목명">
          <input
            className={inputClassName}
            value={item.productName}
            onChange={(event) => onChange({ ...item, productName: event.target.value })}
          />
        </Field>

        <Field label="카테고리">
          <select
            className={inputClassName}
            value={item.productCategory}
            onChange={(event) =>
              onChange({ ...item, productCategory: event.target.value as ProductCategory })
            }
          >
            {productCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="박스 크기">
          <select
            className={inputClassName}
            value={item.boxSize}
            onChange={(event) => onChange({ ...item, boxSize: event.target.value as BoxSize })}
          >
            {boxSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="박스 수량">
          <input
            className={inputClassName}
            inputMode="numeric"
            value={formatIntegerInput(item.boxQuantity)}
            onChange={(event) =>
              onChange({ ...item, boxQuantity: normalizeIntegerInput(event.target.value) })
            }
          />
        </Field>

        <Field label="낱개 수량">
          <input
            className={inputClassName}
            inputMode="numeric"
            value={formatIntegerInput(item.itemQuantity)}
            onChange={(event) =>
              onChange({ ...item, itemQuantity: normalizeIntegerInput(event.target.value) })
            }
          />
        </Field>

        <Field label="평균 무게(g)">
          <input
            className={inputClassName}
            inputMode="numeric"
            value={formatIntegerInput(item.averageWeightGram)}
            onChange={(event) =>
              onChange({ ...item, averageWeightGram: normalizeIntegerInput(event.target.value) })
            }
          />
        </Field>

        <Field label="희망 단가">
          <input
            className={inputClassName}
            inputMode="numeric"
            value={formatIntegerInput(item.targetUnitPrice)}
            onChange={(event) =>
              onChange({ ...item, targetUnitPrice: normalizeIntegerInput(event.target.value) })
            }
          />
        </Field>

        <Field label="온도 관리">
          <select
            className={inputClassName}
            value={item.coldChainType}
            onChange={(event) =>
              onChange({ ...item, coldChainType: event.target.value as ColdChainType })
            }
          >
            {coldChainOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <BooleanField
          checked={item.fragile}
          label="파손 주의"
          onChange={(checked) => onChange({ ...item, fragile: checked })}
        />
        <BooleanField
          checked={item.liquid}
          label="액체 포함"
          onChange={(checked) => onChange({ ...item, liquid: checked })}
        />
        <BooleanField
          checked={item.freshFood}
          label="신선 식품"
          onChange={(checked) => onChange({ ...item, freshFood: checked })}
        />
      </div>
    </div>
  );
}

function ContractRequestList({
  isLoading,
  page,
  pageResponse,
  setPage,
}: {
  isLoading: boolean;
  page: number;
  pageResponse: PageResponse<VendorContractRequestDetail> | null;
  setPage: (updater: (current: number) => number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-sm font-semibold text-slate-700">
          계약 요청 목록 {formatNumber(pageResponse?.totalElements ?? 0)}건
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-3 p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-24 rounded-md bg-slate-100" key={index} />
          ))}
        </div>
      ) : pageResponse && pageResponse.items.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {pageResponse.items.map((request) => (
            <article className="grid gap-4 px-5 py-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]" key={request.contractRequestId}>
              <Info label="대표 품목" value={request.productName} />
              <Info label="배송 라인" value={`${formatNumber(request.items.length)}개`} />
              <Info label="총 박스" value={`${formatNumber(sumBoxQuantity(request.items))}개`} />
              <Info label="상태" value={request.status} />
            </article>
          ))}
        </div>
      ) : (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-semibold text-slate-500">등록된 계약 요청이 없습니다.</p>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function validateForm(form: ContractRequestFormState): string {
  if (!form.pickupRegion.trim()) {
    return "픽업 지역은 필수입니다.";
  }

  if (!form.pickupAddress.trim()) {
    return "픽업 주소는 필수입니다.";
  }

  if (form.items.length === 0) {
    return "계약 요청 배송 물품은 1개 이상이어야 합니다.";
  }

  for (const [index, item] of form.items.entries()) {
    if (!item.productName.trim()) {
      return `라인 ${index + 1}의 품목명은 필수입니다.`;
    }

    if (toRequiredQuantity(item.boxQuantity) + toRequiredQuantity(item.itemQuantity) <= 0) {
      return `라인 ${index + 1}의 박스 수량 또는 낱개 수량 중 하나는 1 이상이어야 합니다.`;
    }
  }

  return "";
}

function toRequestPayload(form: ContractRequestFormState): VendorContractRequestPayload {
  const items = form.items.map(toRequestLine);
  const firstItem = items[0];

  return {
    type: "VENDOR_OFFER",
    approverId: form.approverId || null,
    productId: firstItem.productId,
    pickupRegion: form.pickupRegion.trim(),
    pickupAddress: form.pickupAddress.trim(),
    monthlyVolume: items.reduce((sum, item) => sum + item.boxQuantity, 0),
    productCategory: firstItem.productCategory,
    productName: firstItem.productName,
    boxSize: firstItem.boxSize,
    pickupStartTime: blankToNull(form.pickupStartTime),
    pickupEndTime: blankToNull(form.pickupEndTime),
    saturdayDeliveryRequired: form.saturdayDeliveryRequired,
    returnRequired: form.returnRequired,
    coldChainType: firstItem.coldChainType,
    targetUnitPrice: firstItem.targetUnitPrice,
    memo: blankToNull(form.memo),
    items,
  };
}

function toRequestLine(item: ContractRequestLineFormState): VendorContractRequestLine {
  return {
    productId: null,
    productCategory: item.productCategory,
    productName: item.productName.trim(),
    boxSize: item.boxSize,
    boxQuantity: toRequiredQuantity(item.boxQuantity),
    itemQuantity: toRequiredQuantity(item.itemQuantity),
    averageWeightGram: numberToNullable(item.averageWeightGram),
    fragile: item.fragile,
    liquid: item.liquid,
    freshFood: item.freshFood,
    coldChainType: item.coldChainType,
    targetUnitPrice: numberToNullable(item.targetUnitPrice),
  };
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function numberToNullable(value: string): number | null {
  return value ? Number(value) : null;
}

function toRequiredQuantity(value: string): number {
  return value ? Number(value) : 0;
}

function normalizeIntegerInput(value: string): string {
  return value.replace(/,/g, "").replace(/\D/g, "");
}

function formatIntegerInput(value: string): string {
  return value ? Number(value).toLocaleString("ko-KR") : "";
}

function sumBoxQuantity(items: VendorContractRequestLine[]): number {
  return items.reduce((sum, item) => sum + item.boxQuantity, 0);
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "계약 요청을 처리하지 못했습니다.";
}

function isVendorProfileMissing(error: unknown): boolean {
  return error instanceof ApiError && error.code === "VENDOR_NOT_FOUND";
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#071f46] focus:ring-3 focus:ring-[#071f46]/10";
