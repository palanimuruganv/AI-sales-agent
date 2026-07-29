import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { websiteAnalysisController } from '../container.js';

const router = Router();

router.use(authenticate);
router.post('/:companyId/analyze', asyncHandler(websiteAnalysisController.analyze));
router.get('/:companyId', asyncHandler(websiteAnalysisController.getByCompany));

export default router;
