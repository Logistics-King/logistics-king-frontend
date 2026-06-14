import Image from "next/image";
import Link from "next/link";

// app/page.tsx는 루트 주소("/")에 보이는 첫 화면입니다.
// Next.js App Router는 app 폴더 안의 page.tsx 파일을 URL 페이지로 사용합니다.
const serviceStats = [
  { label: "계약 요청", value: "3분" },
  { label: "제안 비교", value: "한 화면" },
  { label: "권한 관리", value: "4역할" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative flex min-h-[calc(100svh-56px)] overflow-hidden">
        <Image
          src="/images/home-hero-map-truck.png"
          alt="지도 위 배송 화물차"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.94)_0%,rgba(2,6,23,0.82)_34%,rgba(2,6,23,0.34)_68%,rgba(2,6,23,0.1)_100%)]" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-5 py-6 sm:px-8">
          <header className="flex items-center justify-between">
            <Link className="flex items-center gap-3" href="/">
              <Image
                src="/images/logistics-king-logo.png"
                alt="택배왕 로고"
                width={44}
                height={44}
                className="rounded-md"
              />
              <span className="text-lg font-bold tracking-normal">택배왕</span>
            </Link>

            <nav className="flex items-center gap-2">
              <Link
                className="flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
                href="/login"
              >
                로그인
              </Link>
              <Link
                className="flex h-10 items-center justify-center rounded-md bg-amber-400 px-4 text-sm font-bold text-slate-950 transition hover:bg-amber-300"
                href="/signup"
              >
                회원가입
              </Link>
            </nav>
          </header>

          <div className="flex flex-1 items-center py-16">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-amber-300">택배 계약 플랫폼</p>
              <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal text-white sm:text-6xl lg:text-7xl">
                <span className="block sm:whitespace-nowrap">택배 단가와 조건을</span>
                <span className="block sm:whitespace-nowrap">한번에 비교하세요.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">
                <span className="block">
                  화주는 계약 요청을 등록하고, 대리점은 조건을 제안합니다.
                </span>
                <span className="block">
                  택배왕은 계약 비교부터 기사 연결까지 물류 계약 흐름을 정리합니다.
                </span>
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="flex h-12 items-center justify-center rounded-md bg-amber-400 px-6 text-base font-bold text-slate-950 transition hover:bg-amber-300"
                  href="/signup"
                >
                  계약 시작하기
                </Link>
                <Link
                  className="flex h-12 items-center justify-center rounded-md border border-white/30 bg-white/10 px-6 text-base font-semibold text-white backdrop-blur transition hover:bg-white/15"
                  href="/login"
                >
                  로그인
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-950 px-5 py-4 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-3">
          {serviceStats.map((item) => (
            <div
              className="flex items-center justify-between border-b border-white/10 py-3 sm:border-b-0"
              key={item.label}
            >
              <span className="text-sm font-medium text-slate-400">{item.label}</span>
              <span className="text-xl font-bold text-white">{item.value}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
