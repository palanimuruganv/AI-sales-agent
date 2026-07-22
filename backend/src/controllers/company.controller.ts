import type { Request, Response } from 'express';
import type { CompanyService } from '../services/company.service.js';

export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const company = await this.companyService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: company });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await this.companyService.list(req.user!.id, page, limit);
    res.json({ success: true, data: result });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const company = await this.companyService.getById(req.user!.id, req.params.id);
    res.json({ success: true, data: company });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const company = await this.companyService.update(req.user!.id, req.params.id, req.body);
    res.json({ success: true, data: company });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    await this.companyService.remove(req.user!.id, req.params.id);
    res.status(204).send();
  };
}
