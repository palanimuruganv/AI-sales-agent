import { apiClient } from './apiClient';
import type { Analysis, ApiResponse, PaginatedResult } from '@/types';

export async function listAnalyses(
  page = 1,
  limit = 20,
  companyId?: string,
): Promise<PaginatedResult<Analysis>> {
  const { data } = await apiClient.get<ApiResponse<PaginatedResult<Analysis>>>('/analyses', {
    params: { page, limit, companyId },
  });
  return data.data;
}

export async function createAnalysis(payload: {
  companyId: string;
  businessProblems?: string[];
  softwareOpportunities?: string[];
  websiteAudit?: string;
  aiSummary?: string;
  priority?: Analysis['priority'];
  confidence?: number;
}): Promise<Analysis> {
  const { data } = await apiClient.post<ApiResponse<Analysis>>('/analyses', payload);
  return data.data;
}

export async function updateAnalysis(
  id: string,
  payload: Partial<Omit<Analysis, '_id' | 'companyId' | 'createdAt' | 'updatedAt'>>,
): Promise<Analysis> {
  const { data } = await apiClient.patch<ApiResponse<Analysis>>(`/analyses/${id}`, payload);
  return data.data;
}

export async function deleteAnalysis(id: string): Promise<void> {
  await apiClient.delete(`/analyses/${id}`);
}

export async function analyzeCompany(companyId: string): Promise<unknown> {
  const { data } = await apiClient.post(`/website-analysis/${companyId}/analyze`);
  return data.data;
}

export async function getCompanyWebsiteAnalysis(companyId: string): Promise<unknown> {
  const { data } = await apiClient.get(`/website-analysis/${companyId}`);
  return data.data;
}
