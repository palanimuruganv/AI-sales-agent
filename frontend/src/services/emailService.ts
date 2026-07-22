import { apiClient } from './apiClient';
import type { ApiResponse, PaginatedResult, SalesEmail } from '@/types';

export async function listEmails(
  page = 1,
  limit = 20,
  companyId?: string,
): Promise<PaginatedResult<SalesEmail>> {
  const { data } = await apiClient.get<ApiResponse<PaginatedResult<SalesEmail>>>('/emails', {
    params: { page, limit, companyId },
  });
  return data.data;
}

export async function createEmail(payload: {
  companyId: string;
  subject: string;
  body: string;
  status?: SalesEmail['status'];
}): Promise<SalesEmail> {
  const { data } = await apiClient.post<ApiResponse<SalesEmail>>('/emails', payload);
  return data.data;
}

export async function updateEmail(
  id: string,
  payload: Partial<Pick<SalesEmail, 'subject' | 'body' | 'status'>>,
): Promise<SalesEmail> {
  const { data } = await apiClient.patch<ApiResponse<SalesEmail>>(`/emails/${id}`, payload);
  return data.data;
}

export async function deleteEmail(id: string): Promise<void> {
  await apiClient.delete(`/emails/${id}`);
}
