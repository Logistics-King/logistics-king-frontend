import { apiFetch } from "@/src/shared/api/client";
import type { PageResponse } from "@/src/shared/api/types";

export type NotificationType =
  | "CONTRACT_REQUEST_CREATED"
  | "PROPOSAL_SUBMITTED"
  | "PROPOSAL_UPDATED"
  | "PROPOSAL_WITHDRAWN"
  | "PROPOSAL_ACCEPTED"
  | "PROPOSAL_REJECTED"
  | "CONTRACT_CREATED"
  | "CONTRACT_CANCELED"
  | "DELIVER_CONTRACT_REQUESTED"
  | "DELIVER_CONTRACT_ACCEPTED"
  | "DELIVER_CONTRACT_REJECTED";

export type NotificationReferenceType =
  | "CONTRACT_REQUEST"
  | "PROPOSAL"
  | "CONTRACT"
  | "DELIVER_CONTRACT"
  | "SHIPMENT";

export type NotificationItem = {
  notificationId: string;
  receiverUserId: string;
  senderUserId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl: string | null;
  referenceType: NotificationReferenceType | null;
  referenceId: string | null;
  readAt: string | null;
  createdAt: string | null;
};

export type NotificationUnreadCount = {
  count: number;
};

export type NotificationReadAllResult = {
  readCount: number;
};

export function getNotifications({
  page = 0,
  size = 20,
}: {
  page?: number;
  size?: number;
} = {}): Promise<PageResponse<NotificationItem>> {
  const searchParams = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return apiFetch(`/api/v1/notifications/me?${searchParams.toString()}`);
}

export function getUnreadNotificationCount(): Promise<NotificationUnreadCount> {
  return apiFetch("/api/v1/notifications/me/unread-count");
}

export function markNotificationAsRead(
  notificationId: string,
): Promise<NotificationItem> {
  return apiFetch(`/api/v1/notifications/${notificationId}/read`, {
    method: "PUT",
  });
}

export function markAllNotificationsAsRead(): Promise<NotificationReadAllResult> {
  return apiFetch("/api/v1/notifications/me/read-all", {
    method: "PUT",
  });
}
