import apiClient from '@/api/axios';
import type { ApiResponse } from '@/types/api.types';

export interface Notification {
  id: string;
  type?: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const NotificationService = {
  /** List all notifications for the current customer */
  list: (page = 1, limit = 20) =>
    apiClient.get<ApiResponse<NotificationListResponse>>('/customers/notifications', {
      params: { page, limit },
    }),

  /** Mark a single notification as read */
  markRead: (id: string) =>
    apiClient.patch<ApiResponse<{ notification: Notification }>>(`/customers/notifications/${id}/read`),

  /** Mark all notifications as read */
  markAllRead: () =>
    apiClient.patch<ApiResponse<{ updated: number }>>('/customers/notifications/read-all'),
};
