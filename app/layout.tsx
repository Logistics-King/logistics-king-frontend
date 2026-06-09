import type { Metadata } from "next";
import "./globals.css";

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
