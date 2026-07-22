import { z } from 'zod';

const emailStatusEnum = z.enum(['draft', 'scheduled', 'sent', 'failed']);

export const createEmailSchema = z.object({
  body: z.object({
    companyId: z.string().regex(/^[a-fA-F0-9]{24}$/),
    subject: z.string().min(1).max(300),
    body: z.string().min(1),
    status: emailStatusEnum.optional(),
  }),
});

export const updateEmailSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-fA-F0-9]{24}$/) }),
  body: z.object({
    subject: z.string().min(1).max(300).optional(),
    body: z.string().min(1).optional(),
    status: emailStatusEnum.optional(),
  }),
});

export const emailIdParamSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-fA-F0-9]{24}$/) }),
});

export const listEmailsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    companyId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/)
      .optional(),
  }),
});
