"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, type Dispatch, type SetStateAction } from "react";
import {
  searchAgencies,
  type DeliverAgencySummary,
  type DeliverEmploymentType,
} from "@/src/features/driver/api";
import type { Carrier, ColdChainType } from "@/src/shared/api/types";
import { AddressSearchButton } from "@/src/shared/address/AddressSearchButton";
import { signUpAgency, signUpDriver, signUpVendor } from "./api";
import { signUpRoles, type SignUpRole } from "./roles";

type SignUpFormState = {
  loginId: string;
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  businessName: string;
  businessRegistrationNumber: string;
  representativeName: string;
  phoneNumber: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  mainRegion: string;
  carrier: Carrier;
  agencyName: string;
  serviceRegions: string;
  weekdayPickupStartTime: string;
  weekdayPickupEndTime: string;
  saturdayPickupAvailable: boolean;
  saturdayDeliveryAvailable: boolean;
  returnAvailable: boolean;
  supportedColdChainTypes: ColdChainType[];
  maxMonthlyVolume: string;
  employmentType: DeliverEmploymentType;
  agencyId: string;
  driverName: string;
  vehicleNumber: string;
  active: boolean;
  memo: string;
};

const initialFormState: SignUpFormState = {
  loginId: "",
  email: "",
  password: "",
  passwordConfirm: "",
  name: "",
  businessName: "",
  businessRegistrationNumber: "",
  representativeName: "",
  phoneNumber: "",
  postalCode: "",
  address: "",
  addressDetail: "",
  mainRegion: "",
  carrier: "CJ",
  agencyName: "",
  serviceRegions: "",
  weekdayPickupStartTime: "",
  weekdayPickupEndTime: "",
  saturdayPickupAvailable: false,
  saturdayDeliveryAvailable: false,
  returnAvailable: false,
  supportedColdChainTypes: ["NONE"],
  maxMonthlyVolume: "",
  employmentType: "AGENCY_AFFILIATED",
  agencyId: "",
  driverName: "",
  vehicleNumber: "",
  active: true,
  memo: "",
};

export function SignUpForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<SignUpRole>("VENDOR");
  const [form, setForm] = useState<SignUpFormState>(initialFormState);
  const [selectedAgency, setSelectedAgency] = useState<DeliverAgencySummary | null>(null);
  const [agencySearchKeyword, setAgencySearchKeyword] = useState("");
  const [agencyCandidates, setAgencyCandidates] = useState<DeliverAgencySummary[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchingAgencies, setIsSearchingAgencies] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const validationMessage = validateSignUpForm(selectedRole, form);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    if (passwordMismatch) {
      return;
    }

    setIsSubmitting(true);

    try {
      await submitByRole(selectedRole, form);
      router.push("/login");
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

  function handleAgencySelect(agency: DeliverAgencySummary) {
    setForm((current) => ({ ...current, agencyId: agency.agencyId }));
    setSelectedAgency(agency);
    setAgencySearchKeyword(agency.agencyName);
    setAgencyCandidates([]);
  }

  const passwordMismatch =
    form.passwordConfirm.length > 0 && form.password !== form.passwordConfirm;

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <fieldset className="grid gap-3">
        <legend className="mb-3 text-sm font-medium text-slate-700">가입 유형</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {signUpRoles.map((item) => {
            const isSelected = item.role === selectedRole;

            return (
              <button
                className={`min-h-32 rounded-md border p-4 text-left leading-normal transition ${
                  isSelected
                    ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                }`}
                key={item.role}
                type="button"
                onClick={() => setSelectedRole(item.role)}
                aria-pressed={isSelected}
              >
                <span className="block break-keep text-base font-semibold leading-6">
                  {item.label}
                </span>
                <span className="mt-2 block break-keep text-xs leading-6">
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="아이디"
          name="loginId"
          value={form.loginId}
          autoComplete="username"
          onChange={(value) => setForm((current) => ({ ...current, loginId: value }))}
        />
        <TextField
          label="이메일"
          name="email"
          type="email"
          value={form.email}
          autoComplete="email"
          onChange={(value) => setForm((current) => ({ ...current, email: value }))}
        />
        <TextField
          label="비밀번호"
          name="password"
          type="password"
          value={form.password}
          autoComplete="new-password"
          minLength={8}
          onChange={(value) => setForm((current) => ({ ...current, password: value }))}
        />
        <TextField
          label="비밀번호 확인"
          name="passwordConfirm"
          type="password"
          value={form.passwordConfirm}
          autoComplete="new-password"
          minLength={8}
          errorMessage={passwordMismatch ? "비밀번호가 서로 달라요." : ""}
          onChange={(value) =>
            setForm((current) => ({ ...current, passwordConfirm: value }))
          }
        />
        <TextField
          label="이름"
          name="name"
          value={form.name}
          autoComplete="name"
          onChange={(value) => setForm((current) => ({ ...current, name: value }))}
        />
      </div>

      {selectedRole === "VENDOR" ? (
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <SectionTitle
            title="화주 프로필"
            description="가입과 동시에 상호명, 대표자, 주소와 주 발송 지역을 등록합니다."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="상호명"
              name="businessName"
              value={form.businessName}
              autoComplete="organization"
              onChange={(value) => setForm((current) => ({ ...current, businessName: value }))}
            />
            <TextField
              label="사업자등록번호"
              name="businessRegistrationNumber"
              value={form.businessRegistrationNumber}
              autoComplete="off"
              required={false}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  businessRegistrationNumber: formatBusinessRegistrationNumber(value),
                }))
              }
            />
            <TextField
              label="대표자명"
              name="representativeName"
              value={form.representativeName}
              autoComplete="name"
              onChange={(value) =>
                setForm((current) => ({ ...current, representativeName: value }))
              }
            />
            <TextField
              label="연락처"
              name="phoneNumber"
              value={form.phoneNumber}
              autoComplete="tel"
              onChange={(value) =>
                setForm((current) => ({ ...current, phoneNumber: formatPhoneNumber(value) }))
              }
            />
          </div>
          <AddressFields form={form} setForm={setForm} mainRegionLabel="주 발송 지역" />
        </section>
      ) : null}

      {selectedRole === "AGENCY" ? (
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <SectionTitle
            title="대리점 프로필"
            description="가입과 동시에 대리점 정보, 담당 가능 지역과 배송 조건을 등록합니다."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="택배사"
              value={form.carrier}
              options={carrierOptions}
              onChange={(value) =>
                setForm((current) => ({ ...current, carrier: value as Carrier }))
              }
            />
            <TextField
              label="대리점명"
              name="agencyName"
              value={form.agencyName}
              autoComplete="organization"
              onChange={(value) => setForm((current) => ({ ...current, agencyName: value }))}
            />
            <TextField
              label="사업자등록번호"
              name="businessRegistrationNumber"
              value={form.businessRegistrationNumber}
              autoComplete="off"
              required={false}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  businessRegistrationNumber: formatBusinessRegistrationNumber(value),
                }))
              }
            />
            <TextField
              label="대표자명"
              name="representativeName"
              value={form.representativeName}
              autoComplete="name"
              onChange={(value) =>
                setForm((current) => ({ ...current, representativeName: value }))
              }
            />
            <TextField
              label="연락처"
              name="phoneNumber"
              value={form.phoneNumber}
              autoComplete="tel"
              onChange={(value) =>
                setForm((current) => ({ ...current, phoneNumber: formatPhoneNumber(value) }))
              }
            />
            <TextField
              label="월 처리 가능 물량"
              name="maxMonthlyVolume"
              value={formatNumericInput(form.maxMonthlyVolume)}
              autoComplete="off"
              required={false}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  maxMonthlyVolume: normalizeIntegerInput(value),
                }))
              }
            />
            <TextField
              label="평일 집하 시작"
              name="weekdayPickupStartTime"
              value={form.weekdayPickupStartTime}
              autoComplete="off"
              required={false}
              onChange={(value) =>
                setForm((current) => ({ ...current, weekdayPickupStartTime: value }))
              }
            />
            <TextField
              label="평일 집하 종료"
              name="weekdayPickupEndTime"
              value={form.weekdayPickupEndTime}
              autoComplete="off"
              required={false}
              onChange={(value) =>
                setForm((current) => ({ ...current, weekdayPickupEndTime: value }))
              }
            />
          </div>
          <AddressFields
            form={form}
            setForm={setForm}
            mainRegionLabel="주 담당 지역"
            fillServiceRegions
          />
          <TextareaField
            label="담당 가능 지역"
            placeholder={"경기도 안산시 일동\n경기도 안산시 본오동"}
            value={form.serviceRegions}
            onChange={(value) => setForm((current) => ({ ...current, serviceRegions: value }))}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <BooleanField
              checked={form.saturdayPickupAvailable}
              label="토요일 집하"
              onChange={(checked) =>
                setForm((current) => ({ ...current, saturdayPickupAvailable: checked }))
              }
            />
            <BooleanField
              checked={form.saturdayDeliveryAvailable}
              label="토요일 배송"
              onChange={(checked) =>
                setForm((current) => ({ ...current, saturdayDeliveryAvailable: checked }))
              }
            />
            <BooleanField
              checked={form.returnAvailable}
              label="반품 가능"
              onChange={(checked) =>
                setForm((current) => ({ ...current, returnAvailable: checked }))
              }
            />
          </div>
          <ColdChainField form={form} setForm={setForm} />
        </section>
      ) : null}

      {selectedRole === "DRIVER" ? (
        <section className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <SectionTitle title="배송기사 프로필" description="가입과 동시에 기사 프로필을 등록합니다." />
          <div className="grid gap-2 sm:grid-cols-2">
            {employmentTypeOptions.map((option) => {
              const selected = form.employmentType === option.value;

              return (
                <button
                  aria-pressed={selected}
                  className={`rounded-md border px-4 py-3 text-left transition ${
                    selected
                      ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                  }`}
                  key={option.value}
                  onClick={() => {
                    setForm((current) => ({
                      ...current,
                      employmentType: option.value,
                      agencyId: option.value === "FREELANCER" ? "" : current.agencyId,
                    }));
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

          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="기사명"
              name="driverName"
              value={form.driverName}
              autoComplete="name"
              onChange={(value) => setForm((current) => ({ ...current, driverName: value }))}
            />
            <TextField
              label="연락처"
              name="phoneNumber"
              value={form.phoneNumber}
              autoComplete="tel"
              onChange={(value) =>
                setForm((current) => ({ ...current, phoneNumber: formatPhoneNumber(value) }))
              }
            />
            <TextField
              label="차량번호"
              name="vehicleNumber"
              value={form.vehicleNumber}
              autoComplete="off"
              required={false}
              onChange={(value) => setForm((current) => ({ ...current, vehicleNumber: value }))}
            />
          </div>

          {form.employmentType === "AGENCY_AFFILIATED" ? (
            <section className="grid gap-3 rounded-md border border-slate-200 bg-white p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                <input
                  className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
                  placeholder="대리점명 검색"
                  value={agencySearchKeyword}
                  onChange={(event) => setAgencySearchKeyword(event.target.value)}
                />
                <button
                  className="h-12 rounded-md border border-emerald-700 px-4 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
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
                <p className="rounded-md bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500">
                  선택된 대리점이 없습니다.
                </p>
              )}

              {agencyCandidates.length > 0 ? (
                <div className="grid gap-2">
                  <p className="text-xs font-bold text-slate-500">검색 결과</p>
                  {agencyCandidates.map((agency) => (
                    <button
                      className="rounded-md border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-emerald-700"
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
          ) : null}

          <TextareaField
            label="담당 가능 지역"
            placeholder={"경기도 안산시 일동\n경기도 안산시 본오동"}
            value={form.serviceRegions}
            onChange={(value) => setForm((current) => ({ ...current, serviceRegions: value }))}
          />

          <TextareaField
            label="메모"
            value={form.memo}
            required={false}
            onChange={(value) => setForm((current) => ({ ...current, memo: value }))}
          />
        </section>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting || passwordMismatch}
        className="h-12 rounded-md bg-slate-950 px-5 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? "가입 중" : "회원가입"}
      </button>

      <p className="text-center text-sm text-slate-600">
        이미 계정이 있으면{" "}
        <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href="/login">
          로그인
        </Link>
      </p>
    </form>
  );
}

function TextField({
  label,
  name,
  type = "text",
  value,
  autoComplete,
  minLength,
  errorMessage,
  required = true,
  onChange,
}: {
  label: string;
  name: keyof SignUpFormState;
  type?: string;
  value: string;
  autoComplete: string;
  minLength?: number;
  errorMessage?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative flex flex-col gap-2">
      <label className="text-sm font-medium text-slate-700" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        autoComplete={autoComplete}
        minLength={minLength}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={errorMessage ? `${name}-error` : undefined}
        className={`h-12 rounded-md border bg-white px-4 text-base text-slate-950 outline-none transition focus:ring-3 ${
          errorMessage
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-100"
        }`}
      />
      {errorMessage ? (
        <p
          id={`${name}-error`}
          className="relative mt-1 w-fit rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 before:absolute before:-top-1.5 before:left-4 before:h-3 before:w-3 before:rotate-45 before:border-l before:border-t before:border-red-200 before:bg-red-50"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
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
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
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

function TextareaField({
  label,
  placeholder,
  value,
  required = true,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        className="min-h-24 rounded-md border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
        placeholder={placeholder}
        required={required}
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
        className="h-5 w-5 accent-emerald-700"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
    </label>
  );
}

function AddressFields({
  form,
  setForm,
  mainRegionLabel,
  fillServiceRegions = false,
}: {
  form: SignUpFormState;
  setForm: Dispatch<SetStateAction<SignUpFormState>>;
  mainRegionLabel: string;
  fillServiceRegions?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">우편번호</span>
        <div className="grid gap-2 sm:grid-cols-[1fr_48px]">
          <input
            className="h-12 rounded-md border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-3 focus:ring-emerald-100"
            value={form.postalCode}
            onChange={(event) =>
              setForm((current) => ({ ...current, postalCode: event.target.value }))
            }
          />
          <AddressSearchButton
            compact
            onSelect={(selectedAddress) =>
              setForm((current) => ({
                ...current,
                postalCode: selectedAddress.postalCode,
                address: selectedAddress.address,
                mainRegion: selectedAddress.region,
                serviceRegions:
                  fillServiceRegions && !current.serviceRegions
                    ? selectedAddress.region
                    : current.serviceRegions,
              }))
            }
          />
        </div>
      </div>
      <TextField
        label={mainRegionLabel}
        name="mainRegion"
        value={form.mainRegion}
        autoComplete="address-level2"
        onChange={(value) => setForm((current) => ({ ...current, mainRegion: value }))}
      />
      <TextField
        label="주소"
        name="address"
        value={form.address}
        autoComplete="street-address"
        onChange={(value) => setForm((current) => ({ ...current, address: value }))}
      />
      <TextField
        label="상세 주소"
        name="addressDetail"
        value={form.addressDetail}
        autoComplete="address-line2"
        required={false}
        onChange={(value) => setForm((current) => ({ ...current, addressDetail: value }))}
      />
    </div>
  );
}

function ColdChainField({
  form,
  setForm,
}: {
  form: SignUpFormState;
  setForm: Dispatch<SetStateAction<SignUpFormState>>;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">지원 온도 관리</span>
      <div className="grid gap-2 sm:grid-cols-3">
        {coldChainOptions.map((option) => (
          <BooleanField
            checked={form.supportedColdChainTypes.includes(option.value)}
            key={option.value}
            label={option.label}
            onChange={(checked) =>
              setForm((current) => ({
                ...current,
                supportedColdChainTypes: toggleColdChainType(
                  current.supportedColdChainTypes,
                  option.value,
                  checked,
                ),
              }))
            }
          />
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h3 className="text-base font-bold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
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
    </div>
  );
}

function submitByRole(role: SignUpRole, form: SignUpFormState) {
  const request = {
    loginId: form.loginId.trim(),
    email: form.email.trim(),
    password: form.password,
    passwordConfirm: form.passwordConfirm,
    name: form.name.trim(),
  };

  if (role === "VENDOR") {
    return signUpVendor({
      ...request,
      businessName: form.businessName.trim(),
      businessRegistrationNumber: blankToNull(form.businessRegistrationNumber),
      representativeName: form.representativeName.trim(),
      phoneNumber: form.phoneNumber.trim(),
      postalCode: blankToNull(form.postalCode),
      address: form.address.trim(),
      addressDetail: blankToNull(form.addressDetail),
      mainRegion: form.mainRegion.trim(),
    });
  }

  if (role === "AGENCY") {
    return signUpAgency({
      ...request,
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
      supportedColdChainTypes: form.supportedColdChainTypes,
      maxMonthlyVolume: numberToNullable(form.maxMonthlyVolume),
    });
  }

  const driverRequest = {
    ...request,
    employmentType: form.employmentType,
    agencyId: form.employmentType === "AGENCY_AFFILIATED" ? form.agencyId.trim() : null,
    driverName: form.driverName.trim(),
    phoneNumber: form.phoneNumber.trim(),
    vehicleNumber: blankToNull(form.vehicleNumber),
    serviceRegions: parseServiceRegions(form.serviceRegions),
    active: form.active,
    memo: blankToNull(form.memo),
  };

  return signUpDriver(driverRequest);
}

function validateSignUpForm(role: SignUpRole, form: SignUpFormState): string {
  if (!form.loginId.trim()) {
    return "loginId는 필수입니다.";
  }

  if (!form.email.trim()) {
    return "email은 필수입니다.";
  }

  if (!isValidEmail(form.email.trim())) {
    return "email 형식이 올바르지 않습니다.";
  }

  if (!form.password.trim()) {
    return "password는 필수입니다.";
  }

  if (!form.passwordConfirm.trim()) {
    return "passwordConfirm은 필수입니다.";
  }

  if (!form.name.trim()) {
    return "name은 필수입니다.";
  }

  if (role === "VENDOR") {
    return validateVendorProfile(form);
  }

  if (role === "AGENCY") {
    return validateAgencyProfile(form);
  }

  if (role === "DRIVER") {
    if (form.employmentType === "AGENCY_AFFILIATED" && !form.agencyId.trim()) {
      return "소속 기사로 가입하려면 agencyId가 필요합니다.";
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
  }

  return "";
}

function validateVendorProfile(form: SignUpFormState): string {
  if (!form.businessName.trim()) {
    return "상호명은 필수입니다.";
  }

  if (!form.representativeName.trim()) {
    return "대표자명은 필수입니다.";
  }

  if (!isValidBusinessRegistrationNumber(form.businessRegistrationNumber)) {
    return "사업자등록번호는 10자리로 입력해 주세요.";
  }

  if (!isValidPhoneNumber(form.phoneNumber)) {
    return "연락처는 10~11자리로 입력해 주세요.";
  }

  if (!form.address.trim()) {
    return "주소는 필수입니다.";
  }

  if (!form.mainRegion.trim()) {
    return "주 지역은 필수입니다.";
  }

  return "";
}

function validateAgencyProfile(form: SignUpFormState): string {
  if (!form.agencyName.trim()) {
    return "대리점명은 필수입니다.";
  }

  if (!form.representativeName.trim()) {
    return "대표자명은 필수입니다.";
  }

  if (!isValidBusinessRegistrationNumber(form.businessRegistrationNumber)) {
    return "사업자등록번호는 10자리로 입력해 주세요.";
  }

  if (!isValidPhoneNumber(form.phoneNumber)) {
    return "연락처는 10~11자리로 입력해 주세요.";
  }

  if (!form.address.trim()) {
    return "주소는 필수입니다.";
  }

  if (!form.mainRegion.trim()) {
    return "주 담당 지역은 필수입니다.";
  }

  if (parseServiceRegions(form.serviceRegions).length === 0) {
    return "담당 가능 지역은 1개 이상이어야 합니다.";
  }

  if (form.supportedColdChainTypes.length === 0) {
    return "지원 온도 관리는 1개 이상 선택해야 합니다.";
  }

  if (form.maxMonthlyVolume && Number(form.maxMonthlyVolume) < 0) {
    return "월 처리 가능 물량은 0 이상이어야 합니다.";
  }

  return "";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhoneNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");

  return digits.length >= 10 && digits.length <= 11;
}

function isValidBusinessRegistrationNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");

  return digits.length === 0 || digits.length === 10;
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

function toggleColdChainType(
  currentTypes: ColdChainType[],
  value: ColdChainType,
  checked: boolean,
): ColdChainType[] {
  if (checked) {
    return Array.from(new Set([...currentTypes, value]));
  }

  return currentTypes.filter((type) => type !== value);
}

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
  { value: "NONE", label: "일반" },
  { value: "REFRIGERATED", label: "냉장" },
  { value: "FROZEN", label: "냉동" },
];

const employmentTypeOptions: Array<{
  value: DeliverEmploymentType;
  label: string;
  description: string;
}> = [
  {
    value: "AGENCY_AFFILIATED",
    label: "대리점 소속",
    description: "소속 대리점 기준으로 기사 계약을 관리합니다.",
  },
  {
    value: "FREELANCER",
    label: "프리랜서",
    description: "대리점 소속 없이 외부 기사 후보로 등록됩니다.",
  },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "회원가입에 실패했습니다.";
}
