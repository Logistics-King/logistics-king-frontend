import Link from "next/link";
import type { UserRole } from "@/src/shared/api/types";

type ProfileRequiredNoticeProps = {
  role: Extract<UserRole, "VENDOR" | "AGENCY" | "DRIVER">;
};

const noticeContent: Record<
  ProfileRequiredNoticeProps["role"],
  { title: string; description: string; href: string; action: string }
> = {
  VENDOR: {
    title: "화주 정보 등록이 먼저 필요합니다.",
    description: "배송 품목, 계약 요청, 계약 관리는 화주 사업 정보가 있어야 사용할 수 있습니다.",
    href: "/vendor/profile",
    action: "화주 정보 등록",
  },
  AGENCY: {
    title: "대리점 정보 등록이 먼저 필요합니다.",
    description: "제안 요청 조회와 계약 관리는 대리점 영업 거점 정보가 있어야 사용할 수 있습니다.",
    href: "/agency/profile",
    action: "대리점 정보 등록",
  },
  DRIVER: {
    title: "기사 정보 등록이 먼저 필요합니다.",
    description: "기사 계약 관리는 배송기사 정보가 있어야 사용할 수 있습니다.",
    href: "/driver/profile",
    action: "기사 정보 등록",
  },
};

export function ProfileRequiredNotice({ role }: ProfileRequiredNoticeProps) {
  const content = noticeContent[role];

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <p className="text-sm font-bold text-amber-900">{content.title}</p>
      <p className="mt-2 text-sm leading-6 text-amber-800">{content.description}</p>
      <Link
        className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-[#071f46] px-4 text-sm font-bold text-white transition hover:bg-[#0a2d63]"
        href={content.href}
      >
        {content.action}
      </Link>
    </section>
  );
}
