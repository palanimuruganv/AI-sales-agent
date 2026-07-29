import { Router } from 'express';
import authRoutes from './auth.routes.js';
import healthRoutes from './health.routes.js';
import companyRoutes from './company.routes.js';
import analysisRoutes from './analysis.routes.js';
import emailRoutes from './email.routes.js';
import websiteAnalysisRoutes from './websiteAnalysis.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/analyses', analysisRoutes);
router.use('/emails', emailRoutes);
router.use('/website-analysis', websiteAnalysisRoutes);

export default router;
