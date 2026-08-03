import apiClient from '@/api/axios';
import type { ApiResponse } from '@/types/api.types';

export interface Favorite {
  id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
  createdAt: string;
}

export const FavoriteService = {
  /** List all saved favorite places */
  list: () =>
    apiClient.get<ApiResponse<Favorite[]>>('/customers/favorites'),

  /** Create a new favorite place */
  create: (data: Omit<Favorite, 'id' | 'createdAt'>) =>
    apiClient.post<ApiResponse<Favorite>>('/customers/favorites', data),

  /** Update a favorite place */
  update: (id: string, data: Partial<Omit<Favorite, 'id' | 'createdAt'>>) =>
    apiClient.patch<ApiResponse<Favorite>>(`/customers/favorites/${id}`, data),

  /** Delete a favorite place */
  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/customers/favorites/${id}`),
};
