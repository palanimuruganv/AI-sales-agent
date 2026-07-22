import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import {
  createEmailSchema,
  updateEmailSchema,
  emailIdParamSchema,
  listEmailsSchema,
} from '../validators/email.validator.js';
import { emailController } from '../container.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listEmailsSchema), asyncHandler(emailController.list));
router.post('/', validate(createEmailSchema), asyncHandler(emailController.create));
router.get('/:id', validate(emailIdParamSchema), asyncHandler(emailController.getById));
router.patch('/:id', validate(updateEmailSchema), asyncHandler(emailController.update));
router.delete('/:id', validate(emailIdParamSchema), asyncHandler(emailController.remove));

export default router;
