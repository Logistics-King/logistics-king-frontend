"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { signUpAgency, signUpDriver, signUpVendor } from "./api";
import { getRoleHomePath, signUpRoles, type SignUpRole } from "./roles";

type SignUpFormState = {
  loginId: string;
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
};

const initialFormState: SignUpFormState = {
  loginId: "",
  email: "",
  password: "",
  passwordConfirm: "",
  name: "",
};

export function SignUpForm() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<SignUpRole>("VENDOR");
  const [form, setForm] = useState<SignUpFormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (passwordMismatch) {
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await submitByRole(selectedRole, form);
      router.push(getRoleHomePath(user.role));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
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
                className={`min-h-24 rounded-md border p-3 text-left transition ${
                  isSelected
                    ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-500"
                }`}
                key={item.role}
                type="button"
                onClick={() => setSelectedRole(item.role)}
                aria-pressed={isSelected}
              >
                <span className="block text-base font-semibold">{item.label}</span>
                <span className="mt-1 block text-xs leading-5">{item.description}</span>
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
  onChange,
}: {
  label: string;
  name: keyof SignUpFormState;
  type?: string;
  value: string;
  autoComplete: string;
  minLength?: number;
  errorMessage?: string;
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
        required
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

function submitByRole(role: SignUpRole, form: SignUpFormState) {
  const request = {
    loginId: form.loginId,
    email: form.email,
    password: form.password,
    name: form.name,
  };
  const submitters = {
    VENDOR: signUpVendor,
    AGENCY: signUpAgency,
    DRIVER: signUpDriver,
  };

  return submitters[role](request);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "회원가입에 실패했습니다.";
}
