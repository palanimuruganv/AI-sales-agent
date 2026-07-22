import type { Request, Response } from 'express';
import mongoose from 'mongoose';

export class HealthController {
  health = (_req: Request, res: Response): void => {
    const dbState = mongoose.connection.readyState;
    const dbStatus =
      dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
      },
    });
  };
}
