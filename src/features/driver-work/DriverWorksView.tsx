"use client";

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { getAgencyContracts } from "@/src/features/agency/api";
import type { ContractListItem } from "@/src/features/contracts/types";
import { getAgencyDelivers, type DeliverSummary } from "@/src/features/driver/api";
import {
  applyDriverWork,
  assignDriverWork,
  cancelDriverWork,
  completeDriverWork,
  createDriverWork,
  getAgencyDriverWorks,
  getDriverAssignedWorks,
  getDriverOpenWorks,
  getDriverWorkApplications,
  getMyDriverWorkApplications,
  selectDriverWorkApplication,
  withdrawMyDriverWorkApplication,
  type DriverWorkApplication,
  type DriverWorkApplicationStatus,
  type DriverWorkDetail,
  type DriverWorkRequest,
  type DriverWorkStatus,
} from "./api";

type DriverWorksViewProps = {
  mode: "AGENCY" | "DRIVER";
};

type FilterState = {
  status: "" | DriverWorkStatus;
  serviceRegion: string;
  pickupStartDateFrom: string;
  pickupStartDateTo: string;
};

type CreateFormState = {
  contractId: string;
  title: string;
  serviceRegion: string;
  pickupStartDate: string;
  pickupEndDate: string;
  expectedVolume: string;
  unitPrice: string;
  assignedDeliverId: string;
  memo: string;
};

const pageSize = 10;

const initialFilters: FilterState = {
  status: "",
  serviceRegion: "",
  pickupStartDateFrom: "",
  pickupStartDateTo: "",
};

const initialCreateForm: CreateFormState = {
  contractId: "",
  title: "",
  serviceRegion: "",
  pickupStartDate: "",
  pickupEndDate: "",
  expectedVolume: "",
  unitPrice: "",
  assignedDeliverId: "",
  memo: "",
};

export function DriverWorksView({ mode }: DriverWorksViewProps) {
  const [tab, setTab] = useState<"OPEN" | "ASSIGNED" | "APPLICATIONS">("OPEN");
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(initialFilters);
  const [works, setWorks] = useState<DriverWorkDetail[]>([]);
  const [applications, setApplications] = useState<DriverWorkApplication[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [drivers, setDrivers] = useState<DeliverSummary[]>([]);
  const [form, setForm] = useState<CreateFormState | null>(null);
  const [applicantWork, setApplicantWork] = useState<DriverWorkDetail | null>(null);
  const [applicantList, setApplicantList] = useState<DriverWorkApplication[]>([]);
  const [assignWork, setAssignWork] = useState<DriverWorkDetail | null>(null);
  const [assignDeliverId, setAssignDeliverId] = useState("");
  const [applyWork, setApplyWork] = useState<DriverWorkDetail | null>(null);
  const [applyMemo, setApplyMemo] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const isAgencyMode = mode === "AGENCY";
  const visibleWorks = tab === "APPLICATIONS" ? [] : works;

  useEffect(() => {
    let active = true;

    async function fetchWorks() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        if (!isAgencyMode && tab === "APPLICATIONS") {
          const response = await getMyDriverWorkApplications({ page, size: pageSize });

          if (active) {
            setApplications(response.contents);
            setWorks([]);
            setTotalElements(response.totalElements);
            setTotalPages(response.totalPages);
          }
          return;
        }

        const query = {
          page,
          size: pageSize,
          ...toApiFilters(
            appliedFilters,
            !isAgencyMode && tab !== "APPLICATIONS" ? tab : undefined,
          ),
        };
        const response = isAgencyMode
          ? await getAgencyDriverWorks(query)
          : tab === "OPEN"
            ? await getDriverOpenWorks(query)
            : await getDriverAssignedWorks(query);

        if (active) {
          setWorks(response.contents);
          setApplications([]);
          setTotalElements(response.totalElements);
          setTotalPages(response.totalPages);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error));
          setWorks([]);
          setApplications([]);
          setTotalElements(0);
          setTotalPages(1);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchWorks();

    return () => {
      active = false;
    };
  }, [appliedFilters, isAgencyMode, page, tab]);

  useEffect(() => {
    if (!isAgencyMode) {
      return;
    }

    let active = true;

    async function fetchAgencyData() {
      try {
        const [contractResponse, driverResponse] = await Promise.all([
          getAgencyContracts({ page: 0, size: 50 }),
          getAgencyDelivers({ page: 0, size: 50, active: true }),
        ]);

        if (active) {
          setContracts(contractResponse.items);
          setDrivers(driverResponse.items);
        }
      } catch {
        if (active) {
          setContracts([]);
          setDrivers([]);
        }
      }
    }

    fetchAgencyData();

    return () => {
      active = false;
    };
  }, [isAgencyMode]);

  useEffect(() => {
    if (!applicantWork) {
      return;
    }

    let active = true;
    const driverWorkId = applicantWork.driverWorkId;

    async function fetchApplicants() {
      try {
        const response = await getDriverWorkApplications(driverWorkId, {
          page: 0,
          size: 50,
        });

        if (active) {
          setApplicantList(response.contents);
        }
      } catch (error) {
        if (active) {
          setErrorMessage(getErrorMessage(error));
          setApplicantList([]);
        }
      }
    }

    fetchApplicants();

    return () => {
      active = false;
    };
  }, [applicantWork]);

  const selectedContract = useMemo(
    () => contracts.find((contract) => contract.contractId === form?.contractId) ?? null,
    [contracts, form?.contractId],
  );

  function handleFilterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setAppliedFilters(filters);
  }

  function handleTabChange(nextTab: "OPEN" | "ASSIGNED" | "APPLICATIONS") {
    setTab(nextTab);
    setPage(0);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function openCreateForm() {
    setForm(initialCreateForm);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function closeCreateForm() {
    setForm(null);
    setIsSubmitting(false);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form) {
      return;
    }

    const validationMessage = validateCreateForm(form);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await createDriverWork(toCreateRequest(form));
      closeCreateForm();
      setSuccessMessage("기사 일감을 등록했습니다.");
      setPage(0);
      setAppliedFilters({ ...appliedFilters });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSelectApplication(application: DriverWorkApplication) {
    if (!applicantWork) {
      return;
    }

    setActingId(application.applicationId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await selectDriverWorkApplication(applicantWork.driverWorkId, application.applicationId);
      setApplicantWork(null);
      setApplicantList([]);
      setSuccessMessage("신청자를 선택했습니다.");
      setAppliedFilters({ ...appliedFilters });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActingId(null);
    }
  }

  async function handleAssign() {
    if (!assignWork || !assignDeliverId) {
      setErrorMessage("배정할 배송기사를 선택하세요.");
      return;
    }

    setActingId(assignWork.driverWorkId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await assignDriverWork(assignWork.driverWorkId, assignDeliverId);
      setAssignWork(null);
      setAssignDeliverId("");
      setSuccessMessage("배송기사를 배정했습니다.");
      setAppliedFilters({ ...appliedFilters });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActingId(null);
    }
  }

  async function handleStatusAction(work: DriverWorkDetail, action: "CANCEL" | "COMPLETE") {
    setActingId(work.driverWorkId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (action === "CANCEL") {
        await cancelDriverWork(work.driverWorkId);
        setSuccessMessage("기사 일감을 취소했습니다.");
      } else {
        await completeDriverWork(work.driverWorkId);
        setSuccessMessage("기사 일감을 완료 처리했습니다.");
      }
      setAppliedFilters({ ...appliedFilters });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActingId(null);
    }
  }

  async function handleApply() {
    if (!applyWork) {
      return;
    }

    setActingId(applyWork.driverWorkId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await applyDriverWork(applyWork.driverWorkId, applyMemo.trim() || null);
      setApplyWork(null);
      setApplyMemo("");
      setSuccessMessage("기사 일감에 신청했습니다.");
      setAppliedFilters({ ...appliedFilters });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActingId(null);
    }
  }

  async function handleWithdraw(application: DriverWorkApplication) {
    setActingId(application.applicationId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await withdrawMyDriverWorkApplication(application.driverWorkId);
      setSuccessMessage("신청을 철회했습니다.");
      setAppliedFilters({ ...appliedFilters });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setActingId(null);
    }
  }

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500">
              {isAgencyMode ? "소속 기사 배정" : "소속 대리점 일감"}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-950">
              {isAgencyMode ? "기사 일감 관리" : "기사 일감"}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
              총 {formatNumber(totalElements)}건
            </span>
            {isAgencyMode ? (
              <button className={primaryButtonClassName} onClick={openCreateForm} type="button">
                일감 등록
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {!isAgencyMode ? (
        <div className="flex flex-wrap gap-2">
          {[
            ["OPEN", "신청 가능"],
            ["ASSIGNED", "내 할당"],
            ["APPLICATIONS", "내 신청"],
          ].map(([value, label]) => (
            <button
              className={`h-10 rounded-md border px-4 text-sm font-bold transition ${
                tab === value
                  ? "border-[#071f46] bg-[#071f46] text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
              }`}
              key={value}
              onClick={() => handleTabChange(value as "OPEN" | "ASSIGNED" | "APPLICATIONS")}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {tab !== "APPLICATIONS" ? (
        <form
          className="grid gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[160px_1fr_160px_160px_auto]"
          onSubmit={handleFilterSubmit}
        >
          {isAgencyMode ? (
            <SelectField
              label="상태"
              onChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  status: value as "" | DriverWorkStatus,
                }))
              }
              value={filters.status}
            >
              <option value="">전체</option>
              <option value="OPEN">공개</option>
              <option value="ASSIGNED">배정됨</option>
              <option value="CANCELLED">취소됨</option>
              <option value="COMPLETED">완료</option>
            </SelectField>
          ) : (
            <div className="hidden lg:block" />
          )}
          <TextField
            label="담당 지역"
            onChange={(value) => setFilters((current) => ({ ...current, serviceRegion: value }))}
            placeholder="예: 대전 유성구"
            value={filters.serviceRegion}
          />
          <TextField
            label="시작일 From"
            onChange={(value) =>
              setFilters((current) => ({ ...current, pickupStartDateFrom: value }))
            }
            type="date"
            value={filters.pickupStartDateFrom}
          />
          <TextField
            label="시작일 To"
            onChange={(value) =>
              setFilters((current) => ({ ...current, pickupStartDateTo: value }))
            }
            type="date"
            value={filters.pickupStartDateTo}
          />
          <button className={`${secondaryButtonClassName} self-end`} type="submit">
            조회
          </button>
        </form>
      ) : null}

      {errorMessage ? <Alert tone="error">{errorMessage}</Alert> : null}
      {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="grid gap-3 p-5">
            <div className="h-24 rounded-md bg-slate-100" />
            <div className="h-24 rounded-md bg-slate-100" />
            <div className="h-24 rounded-md bg-slate-100" />
          </div>
        ) : tab === "APPLICATIONS" ? (
          applications.length === 0 ? (
            <EmptyState message="신청한 기사 일감이 없습니다." />
          ) : (
            applications.map((application) => (
              <ApplicationCard
                application={application}
                isActing={actingId === application.applicationId}
                key={application.applicationId}
                onWithdraw={handleWithdraw}
              />
            ))
          )
        ) : visibleWorks.length === 0 ? (
          <EmptyState message={isAgencyMode ? "등록된 기사 일감이 없습니다." : "조회된 기사 일감이 없습니다."} />
        ) : (
          visibleWorks.map((work) => (
            <DriverWorkCard
              drivers={drivers}
              isActing={actingId === work.driverWorkId}
              key={work.driverWorkId}
              mode={mode}
              onApply={setApplyWork}
              onAssign={setAssignWork}
              onCancel={(target) => handleStatusAction(target, "CANCEL")}
              onComplete={(target) => handleStatusAction(target, "COMPLETE")}
              onOpenApplicants={setApplicantWork}
              work={work}
            />
          ))
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          className={secondaryButtonClassName}
          disabled={page === 0}
          onClick={() => setPage((current) => Math.max(0, current - 1))}
          type="button"
        >
          이전
        </button>
        <span className="text-sm font-semibold text-slate-500">
          {page + 1} / {Math.max(totalPages, 1)}
        </span>
        <button
          className={secondaryButtonClassName}
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((current) => current + 1)}
          type="button"
        >
          다음
        </button>
      </div>

      {form ? (
        <Modal title="기사 일감 등록" onClose={closeCreateForm}>
          <form className="grid gap-4" onSubmit={handleCreate}>
            <SelectField
              label="최종 계약"
              onChange={(value) => {
                const contract = contracts.find((item) => item.contractId === value);
                setForm((current) =>
                  current
                    ? {
                        ...current,
                        contractId: value,
                        title: current.title || contract?.productName || "",
                        serviceRegion: current.serviceRegion || contract?.pickupRegion || "",
                        expectedVolume:
                          current.expectedVolume || String(contract?.monthlyVolume ?? ""),
                        unitPrice: current.unitPrice || String(contract?.unitPrice ?? ""),
                      }
                    : current,
                );
              }}
              value={form.contractId}
            >
              <option value="">계약 선택</option>
              {contracts.map((contract) => (
                <option key={contract.contractId} value={contract.contractId}>
                  {contract.productName} / {contract.pickupRegion} / {formatCurrency(contract.unitPrice)}
                </option>
              ))}
            </SelectField>

            {selectedContract ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-bold text-slate-950">{selectedContract.vendor?.businessName ?? "화주 정보 없음"}</p>
                <p className="mt-1">
                  {selectedContract.pickupAddress} · {formatNumber(selectedContract.monthlyVolume)}박스
                </p>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="일감명"
                onChange={(value) => setForm((current) => (current ? { ...current, title: value } : current))}
                value={form.title}
              />
              <TextField
                label="담당 지역"
                onChange={(value) =>
                  setForm((current) => (current ? { ...current, serviceRegion: value } : current))
                }
                value={form.serviceRegion}
              />
              <TextField
                label="회수 시작일"
                onChange={(value) =>
                  setForm((current) => (current ? { ...current, pickupStartDate: value } : current))
                }
                type="date"
                value={form.pickupStartDate}
              />
              <TextField
                label="회수 종료일"
                onChange={(value) =>
                  setForm((current) => (current ? { ...current, pickupEndDate: value } : current))
                }
                type="date"
                value={form.pickupEndDate}
              />
              <TextField
                label="예상 물량"
                onChange={(value) =>
                  setForm((current) => (current ? { ...current, expectedVolume: value } : current))
                }
                type="number"
                value={form.expectedVolume}
              />
              <TextField
                label="기사 단가"
                onChange={(value) =>
                  setForm((current) => (current ? { ...current, unitPrice: value } : current))
                }
                type="number"
                value={form.unitPrice}
              />
            </div>

            <SelectField
              label="직접 배정"
              onChange={(value) =>
                setForm((current) => (current ? { ...current, assignedDeliverId: value } : current))
              }
              value={form.assignedDeliverId}
            >
              <option value="">OPEN으로 등록</option>
              {drivers.map((driver) => (
                <option key={driver.deliverId} value={driver.deliverId}>
                  {driver.driverName} / {driver.vehicleNumber || "차량번호 없음"}
                </option>
              ))}
            </SelectField>

            <TextAreaField
              label="메모"
              onChange={(value) => setForm((current) => (current ? { ...current, memo: value } : current))}
              value={form.memo}
            />

            <div className="flex justify-end gap-2">
              <button className={secondaryButtonClassName} onClick={closeCreateForm} type="button">
                닫기
              </button>
              <button className={primaryButtonClassName} disabled={isSubmitting} type="submit">
                등록
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {applicantWork ? (
        <Modal title="신청자 목록" onClose={() => setApplicantWork(null)}>
          <div className="grid gap-3">
            {applicantList.length === 0 ? (
              <EmptyState message="아직 신청자가 없습니다." />
            ) : (
              applicantList.map((application) => (
                <div
                  className="grid gap-3 rounded-lg border border-slate-200 p-4 md:grid-cols-[1fr_auto]"
                  key={application.applicationId}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-950">
                        {application.deliver?.driverName ?? application.deliverId}
                      </p>
                      <StatusBadge status={application.status} type="APPLICATION" />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {application.deliver?.phoneNumber ?? "연락처 없음"} ·{" "}
                      {application.deliver?.vehicleNumber || "차량번호 없음"}
                    </p>
                    {application.memo ? (
                      <p className="mt-2 text-sm font-semibold text-slate-700">{application.memo}</p>
                    ) : null}
                  </div>
                  {application.status === "APPLIED" ? (
                    <button
                      className={primaryButtonClassName}
                      disabled={actingId === application.applicationId}
                      onClick={() => handleSelectApplication(application)}
                      type="button"
                    >
                      선택
                    </button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Modal>
      ) : null}

      {assignWork ? (
        <Modal title="배송기사 직접 배정" onClose={() => setAssignWork(null)}>
          <div className="grid gap-4">
            <p className="text-sm font-semibold text-slate-600">{assignWork.title}</p>
            <SelectField label="배송기사" onChange={setAssignDeliverId} value={assignDeliverId}>
              <option value="">선택</option>
              {drivers.map((driver) => (
                <option key={driver.deliverId} value={driver.deliverId}>
                  {driver.driverName} / {driver.vehicleNumber || "차량번호 없음"}
                </option>
              ))}
            </SelectField>
            <div className="flex justify-end gap-2">
              <button className={secondaryButtonClassName} onClick={() => setAssignWork(null)} type="button">
                닫기
              </button>
              <button className={primaryButtonClassName} disabled={actingId === assignWork.driverWorkId} onClick={handleAssign} type="button">
                배정
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {applyWork ? (
        <Modal title="기사 일감 신청" onClose={() => setApplyWork(null)}>
          <div className="grid gap-4">
            <p className="text-sm font-semibold text-slate-600">{applyWork.title}</p>
            <TextAreaField label="신청 메모" onChange={setApplyMemo} value={applyMemo} />
            <div className="flex justify-end gap-2">
              <button className={secondaryButtonClassName} onClick={() => setApplyWork(null)} type="button">
                닫기
              </button>
              <button className={primaryButtonClassName} disabled={actingId === applyWork.driverWorkId} onClick={handleApply} type="button">
                신청
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}

function DriverWorkCard({
  drivers,
  isActing,
  mode,
  onApply,
  onAssign,
  onCancel,
  onComplete,
  onOpenApplicants,
  work,
}: {
  drivers: DeliverSummary[];
  isActing: boolean;
  mode: "AGENCY" | "DRIVER";
  onApply: (work: DriverWorkDetail) => void;
  onAssign: (work: DriverWorkDetail) => void;
  onCancel: (work: DriverWorkDetail) => void;
  onComplete: (work: DriverWorkDetail) => void;
  onOpenApplicants: (work: DriverWorkDetail) => void;
  work: DriverWorkDetail;
}) {
  const isAgencyMode = mode === "AGENCY";

  return (
    <article className="grid gap-4 border-b border-slate-200 px-5 py-5 last:border-b-0">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{work.title}</h3>
            <StatusBadge status={work.status} type="WORK" />
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">{work.serviceRegion}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAgencyMode && work.status === "OPEN" ? (
            <>
              <button className={secondaryButtonClassName} onClick={() => onOpenApplicants(work)} type="button">
                신청자
              </button>
              <button className={secondaryButtonClassName} disabled={drivers.length === 0} onClick={() => onAssign(work)} type="button">
                직접 배정
              </button>
              <button className={dangerButtonClassName} disabled={isActing} onClick={() => onCancel(work)} type="button">
                취소
              </button>
            </>
          ) : null}
          {isAgencyMode && work.status === "ASSIGNED" ? (
            <button className={primaryButtonClassName} disabled={isActing} onClick={() => onComplete(work)} type="button">
              완료 처리
            </button>
          ) : null}
          {!isAgencyMode && work.status === "OPEN" ? (
            <button className={primaryButtonClassName} disabled={isActing} onClick={() => onApply(work)} type="button">
              신청
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <InfoBlock label="회수 기간" value={`${formatDate(work.pickupStartDate)} ~ ${formatDate(work.pickupEndDate)}`} />
        <InfoBlock label="예상 물량" value={`${formatNumber(work.expectedVolume)}건`} />
        <InfoBlock label="기사 단가" value={formatCurrency(work.unitPrice)} tone="price" />
        <InfoBlock label="배정 기사" value={work.assignedDeliver?.driverName ?? "미정"} />
        <InfoBlock label="계약 ID" value={shortId(work.contractId)} />
      </div>

      {work.memo ? <p className="text-sm font-semibold text-slate-600">{work.memo}</p> : null}
    </article>
  );
}

function ApplicationCard({
  application,
  isActing,
  onWithdraw,
}: {
  application: DriverWorkApplication;
  isActing: boolean;
  onWithdraw: (application: DriverWorkApplication) => void;
}) {
  const work = application.driverWork;

  return (
    <article className="grid gap-4 border-b border-slate-200 px-5 py-5 last:border-b-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{work?.title ?? application.driverWorkId}</h3>
            <StatusBadge status={application.status} type="APPLICATION" />
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {work?.serviceRegion ?? "지역 정보 없음"}
          </p>
        </div>
        {application.status === "APPLIED" ? (
          <button className={dangerButtonClassName} disabled={isActing} onClick={() => onWithdraw(application)} type="button">
            신청 철회
          </button>
        ) : null}
      </div>

      {work ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <InfoBlock label="회수 기간" value={`${formatDate(work.pickupStartDate)} ~ ${formatDate(work.pickupEndDate)}`} />
          <InfoBlock label="예상 물량" value={`${formatNumber(work.expectedVolume)}건`} />
          <InfoBlock label="기사 단가" value={formatCurrency(work.unitPrice)} tone="price" />
          <InfoBlock label="일감 상태" value={formatWorkStatus(work.status)} />
        </div>
      ) : null}

      {application.memo ? <p className="text-sm font-semibold text-slate-600">{application.memo}</p> : null}
    </article>
  );
}

function InfoBlock({ label, tone, value }: { label: string; tone?: "price"; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-bold ${tone === "price" ? "text-[#071f46]" : "text-slate-950"}`}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
  type,
}: {
  status: DriverWorkApplicationStatus | DriverWorkStatus;
  type: "APPLICATION" | "WORK";
}) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${getStatusClassName(status)}`}>
      {type === "WORK" ? formatWorkStatus(status as DriverWorkStatus) : formatApplicationStatus(status as DriverWorkApplicationStatus)}
    </span>
  );
}

function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/45 px-4 py-6">
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
          <h3 className="text-lg font-bold text-slate-950">{title}</h3>
          <button className={secondaryButtonClassName} onClick={onClose} type="button">
            닫기
          </button>
        </div>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}

function TextField({
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <input
        className={inputClassName}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <textarea
        className={`${inputClassName} min-h-24 py-3`}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function SelectField({
  children,
  label,
  onChange,
  value,
}: {
  children: ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-600">{label}</span>
      <select className={inputClassName} onChange={(event) => onChange(event.target.value)} value={value}>
        {children}
      </select>
    </label>
  );
}

function Alert({ children, tone }: { children: ReactNode; tone: "error" | "success" }) {
  return (
    <p
      className={`rounded-lg border px-4 py-3 text-sm font-semibold ${
        tone === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {children}
    </p>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-5 py-10 text-center text-sm font-semibold text-slate-500">{message}</p>;
}

function toApiFilters(filters: FilterState, forcedStatus?: "OPEN" | "ASSIGNED") {
  return {
    status: forcedStatus ?? (filters.status || undefined),
    serviceRegion: filters.serviceRegion || undefined,
    pickupStartDateFrom: filters.pickupStartDateFrom || undefined,
    pickupStartDateTo: filters.pickupStartDateTo || undefined,
  };
}

function validateCreateForm(form: CreateFormState): string {
  if (!form.contractId) return "최종 계약을 선택하세요.";
  if (!form.title.trim()) return "일감명을 입력하세요.";
  if (!form.serviceRegion.trim()) return "담당 지역을 입력하세요.";
  if (!form.pickupStartDate) return "회수 시작일을 입력하세요.";
  if (Number(form.expectedVolume) <= 0) return "예상 물량은 1 이상이어야 합니다.";
  if (Number(form.unitPrice) <= 0) return "기사 단가는 1 이상이어야 합니다.";
  return "";
}

function toCreateRequest(form: CreateFormState): DriverWorkRequest {
  return {
    contractId: form.contractId,
    title: form.title.trim(),
    serviceRegion: form.serviceRegion.trim(),
    pickupStartDate: form.pickupStartDate,
    pickupEndDate: form.pickupEndDate || null,
    expectedVolume: Number(form.expectedVolume),
    unitPrice: Number(form.unitPrice),
    assignedDeliverId: form.assignedDeliverId || null,
    memo: form.memo.trim() || null,
  };
}

function getStatusClassName(status: DriverWorkApplicationStatus | DriverWorkStatus): string {
  if (status === "ASSIGNED" || status === "COMPLETED" || status === "SELECTED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "CANCELLED" || status === "REJECTED") {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (status === "OPEN" || status === "APPLIED") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function formatWorkStatus(status: DriverWorkStatus): string {
  const labels: Record<DriverWorkStatus, string> = {
    OPEN: "공개",
    ASSIGNED: "배정됨",
    CANCELLED: "취소됨",
    COMPLETED: "완료",
  };

  return labels[status] ?? status;
}

function formatApplicationStatus(status: DriverWorkApplicationStatus): string {
  const labels: Record<DriverWorkApplicationStatus, string> = {
    APPLIED: "신청",
    WITHDRAWN: "철회",
    SELECTED: "선택됨",
    REJECTED: "미선택",
  };

  return labels[status] ?? status;
}

function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

function formatCurrency(value: number): string {
  return `${formatNumber(value)}원`;
}

function formatDate(value: string | null): string {
  return value || "-";
}

function shortId(value: string): string {
  return value.slice(0, 8);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "요청 처리 중 오류가 발생했습니다.";
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#071f46] focus:ring-3 focus:ring-[#071f46]/10";
const primaryButtonClassName =
  "inline-flex h-10 items-center justify-center rounded-md bg-[#071f46] px-4 text-sm font-bold text-white transition hover:bg-[#0a2d63] disabled:cursor-not-allowed disabled:bg-slate-400";
const secondaryButtonClassName =
  "inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:text-slate-300";
const dangerButtonClassName =
  "inline-flex h-10 items-center justify-center rounded-md border border-red-300 bg-white px-4 text-sm font-bold text-red-600 transition hover:border-red-500 disabled:cursor-not-allowed disabled:opacity-60";
