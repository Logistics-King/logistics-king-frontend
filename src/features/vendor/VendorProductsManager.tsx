"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ApiError } from "@/src/shared/api/client";
import type { BoxSize, ColdChainType, ProductCategory } from "@/src/shared/api/types";
import type { PageResponse } from "@/src/shared/api/types";
import { AddressSearchButton } from "@/src/shared/address/AddressSearchButton";
import { ProfileRequiredNotice } from "@/src/shared/profile/ProfileRequiredNotice";
import {
  createVendorProduct,
  getVendorProducts,
  updateVendorProduct,
  type VendorProductItem,
  type VendorProductRequest,
} from "./api";

type VendorProductsManagerProps = {
  mode: "list" | "create";
};

type ProductFormState = {
  category: ProductCategory;
  name: string;
  description: string;
  averagePrice: string;
  averageWeightGram: string;
  boxSize: BoxSize | "";
  boxQuantity: string;
  itemQuantity: string;
  destinationPostalCode: string;
  destinationAddress: string;
  destinationAddressDetail: string;
  fragile: boolean;
  liquid: boolean;
  freshFood: boolean;
  coldChainType: ColdChainType;
};

type ProductFilterState = {
  name: string;
  category: ProductCategory | "";
  boxSize: BoxSize | "";
  coldChainType: ColdChainType | "";
};

const pageSize = 10;

const initialFormState: ProductFormState = {
  category: "CLOTHING",
  name: "",
  description: "",
  averagePrice: "",
  averageWeightGram: "",
  boxSize: "",
  boxQuantity: "",
  itemQuantity: "",
  destinationPostalCode: "",
  destinationAddress: "",
  destinationAddressDetail: "",
  fragile: false,
  liquid: false,
  freshFood: false,
  coldChainType: "NONE",
};

const initialFilterState: ProductFilterState = {
  name: "",
  category: "",
  boxSize: "",
  coldChainType: "",
};

const productCategories: Array<{ value: ProductCategory; label: string }> = [
  { value: "CLOTHING", label: "의류/패션" },
  { value: "GENERAL_GOODS", label: "생활용품/잡화" },
  { value: "FOOD", label: "식품" },
  { value: "ELECTRONICS", label: "전자제품" },
  { value: "DOCUMENT", label: "문서/책자" },
  { value: "COSMETIC", label: "화장품" },
  { value: "ETC", label: "기타" },
];

const coldChainOptions: Array<{ value: ColdChainType; label: string }> = [
  { value: "NONE", label: "필요 없음" },
  { value: "REFRIGERATED", label: "냉장 필요" },
  { value: "FROZEN", label: "냉동 필요" },
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

// 화주 배송 품목 화면은 두 모드로 재사용됩니다.
// mode="list": 조회 화면 + 수정 폼
// mode="create": 등록 전용 화면
export function VendorProductsManager({ mode }: VendorProductsManagerProps) {
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [pageResponse, setPageResponse] = useState<PageResponse<VendorProductItem> | null>(
    null,
  );
  const [form, setForm] = useState<ProductFormState>(initialFormState);
  const [filters, setFilters] = useState<ProductFilterState>(initialFilterState);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilterState>(initialFilterState);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [needsVendorProfile, setNeedsVendorProfile] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(mode === "list");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode !== "list") {
      return;
    }

    let active = true;

    async function fetchProducts() {
      setIsLoading(true);
      setErrorMessage("");
      setNeedsVendorProfile(false);

      try {
        // 목록 화면은 현재 page와 적용된 검색 조건(appliedFilters)로 백엔드를 조회합니다.
        const response = await getVendorProducts({
          page,
          size: pageSize,
          ...toProductFilterQuery(appliedFilters),
        });

        if (active) {
          setPageResponse(response);
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

    fetchProducts();

    return () => {
      active = false;
    };
  }, [mode, page, reloadKey, appliedFilters]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setNeedsVendorProfile(false);
    setSuccessMessage("");

    const validationMessage = validateProductForm(form);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const request = toProductRequest(form);

      // editingProductId가 있으면 수정, 없으면 신규 등록입니다.
      if (editingProductId) {
        await updateVendorProduct(editingProductId, request);
        setSuccessMessage("배송 품목을 수정했습니다.");
      } else {
        await createVendorProduct(request);
        setSuccessMessage("배송 품목을 등록했습니다.");
      }

      resetForm();

      if (mode === "list") {
        if (page === 0) {
          setReloadKey((current) => current + 1);
        } else {
          setPage(0);
        }
      }
    } catch (error) {
      setNeedsVendorProfile(isVendorProfileMissing(error));
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleEdit(product: VendorProductItem) {
    setEditingProductId(product.productId);
    setForm(toFormState(product));
    setSuccessMessage("");
    setErrorMessage("");
    setNeedsVendorProfile(false);
  }

  function resetForm() {
    setEditingProductId(null);
    setForm(initialFormState);
  }

  function applyFilters() {
    // 입력 중인 필터(filters)와 실제 조회에 적용된 필터(appliedFilters)를 분리했습니다.
    // 사용자가 조회 버튼을 누를 때만 백엔드 검색을 다시 실행하기 위함입니다.
    setAppliedFilters(filters);
    setPage(0);
  }

  function resetFilters() {
    setFilters(initialFilterState);
    setAppliedFilters(initialFilterState);
    setPage(0);
  }

  return (
    <section className="grid gap-5">
      {mode === "create" || editingProductId ? (
        <ProductForm
          editing={Boolean(editingProductId)}
          errorMessage={errorMessage}
          form={form}
          isSubmitting={isSubmitting}
          onCancel={mode === "list" ? resetForm : undefined}
          onChange={setForm}
          onSubmit={handleSubmit}
          successMessage={successMessage}
        />
      ) : null}

      {needsVendorProfile ? <ProfileRequiredNotice role="VENDOR" /> : null}

      {mode === "list" ? (
        <ProductsList
          filters={filters}
          isLoading={isLoading}
          onFilterChange={setFilters}
          onFilterReset={resetFilters}
          onFilterSubmit={applyFilters}
          onEdit={handleEdit}
          page={page}
          pageResponse={pageResponse}
          setPage={setPage}
        />
      ) : null}
    </section>
  );
}

function ProductForm({
  editing,
  errorMessage,
  form,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit,
  successMessage,
}: {
  editing: boolean;
  errorMessage: string;
  form: ProductFormState;
  isSubmitting: boolean;
  onCancel?: () => void;
  onChange: (form: ProductFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  successMessage: string;
}) {
  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={onSubmit}>
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            {editing ? "배송 품목 수정" : "배송 품목 등록"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            계약 요청과 단가 산정에 사용할 품목 정보를 입력합니다.
          </p>
        </div>
        {onCancel ? (
          <button
            className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-500"
            onClick={onCancel}
            type="button"
          >
            닫기
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Field label="카테고리">
          <select
            className={inputClassName}
            value={form.category}
            onChange={(event) =>
              onChange({ ...form, category: event.target.value as ProductCategory })
            }
          >
            {productCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="품목명">
          <input
            className={inputClassName}
            required
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value })}
          />
        </Field>

        <Field label="평균 상품 가격">
          <input
            className={inputClassName}
            inputMode="decimal"
            min="0"
            type="text"
            value={formatNumericInput(form.averagePrice)}
            onChange={(event) =>
              onChange({ ...form, averagePrice: normalizeNumericInput(event.target.value) })
            }
          />
        </Field>

        <Field label="평균 무게(g)">
          <input
            className={inputClassName}
            inputMode="numeric"
            min="0"
            type="text"
            value={formatIntegerInput(form.averageWeightGram)}
            onChange={(event) =>
              onChange({ ...form, averageWeightGram: normalizeIntegerInput(event.target.value) })
            }
          />
        </Field>

        <Field label="박스 규격">
          <select
            className={inputClassName}
            value={form.boxSize}
            onChange={(event) =>
              onChange({ ...form, boxSize: event.target.value as BoxSize | "" })
            }
          >
            <option value="">선택 안함</option>
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
            min="0"
            type="text"
            value={formatIntegerInput(form.boxQuantity)}
            onChange={(event) =>
              onChange({ ...form, boxQuantity: normalizeIntegerInput(event.target.value) })
            }
          />
        </Field>

        <Field label="낱개 수량">
          <input
            className={inputClassName}
            inputMode="numeric"
            min="0"
            type="text"
            value={formatIntegerInput(form.itemQuantity)}
            onChange={(event) =>
              onChange({ ...form, itemQuantity: normalizeIntegerInput(event.target.value) })
            }
          />
        </Field>

        <Field label="설명">
          <textarea
            className={`${inputClassName} min-h-24 resize-y py-3`}
            value={form.description}
            onChange={(event) => onChange({ ...form, description: event.target.value })}
          />
        </Field>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-5">
        <h3 className="text-base font-bold text-slate-950">배송 목적지</h3>
        <div className="mt-1 text-sm leading-6 text-slate-600">
          품목별 계약 요청에 사용할 기본 배송 목적지입니다.
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="목적지 우편번호">
            <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
              <input
                className={inputClassName}
                inputMode="numeric"
                placeholder="06164"
                value={form.destinationPostalCode}
                onChange={(event) =>
                  onChange({ ...form, destinationPostalCode: event.target.value })
                }
              />
              <AddressSearchButton
                onSelect={(selectedAddress) =>
                  onChange({
                    ...form,
                    destinationPostalCode: selectedAddress.postalCode,
                    destinationAddress: selectedAddress.address,
                  })
                }
              />
            </div>
          </Field>

          <Field label="목적지 주소">
            <input
              className={inputClassName}
              required
              placeholder="서울특별시 강남구 테헤란로 521"
              value={form.destinationAddress}
              onChange={(event) => onChange({ ...form, destinationAddress: event.target.value })}
            />
          </Field>

          <Field label="목적지 상세주소">
            <input
              className={inputClassName}
              placeholder="10층"
              value={form.destinationAddressDetail}
              onChange={(event) =>
                onChange({ ...form, destinationAddressDetail: event.target.value })
              }
            />
          </Field>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <BooleanField
          checked={form.fragile}
          label="파손 주의"
          onChange={(checked) => onChange({ ...form, fragile: checked })}
        />
        <BooleanField
          checked={form.liquid}
          label="액체 포함"
          onChange={(checked) => onChange({ ...form, liquid: checked })}
        />
        <BooleanField
          checked={form.freshFood}
          label="신선 식품"
          onChange={(checked) => onChange({ ...form, freshFood: checked })}
        />
      </div>

      <Field label="온도 관리">
        <div className="grid gap-2 sm:grid-cols-3">
          {coldChainOptions.map((option) => (
            <button
              className={`h-11 rounded-md border px-3 text-sm font-bold transition ${
                form.coldChainType === option.value
                  ? "border-[#071f46] bg-[#071f46] text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-[#071f46]"
              }`}
              key={option.value}
              onClick={() => onChange({ ...form, coldChainType: option.value })}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      </Field>

      {errorMessage ? (
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
          {isSubmitting ? "저장 중" : editing ? "수정 저장" : "품목 등록"}
        </button>
      </div>
    </form>
  );
}

function ProductsList({
  filters,
  isLoading,
  onFilterChange,
  onFilterReset,
  onFilterSubmit,
  onEdit,
  page,
  pageResponse,
  setPage,
}: {
  filters: ProductFilterState;
  isLoading: boolean;
  onFilterChange: (filters: ProductFilterState) => void;
  onFilterReset: () => void;
  onFilterSubmit: () => void;
  onEdit: (product: VendorProductItem) => void;
  page: number;
  pageResponse: PageResponse<VendorProductItem> | null;
  setPage: (updater: (current: number) => number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid gap-4 border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">배송 품목 조회</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              전체 {formatNumber(pageResponse?.totalElements ?? 0)}건
            </p>
          </div>
          <Link
            className="inline-flex h-9 items-center justify-center rounded-md bg-[#071f46] px-3 text-sm font-bold text-white transition hover:bg-[#0a2d63]"
            href="/vendor/products/new"
          >
            등록
          </Link>
        </div>

        <div className="grid gap-2 xl:grid-cols-[1.2fr_1fr_1fr_1fr_auto_auto]">
          <input
            className={filterInputClassName}
            placeholder="품목명 검색"
            value={filters.name}
            onChange={(event) => onFilterChange({ ...filters, name: event.target.value })}
          />
          <select
            className={filterInputClassName}
            value={filters.category}
            onChange={(event) =>
              onFilterChange({ ...filters, category: event.target.value as ProductCategory | "" })
            }
          >
            <option value="">카테고리 전체</option>
            {productCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <select
            className={filterInputClassName}
            value={filters.boxSize}
            onChange={(event) =>
              onFilterChange({ ...filters, boxSize: event.target.value as BoxSize | "" })
            }
          >
            <option value="">규격 전체</option>
            {boxSizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={filterInputClassName}
            value={filters.coldChainType}
            onChange={(event) =>
              onFilterChange({
                ...filters,
                coldChainType: event.target.value as ColdChainType | "",
              })
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
            onClick={onFilterSubmit}
            type="button"
          >
            검색
          </button>
          <button
            className="h-11 rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:border-[#071f46] hover:text-[#071f46]"
            onClick={onFilterReset}
            type="button"
          >
            초기화
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 p-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="h-24 rounded-md bg-slate-100" key={index} />
          ))}
        </div>
      ) : pageResponse && pageResponse.items.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {pageResponse.items.map((product) => (
            <article
              className="grid gap-4 px-5 py-4 xl:grid-cols-[1.5fr_1fr_1fr_auto]"
              key={product.productId}
            >
              <div>
                <p className="text-sm font-bold text-slate-950">{product.name}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {categoryLabelMap[product.category]}
                </p>
                {product.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {product.description}
                  </p>
                ) : null}
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {formatAddress(product)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm xl:block">
                <Info label="평균 가격" value={formatCurrency(product.averagePrice)} />
                <Info label="평균 무게" value={formatWeight(product.averageWeightGram)} />
                <Info label="박스 규격" value={formatBoxSize(product.boxSize)} />
                <Info label="박스 수량" value={formatQuantity(product.boxQuantity)} />
                <Info label="낱개 수량" value={formatQuantity(product.itemQuantity)} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
                <Flag active={product.fragile} label="파손" />
                <Flag active={product.liquid} label="액체" />
                <Flag active={product.freshFood} label="신선" />
                <Flag
                  active={product.coldChainType !== "NONE"}
                  label={coldChainLabelMap[product.coldChainType]}
                />
              </div>
              <div className="flex items-start justify-end">
                <button
                  className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#071f46] hover:text-[#071f46]"
                  onClick={() => onEdit(product)}
                  type="button"
                >
                  수정
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="px-5 py-12 text-center">
          <p className="text-sm font-semibold text-slate-500">
            등록된 배송 품목이 없습니다.
          </p>
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mt-5 grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function BooleanField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
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
    <div className="mb-2">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Flag({ label, active }: { label: string; active: boolean }) {
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

function validateProductForm(form: ProductFormState): string {
  if (!form.name.trim()) {
    return "배송 품목명은 필수입니다.";
  }

  if (!form.destinationAddress.trim()) {
    return "배송 목적지 주소는 필수입니다.";
  }

  if (form.averagePrice && !isValidNumber(form.averagePrice)) {
    return "평균 상품 가격은 숫자로 입력해 주세요.";
  }

  if (form.averagePrice && Number(form.averagePrice) < 0) {
    return "평균 상품 가격은 0 이상이어야 합니다.";
  }

  if (form.averageWeightGram && !isValidNumber(form.averageWeightGram)) {
    return "평균 무게는 숫자로 입력해 주세요.";
  }

  if (form.averageWeightGram && Number(form.averageWeightGram) < 0) {
    return "평균 무게는 0 이상이어야 합니다.";
  }

  if (form.averageWeightGram && !Number.isInteger(Number(form.averageWeightGram))) {
    return "평균 무게는 정수로 입력해 주세요.";
  }

  if (form.boxQuantity && !Number.isInteger(Number(form.boxQuantity))) {
    return "박스 수량은 정수로 입력해 주세요.";
  }

  if (form.itemQuantity && !Number.isInteger(Number(form.itemQuantity))) {
    return "낱개 수량은 정수로 입력해 주세요.";
  }

  if (toRequiredQuantity(form.boxQuantity) + toRequiredQuantity(form.itemQuantity) <= 0) {
    return "박스 수량 또는 낱개 수량 중 하나는 1 이상이어야 합니다.";
  }

  return "";
}

function toProductFilterQuery(filters: ProductFilterState) {
  return {
    name: blankToUndefined(filters.name),
    category: filters.category || undefined,
    boxSize: filters.boxSize || undefined,
    coldChainType: filters.coldChainType || undefined,
  };
}

function isValidNumber(value: string): boolean {
  return Number.isFinite(Number(value));
}

function toProductRequest(form: ProductFormState): VendorProductRequest {
  return {
    category: form.category,
    name: form.name.trim(),
    description: blankToNull(form.description),
    averagePrice: numberToNullable(form.averagePrice),
    averageWeightGram: numberToNullable(form.averageWeightGram),
    boxSize: form.boxSize || null,
    boxQuantity: toRequiredQuantity(form.boxQuantity),
    itemQuantity: toRequiredQuantity(form.itemQuantity),
    destinationPostalCode: blankToNull(form.destinationPostalCode),
    destinationAddress: form.destinationAddress.trim(),
    destinationAddressDetail: blankToNull(form.destinationAddressDetail),
    fragile: form.fragile,
    liquid: form.liquid,
    freshFood: form.freshFood,
    coldChainType: form.coldChainType,
  };
}

function toFormState(product: VendorProductItem): ProductFormState {
  return {
    category: product.category,
    name: product.name,
    description: product.description ?? "",
    averagePrice: nullableToString(product.averagePrice),
    averageWeightGram: nullableToString(product.averageWeightGram),
    boxSize: product.boxSize ?? "",
    boxQuantity: String(product.boxQuantity),
    itemQuantity: String(product.itemQuantity),
    destinationPostalCode: product.destinationPostalCode ?? "",
    destinationAddress: product.destinationAddress,
    destinationAddressDetail: product.destinationAddressDetail ?? "",
    fragile: product.fragile,
    liquid: product.liquid,
    freshFood: product.freshFood,
    coldChainType: product.coldChainType,
  };
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function blankToUndefined(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed ? trimmed : undefined;
}

function numberToNullable(value: string): number | null {
  if (!value) {
    return null;
  }

  return Number(value);
}

function toRequiredQuantity(value: string): number {
  return value ? Number(value) : 0;
}

function normalizeNumericInput(value: string): string {
  const numericValue = value.replace(/,/g, "").replace(/[^\d.]/g, "");
  const [integerPart, ...decimalParts] = numericValue.split(".");

  if (decimalParts.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${decimalParts.join("")}`;
}

function formatNumericInput(value: string): string {
  if (!value) {
    return "";
  }

  const [integerPart, decimalPart] = value.split(".");
  const formattedInteger = Number(integerPart || 0).toLocaleString("ko-KR");

  if (decimalPart !== undefined) {
    return `${formattedInteger}.${decimalPart}`;
  }

  return formattedInteger;
}

function normalizeIntegerInput(value: string): string {
  return value.replace(/,/g, "").replace(/\D/g, "");
}

function formatIntegerInput(value: string): string {
  return value ? Number(value).toLocaleString("ko-KR") : "";
}

function nullableToString(value: number | null): string {
  return value === null ? "" : String(value);
}

function formatCurrency(value: number | null): string {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}원`;
}

function formatWeight(value: number | null): string {
  return value === null ? "-" : `${value.toLocaleString("ko-KR")}g`;
}

function formatBoxSize(value: BoxSize | null): string {
  return value ? boxSizeLabelMap[value] : "-";
}

function formatQuantity(value: number): string {
  return `${value.toLocaleString("ko-KR")}개`;
}

function formatAddress(product: VendorProductItem): string {
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

  return "배송 품목 정보를 처리하지 못했습니다.";
}

function isVendorProfileMissing(error: unknown): boolean {
  return error instanceof ApiError && error.code === "VENDOR_NOT_FOUND";
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#071f46] focus:ring-3 focus:ring-[#071f46]/10";

const filterInputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#071f46] focus:ring-3 focus:ring-[#071f46]/10";

const categoryLabelMap: Record<ProductCategory, string> = {
  CLOTHING: "의류/패션",
  GENERAL_GOODS: "생활용품/잡화",
  FOOD: "식품",
  ELECTRONICS: "전자제품",
  DOCUMENT: "문서/책자",
  COSMETIC: "화장품",
  ETC: "기타",
};

const coldChainLabelMap: Record<ColdChainType, string> = {
  NONE: "온도 관리 없음",
  REFRIGERATED: "냉장",
  FROZEN: "냉동",
};

const boxSizeLabelMap: Record<BoxSize, string> = {
  SIZE_60: "60사이즈",
  SIZE_80: "80사이즈",
  SIZE_100: "100사이즈",
  SIZE_120: "120사이즈",
  SIZE_140: "140사이즈",
  SIZE_160: "160사이즈",
  CUSTOM: "기타",
};
