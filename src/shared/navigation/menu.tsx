import type { ComponentType, SVGProps } from "react";
import type { UserRole } from "@/src/shared/api/types";

export type MenuItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  roles: UserRole[];
  group: "화주" | "대리점" | "배송기사";
};

const vendorRoles: UserRole[] = ["ADMIN", "VENDOR"];
const agencyRoles: UserRole[] = ["ADMIN", "AGENCY"];
const driverRoles: UserRole[] = ["ADMIN", "DRIVER"];

export const menuItems: MenuItem[] = [
  {
    label: "화주 홈",
    href: "/vendor",
    icon: StoreIcon,
    roles: vendorRoles,
    group: "화주",
  },
  {
    label: "화주 정보",
    href: "/vendor/profile",
    icon: UserIcon,
    roles: vendorRoles,
    group: "화주",
  },
  {
    label: "배송 품목 조회",
    href: "/vendor/products",
    icon: PackageIcon,
    roles: vendorRoles,
    group: "화주",
  },
  {
    label: "배송 품목 등록",
    href: "/vendor/products/new",
    icon: FileIcon,
    roles: vendorRoles,
    group: "화주",
  },
  {
    label: "계약 요청",
    href: "/vendor/contract-requests",
    icon: FileIcon,
    roles: vendorRoles,
    group: "화주",
  },
  {
    label: "화주 계약",
    href: "/vendor/contracts",
    icon: ContractIcon,
    roles: vendorRoles,
    group: "화주",
  },
  {
    label: "대리점 홈",
    href: "/agency",
    icon: BuildingIcon,
    roles: agencyRoles,
    group: "대리점",
  },
  {
    label: "대리점 정보",
    href: "/agency/profile",
    icon: UserIcon,
    roles: agencyRoles,
    group: "대리점",
  },
  {
    label: "일감 조회",
    href: "/agency/open-requests",
    icon: SearchIcon,
    roles: agencyRoles,
    group: "대리점",
  },
  {
    label: "내 제안",
    href: "/agency/proposals",
    icon: HandshakeIcon,
    roles: agencyRoles,
    group: "대리점",
  },
  {
    label: "대리점 계약",
    href: "/agency/contracts",
    icon: ContractIcon,
    roles: agencyRoles,
    group: "대리점",
  },
  {
    label: "기사 계약",
    href: "/agency/deliver-contracts",
    icon: TruckIcon,
    roles: agencyRoles,
    group: "대리점",
  },
  {
    label: "기사 홈",
    href: "/driver",
    icon: TruckIcon,
    roles: driverRoles,
    group: "배송기사",
  },
  {
    label: "기사 정보",
    href: "/driver/profile",
    icon: UserIcon,
    roles: driverRoles,
    group: "배송기사",
  },
  {
    label: "내 기사 계약",
    href: "/driver/deliver-contracts",
    icon: ContractIcon,
    roles: driverRoles,
    group: "배송기사",
  },
];

export function getMenuItems(role: UserRole): MenuItem[] {
  return menuItems.filter((item) => item.roles.includes(role));
}

function IconBase(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      {...props}
    />
  );
}

function StoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 10h16l-1-6H5z" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </IconBase>
  );
}

function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </IconBase>
  );
}

function PackageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="m12 3 8 4-8 4-8-4z" />
      <path d="M4 7v10l8 4 8-4V7" />
      <path d="M12 11v10" />
    </IconBase>
  );
}

function FileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h5" />
      <path d="M10 13h5" />
      <path d="M10 17h7" />
    </IconBase>
  );
}

function ContractIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M6 3h12v18H6z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h3" />
    </IconBase>
  );
}

function BuildingIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M4 21V5l8-3 8 3v16" />
      <path d="M8 9h1" />
      <path d="M12 9h1" />
      <path d="M16 9h1" />
      <path d="M8 13h1" />
      <path d="M12 13h1" />
      <path d="M16 13h1" />
      <path d="M10 21v-4h4v4" />
    </IconBase>
  );
}

function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </IconBase>
  );
}

function HandshakeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M8 12 4 8l4-4 4 4" />
      <path d="m16 12 4-4-4-4-4 4" />
      <path d="m9 11 3 3 3-3" />
      <path d="M7 14l5 5 5-5" />
    </IconBase>
  );
}

function TruckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <IconBase {...props}>
      <path d="M3 6h11v10H3z" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </IconBase>
  );
}
