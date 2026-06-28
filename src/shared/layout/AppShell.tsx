"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { logout } from "@/src/features/auth/api";
import { API_BASE_URL } from "@/src/shared/api/client";
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
  const [authenticatedRole, setAuthenticatedRole] = useState<UserRole | null>(null);
  const effectiveRole = authenticatedRole ?? role;
  const menuItems = getMenuItems(effectiveRole);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const storedRole = window.localStorage.getItem("logisticsKingRole");

      if (isUserRole(storedRole) && canUseStoredRoleForPage(storedRole, role)) {
        setAuthenticatedRole(storedRole);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [role]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 lg:flex">
      <DesktopSidebar menuItems={menuItems} role={effectiveRole} />
      <div className="flex min-h-screen flex-1 flex-col pb-24 lg:pb-0">
        <header className="border-b border-slate-200 bg-white">
          <TopNavigation role={effectiveRole} />
          <div className="px-5 py-5 lg:px-8">
            <p className="text-sm font-semibold text-emerald-700">{roleLabelMap[effectiveRole]}</p>
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
                <NavigationItem item={item} key={item.href} />
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
  const receivedNotificationIds = useRef<Set<string>>(new Set());
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState<NotificationItem | null>(null);
  const [toastNotification, setToastNotification] = useState<NotificationItem | null>(null);
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
    const eventSource = new EventSource(`${API_BASE_URL}/api/v1/notifications/stream`, {
      withCredentials: true,
    });

    eventSource.addEventListener("connected", fetchUnreadCount);
    eventSource.addEventListener("notification", (event) => {
      try {
        const messageEvent = event as MessageEvent;
        const notification = JSON.parse(messageEvent.data) as NotificationItem;
        const notificationId = messageEvent.lastEventId || notification.notificationId;

        if (active && !receivedNotificationIds.current.has(notificationId)) {
          receivedNotificationIds.current.add(notificationId);
          setLatestNotification(notification);
          setToastNotification(notification);
        }
      } catch {
        // 알림 payload 파싱에 실패해도 badge는 서버 기준으로 다시 맞춥니다.
      }

      fetchUnreadCount();
    });
    eventSource.onerror = () => {
      fetchUnreadCount();
    };

    return () => {
      active = false;
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (!toastNotification) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastNotification(null), 5_000);

    return () => window.clearTimeout(timeoutId);
  }, [toastNotification]);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      window.localStorage.removeItem("logisticsKingRole");
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
              key={latestNotification?.notificationId ?? "notifications"}
              onClose={() => setNotificationsOpen(false)}
              role={role}
              onUnreadCountChange={setUnreadCount}
            />
          ) : null}
        </div>
        <button className={topNavButtonClassName} onClick={handleLogout} type="button">
          로그아웃
        </button>
      </nav>
      {toastNotification ? (
        <NotificationToast
          item={toastNotification}
          onClose={() => setToastNotification(null)}
          onOpen={() => {
            setNotificationsOpen(true);
            setToastNotification(null);
          }}
        />
      ) : null}
    </div>
  );
}

function NotificationPanel({
  onClose,
  onUnreadCountChange,
  role,
}: {
  onClose: () => void;
  onUnreadCountChange: Dispatch<SetStateAction<number>>;
  role: UserRole;
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

      router.push(getNotificationTargetPath(item, role));
      onClose();
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

function NotificationToast({
  item,
  onClose,
  onOpen,
}: {
  item: NotificationItem;
  onClose: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="fixed right-4 top-20 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <button className="grid min-w-0 flex-1 gap-1 text-left" onClick={onOpen} type="button">
          <span className="text-sm font-bold text-slate-950">{item.title}</span>
          <span className="line-clamp-2 text-xs leading-5 text-slate-600">{item.message}</span>
        </button>
        <button
          className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-200"
          onClick={onClose}
          type="button"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

function MobileBottomNav({ menuItems }: { menuItems: MenuItem[] }) {
  const pathname = usePathname();
  const primaryItems = flattenMenuItems(menuItems).slice(0, 5);

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

function NavigationItem({ item }: { item: MenuItem }) {
  const pathname = usePathname();
  const children = item.children ?? [];

  if (children.length === 0) {
    return <NavigationLink item={item} />;
  }

  const active = children.some((child) => isActive(pathname, child.href));
  const Icon = item.icon;

  return (
    <div className="grid gap-1">
      <Link
        className={`flex h-10 items-center gap-3 rounded-md px-3 text-sm font-bold transition ${
          active
            ? "bg-[#071f46] text-white"
            : "bg-[#071f46]/90 text-white hover:bg-[#071f46]"
        }`}
        href={item.href}
      >
        <Icon className="h-5 w-5" />
        <span>{item.label}</span>
      </Link>
      <div className="ml-5 grid gap-1 border-l border-slate-200 pl-3">
        {children.map((child) => (
          <NavigationLink item={child} key={child.href} nested />
        ))}
      </div>
    </div>
  );
}

function NavigationLink({ item, nested = false }: { item: MenuItem; nested?: boolean }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      className={`flex ${nested ? "h-9" : "h-11"} items-center gap-3 rounded-md px-3 text-sm font-semibold transition ${
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

function flattenMenuItems(menuItems: MenuItem[]): MenuItem[] {
  return menuItems.flatMap((item) => (item.children && item.children.length > 0 ? item.children : item));
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
    href === "/vendor/products" ||
    href === "/vendor/contract-requests"
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

function getNotificationTargetPath(item: NotificationItem, role: UserRole): string {
  const mappedPath = mapBackendLinkToFrontendPath(item.linkUrl, role);

  if (mappedPath) {
    return mappedPath;
  }

  if (item.referenceType === "PROPOSAL") {
    return role === "AGENCY" ? "/agency/proposals" : "/vendor/contract-requests";
  }

  if (item.referenceType === "CONTRACT") {
    return role === "AGENCY" ? "/agency/contracts" : "/vendor/contracts";
  }

  if (item.referenceType === "DELIVER_CONTRACT") {
    return role === "DRIVER" ? "/driver/deliver-contracts" : "/agency/deliver-contracts";
  }

  if (item.referenceType === "CONTRACT_REQUEST") {
    if (role === "AGENCY") {
      return "/agency/open-requests";
    }

    return item.referenceId
      ? `/vendor/contract-requests?selected=${encodeURIComponent(item.referenceId)}`
      : "/vendor/contract-requests";
  }

  return roleHomePathMap[role];
}

function mapBackendLinkToFrontendPath(linkUrl: string | null, role: UserRole): string | null {
  if (!linkUrl) {
    return null;
  }

  if (linkUrl.startsWith("/vendor/") || linkUrl.startsWith("/agency/") || linkUrl.startsWith("/driver/")) {
    return linkUrl;
  }

  const contractRequestMatch = linkUrl.match(/^\/contract-requests\/([^/]+)/);

  if (contractRequestMatch) {
    if (role === "AGENCY") {
      return "/agency/open-requests";
    }

    return `/vendor/contract-requests?selected=${encodeURIComponent(contractRequestMatch[1])}`;
  }

  if (linkUrl.startsWith("/proposals")) {
    return role === "AGENCY" ? "/agency/proposals" : "/vendor/contract-requests";
  }

  if (linkUrl.startsWith("/contracts/vendor")) {
    return "/vendor/contracts";
  }

  if (linkUrl.startsWith("/contracts/agency")) {
    return "/agency/contracts";
  }

  if (linkUrl.startsWith("/deliver-contracts")) {
    return role === "DRIVER" ? "/driver/deliver-contracts" : "/agency/deliver-contracts";
  }

  return null;
}

function isUserRole(value: string | null): value is UserRole {
  return value === "ADMIN" || value === "VENDOR" || value === "AGENCY" || value === "DRIVER";
}

function canUseStoredRoleForPage(storedRole: UserRole, pageRole: UserRole): boolean {
  return storedRole === "ADMIN" || storedRole === pageRole;
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
