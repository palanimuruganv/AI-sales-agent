import { z } from 'zod';

const companyStatusEnum = z.enum([
  'new',
  'analyzed',
  'contacted',
  'qualified',
  'won',
  'lost',
]);

export const createCompanySchema = z.object({
  body: z.object({
    companyName: z.string().min(1).max(200),
    website: z.string().url().optional().or(z.literal('')),
    industry: z.string().max(120).optional(),
    employees: z.coerce.number().int().min(0).optional(),
    country: z.string().max(120).optional(),
    linkedin: z.string().url().optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().max(40).optional(),
    status: companyStatusEnum.optional(),
    leadScore: z.coerce.number().min(0).max(100).optional(),
  }),
});

export const updateCompanySchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-fA-F0-9]{24}$/) }),
  body: createCompanySchema.shape.body.partial(),
});

export const companyIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-fA-F0-9]{24}$/) }),
});

export const listCompaniesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  }),
});
