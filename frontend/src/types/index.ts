export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type CompanyStatus =
  | 'new'
  | 'analyzed'
  | 'contacted'
  | 'qualified'
  | 'won'
  | 'lost';

export interface Company {
  _id: string;
  companyName: string;
  website?: string;
  industry?: string;
  employees?: number;
  country?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  status: CompanyStatus;
  leadScore?: number;
  createdAt: string;
}

export type AnalysisPriority = 'low' | 'medium' | 'high';

export interface Analysis {
  _id: string;
  companyId: string;
  businessProblems: string[];
  softwareOpportunities: string[];
  websiteAudit?: string;
  aiSummary?: string;
  priority: AnalysisPriority;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

export type EmailStatus = 'draft' | 'scheduled' | 'sent' | 'failed';

export interface SalesEmail {
  _id: string;
  companyId: string;
  subject: string;
  body: string;
  status: EmailStatus;
  createdAt: string;
}
