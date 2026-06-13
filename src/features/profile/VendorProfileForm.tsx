"use client";

import { FormEvent, useState } from "react";
import { AddressSearchButton } from "@/src/shared/address/AddressSearchButton";
import { createVendorProfile } from "./api";

type VendorProfileFormState = {
  businessName: string;
  businessRegistrationNumber: string;
  representativeName: string;
  phoneNumber: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  mainRegion: string;
};

const initialFormState: VendorProfileFormState = {
  businessName: "",
  businessRegistrationNumber: "",
  representativeName: "",
  phoneNumber: "",
  postalCode: "",
  address: "",
  addressDetail: "",
  mainRegion: "",
};

export function VendorProfileForm() {
  const [form, setForm] = useState(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      await createVendorProfile({
        businessName: form.businessName.trim(),
        businessRegistrationNumber: blankToNull(form.businessRegistrationNumber),
        representativeName: form.representativeName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        postalCode: blankToNull(form.postalCode),
        address: form.address.trim(),
        addressDetail: blankToNull(form.addressDetail),
        mainRegion: form.mainRegion.trim(),
      });
      setSuccessMessage("화주 정보를 등록했습니다.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-950">화주 정보 등록</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          배송 품목과 계약 요청을 사용하려면 먼저 사업자 정보를 등록해야 합니다.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <TextField label="상호명" value={form.businessName} onChange={(value) => setForm({ ...form, businessName: value })} />
        <TextField
          label="사업자등록번호"
          value={form.businessRegistrationNumber}
          onChange={(value) =>
            setForm({
              ...form,
              businessRegistrationNumber: formatBusinessRegistrationNumber(value),
            })
          }
        />
        <TextField label="대표자명" value={form.representativeName} onChange={(value) => setForm({ ...form, representativeName: value })} />
        <TextField
          label="연락처"
          value={form.phoneNumber}
          onChange={(value) => setForm({ ...form, phoneNumber: formatPhoneNumber(value) })}
        />
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
                })
              }
            />
          </div>
        </div>
        <TextField label="주 발송 지역" value={form.mainRegion} onChange={(value) => setForm({ ...form, mainRegion: value })} />
        <TextField label="사업장 주소" value={form.address} onChange={(value) => setForm({ ...form, address: value })} />
        <TextField label="상세 주소" value={form.addressDetail} onChange={(value) => setForm({ ...form, addressDetail: value })} />
      </div>

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
          {isSubmitting ? "등록 중" : "화주 정보 등록"}
        </button>
      </div>
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

function validateForm(form: VendorProfileFormState): string {
  if (!form.businessName.trim()) {
    return "상호명은 필수입니다.";
  }

  if (!form.representativeName.trim()) {
    return "대표자명은 필수입니다.";
  }

  if (!isValidBusinessRegistrationNumber(form.businessRegistrationNumber)) {
    return "사업자등록번호는 10자리로 입력해 주세요.";
  }

  if (!form.phoneNumber.trim()) {
    return "연락처는 필수입니다.";
  }

  if (!isValidPhoneNumber(form.phoneNumber)) {
    return "연락처는 10~11자리로 입력해 주세요.";
  }

  if (!form.address.trim()) {
    return "사업장 주소는 필수입니다.";
  }

  if (!form.mainRegion.trim()) {
    return "주 발송 지역은 필수입니다.";
  }

  return "";
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function formatBusinessRegistrationNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function isValidBusinessRegistrationNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");

  return digits.length === 0 || digits.length === 10;
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

  return digits.length === 10 || digits.length === 11;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "화주 정보를 등록하지 못했습니다.";
}

const inputClassName =
  "h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-[#071f46] focus:ring-3 focus:ring-[#071f46]/10";
