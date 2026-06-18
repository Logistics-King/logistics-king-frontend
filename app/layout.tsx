import type { Metadata } from "next";
import "./globals.css";

// Next.js의 최상위 레이아웃입니다.
// app 아래 모든 page.tsx는 최종적으로 이 children 위치에 렌더링됩니다.
// 전역 CSS, html/body 태그, 기본 메타데이터처럼 앱 전체 공통 설정을 둡니다.
export const metadata: Metadata = {
  title: "택배왕",
  description: "택배왕 프론트엔드",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
