"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ColdChainType, PageResponse } from "@/src/shared/api/types";
import { ProposalNegotiationPanel } from "@/src/features/proposals/ProposalNegotiationPanel";
import {
  getAgencyProposals,
  updateAgencyProposal,
  withdrawAgencyProposal,
  type AgencyProposalItem,
  type AgencyProposalRequest,
} from "./api";

type ProposalFormState = {
  unitPrice: string;
  pickupStartTime: string;
  pickupEndTime: string;
  saturdayDeliveryAvailable: boolean;
  returnAvailable: boolean;
  coldChainType: ColdChainType;
  memo: string;
};

const pageSize = 10;

const coldChainTypeLabels: Record<ColdChainType, string> = {
  NONE: "일반",
  REFRIGERATED: "냉장",
  FROZEN: "냉동",
};

export function AgencyProposalsView() {
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [pageResponse, setPageResponse] = useState<PageResponse<AgencyProposalItem> | null>(null);
  const [editingProposal, setEditingProposal] = useState<AgencyProposalItem | null>(null);
  const [form, setForm] = useState<ProposalFormState | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawingProposalId, setWithdrawingProposalId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchProposals() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await getAgencyProposals({ page, size: pageSize });

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

    fetchProposals();

    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  function openEditForm(proposal: AgencyProposalItem) {
    if (proposal.pendingNegotiationId) {
      setErrorMessage("응답 대기 중인 단가 조율이 있어 제안을 수정할 수 없습니다.");
      return;
    }

    setEditingProposal(proposal);
    setForm(toFormState(proposal));
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeEditForm() {
    setEditingProposal(null);
    setForm(null);
    setIsSubmitting(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingProposal || !form) {
      return;
    }

    const unitPrice = Number(normalizeIntegerInput(form.unitPrice));

    if (!unitPrice || unitPrice < 1) {
      setErrorMessage("제안 단가는 1원 이상 입력해야 합니다.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateAgencyProposal(editingProposal.proposalId, toProposalRequest(form));
      closeEditForm();
      setSuccessMessage("제안을 수정했습니다.");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleWithdraw(proposal: AgencyProposalItem) {
    if (proposal.pendingNegotiationId) {
      setErrorMessage("응답 대기 중인 단가 조율이 있어 제안을 철회할 수 없습니다.");
      return;
    }

    if (!window.confirm("제안을 철회할까요? 철회한 제안은 다시 수정할 수 없습니다.")) {
      return;
    }

    setWithdrawingProposalId(proposal.proposalId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await withdrawAgencyProposal(proposal.proposalId);
      setSuccessMessage("제안을 철회했습니다.");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setWithdrawingProposalId(null);
    }
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">내 제안</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              제출한 제안의 단가와 조건을 확인하고 진행중인 제안을 수정하거나 철회합니다.
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

      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="grid gap-3 p-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="h-28 rounded-md bg-slate-100" key={index} />
            ))}
          </div>
        ) : pageResponse && pageResponse.items.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {pageResponse.items.map((proposal) => (
              <ProposalCard
                isWithdrawing={withdrawingProposalId === proposal.proposalId}
                key={proposal.proposalId}
                onEdit={openEditForm}
                onNegotiationChanged={() => setReloadKey((current) => current + 1)}
                onWithdraw={handleWithdraw}
                proposal={proposal}
              />
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-slate-500">제출한 제안이 없습니다.</p>
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

      {editingProposal && form ? (
        <ProposalEditModal
          form={form}
          isSubmitting={isSubmitting}
          onChange={setForm}
          onClose={closeEditForm}
          onSubmit={handleSubmit}
          proposal={editingProposal}
        />
      ) : null}
    </section>
  );
}

function ProposalCard({
  isWithdrawing,
  onEdit,
  onNegotiationChanged,
  onWithdraw,
  proposal,
}: {
  isWithdrawing: boolean;
  onEdit: (proposal: AgencyProposalItem) => void;
  onNegotiationChanged: () => void;
  onWithdraw: (proposal: AgencyProposalItem) => void;
  proposal: AgencyProposalItem;
}) {
  const editable =
    (proposal.status === "SUBMITTED" || proposal.status === "NEGOTIATING") &&
    !proposal.pendingNegotiationId;

  return (
    <article className="grid gap-4 px-5 py-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{formatVendorName(proposal)}</h3>
            <span className="rounded-full bg-[#071f46]/10 px-2 py-1 text-xs font-bold text-[#071f46]">
              {formatProposalStatus(proposal.status)}
            </span>
            {proposal.agency ? (
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                {proposal.agency.agencyName}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{formatVendorSummary(proposal)}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="h-10 rounded-md border border-[#071f46] px-4 text-sm font-bold text-[#071f46] transition hover:bg-[#071f46]/5 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!editable}
            onClick={() => onEdit(proposal)}
            type="button"
          >
            수정
          </button>
          <button
            className="h-10 rounded-md border border-red-300 px-4 text-sm font-bold text-red-600 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!editable || isWithdrawing}
            onClick={() => onWithdraw(proposal)}
            type="button"
          >
            {isWithdrawing ? "철회 중" : "철회"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <InfoItem label="화주" value={formatVendorName(proposal)} />
        <InfoItem label="화주 지역" value={proposal.vendor?.mainRegion ?? "-"} />
        <InfoItem label="제안 단가" value={formatCurrency(proposal.unitPrice)} />
        <InfoItem label="최초 단가" value={formatCurrency(proposal.initialUnitPrice)} />
        <InfoItem label="합의 단가" value={formatCurrency(proposal.finalUnitPrice)} />
        <InfoItem label="픽업 시간" value={formatPickupTime(proposal)} />
        <InfoItem label="온도 관리" value={coldChainTypeLabels[proposal.coldChainType]} />
        <InfoItem label="처리 조건" value={formatServiceOptions(proposal)} />
      </div>

      {proposal.memo ? (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
          {proposal.memo}
        </p>
      ) : null}

      <ProposalNegotiationPanel
        myRole="AGENCY"
        onChanged={onNegotiationChanged}
        pendingNegotiationId={proposal.pendingNegotiationId}
        proposalId={proposal.proposalId}
        proposalStatus={proposal.status}
      />
    </article>
  );
}

function ProposalEditModal({
  form,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
  proposal,
}: {
  form: ProposalFormState;
  isSubmitting: boolean;
  onChange: (form: ProposalFormState) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  proposal: AgencyProposalItem;
}) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 px-4 py-6">
      <form
        className="grid max-h-[90vh] w-full max-w-2xl gap-5 overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold text-slate-400">제안 수정</p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">{formatVendorName(proposal)}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              제출 상태의 제안만 수정할 수 있습니다.
            </p>
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
              inputMode="numeric"
              value={formatIntegerInput(form.unitPrice)}
              onChange={(event) =>
                onChange({ ...form, unitPrice: normalizeIntegerInput(event.target.value) })
              }
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
            {isSubmitting ? "수정 중" : "제안 수정"}
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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-3 py-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function toFormState(proposal: AgencyProposalItem): ProposalFormState {
  return {
    unitPrice: String(proposal.unitPrice),
    pickupStartTime: proposal.pickupStartTime ?? "",
    pickupEndTime: proposal.pickupEndTime ?? "",
    saturdayDeliveryAvailable: proposal.saturdayDeliveryAvailable,
    returnAvailable: proposal.returnAvailable,
    coldChainType: proposal.coldChainType,
    memo: proposal.memo ?? "",
  };
}

function toProposalRequest(form: ProposalFormState): AgencyProposalRequest {
  return {
    unitPrice: Number(normalizeIntegerInput(form.unitPrice)),
    pickupStartTime: blankToNull(form.pickupStartTime),
    pickupEndTime: blankToNull(form.pickupEndTime),
    saturdayDeliveryAvailable: form.saturdayDeliveryAvailable,
    returnAvailable: form.returnAvailable,
    coldChainType: form.coldChainType,
    memo: blankToNull(form.memo),
  };
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

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  return value.toLocaleString("ko-KR");
}

function formatCurrency(value: number | null | undefined): string {
  return value === null || value === undefined ? "-" : `${formatNumber(value)}원`;
}

function formatPickupTime(proposal: AgencyProposalItem): string {
  if (!proposal.pickupStartTime && !proposal.pickupEndTime) {
    return "-";
  }

  return `${proposal.pickupStartTime ?? "-"} ~ ${proposal.pickupEndTime ?? "-"}`;
}

function formatServiceOptions(proposal: AgencyProposalItem): string {
  return [
    proposal.saturdayDeliveryAvailable ? "토요일 배송 가능" : "토요일 배송 불가",
    proposal.returnAvailable ? "반품 가능" : "반품 불가",
  ].join(" / ");
}

function formatVendorName(proposal: AgencyProposalItem): string {
  return proposal.vendor?.businessName ?? "화주 정보 없음";
}

function formatVendorSummary(proposal: AgencyProposalItem): string {
  if (!proposal.vendor) {
    return "화주 정보가 응답에 포함되지 않았습니다.";
  }

  return `${proposal.vendor.mainRegion} / ${proposal.vendor.phoneNumber}`;
}

function formatProposalStatus(status: AgencyProposalItem["status"]): string {
  const labels: Record<string, string> = {
    SUBMITTED: "제안 제출",
    WITHDRAWN: "철회됨",
    ACCEPTED: "수락됨",
    REJECTED: "거절됨",
    NEGOTIATING: "단가 조율중",
  };

  return labels[status] ?? status;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "제안을 처리하지 못했습니다.";
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#071f46] focus:ring-3 focus:ring-[#071f46]/10";
