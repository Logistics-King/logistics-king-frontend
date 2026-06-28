import Image from "next/image";
import Link from "next/link";
import { SignUpForm } from "@/src/features/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-10 lg:px-8">
        <Link className="flex w-fit items-center gap-3 text-sm font-semibold text-emerald-700" href="/">
          <Image
            src="/images/logistics-king-logo.png"
            alt="택배왕 로고"
            width={40}
            height={40}
            className="rounded-md"
          />
          택배왕
        </Link>

        <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
          <div className="flex flex-col justify-center gap-5">
            <p className="text-sm font-semibold text-orange-600">계정 생성</p>
            <h1 className="text-3xl font-bold leading-[1.35] tracking-normal text-slate-950 sm:text-4xl">
              역할에 맞는 계정을 만들고 계약 흐름을 시작합니다.
            </h1>
            <p className="text-base leading-8 text-slate-600">
              가입 후 화주는 프로필과 품목을 등록하고, 대리점과 배송기사는 담당 정보를 이어서 입력합니다.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-950">회원가입</h2>
              <p className="mt-2 text-sm text-slate-600">
                역할을 선택하고 필요한 계정 정보를 입력하세요.
              </p>
            </div>
            <SignUpForm />
          </div>
        </div>
      </section>
    </main>
  );
}
