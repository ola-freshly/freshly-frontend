import apiClient from './client';
import type {
  PantryItem,
  PantryCategory,
  CreatePantryItemDto,
  UpdatePantryItemDto,
  ScanResult,
} from './types';

export const pantryApi = {
  getAll: async (): Promise<PantryItem[]> => {
    const { data } = await apiClient.get<PantryItem[]>('/pantry-items');
    return data;
  },

  // Categories with their allowed units — drives the add-item unit picker.
  getCategories: async (): Promise<PantryCategory[]> => {
    const { data } = await apiClient.get<PantryCategory[]>('/pantry-items/categories');
    return data;
  },

  getById: async (id: string): Promise<PantryItem> => {
    const { data } = await apiClient.get<PantryItem>(`/pantry-items/${id}`);
    return data;
  },

  create: async (dto: CreatePantryItemDto): Promise<PantryItem> => {
    const { data } = await apiClient.post<PantryItem>('/pantry-items', dto);
    return data;
  },

  update: async (id: string, dto: UpdatePantryItemDto): Promise<PantryItem> => {
    const { data } = await apiClient.put<PantryItem>(`/pantry-items/${id}`, dto);
    return data;
  },

  remove: async (id: string): Promise<{ deleted: boolean; id: string }> => {
    const { data } = await apiClient.delete<{ deleted: boolean; id: string }>(
      `/pantry-items/${id}`,
    );
    return data;
  },

  // Merges several items into one. `expiryDate` resolves a conflict (a date, or
  // null for "no expiry"); omit it when the items already share one expiry.
  merge: async (payload: {
    itemIds: string[];
    primaryId: string;
    name?: string;
    expiryDate?: string | null;
  }): Promise<PantryItem> => {
    const { data } = await apiClient.post<PantryItem>('/pantry-items/merge', payload);
    return data;
  },

  scanImage: async (file: { uri: string; name: string; type: string }): Promise<ScanResult> => {
    const formData = new FormData();
    formData.append('image', file as unknown as Blob);
    // Don't set Content-Type manually — let the runtime add it *with* the
    // multipart boundary, otherwise the server can't parse the file part.
    const { data } = await apiClient.post<ScanResult>('/pantry-items/scan-image', formData);
    return data;
  },

  scanBarcode: async (barcode: string): Promise<ScanResult> => {
    const { data } = await apiClient.post<ScanResult>('/pantry-items/scan-barcode', { barcode });
    return data;
  },
};
