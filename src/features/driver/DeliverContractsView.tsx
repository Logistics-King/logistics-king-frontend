"use client";

import { FormEvent, useEffect, useState } from "react";
import { ProfileRequiredNotice } from "@/src/shared/profile/ProfileRequiredNotice";
import {
  acceptDeliverContract,
  cancelDeliverContract,
  createDeliverContract,
  getAgencyDeliverContracts,
  getAgencyDelivers,
  getDriverDeliverContracts,
  getFreelancerDelivers,
  rejectDeliverContract,
  updateDeliverContract,
  type DeliverContractFilters,
  type DeliverContractItem,
  type DeliverContractRequest,
  type DeliverContractStatus,
  type DeliverContractUpdateRequest,
  type DeliverSummary,
} from "./api";

type DeliverContractsViewProps = {
  mode: "AGENCY" | "DRIVER";
};

type ContractFilterFormState = {
  status: "" | DeliverContractStatus;
  serviceRegion: string;
  startDateFrom: string;
  startDateTo: string;
};

type DriverFilterFormState = {
  source: "AGENCY_AFFILIATED" | "FREELANCER";
  active: "" | "true" | "false";
  serviceRegion: string;
  driverName: string;
  vehicleNumber: string;
};

type ContractFormState = {
  deliverId: string;
  serviceRegion: string;
  expectedMonthlyVolume: string;
  unitPrice: string;
  startDate: string;
  endDate: string;
  memo: string;
};

const pageSize = 10;

const initialContractFilters: ContractFilterFormState = {
  status: "",
  serviceRegion: "",
  startDateFrom: "",
  startDateTo: "",
};

const initialDriverFilters: DriverFilterFormState = {
  source: "AGENCY_AFFILIATED",
  active: "",
  serviceRegion: "",
  driverName: "",
  vehicleNumber: "",
};

const initialContractForm: ContractFormState = {
  deliverId: "",
  serviceRegion: "",
  expectedMonthlyVolume: "",
  unitPrice: "",
  startDate: "",
  endDate: "",
  memo: "",
};

export function DeliverContractsView({ mode }: DeliverContractsViewProps) {
  const [page, setPage] = useState(0);
  const [contracts, setContracts] = useState<DeliverContractItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [contractFilters, setContractFilters] =
    useState<ContractFilterFormState>(initialContractFilters);
  const [appliedContractFilters, setAppliedContractFilters] =
    useState<ContractFilterFormState>(initialContractFilters);
  const [driverFilters, setDriverFilters] = useState<DriverFilterFormState>(initialDriverFilters);
  const [drivers, setDrivers] = useState<DeliverSummary[]>([]);
  const [form, setForm] = useState<ContractFormState | null>(null);
  const [editingContractId, setEditingContractId] = useState<string | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchContracts() {
      setIsLoading(true);
      setErrorMessage("");
      setNeedsProfile(false);

      try {
        const query = {
          page,
          size: pageSize,
          ...toContractFilters(appliedContractFilters),
        };
        const response =
          mode === "AGENCY"
            ? await getAgencyDeliverContracts(query)
            : await getDriverDeliverContracts(query);

        if (active) {
          setContracts(response.items);
          setTotalElements(response.totalElements);
          setTotalPages(response.totalPages);
          setHasPrevious(response.hasPrevious);
          setHasNext(response.hasNext);
        }
      } catch (error) {
        if (active) {
          setNeedsProfile(isProfileMissing(error));
          setErrorMessage(getErrorMessage(error));
          setContracts([]);
          setTotalElements(0);
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
  }, [appliedContractFilters, mode, page]);

  useEffect(() => {
    if (mode !== "AGENCY") {
      return;
    }

    let active = true;

    async function fetchDrivers() {
      try {
        const query = {
          page: 0,
          size: 50,
          ...toDriverFilters(driverFilters),
        };
        const response =
          driverFilters.source === "FREELANCER"
            ? await getFreelancerDelivers(query)
            : await getAgencyDelivers(query);

        if (active) {
          setDrivers(response.items);
        }
      } catch {
        if (active) {
          setDrivers([]);
        }
      }
    }

    fetchDrivers();

    return () => {
      active = false;
    };
  }, [driverFilters, mode]);

  function handleContractFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setAppliedContractFilters(contractFilters);
  }

  function openCreateForm() {
    setEditingContractId(null);
    setForm(initialContractForm);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function openEditForm(contract: DeliverContractItem) {
    setEditingContractId(contract.deliverContractId);
    setForm(toFormState(contract));
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeForm() {
    setForm(null);
    setEditingContractId(null);
    setIsSubmitting(false);
  }

  async function handleSubmitContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    const validationMessage = validateContractForm(form, editingContractId === null);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (editingContractId) {
        await updateDeliverContract(editingContractId, toUpdateRequest(form));
        setSuccessMessage("기사 계약을 수정했습니다.");
      } else {
        await createDeliverContract(toCreateRequest(form));
        setSuccessMessage("기사 계약을 요청했습니다.");
      }

      closeForm();
      setPage(0);
      setAppliedContractFilters({ ...appliedContractFilters });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAction(contract: DeliverContractItem, action: "accept" | "cancel" | "reject") {
    const confirmMessage = {
      accept: "기사 계약을 수락할까요?",
      cancel: "기사 계약 요청을 취소할까요?",
      reject: "기사 계약을 거절할까요?",
    }[action];

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setActingId(contract.deliverContractId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (action === "accept") {
        await acceptDeliverContract(contract.deliverContractId);
        setSuccessMessage("기사 계약을 수락했습니다.");
      } else if (action === "reject") {
        await rejectDeliverContract(contract.deliverContractId);
        setSuccessMessage("기사 계약을 거절했습니다.");
      } else {
        await cancelDeliverContract(contract.deliverContractId);
        setSuccessMessage("기사 계약 요청을 취소했습니다.");
      }

      setAppliedContractFilters({ ...appliedContractFilters });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActingId(null);
    }
  }

  return (
    <section className="grid gap-4">
      <form
        className="grid gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm"
        onSubmit={handleContractFilterSubmit}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-slate-700">기사 계약 기준 조회 중입니다.</span>
            <span className="rounded-md bg-[#071f46]/10 px-2.5 py-1 font-bold text-[#071f46]">
              전체 {formatNumber(totalElements)}건
            </span>
          </div>
          {mode === "AGENCY" ? (
            <button
              className="h-10 rounded-md bg-[#071f46] px-4 text-sm font-bold text-white transition hover:bg-[#0a2d63]"
              onClick={openCreateForm}
              type="button"
            >
              기사 계약 요청
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-4">
          <Field label="상태">
            <select
              className={inputClassName}
              value={contractFilters.status}
              onChange={(event) =>
                setContractFilters({
                  ...contractFilters,
                  status: event.target.value as "" | DeliverContractStatus,
                })
              }
            >
              <option value="">전체</option>
              <option value="REQUESTED">요청됨</option>
              <option value="ACCEPTED">수락됨</option>
              <option value="REJECTED">거절됨</option>
              <option value="CANCELLED">취소됨</option>
            </select>
          </Field>
          <TextField
            label="담당 지역"
            value={contractFilters.serviceRegion}
            onChange={(value) => setContractFilters({ ...contractFilters, serviceRegion: value })}
          />
          <TextField
            label="시작일 From"
            type="date"
            value={contractFilters.startDateFrom}
            onChange={(value) => setContractFilters({ ...contractFilters, startDateFrom: value })}
          />
          <TextField
            label="시작일 To"
            type="date"
            value={contractFilters.startDateTo}
            onChange={(value) => setContractFilters({ ...contractFilters, startDateTo: value })}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            className="h-10 rounded-md border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:border-slate-500"
            onClick={() => {
              setContractFilters(initialContractFilters);
              setAppliedContractFilters(initialContractFilters);
              setPage(0);
            }}
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
      </form>

      {mode === "AGENCY" ? (
        <section className="grid gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm font-bold text-slate-950">기사 찾기</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              aria-pressed={driverFilters.source === "AGENCY_AFFILIATED"}
              className={`rounded-md border px-4 py-3 text-left text-sm font-bold transition ${
                driverFilters.source === "AGENCY_AFFILIATED"
                  ? "border-[#071f46] bg-[#071f46]/5 text-[#071f46]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
              }`}
              onClick={() => setDriverFilters({ ...driverFilters, source: "AGENCY_AFFILIATED" })}
              type="button"
            >
              소속 기사
              <span className="mt-1 block text-xs font-semibold text-slate-500">
                우리 대리점에 소속된 기사입니다.
              </span>
            </button>
            <button
              aria-pressed={driverFilters.source === "FREELANCER"}
              className={`rounded-md border px-4 py-3 text-left text-sm font-bold transition ${
                driverFilters.source === "FREELANCER"
                  ? "border-[#071f46] bg-[#071f46]/5 text-[#071f46]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
              }`}
              onClick={() => setDriverFilters({ ...driverFilters, source: "FREELANCER" })}
              type="button"
            >
              프리랜서 기사
              <span className="mt-1 block text-xs font-semibold text-slate-500">
                외부 프리랜서 기사 후보입니다.
              </span>
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Field label="활동 상태">
              <select
                className={inputClassName}
                value={driverFilters.active}
                onChange={(event) =>
                  setDriverFilters({
                    ...driverFilters,
                    active: event.target.value as DriverFilterFormState["active"],
                  })
                }
              >
                <option value="">전체</option>
                <option value="true">활동 가능</option>
                <option value="false">비활성</option>
              </select>
            </Field>
            <TextField
              label="담당 지역"
              value={driverFilters.serviceRegion}
              onChange={(value) => setDriverFilters({ ...driverFilters, serviceRegion: value })}
            />
            <TextField
              label="기사명"
              value={driverFilters.driverName}
              onChange={(value) => setDriverFilters({ ...driverFilters, driverName: value })}
            />
            <TextField
              label="차량번호"
              value={driverFilters.vehicleNumber}
              onChange={(value) => setDriverFilters({ ...driverFilters, vehicleNumber: value })}
            />
          </div>
        </section>
      ) : null}

      {needsProfile ? <ProfileRequiredNotice role={mode === "DRIVER" ? "DRIVER" : "AGENCY"} /> : null}

      {errorMessage && !needsProfile ? (
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
        ) : contracts.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {contracts.map((contract) => (
              <DeliverContractCard
                acting={actingId === contract.deliverContractId}
                contract={contract}
                key={contract.deliverContractId}
                mode={mode}
                onAccept={() => handleAction(contract, "accept")}
                onCancel={() => handleAction(contract, "cancel")}
                onEdit={() => openEditForm(contract)}
                onReject={() => handleAction(contract, "reject")}
              />
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-slate-500">조회된 기사 계약이 없습니다.</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
          <p className="text-sm text-slate-500">
            {formatNumber(page + 1)} / {formatNumber(Math.max(totalPages, 1))}
          </p>
          <div className="flex gap-2">
            <button
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:text-slate-300"
              disabled={!hasPrevious || isLoading}
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              type="button"
            >
              이전
            </button>
            <button
              className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:text-slate-300"
              disabled={!hasNext || isLoading}
              onClick={() => setPage((current) => current + 1)}
              type="button"
            >
              다음
            </button>
          </div>
        </div>
      </div>

      {form && mode === "AGENCY" ? (
        <DeliverContractModal
          drivers={drivers}
          editing={editingContractId !== null}
          form={form}
          isSubmitting={isSubmitting}
          onChange={setForm}
          onClose={closeForm}
          onSubmit={handleSubmitContract}
        />
      ) : null}
    </section>
  );
}

function DeliverContractCard({
  acting,
  contract,
  mode,
  onAccept,
  onCancel,
  onEdit,
  onReject,
}: {
  acting: boolean;
  contract: DeliverContractItem;
  mode: "AGENCY" | "DRIVER";
  onAccept: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onReject: () => void;
}) {
  const canChange = contract.status === "REQUESTED";

  return (
    <article className="grid gap-4 px-5 py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">
              {mode === "AGENCY"
                ? contract.deliver?.driverName ?? "기사 정보 없음"
                : contract.agency?.agencyName ?? "대리점 정보 없음"}
            </h3>
            <span
              className={`rounded-full px-2 py-1 text-xs font-bold ${getStatusClassName(
                contract.status,
              )}`}
            >
              {formatStatus(contract.status)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {contract.serviceRegion} / {formatDateRange(contract.startDate, contract.endDate)}
          </p>
        </div>
        <div className="rounded-md bg-[#071f46]/10 px-4 py-3 text-right text-sm font-bold text-[#071f46]">
          {formatCurrency(contract.unitPrice)}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <InfoItem label="예상 월 물량" value={`${formatNumber(contract.expectedMonthlyVolume)}개`} />
        <InfoItem label="기사" value={formatDeliver(contract.deliver)} />
        <InfoItem label="대리점" value={formatAgency(contract.agency)} />
        <InfoItem label="차량번호" value={contract.deliver?.vehicleNumber ?? "-"} />
      </div>

      {contract.memo ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
          {contract.memo}
        </p>
      ) : null}

      {canChange ? (
        <div className="flex flex-wrap justify-end gap-2">
          {mode === "AGENCY" ? (
            <>
              <button
                className="h-10 rounded-md border border-[#071f46] px-4 text-sm font-bold text-[#071f46] transition hover:bg-[#071f46]/5 disabled:opacity-50"
                disabled={acting}
                onClick={onEdit}
                type="button"
              >
                수정
              </button>
              <button
                className="h-10 rounded-md border border-red-300 px-4 text-sm font-bold text-red-600 transition hover:border-red-500 disabled:opacity-50"
                disabled={acting}
                onClick={onCancel}
                type="button"
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                className="h-10 rounded-md border border-red-300 px-4 text-sm font-bold text-red-600 transition hover:border-red-500 disabled:opacity-50"
                disabled={acting}
                onClick={onReject}
                type="button"
              >
                거절
              </button>
              <button
                className="h-10 rounded-md bg-[#071f46] px-4 text-sm font-bold text-white transition hover:bg-[#0a2d63] disabled:bg-slate-400"
                disabled={acting}
                onClick={onAccept}
                type="button"
              >
                수락
              </button>
            </>
          )}
        </div>
      ) : null}
    </article>
  );
}

function DeliverContractModal({
  drivers,
  editing,
  form,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
}: {
  drivers: DeliverSummary[];
  editing: boolean;
  form: ContractFormState;
  isSubmitting: boolean;
  onChange: (form: ContractFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 px-4 py-6">
      <form
        className="grid max-h-[90vh] w-full max-w-2xl gap-5 overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold text-slate-400">기사 계약</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {editing ? "기사 계약 수정" : "기사 계약 요청"}
            </h2>
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
          <Field label="배송기사">
            <select
              className={inputClassName}
              disabled={editing}
              value={form.deliverId}
              onChange={(event) => onChange({ ...form, deliverId: event.target.value })}
            >
              <option value="">선택</option>
              {drivers.map((driver) => (
                <option key={driver.deliverId} value={driver.deliverId}>
                  {driver.driverName} / {driver.vehicleNumber} /{" "}
                  {formatEmploymentType(driver.employmentType)}
                </option>
              ))}
            </select>
          </Field>
          <TextField
            label="담당 지역"
            value={form.serviceRegion}
            onChange={(value) => onChange({ ...form, serviceRegion: value })}
          />
          <TextField
            inputMode="numeric"
            label="예상 월 물량"
            value={formatIntegerInput(form.expectedMonthlyVolume)}
            onChange={(value) =>
              onChange({ ...form, expectedMonthlyVolume: normalizeIntegerInput(value) })
            }
          />
          <TextField
            inputMode="numeric"
            label="단가"
            value={formatIntegerInput(form.unitPrice)}
            onChange={(value) => onChange({ ...form, unitPrice: normalizeIntegerInput(value) })}
          />
          <TextField
            label="시작일"
            type="date"
            value={form.startDate}
            onChange={(value) => onChange({ ...form, startDate: value })}
          />
          <TextField
            label="종료일"
            type="date"
            value={form.endDate}
            onChange={(value) => onChange({ ...form, endDate: value })}
          />
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">메모</span>
          <textarea
            className={`${inputClassName} min-h-24 resize-y py-3`}
            value={form.memo}
            onChange={(event) => onChange({ ...form, memo: event.target.value })}
          />
        </label>

        <div className="flex justify-end">
          <button
            className="h-11 rounded-md bg-[#071f46] px-5 text-sm font-bold text-white transition hover:bg-[#0a2d63] disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "저장 중" : editing ? "수정 저장" : "계약 요청"}
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

function TextField({
  inputMode,
  label,
  type = "text",
  value,
  onChange,
}: {
  inputMode?: "numeric";
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        className={inputClassName}
        inputMode={inputMode}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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

function toContractFilters(form: ContractFilterFormState): DeliverContractFilters {
  return {
    status: form.status || undefined,
    serviceRegion: form.serviceRegion.trim() || undefined,
    startDateFrom: form.startDateFrom || undefined,
    startDateTo: form.startDateTo || undefined,
  };
}

function toDriverFilters(form: DriverFilterFormState) {
  return {
    active: form.active === "" ? undefined : form.active === "true",
    serviceRegion: form.serviceRegion.trim() || undefined,
    driverName: form.driverName.trim() || undefined,
    vehicleNumber: form.vehicleNumber.trim() || undefined,
  };
}

function toCreateRequest(form: ContractFormState): DeliverContractRequest {
  return {
    deliverId: form.deliverId.trim(),
    ...toUpdateRequest(form),
  };
}

function toUpdateRequest(form: ContractFormState): DeliverContractUpdateRequest {
  return {
    serviceRegion: form.serviceRegion.trim(),
    expectedMonthlyVolume: Number(form.expectedMonthlyVolume),
    unitPrice: Number(form.unitPrice),
    startDate: form.startDate,
    endDate: form.endDate,
    memo: blankToNull(form.memo),
  };
}

function toFormState(contract: DeliverContractItem): ContractFormState {
  return {
    deliverId: contract.deliverId,
    serviceRegion: contract.serviceRegion,
    expectedMonthlyVolume: String(contract.expectedMonthlyVolume),
    unitPrice: String(contract.unitPrice),
    startDate: contract.startDate,
    endDate: contract.endDate,
    memo: contract.memo ?? "",
  };
}

function validateContractForm(form: ContractFormState, needsDeliverId: boolean): string {
  if (needsDeliverId && !form.deliverId.trim()) {
    return "배송기사를 선택해 주세요.";
  }

  if (!form.serviceRegion.trim()) {
    return "담당 지역은 필수입니다.";
  }

  if (!Number(form.expectedMonthlyVolume) || Number(form.expectedMonthlyVolume) < 1) {
    return "예상 월 물량은 1 이상이어야 합니다.";
  }

  if (!Number(form.unitPrice) || Number(form.unitPrice) < 1) {
    return "단가는 1원 이상이어야 합니다.";
  }

  if (!form.startDate || !form.endDate || form.startDate > form.endDate) {
    return "계약 기간을 올바르게 입력해 주세요.";
  }

  return "";
}

function formatAgency(agency: DeliverContractItem["agency"]): string {
  return agency ? `${agency.agencyName} / ${agency.carrier}` : "-";
}

function formatDeliver(deliver: DeliverContractItem["deliver"]): string {
  return deliver
    ? `${deliver.driverName} / ${deliver.phoneNumber} / ${formatEmploymentType(
        deliver.employmentType,
      )}`
    : "-";
}

function formatEmploymentType(employmentType: DeliverSummary["employmentType"]): string {
  const labels: Record<DeliverSummary["employmentType"], string> = {
    AGENCY_AFFILIATED: "소속",
    FREELANCER: "프리랜서",
  };

  return labels[employmentType];
}

function formatStatus(status: DeliverContractStatus): string {
  const labels: Record<DeliverContractStatus, string> = {
    REQUESTED: "요청됨",
    ACCEPTED: "수락됨",
    REJECTED: "거절됨",
    CANCELLED: "취소됨",
  };

  return labels[status];
}

function getStatusClassName(status: DeliverContractStatus): string {
  const classNames: Record<DeliverContractStatus, string> = {
    REQUESTED: "bg-amber-50 text-amber-700",
    ACCEPTED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-red-700",
    CANCELLED: "bg-red-50 text-red-700",
  };

  return classNames[status];
}

function formatDateRange(from: string, to: string): string {
  return `${from} ~ ${to}`;
}

function formatCurrency(value: number): string {
  return `${formatNumber(value)}원`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

function normalizeIntegerInput(value: string): string {
  return value.replace(/,/g, "").replace(/\D/g, "");
}

function formatIntegerInput(value: string): string {
  return value ? Number(value).toLocaleString("ko-KR") : "";
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function isProfileMissing(error: unknown): boolean {
  if (!(error instanceof Error) || !("code" in error)) {
    return false;
  }

  const code = String((error as Error & { code?: string }).code);

  return code === "DELIVER_NOT_FOUND" || code === "DELIVER_CONTRACT_AGENCY_NOT_FOUND";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "기사 계약을 처리하지 못했습니다.";
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#071f46]";
