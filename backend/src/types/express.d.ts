import type { UserRole } from './index.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
      file?: {
        path?: string;
        originalname?: string;
        mimetype?: string;
      };
    }
  }
}

export {};
