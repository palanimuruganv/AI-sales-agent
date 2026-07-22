export type UserRole = 'user' | 'admin';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
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

export type EmailStatus = 'draft' | 'scheduled' | 'sent' | 'failed';

export type AnalysisPriority = 'low' | 'medium' | 'high';

export type AutomationStatus = 'idle' | 'running' | 'completed' | 'failed';
