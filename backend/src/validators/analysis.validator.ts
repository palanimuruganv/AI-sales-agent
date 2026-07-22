import { z } from 'zod';

const priorityEnum = z.enum(['low', 'medium', 'high']);

export const createAnalysisSchema = z.object({
  body: z.object({
    companyId: z.string().regex(/^[a-fA-F0-9]{24}$/),
    businessProblems: z.array(z.string()).optional().default([]),
    softwareOpportunities: z.array(z.string()).optional().default([]),
    websiteAudit: z.string().optional(),
    aiSummary: z.string().optional(),
    priority: priorityEnum.optional(),
    confidence: z.coerce.number().min(0).max(1).optional(),
  }),
});

export const updateAnalysisSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-fA-F0-9]{24}$/) }),
  body: z.object({
    businessProblems: z.array(z.string()).optional(),
    softwareOpportunities: z.array(z.string()).optional(),
    websiteAudit: z.string().optional(),
    aiSummary: z.string().optional(),
    priority: priorityEnum.optional(),
    confidence: z.coerce.number().min(0).max(1).optional(),
  }),
});

export const analysisIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-fA-F0-9]{24}$/) }),
});

export const listAnalysesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    companyId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .optional(),
  }),
});
