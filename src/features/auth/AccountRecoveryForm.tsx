"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  confirmPasswordReset,
  recoverLoginId,
  requestPasswordReset,
} from "./api";

type RecoveryMode = "loginId" | "passwordRequest" | "passwordConfirm";

type LoginIdFormState = {
  name: string;
  email: string;
};

type PasswordRequestFormState = {
  loginId: string;
  email: string;
};

type PasswordConfirmFormState = {
  token: string;
  newPassword: string;
  newPasswordConfirm: string;
};

const recoveryModes: Array<{ mode: RecoveryMode; label: string }> = [
  { mode: "loginId", label: "아이디 찾기" },
  { mode: "passwordRequest", label: "비밀번호 인증" },
  { mode: "passwordConfirm", label: "비밀번호 변경" },
];

const initialLoginIdForm: LoginIdFormState = {
  name: "",
  email: "",
};

const initialPasswordRequestForm: PasswordRequestFormState = {
  loginId: "",
  email: "",
};

const initialPasswordConfirmForm: PasswordConfirmFormState = {
  token: "",
  newPassword: "",
  newPasswordConfirm: "",
};

export function AccountRecoveryForm() {
  const [mode, setMode] = useState<RecoveryMode>("loginId");
  const [loginIdForm, setLoginIdForm] = useState(initialLoginIdForm);
  const [passwordRequestForm, setPasswordRequestForm] = useState(initialPasswordRequestForm);
  const [passwordConfirmForm, setPasswordConfirmForm] = useState(initialPasswordConfirmForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordMismatch =
    passwordConfirmForm.newPasswordConfirm.length > 0 &&
    passwordConfirmForm.newPassword !== passwordConfirmForm.newPasswordConfirm;

  function handleModeChange(nextMode: RecoveryMode) {
    setMode(nextMode);
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleLoginIdSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!loginIdForm.name.trim()) {
      setErrorMessage("이름은 필수입니다.");
      return;
    }

    if (!isValidEmail(loginIdForm.email)) {
      setErrorMessage("이메일 형식이 올바르지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await recoverLoginId({
        name: loginIdForm.name.trim(),
        email: loginIdForm.email.trim(),
      });

      setSuccessMessage(response.message);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "아이디 찾기 요청에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!passwordRequestForm.loginId.trim()) {
      setErrorMessage("아이디는 필수입니다.");
      return;
    }

    if (!isValidEmail(passwordRequestForm.email)) {
      setErrorMessage("이메일 형식이 올바르지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await requestPasswordReset({
        loginId: passwordRequestForm.loginId.trim(),
        email: passwordRequestForm.email.trim(),
      });

      setSuccessMessage(`${response.message} 인증 토큰은 1분 동안만 유효합니다.`);
      setMode("passwordConfirm");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "비밀번호 재설정 요청에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordConfirmSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationMessage = validatePasswordConfirmForm(passwordConfirmForm);

    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    if (passwordMismatch) {
      return;
    }

    setIsSubmitting(true);

    try {
      await confirmPasswordReset({
        token: passwordConfirmForm.token.trim(),
        newPassword: passwordConfirmForm.newPassword,
        newPasswordConfirm: passwordConfirmForm.newPasswordConfirm,
      });

      setPasswordConfirmForm(initialPasswordConfirmForm);
      setSuccessMessage("비밀번호를 변경했습니다. 새 비밀번호로 다시 로그인하세요.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "비밀번호 변경에 실패했습니다."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2 rounded-lg bg-slate-100 p-1 sm:grid-cols-3">
        {recoveryModes.map((item) => {
          const selected = item.mode === mode;

          return (
            <button
              aria-pressed={selected}
              className={`h-11 rounded-md text-sm font-bold transition ${
                selected
                  ? "bg-white text-[#071f46] shadow-sm"
                  : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
              }`}
              key={item.mode}
              onClick={() => handleModeChange(item.mode)}
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {mode === "loginId" ? (
        <form className="grid gap-5" onSubmit={handleLoginIdSubmit}>
          <TextField
            autoComplete="name"
            label="이름"
            name="name"
            value={loginIdForm.name}
            onChange={(value) => setLoginIdForm((current) => ({ ...current, name: value }))}
          />
          <TextField
            autoComplete="email"
            label="이메일"
            name="email"
            type="email"
            value={loginIdForm.email}
            onChange={(value) => setLoginIdForm((current) => ({ ...current, email: value }))}
          />
          <SubmitButton isSubmitting={isSubmitting} label="아이디 찾기 메일 요청" />
        </form>
      ) : null}

      {mode === "passwordRequest" ? (
        <form className="grid gap-5" onSubmit={handlePasswordRequestSubmit}>
          <TextField
            autoComplete="username"
            label="아이디"
            name="loginId"
            value={passwordRequestForm.loginId}
            onChange={(value) =>
              setPasswordRequestForm((current) => ({ ...current, loginId: value }))
            }
          />
          <TextField
            autoComplete="email"
            label="이메일"
            name="email"
            type="email"
            value={passwordRequestForm.email}
            onChange={(value) =>
              setPasswordRequestForm((current) => ({ ...current, email: value }))
            }
          />
          <SubmitButton isSubmitting={isSubmitting} label="비밀번호 인증 메일 요청" />
        </form>
      ) : null}

      {mode === "passwordConfirm" ? (
        <form className="grid gap-5" onSubmit={handlePasswordConfirmSubmit}>
          <TextField
            autoComplete="one-time-code"
            label="인증 토큰"
            name="token"
            value={passwordConfirmForm.token}
            onChange={(value) =>
              setPasswordConfirmForm((current) => ({ ...current, token: value }))
            }
          />
          <TextField
            autoComplete="new-password"
            label="새 비밀번호"
            minLength={8}
            name="newPassword"
            type="password"
            value={passwordConfirmForm.newPassword}
            onChange={(value) =>
              setPasswordConfirmForm((current) => ({ ...current, newPassword: value }))
            }
          />
          <TextField
            autoComplete="new-password"
            errorMessage={passwordMismatch ? "비밀번호가 서로 달라요." : ""}
            label="새 비밀번호 확인"
            minLength={8}
            name="newPasswordConfirm"
            type="password"
            value={passwordConfirmForm.newPasswordConfirm}
            onChange={(value) =>
              setPasswordConfirmForm((current) => ({
                ...current,
                newPasswordConfirm: value,
              }))
            }
          />
          <SubmitButton
            disabled={passwordMismatch}
            isSubmitting={isSubmitting}
            label="비밀번호 변경"
          />
        </form>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <p className="text-center text-sm text-slate-600">
        계정 정보가 있으면{" "}
        <Link className="font-semibold text-emerald-700 hover:text-emerald-800" href="/login">
          로그인
        </Link>
      </p>
    </div>
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
  name: string;
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
        aria-describedby={errorMessage ? `${name}-error` : undefined}
        aria-invalid={Boolean(errorMessage)}
        autoComplete={autoComplete}
        className={`h-12 rounded-md border bg-white px-4 text-base text-slate-950 outline-none transition focus:ring-3 ${
          errorMessage
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-100"
        }`}
        id={name}
        minLength={minLength}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
      {errorMessage ? (
        <p
          className="relative mt-1 w-fit rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 before:absolute before:-top-1.5 before:left-4 before:h-3 before:w-3 before:rotate-45 before:border-l before:border-t before:border-red-200 before:bg-red-50"
          id={`${name}-error`}
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function SubmitButton({
  disabled = false,
  isSubmitting,
  label,
}: {
  disabled?: boolean;
  isSubmitting: boolean;
  label: string;
}) {
  return (
    <button
      className="h-12 rounded-md bg-slate-950 px-5 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      disabled={disabled || isSubmitting}
      type="submit"
    >
      {isSubmitting ? "요청 중" : label}
    </button>
  );
}

function validatePasswordConfirmForm(form: PasswordConfirmFormState): string {
  if (!form.token.trim()) {
    return "인증 토큰은 필수입니다.";
  }

  if (!form.newPassword.trim()) {
    return "새 비밀번호는 필수입니다.";
  }

  if (form.newPassword.length < 8) {
    return "새 비밀번호는 8자리 이상으로 입력해 주세요.";
  }

  if (!form.newPasswordConfirm.trim()) {
    return "새 비밀번호 확인은 필수입니다.";
  }

  return "";
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallbackMessage;
}
