import type { Request, Response } from 'express';
import type { AnalysisService } from '../services/analysis.service.js';

export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const analysis = await this.analysisService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: analysis });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const companyId = req.query.companyId as string | undefined;
    const result = await this.analysisService.list(req.user!.id, page, limit, companyId);
    res.json({ success: true, data: result });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const analysis = await this.analysisService.getById(req.user!.id, req.params.id);
    res.json({ success: true, data: analysis });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const analysis = await this.analysisService.update(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: analysis });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.analysisService.remove(req.user!.id, req.params.id);
    res.status(204).send();
  };
}
