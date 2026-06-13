"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { logout } from "@/src/features/auth/api";
import type { UserRole } from "@/src/shared/api/types";
import { getMenuItems, type MenuItem } from "@/src/shared/navigation/menu";

export function AppShell({
  role,
  title,
  description,
  children,
}: {
  role: UserRole;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const menuItems = getMenuItems(role);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 lg:flex">
      <DesktopSidebar menuItems={menuItems} role={role} />
      <div className="flex min-h-screen flex-1 flex-col pb-24 lg:pb-0">
        <header className="border-b border-slate-200 bg-white">
          <TopNavigation role={role} />
          <div className="px-5 py-5 lg:px-8">
            <p className="text-sm font-semibold text-emerald-700">{roleLabelMap[role]}</p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
        </header>
        <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
      </div>
      <MobileBottomNav menuItems={menuItems} />
    </div>
  );
}

function DesktopSidebar({ role, menuItems }: { role: UserRole; menuItems: MenuItem[] }) {
  const groups = groupMenuItems(menuItems);

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-5 py-5">
        <Link className="flex items-center gap-3" href={roleHomePathMap[role]}>
          <Image
            src="/images/logistics-king-logo.png"
            alt="택배왕 로고"
            width={42}
            height={42}
            className="rounded-md"
          />
          <div>
            <p className="text-base font-bold text-slate-950">택배왕</p>
            <p className="text-xs font-medium text-slate-500">{roleLabelMap[role]}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map(([group, items]) => (
          <div className="mb-5" key={group}>
            <p className={groupLabelClassName}>{group}</p>
            <div className="mt-2 grid gap-1">
              {items.map((item) => (
                <NavigationLink item={item} key={item.href} />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function TopNavigation({ role }: { role: UserRole }) {
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [infoHref, roleHomeHref] = [roleInfoPathMap[role], roleHomePathMap[role]];

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/");
    }
  }

  return (
    <div className="flex h-16 items-center justify-between gap-3 border-b border-slate-100 px-5 lg:px-8">
      <Link className="flex min-w-0 items-center gap-3 lg:hidden" href={roleHomeHref}>
        <Image
          src="/images/logistics-king-logo.png"
          alt="택배왕 로고"
          width={36}
          height={36}
          className="rounded-md"
        />
        <span className="hidden truncate text-base font-bold text-slate-950 sm:inline">택배왕</span>
      </Link>

      <div className="hidden items-center gap-2 lg:flex">
        <span className="rounded-md bg-[#071f46]/10 px-3 py-1.5 text-sm font-bold text-[#071f46]">
          {roleLabelMap[role]}
        </span>
      </div>

      <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Link className={topNavLinkClassName} href={roleHomeHref}>
          홈
        </Link>
        <Link className={topNavLinkClassName} href={infoHref}>
          내 정보
        </Link>
        <div className="relative">
          <button
            aria-expanded={notificationsOpen}
            className={topNavButtonClassName}
            onClick={() => setNotificationsOpen((open) => !open)}
            type="button"
          >
            알림
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#071f46] px-1 text-xs font-bold text-white">
              0
            </span>
          </button>
          {notificationsOpen ? <NotificationPanel /> : null}
        </div>
        <button className={topNavButtonClassName} onClick={handleLogout} type="button">
          로그아웃
        </button>
      </nav>
    </div>
  );
}

function NotificationPanel() {
  return (
    <div className="absolute right-0 top-11 z-30 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-bold text-slate-950">알림</p>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">0개</span>
      </div>
      <div className="px-4 py-8 text-center">
        <p className="text-sm font-bold text-slate-700">새 알림이 없습니다.</p>
      </div>
    </div>
  );
}

function MobileBottomNav({ menuItems }: { menuItems: MenuItem[] }) {
  const pathname = usePathname();
  const primaryItems = menuItems.slice(0, 5);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div
        className="grid h-16"
        style={{ gridTemplateColumns: `repeat(${primaryItems.length}, minmax(0, 1fr))` }}
      >
        {primaryItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              className={`flex min-w-0 flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
                active ? "text-emerald-700" : "text-slate-500"
              }`}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-5 w-5" />
              <span className="max-w-full truncate">{shortenLabel(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavigationLink({ item }: { item: MenuItem }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      className={`flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
        active
          ? "bg-[#071f46]/10 text-[#071f46]"
          : "text-slate-600 hover:bg-[#071f46]/5 hover:text-[#071f46]"
      }`}
      href={item.href}
    >
      <Icon className="h-5 w-5" />
      <span>{item.label}</span>
    </Link>
  );
}

function groupMenuItems(menuItems: MenuItem[]): Array<[MenuItem["group"], MenuItem[]]> {
  const groups: MenuItem["group"][] = ["화주", "대리점", "배송기사"];

  return groups
    .map(
      (group) =>
        [group, menuItems.filter((item) => item.group === group)] as [
          MenuItem["group"],
          MenuItem[],
        ],
    )
    .filter(([, items]) => items.length > 0);
}

function isActive(pathname: string, href: string): boolean {
  if (
    href === "/vendor" ||
    href === "/agency" ||
    href === "/driver" ||
    href === "/admin" ||
    href === "/vendor/products"
  ) {
    return pathname === href;
  }

  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

function shortenLabel(label: string): string {
  return label.replace("화주 ", "").replace("대리점 ", "").replace("기사 ", "");
}

const roleLabelMap: Record<UserRole, string> = {
  ADMIN: "관리자",
  VENDOR: "화주",
  AGENCY: "대리점",
  DRIVER: "배송기사",
};

const roleHomePathMap: Record<UserRole, string> = {
  ADMIN: "/admin",
  VENDOR: "/vendor",
  AGENCY: "/agency",
  DRIVER: "/driver",
};

const roleInfoPathMap: Record<UserRole, string> = {
  ADMIN: "/admin",
  VENDOR: "/vendor/profile",
  AGENCY: "/agency/profile",
  DRIVER: "/driver/profile",
};

const groupLabelClassName =
  "mx-1 rounded-md bg-[#071f46] px-3 py-2 text-sm font-bold text-white";

const topNavLinkClassName =
  "inline-flex h-9 items-center justify-center rounded-md px-2 text-xs font-semibold text-slate-600 transition hover:bg-[#071f46]/5 hover:text-[#071f46] sm:px-3 sm:text-sm";

const topNavButtonClassName =
  "inline-flex h-9 items-center justify-center rounded-md border border-slate-300 px-2 text-xs font-bold text-slate-700 transition hover:border-[#071f46] hover:text-[#071f46] sm:px-3 sm:text-sm";
