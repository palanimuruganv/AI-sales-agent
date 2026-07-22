import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  createCompanySchema,
  updateCompanySchema,
  companyIdParamSchema,
  listCompaniesSchema,
} from '../validators/company.validator.js';
import { companyController } from '../container.js';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/v1/companies:
 *   get:
 *     tags: [Companies]
 *     summary: List companies
 *     responses:
 *       200:
 *         description: Paginated companies
 *   post:
 *     tags: [Companies]
 *     summary: Create company
 *     responses:
 *       201:
 *         description: Created
 */
router.get('/', validate(listCompaniesSchema), asyncHandler(companyController.list));
router.post('/', validate(createCompanySchema), asyncHandler(companyController.create));

router.get(
  '/:id',
  validate(companyIdParamSchema),
  asyncHandler(companyController.getById),
);
router.patch(
  '/:id',
  validate(updateCompanySchema),
  asyncHandler(companyController.update),
);
router.delete(
  '/:id',
  validate(companyIdParamSchema),
  asyncHandler(companyController.remove),
);

export default router;
