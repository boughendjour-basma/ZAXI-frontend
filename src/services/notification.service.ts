import apiClient from '@/api/axios';
import type { ApiResponse } from '@/types/api.types';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const NotificationService = {
  /** List all notifications for the current customer */
  list: () =>
    apiClient.get<ApiResponse<Notification[]>>('/customers/notifications'),

  /** Mark a single notification as read */
  markRead: (id: string) =>
    apiClient.patch<ApiResponse<Notification>>(`/customers/notifications/${id}/read`),

  /** Mark all notifications as read */
  markAllRead: () =>
    apiClient.patch<ApiResponse<null>>('/customers/notifications/read-all'),
};
