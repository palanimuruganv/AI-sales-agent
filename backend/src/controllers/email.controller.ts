import type { Request, Response } from 'express';
import type { EmailService } from '../services/email.service.js';

export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const email = await this.emailService.create(req.user!.id, req.body);
    res.status(201).json({ success: true, data: email });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const companyId = req.query.companyId as string | undefined;
    const result = await this.emailService.list(req.user!.id, page, limit, companyId);
    res.json({ success: true, data: result });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const email = await this.emailService.getById(req.user!.id, id);
    res.json({ success: true, data: email });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const email = await this.emailService.update(req.user!.id, id, req.body);
    res.json({ success: true, data: email });
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await this.emailService.remove(req.user!.id, id);
    res.status(204).send();
  };
}
