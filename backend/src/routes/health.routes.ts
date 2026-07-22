import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { healthController } from '../container.js';

const router = Router();

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags: [Health]
 *     summary: Service health check
 *     security: []
 *     responses:
 *       200:
 *         description: Health status
 */
router.get('/', asyncHandler(healthController.health));

export default router;
