import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/src/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-slate-100">
      <section className="mx-auto flex w-full max-w-6xl flex-col justify-center gap-10 px-5 py-10 lg:grid lg:grid-cols-[1fr_440px] lg:px-8">
        <div className="flex flex-col justify-center gap-6">
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
          <div className="max-w-xl">
            <p className="text-sm font-semibold text-orange-600">물류 계약 관리</p>
            <h1 className="mt-3 text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
              계약 요청부터 제안 비교까지 한 계정으로 관리합니다.
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600">
              화주, 대리점, 배송기사 권한에 맞는 화면으로 이동합니다.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-950">로그인</h2>
            <p className="mt-2 text-sm text-slate-600">
              계정 정보를 입력하고 택배왕을 시작하세요.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
