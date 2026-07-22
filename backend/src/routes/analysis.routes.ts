import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  createAnalysisSchema,
  updateAnalysisSchema,
  analysisIdParamSchema,
  listAnalysesSchema,
} from '../validators/analysis.validator.js';
import { analysisController } from '../container.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listAnalysesSchema), asyncHandler(analysisController.list));
router.post('/', validate(createAnalysisSchema), asyncHandler(analysisController.create));
router.get(
  '/:id',
  validate(analysisIdParamSchema),
  asyncHandler(analysisController.getById),
);
router.patch(
  '/:id',
  validate(updateAnalysisSchema),
  asyncHandler(analysisController.update),
);
router.delete(
  '/:id',
  validate(analysisIdParamSchema),
  asyncHandler(analysisController.remove),
);

export default router;
