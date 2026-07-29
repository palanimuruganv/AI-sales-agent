import type { Request, Response } from 'express';
import type { CsvImportService } from '../services/csvImport.service.js';

export class CsvImportController {
  constructor(private readonly csvImportService: CsvImportService) {}

  upload = async (req: Request, res: Response): Promise<void> => {
    if (!req.file?.path) {
      res.status(400).json({ success: false, message: 'CSV file is required' });
      return;
    }

    const summary = await this.csvImportService.importCompanies(req.user!.id, req.file.path);
    res.json({
      success: true,
      uploaded: summary.uploaded,
      duplicates: summary.duplicates,
      failed: summary.failed,
      errors: summary.errors,
    });
  };
}
