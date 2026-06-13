"use client";

import { FormEvent, useEffect, useState } from "react";
import { ApiError } from "@/src/shared/api/client";
import type { Carrier, ColdChainType } from "@/src/shared/api/types";
import { AddressSearchButton } from "@/src/shared/address/AddressSearchButton";
import {
  createAgencyProfile,
  getAgencyProfile,
  updateAgencyProfile,
  type AgencyProfile,
  type AgencyProfileRequest,
} from "./api";

type AgencyProfileFormState = {
  carrier: Carrier;
  agencyName: string;
  businessRegistrationNumber: string;
  representativeName: string;
  phoneNumber: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  mainRegion: string;
  serviceRegions: string;
  weekdayPickupStartTime: string;
  weekdayPickupEndTime: string;
  saturdayPickupAvailable: boolean;
  saturdayDeliveryAvailable: boolean;
  returnAvailable: boolean;
  coldChainType: ColdChainType;
  maxMonthlyVolume: string;
};

const initialFormState: AgencyProfileFormState = {
  carrier: "CJ",
  agencyName: "",
  businessRegistrationNumber: "",
  representativeName: "",
  phoneNumber: "",
  postalCode: "",
  address: "",
  addressDetail: "",
  mainRegion: "",
  serviceRegions: "",
  weekdayPickupStartTime: "",
  weekdayPickupEndTime: "",
  saturdayPickupAvailable: false,
  saturdayDeliveryAvailable: false,
  returnAvailable: false,
  coldChainType: "NONE",
  maxMonthlyVolume: "",
};

const carrierOptions: Array<{ value: Carrier; label: string }> = [
  { value: "CJ", label: "CJ대한통운" },
  { value: "HANJIN", label: "한진택배" },
  { value: "LOTTE", label: "롯데택배" },
  { value: "LOGEN", label: "로젠택배" },
  { value: "POST_OFFICE", label: "우체국택배" },
  { value: "CU", label: "CU 편의점택배" },
  { value: "GS", label: "GS 편의점택배" },
  { value: "OTHER", label: "기타" },
];

const coldChainOptions: Array<{ value: ColdChainType; label: string }> = [
  { value: "NONE", label: "콜드체인 없음" },
  { value: "REFRIGERATED", label: "냉장" },
  { value: "FROZEN", label: "냉동" },
];

export function AgencyProfileForm() {
  const [form, setForm] = useState(initialFormState);
  const [profileExists, setProfileExists] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchProfile() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const profile = await getAgencyProfile();

        if (active) {
          setForm(toFormState(profile));
          setProfileExists(true);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        if (isAgencyProfileMissing(error)) {
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
      const request = toAgencyProfileRequest(form);

      if (profileExists) {
        const profile = await updateAgencyProfile(request);
        setForm(toFormState(profile));
        setSuccessMessage("대리점 정보를 수정했습니다.");
      } else {
        const profile = await createAgencyProfile(request);
        setForm(toFormState(profile));
        setProfileExists(true);
        setSuccessMessage("대리점 정보를 등록했습니다.");
      }
    } catch (error) {
      if (isAgencyAlreadyExists(error)) {
        try {
          const profile = await getAgencyProfile();

          setForm(toFormState(profile));
          setProfileExists(true);
          setSuccessMessage("이미 등록된 대리점 정보를 불러왔습니다.");
        } catch (fetchError) {
          setErrorMessage(getErrorMessage(fetchError));
        }
      } else {
        setErrorMessage(getErrorMessage(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-950">
          {profileExists ? "대리점 정보 수정" : "대리점 정보 등록"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          제안과 계약 관리에 사용할 영업 거점 정보를 관리합니다.
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

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <SelectField
          label="택배사"
          value={form.carrier}
          options={carrierOptions}
          onChange={(value) => setForm({ ...form, carrier: value as Carrier })}
        />
        <TextField label="대리점명" value={form.agencyName} onChange={(value) => setForm({ ...form, agencyName: value })} />
        <TextField label="사업자등록번호" value={form.businessRegistrationNumber} onChange={(value) => setForm({ ...form, businessRegistrationNumber: value })} />
        <TextField label="대표자명" value={form.representativeName} onChange={(value) => setForm({ ...form, representativeName: value })} />
        <TextField label="연락처" value={form.phoneNumber} onChange={(value) => setForm({ ...form, phoneNumber: value })} />
        <div className="grid gap-2">
          <span className="text-sm font-semibold text-slate-700">우편번호</span>
          <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
            <input
              className={inputClassName}
              value={form.postalCode}
              onChange={(event) => setForm({ ...form, postalCode: event.target.value })}
            />
            <AddressSearchButton
              onSelect={(selectedAddress) =>
                setForm({
                  ...form,
                  postalCode: selectedAddress.postalCode,
                  address: selectedAddress.address,
                  mainRegion: selectedAddress.region,
                  serviceRegions: form.serviceRegions || selectedAddress.region,
                })
              }
            />
          </div>
        </div>
        <TextField label="주소" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
        <TextField label="상세 주소" value={form.addressDetail} onChange={(value) => setForm({ ...form, addressDetail: value })} />
        <TextField label="주 담당 지역" value={form.mainRegion} onChange={(value) => setForm({ ...form, mainRegion: value })} />
        <TextField label="월 처리 가능 물량" value={formatNumericInput(form.maxMonthlyVolume)} onChange={(value) => setForm({ ...form, maxMonthlyVolume: normalizeIntegerInput(value) })} />
        <TextField label="평일 집하 시작" placeholder="09:00" value={form.weekdayPickupStartTime} onChange={(value) => setForm({ ...form, weekdayPickupStartTime: value })} />
        <TextField label="평일 집하 종료" placeholder="18:00" value={form.weekdayPickupEndTime} onChange={(value) => setForm({ ...form, weekdayPickupEndTime: value })} />
      </div>

      <label className="mt-5 grid gap-2">
        <span className="text-sm font-semibold text-slate-700">담당 가능 지역</span>
        <textarea
          className={`${inputClassName} min-h-28 resize-y py-3`}
          placeholder={"경기도 안산시 일동\n경기도 안산시 본오동"}
          value={form.serviceRegions}
          onChange={(event) => setForm({ ...form, serviceRegions: event.target.value })}
        />
      </label>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <BooleanField checked={form.saturdayPickupAvailable} label="토요일 집하" onChange={(checked) => setForm({ ...form, saturdayPickupAvailable: checked })} />
        <BooleanField checked={form.saturdayDeliveryAvailable} label="토요일 배송" onChange={(checked) => setForm({ ...form, saturdayDeliveryAvailable: checked })} />
        <BooleanField checked={form.returnAvailable} label="반품 가능" onChange={(checked) => setForm({ ...form, returnAvailable: checked })} />
      </div>

      <SelectField
        label="온도 관리"
        value={form.coldChainType}
        options={coldChainOptions}
        onChange={(value) => setForm({ ...form, coldChainType: value as ColdChainType })}
      />

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
          {isSubmitting ? "저장 중" : profileExists ? "수정 저장" : "대리점 정보 등록"}
        </button>
      </div>
        </>
      )}
    </form>
  );
}

function TextField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        className={inputClassName}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-5 grid gap-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <select
        className={inputClassName}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

function validateForm(form: AgencyProfileFormState): string {
  if (!form.agencyName.trim()) {
    return "대리점명은 필수입니다.";
  }

  if (!form.representativeName.trim()) {
    return "대표자명은 필수입니다.";
  }

  if (!form.phoneNumber.trim()) {
    return "연락처는 필수입니다.";
  }

  if (!form.address.trim()) {
    return "대리점 주소는 필수입니다.";
  }

  if (!form.mainRegion.trim()) {
    return "주 담당 지역은 필수입니다.";
  }

  if (parseServiceRegions(form.serviceRegions).length === 0) {
    return "담당 가능 지역은 1개 이상이어야 합니다.";
  }

  if (form.maxMonthlyVolume && Number(form.maxMonthlyVolume) < 0) {
    return "월 처리 가능 물량은 0 이상이어야 합니다.";
  }

  return "";
}

function toAgencyProfileRequest(form: AgencyProfileFormState): AgencyProfileRequest {
  return {
    carrier: form.carrier,
    agencyName: form.agencyName.trim(),
    businessRegistrationNumber: blankToNull(form.businessRegistrationNumber),
    representativeName: form.representativeName.trim(),
    phoneNumber: form.phoneNumber.trim(),
    postalCode: blankToNull(form.postalCode),
    address: form.address.trim(),
    addressDetail: blankToNull(form.addressDetail),
    mainRegion: form.mainRegion.trim(),
    serviceRegions: parseServiceRegions(form.serviceRegions),
    weekdayPickupStartTime: blankToNull(form.weekdayPickupStartTime),
    weekdayPickupEndTime: blankToNull(form.weekdayPickupEndTime),
    saturdayPickupAvailable: form.saturdayPickupAvailable,
    saturdayDeliveryAvailable: form.saturdayDeliveryAvailable,
    returnAvailable: form.returnAvailable,
    coldChainType: form.coldChainType,
    maxMonthlyVolume: numberToNullable(form.maxMonthlyVolume),
  };
}

function toFormState(profile: AgencyProfile): AgencyProfileFormState {
  return {
    carrier: profile.carrier,
    agencyName: profile.agencyName,
    businessRegistrationNumber: profile.businessRegistrationNumber ?? "",
    representativeName: profile.representativeName,
    phoneNumber: profile.phoneNumber,
    postalCode: profile.postalCode ?? "",
    address: profile.address,
    addressDetail: profile.addressDetail ?? "",
    mainRegion: profile.mainRegion,
    serviceRegions: profile.serviceRegions.join("\n"),
    weekdayPickupStartTime: profile.weekdayPickupStartTime ?? "",
    weekdayPickupEndTime: profile.weekdayPickupEndTime ?? "",
    saturdayPickupAvailable: profile.saturdayPickupAvailable,
    saturdayDeliveryAvailable: profile.saturdayDeliveryAvailable,
    returnAvailable: profile.returnAvailable,
    coldChainType: profile.coldChainType,
    maxMonthlyVolume: profile.maxMonthlyVolume === null ? "" : String(profile.maxMonthlyVolume),
  };
}

function parseServiceRegions(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function numberToNullable(value: string): number | null {
  return value ? Number(value) : null;
}

function normalizeIntegerInput(value: string): string {
  return value.replace(/,/g, "").replace(/\D/g, "");
}

function formatNumericInput(value: string): string {
  return value ? Number(value).toLocaleString("ko-KR") : "";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "대리점 정보를 저장하지 못했습니다.";
}

function isAgencyProfileMissing(error: unknown): boolean {
  return error instanceof ApiError && error.code === "AGENCY_NOT_FOUND";
}

function isAgencyAlreadyExists(error: unknown): boolean {
  return error instanceof ApiError && error.code === "AGENCY_ALREADY_EXISTS";
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#071f46] focus:ring-3 focus:ring-[#071f46]/10";
