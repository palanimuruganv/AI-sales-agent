import { apiClient } from './apiClient';
import type { ApiResponse, Company, PaginatedResult } from '@/types';

export async function listCompanies(page = 1, limit = 20): Promise<PaginatedResult<Company>> {
  const { data } = await apiClient.get<ApiResponse<PaginatedResult<Company>>>('/companies', {
    params: { page, limit },
  });
  return data.data;
}

export async function getCompany(id: string): Promise<Company> {
  const { data } = await apiClient.get<ApiResponse<Company>>(`/companies/${id}`);
  return data.data;
}

export async function createCompany(
  payload: Partial<Omit<Company, '_id' | 'createdAt'>>,
): Promise<Company> {
  const { data } = await apiClient.post<ApiResponse<Company>>('/companies', payload);
  return data.data;
}

export async function updateCompany(
  id: string,
  payload: Partial<Omit<Company, '_id' | 'createdAt'>>,
): Promise<Company> {
  const { data } = await apiClient.patch<ApiResponse<Company>>(`/companies/${id}`, payload);
  return data.data;
}

export async function deleteCompany(id: string): Promise<void> {
  await apiClient.delete(`/companies/${id}`);
}
