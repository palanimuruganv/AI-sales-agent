import type { Request, Response } from 'express';
import type { WebsiteAnalysisService } from '../services/websiteAnalysis.service.js';

export class WebsiteAnalysisController {
  constructor(private readonly websiteAnalysisService: WebsiteAnalysisService) {}

  analyze = async (req: Request, res: Response): Promise<void> => {
    const companyId = Array.isArray(req.params.companyId) ? req.params.companyId[0] : req.params.companyId;
    const result = await this.websiteAnalysisService.analyzeCompany(req.user!.id, companyId);
    res.status(202).json({ success: true, data: result });
  };

  getByCompany = async (req: Request, res: Response): Promise<void> => {
    const companyId = Array.isArray(req.params.companyId) ? req.params.companyId[0] : req.params.companyId;
    const result = await this.websiteAnalysisService.getByCompany(req.user!.id, companyId);
    res.json({ success: true, data: result });
  };
}
