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
import { companyController, csvImportController } from '../container.js';
import multer from 'multer';
import path from 'path';

const __dirname = path.dirname(__filename);
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'text/csv' && !file.originalname.toLowerCase().endsWith('.csv')) {
      cb(new Error('Only CSV files are allowed'));
      return;
    }
    cb(null, true);
  },
});

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
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(csvImportController.upload),
);

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
