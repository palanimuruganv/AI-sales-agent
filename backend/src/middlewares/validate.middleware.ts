import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { BadRequestError } from '../utils/errors.js';

type RequestPart = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodSchema, parts: RequestPart[] = ['body', 'query', 'params']) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const payload: Record<string, unknown> = {};
      for (const part of parts) {
        if (part in req) {
          payload[part] = req[part];
        }
      }
      const parsed = schema.parse(payload);
      if ('body' in parsed && parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if ('query' in parsed && parsed.query !== undefined) {
        req.query = parsed.query as Request['query'];
      }
      if ('params' in parsed && parsed.params !== undefined) {
        req.params = parsed.params as Request['params'];
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        next(new BadRequestError(message));
        return;
      }
      next(err);
    }
  };
