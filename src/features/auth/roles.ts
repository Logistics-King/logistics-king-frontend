import type { UserRole } from "@/src/shared/api/types";

export type SignUpRole = Exclude<UserRole, "ADMIN">;

export const signUpRoles: Array<{
  role: SignUpRole;
  label: string;
  description: string;
}> = [
  {
    role: "VENDOR",
    label: "화주",
    description: "배송 계약 요청을 등록하고 제안을 비교합니다.",
  },
  {
    role: "AGENCY",
    label: "대리점",
    description: "계약 요청을 확인하고 배송 조건을 제안합니다.",
  },
  {
    role: "DRIVER",
    label: "배송기사",
    description: "대리점과 기사 계약을 확인하고 수락합니다.",
  },
];

export function getRoleHomePath(role: UserRole): string {
  const roleHomePaths: Record<UserRole, string> = {
    ADMIN: "/admin",
    VENDOR: "/vendor",
    AGENCY: "/agency",
    DRIVER: "/driver",
  };

  return roleHomePaths[role];
}
