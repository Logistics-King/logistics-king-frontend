"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/src/shared/api/client";
import {
  createMyDeliverProfile,
  getAgencyDetail,
  getMyDeliverProfile,
  searchAgencies,
  updateMyDeliverProfile,
  type DeliverAgencySummary,
  type DeliverEmploymentType,
  type DeliverProfile,
  type DeliverProfileRequest,
} from "./api";

type DriverProfileFormState = {
  employmentType: DeliverEmploymentType;
  agencyId: string | null;
  driverName: string;
  phoneNumber: string;
  vehicleNumber: string;
  serviceRegions: string;
  active: boolean;
  memo: string;
};

const initialFormState: DriverProfileFormState = {
  employmentType: "AGENCY_AFFILIATED",
  agencyId: null,
  driverName: "",
  phoneNumber: "",
  vehicleNumber: "",
  serviceRegions: "",
  active: true,
  memo: "",
};

export function DriverProfileForm() {
  const [form, setForm] = useState(initialFormState);
  const [selectedAgency, setSelectedAgency] = useState<DeliverAgencySummary | null>(null);
  const [agencySearchKeyword, setAgencySearchKeyword] = useState("");
  const [agencyCandidates, setAgencyCandidates] = useState<DeliverAgencySummary[]>([]);
  const [profileExists, setProfileExists] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingAgencies, setIsSearchingAgencies] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const profile = await getMyDeliverProfile();

        if (active) {
          setForm(toFormState(profile));
          setSelectedAgency(profile.agency);
          setAgencySearchKeyword(profile.agency?.agencyName ?? "");
          setProfileExists(true);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        if (isDeliverProfileMissing(error)) {
          setProfileExists(false);
          setForm(initialFormState);
        } else {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationMessage = validateForm(form);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const request = toRequest(form);
      const profile = profileExists
        ? await updateMyDeliverProfile(request)
        : await createMyDeliverProfile(request);

      setForm(toFormState(profile));
      setProfileExists(true);
      setSuccessMessage(profileExists ? "기사 정보를 수정했습니다." : "기사 정보를 등록했습니다.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAgencySearch() {
    const keyword = agencySearchKeyword.trim();

    if (!keyword) {
      setErrorMessage("검색할 대리점명을 입력해 주세요.");
      return;
    }

    setIsSearchingAgencies(true);
    setErrorMessage("");
    setAgencyCandidates([]);

    try {
      const response = await searchAgencies({
        agencyName: keyword,
        scope: "ALL",
        page: 0,
        size: 20,
      });

      setAgencyCandidates(response.items);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSearchingAgencies(false);
    }
  }

  async function handleAgencySelect(agency: DeliverAgencySummary) {
    setForm({
      ...form,
      agencyId: agency.agencyId,
      serviceRegions: agency.serviceRegions.join("\n"),
    });
    setSelectedAgency(agency);
    setAgencySearchKeyword(agency.agencyName);
    setAgencyCandidates([]);

    try {
      const detail = await getAgencyDetail(agency.agencyId);

      setSelectedAgency(detail);
      setForm((current) =>
        current.agencyId === agency.agencyId
          ? { ...current, serviceRegions: detail.serviceRegions.join("\n") }
          : current,
      );
    } catch {
      // 상세 조회 실패 시에도 목록 요약 정보로 선택은 유지합니다.
    }
  }

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-950">
          {profileExists ? "기사 정보 수정" : "기사 정보 등록"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          고용 형태, 차량번호, 담당 가능 지역과 활동 상태를 관리합니다.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-5 grid gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="h-11 rounded-md bg-slate-100" key={index} />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-4">
            <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="text-base font-bold text-slate-950">고용 형태</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  대리점 소속 기사인지, 프리랜서 기사인지 선택합니다.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {employmentTypeOptions.map((option) => {
                  const selected = form.employmentType === option.value;

                  return (
                    <button
                      aria-pressed={selected}
                      className={`rounded-md border px-4 py-3 text-left transition ${
                        selected
                          ? "border-[#071f46] bg-[#071f46]/5 text-[#071f46]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
                      }`}
                      key={option.value}
                      onClick={() => {
                        const nextServiceRegions =
                          option.value === "AGENCY_AFFILIATED" &&
                          selectedAgency &&
                          !form.serviceRegions.trim()
                            ? selectedAgency.serviceRegions.join("\n")
                            : form.serviceRegions;

                        setForm({
                          ...form,
                          employmentType: option.value,
                          agencyId: option.value === "FREELANCER" ? null : form.agencyId,
                          serviceRegions: nextServiceRegions,
                        });
                        if (option.value === "FREELANCER") {
                          setSelectedAgency(null);
                          setAgencyCandidates([]);
                        }
                      }}
                      type="button"
                    >
                      <span className="block text-sm font-bold">{option.label}</span>
                      <span className="mt-1 block text-xs leading-5">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {form.employmentType === "AGENCY_AFFILIATED" ? (
            <section className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div>
                <h3 className="text-base font-bold text-slate-950">소속 대리점 선택</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  대리점명을 검색한 뒤 후보에서 소속 대리점을 선택합니다.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                <input
                  className={inputClassName}
                  placeholder="CJ 일동대리점"
                  value={agencySearchKeyword}
                  onChange={(event) => setAgencySearchKeyword(event.target.value)}
                />
                <button
                  className="h-11 rounded-md border border-[#071f46] px-4 text-sm font-bold text-[#071f46] transition hover:bg-[#071f46]/5 disabled:opacity-50"
                  disabled={isSearchingAgencies}
                  onClick={handleAgencySearch}
                  type="button"
                >
                  {isSearchingAgencies ? "검색 중" : "검색"}
                </button>
              </div>

              {selectedAgency ? (
                <AgencySummaryCard agency={selectedAgency} selected />
              ) : (
                <p className="rounded-md bg-white px-3 py-3 text-sm font-semibold text-slate-500">
                  선택된 대리점이 없습니다.
                </p>
              )}

              {agencyCandidates.length > 0 ? (
                <div className="grid gap-2">
                  <p className="text-xs font-bold text-slate-500">검색 결과</p>
                  {agencyCandidates.map((agency) => (
                    <button
                      className="rounded-md border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-[#071f46]/40"
                      key={agency.agencyId}
                      onClick={() => handleAgencySelect(agency)}
                      type="button"
                    >
                      <AgencySummaryCard agency={agency} />
                    </button>
                  ))}
                </div>
              ) : null}
            </section>
            ) : (
              <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-bold text-emerald-800">프리랜서 기사</p>
                <p className="mt-1 text-sm leading-6 text-emerald-700">
                  대리점 선택 없이 담당 가능 지역 기준으로 계약 요청을 받을 수 있습니다.
                </p>
              </section>
            )}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <TextField
              label="기사명"
              value={form.driverName}
              onChange={(value) => setForm({ ...form, driverName: value })}
            />
            <TextField
              label="연락처"
              value={form.phoneNumber}
              onChange={(value) => setForm({ ...form, phoneNumber: formatPhoneNumber(value) })}
            />
            <TextField
              label="차량번호"
              value={form.vehicleNumber}
              onChange={(value) => setForm({ ...form, vehicleNumber: value })}
            />
          </div>

          <RegionSelector
            baseRegions={
              form.employmentType === "AGENCY_AFFILIATED" && selectedAgency
                ? selectedAgency.serviceRegions
                : []
            }
            selectedRegions={parseServiceRegions(form.serviceRegions)}
            onChange={(regions) => setForm({ ...form, serviceRegions: regions.join("\n") })}
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <BooleanField
              checked={form.active}
              label="활동 가능"
              onChange={(checked) => setForm({ ...form, active: checked })}
            />
          </div>

          <label className="mt-5 grid gap-2">
            <span className="text-sm font-semibold text-slate-700">메모</span>
            <textarea
              className={`${inputClassName} min-h-24 resize-y py-3`}
              value={form.memo}
              onChange={(event) => setForm({ ...form, memo: event.target.value })}
            />
          </label>

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
              {isSubmitting ? "저장 중" : profileExists ? "수정 저장" : "기사 정보 등록"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        className={inputClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
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

function RegionSelector({
  baseRegions,
  selectedRegions,
  onChange,
}: {
  baseRegions: string[];
  selectedRegions: string[];
  onChange: (regions: string[]) => void;
}) {
  const [regionInput, setRegionInput] = useState("");
  const selectedSet = new Set(selectedRegions);
  const allBaseSelected =
    baseRegions.length > 0 && baseRegions.every((region) => selectedSet.has(region));
  const customRegions = selectedRegions.filter((region) => !baseRegions.includes(region));

  function handleToggle(region: string, checked: boolean) {
    if (checked) {
      onChange(uniqueRegions([...selectedRegions, region]));
      return;
    }

    onChange(selectedRegions.filter((selectedRegion) => selectedRegion !== region));
  }

  function handleAddRegion(region: string) {
    if (!region.trim()) {
      return;
    }

    onChange(uniqueRegions([...selectedRegions, region.trim()]));
  }

  return (
    <section className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-950">담당 가능 지역</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            대리점 담당 지역을 우선 선택하고, 필요한 지역구를 직접 추가할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {baseRegions.length > 0 ? (
            <button
              className="h-10 rounded-md border border-[#071f46] px-4 text-sm font-bold text-[#071f46] transition hover:bg-[#071f46]/5"
              onClick={() =>
                onChange(
                  allBaseSelected
                    ? selectedRegions.filter((region) => !baseRegions.includes(region))
                    : uniqueRegions([...selectedRegions, ...baseRegions]),
                )
              }
              type="button"
            >
              {allBaseSelected ? "기본 지역 해제" : "기본 지역 선택"}
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 rounded-md border border-slate-200 bg-white p-3">
        <label className="grid gap-2">
          <span className="text-xs font-bold text-slate-500">지역구 직접 추가</span>
          <div className="grid gap-2 sm:grid-cols-[1fr_96px]">
            <input
              className={inputClassName}
              placeholder="예: 경기 안산시 상록구"
              value={regionInput}
              onChange={(event) => setRegionInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleAddRegion(regionInput);
                  setRegionInput("");
                }
              }}
            />
            <button
              className="h-11 rounded-md bg-[#071f46] px-4 text-sm font-bold text-white transition hover:bg-[#0a2d63]"
              onClick={() => {
                handleAddRegion(regionInput);
                setRegionInput("");
              }}
              type="button"
            >
              추가
            </button>
          </div>
        </label>
        <div className="flex flex-wrap gap-2">
          {regionExamples.map((region) => (
            <button
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-[#071f46] hover:text-[#071f46]"
              key={region}
              onClick={() => handleAddRegion(region)}
              type="button"
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {baseRegions.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {baseRegions.map((region) => (
            <label
              className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              key={region}
            >
              <span className="break-keep leading-5">{region}</span>
              <input
                checked={selectedSet.has(region)}
                className="h-5 w-5 shrink-0 accent-[#071f46]"
                onChange={(event) => handleToggle(region, event.target.checked)}
                type="checkbox"
              />
            </label>
          ))}
        </div>
      ) : (
        <p className="rounded-md bg-white px-3 py-3 text-sm font-semibold text-slate-500">
          담당 가능 지역을 직접 추가해 주세요.
        </p>
      )}

      {customRegions.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-xs font-bold text-slate-500">추가 지역</p>
          <div className="flex flex-wrap gap-2">
            {customRegions.map((region) => (
              <button
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                key={region}
                onClick={() =>
                  onChange(selectedRegions.filter((selectedRegion) => selectedRegion !== region))
                }
                type="button"
              >
                {region} 삭제
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function AgencySummaryCard({
  agency,
  selected = false,
}: {
  agency: DeliverAgencySummary;
  selected?: boolean;
}) {
  return (
    <div
      className={
        selected
          ? "rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3"
          : "grid gap-1"
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-slate-950">{agency.agencyName}</p>
        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600">
          {agency.carrier}
        </span>
        {selected ? (
          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-700">
            선택됨
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500">{agency.mainRegion}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        담당 가능 지역 {agency.serviceRegions.join(", ")}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        평일 집하 {agency.weekdayPickupStartTime ?? "-"} ~ {agency.weekdayPickupEndTime ?? "-"}
      </p>
    </div>
  );
}

function validateForm(form: DriverProfileFormState): string {
  if (form.employmentType === "AGENCY_AFFILIATED" && !form.agencyId?.trim()) {
    return "소속 대리점을 검색해서 선택해 주세요.";
  }

  if (!form.driverName.trim()) {
    return "기사명은 필수입니다.";
  }

  if (!isValidPhoneNumber(form.phoneNumber)) {
    return "연락처는 10~11자리로 입력해 주세요.";
  }

  if (parseServiceRegions(form.serviceRegions).length === 0) {
    return "담당 가능 지역은 1개 이상이어야 합니다.";
  }

  return "";
}

function toRequest(form: DriverProfileFormState): DeliverProfileRequest {
  return {
    employmentType: form.employmentType,
    agencyId: form.employmentType === "AGENCY_AFFILIATED" ? form.agencyId?.trim() ?? null : null,
    driverName: form.driverName.trim(),
    phoneNumber: form.phoneNumber.trim(),
    vehicleNumber: form.vehicleNumber.trim(),
    serviceRegions: parseServiceRegions(form.serviceRegions),
    active: form.active,
    memo: blankToNull(form.memo),
  };
}

function toFormState(profile: DeliverProfile): DriverProfileFormState {
  return {
    employmentType: profile.employmentType,
    agencyId: profile.agencyId,
    driverName: profile.driverName,
    phoneNumber: formatPhoneNumber(profile.phoneNumber),
    vehicleNumber: profile.vehicleNumber,
    serviceRegions: profile.serviceRegions.join("\n"),
    active: profile.active,
    memo: profile.memo ?? "",
  };
}

function parseServiceRegions(value: string): string[] {
  return uniqueRegions(value.split("\n"));
}

function uniqueRegions(regions: string[]): string[] {
  return Array.from(new Set(regions.map((region) => region.trim()).filter(Boolean)));
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function isValidPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");

  return digits.length >= 10 && digits.length <= 11;
}

function isDeliverProfileMissing(error: unknown): boolean {
  return error instanceof ApiError && error.code === "DELIVER_NOT_FOUND";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "기사 정보를 처리하지 못했습니다.";
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-[#071f46]";

const employmentTypeOptions: Array<{
  value: DeliverEmploymentType;
  label: string;
  description: string;
}> = [
  {
    value: "AGENCY_AFFILIATED",
    label: "대리점 소속",
    description: "선택한 대리점 소속 기사로 계약을 관리합니다.",
  },
  {
    value: "FREELANCER",
    label: "프리랜서",
    description: "특정 대리점 소속 없이 외부 기사 후보로 노출됩니다.",
  },
];

const regionExamples = [
  "경기 안산시 상록구",
  "경기 안산시 단원구",
  "경기 성남시 분당구",
  "서울 강남구",
  "서울 송파구",
  "인천 남동구",
];
