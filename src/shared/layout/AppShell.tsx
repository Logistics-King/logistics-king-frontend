"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { logout } from "@/src/features/auth/api";
import type { UserRole } from "@/src/shared/api/types";
import { getMenuItems, type MenuItem } from "@/src/shared/navigation/menu";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "@/src/shared/notifications/api";

// 로그인 이후 대부분의 내부 페이지가 공유하는 화면 껍데기입니다.
// 좌측 메뉴, 모바일 하단 메뉴, 상단 네비게이션, 알림, 로그아웃을 한 곳에서 처리합니다.
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

  // 데스크톱에서는 왼쪽 사이드바를 고정해서 업무 메뉴를 계속 보여줍니다.
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [infoHref, roleHomeHref] = [roleInfoPathMap[role], roleHomePathMap[role]];

  useEffect(() => {
    let active = true;

    async function fetchUnreadCount() {
      try {
        const response = await getUnreadNotificationCount();

        if (active) {
          setUnreadCount(response.count);
        }
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    }

    fetchUnreadCount();
    // 백엔드에 실시간 알림 API가 아직 없어서 1분마다 unread count를 다시 조회합니다.
    const intervalId = window.setInterval(fetchUnreadCount, 60_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

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
              {formatBadgeCount(unreadCount)}
            </span>
          </button>
          {notificationsOpen ? (
            <NotificationPanel
              onClose={() => setNotificationsOpen(false)}
              onUnreadCountChange={setUnreadCount}
            />
          ) : null}
        </div>
        <button className={topNavButtonClassName} onClick={handleLogout} type="button">
          로그아웃
        </button>
      </nav>
    </div>
  );
}

function NotificationPanel({
  onClose,
  onUnreadCountChange,
}: {
  onClose: () => void;
  onUnreadCountChange: Dispatch<SetStateAction<number>>;
}) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchNotifications() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await getNotifications({ page: 0, size: 20 });

        if (active) {
          setItems(response.items);
        }
      } catch {
        if (active) {
          setErrorMessage("알림을 불러오지 못했습니다.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchNotifications();

    return () => {
      active = false;
    };
  }, []);

  async function handleReadAll() {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await markAllNotificationsAsRead();
      setItems((currentItems) =>
        currentItems.map((item) => ({
          ...item,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
      onUnreadCountChange(0);
    } catch {
      setErrorMessage("알림을 읽음 처리하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNotificationClick(item: NotificationItem) {
    setErrorMessage("");

    try {
      if (item.readAt === null) {
        const updatedItem = await markNotificationAsRead(item.notificationId);

        setItems((currentItems) =>
          currentItems.map((currentItem) =>
            currentItem.notificationId === item.notificationId ? updatedItem : currentItem,
          ),
        );
        onUnreadCountChange((currentCount) => Math.max(currentCount - 1, 0));
      }

      if (item.linkUrl) {
        // 백엔드가 내려준 linkUrl이 있으면 알림 클릭 시 해당 화면으로 이동합니다.
        router.push(item.linkUrl);
        onClose();
      }
    } catch {
      setErrorMessage("알림을 읽음 처리하지 못했습니다.");
    }
  }

  const unreadCount = items.filter((item) => item.readAt === null).length;

  return (
    <div className="absolute right-0 top-11 z-30 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-bold text-slate-950">알림</p>
        <button
          className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-[#071f46]/10 hover:text-[#071f46] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting || unreadCount === 0}
          onClick={handleReadAll}
          type="button"
        >
          모두 읽음
        </button>
      </div>

      {errorMessage ? (
        <p className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="grid gap-2 px-4 py-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="h-16 rounded-md bg-slate-100" key={index} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm font-bold text-slate-700">새 알림이 없습니다.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.notificationId}>
                <button
                  className="grid w-full gap-1 px-4 py-3 text-left transition hover:bg-slate-50"
                  onClick={() => handleNotificationClick(item)}
                  type="button"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0 text-sm font-bold text-slate-950">{item.title}</span>
                    {item.readAt === null ? (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#071f46]" />
                    ) : null}
                  </span>
                  <span className="line-clamp-2 text-xs leading-5 text-slate-600">
                    {item.message}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {formatNotificationTime(item.createdAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function MobileBottomNav({ menuItems }: { menuItems: MenuItem[] }) {
  const pathname = usePathname();
  const primaryItems = menuItems.slice(0, 5);

  // 모바일에서는 사이드바 대신 하단 탭 메뉴를 씁니다.
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

function formatBadgeCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

function formatNotificationTime(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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
