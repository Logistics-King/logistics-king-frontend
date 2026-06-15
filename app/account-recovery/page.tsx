import Image from "next/image";
import Link from "next/link";
import { AccountRecoveryForm } from "@/src/features/auth/AccountRecoveryForm";

export default function AccountRecoveryPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 lg:px-8">
        <Link className="flex w-fit items-center gap-3 text-sm font-semibold text-emerald-700" href="/">
          <Image
            alt="택배왕 로고"
            className="rounded-md"
            height={40}
            src="/images/logistics-king-logo.png"
            width={40}
          />
          택배왕
        </Link>

        <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
          <div className="flex flex-col justify-center gap-5">
            <p className="text-sm font-semibold text-orange-600">계정 복구</p>
            <h1 className="text-4xl font-bold tracking-normal text-slate-950">
              아이디와 비밀번호를 이메일 인증으로 복구합니다.
            </h1>
            <p className="text-base leading-8 text-slate-600">
              입력한 정보가 계정과 일치하면 인증 안내를 발송합니다. 개발 환경에서는 메일 대신 백엔드 로그에서 토큰을 확인합니다.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-950">계정 찾기</h2>
              <p className="mt-2 text-sm text-slate-600">
                아이디 찾기, 비밀번호 인증 요청, 비밀번호 변경을 진행합니다.
              </p>
            </div>
            <AccountRecoveryForm />
          </div>
        </div>
      </section>
    </main>
  );
}
