import mongoose from 'mongoose';
import { WebsiteAnalysis, type IWebsiteAnalysisDocument } from '../models/WebsiteAnalysis.js';
import { BaseRepository } from './base.repository.js';
import type { PaginatedResult } from '../types/index.js';

export class WebsiteAnalysisRepository extends BaseRepository<IWebsiteAnalysisDocument> {
  constructor() {
    super(WebsiteAnalysis);
  }

  async findByCompany(companyId: string): Promise<IWebsiteAnalysisDocument | null> {
    return WebsiteAnalysis.findOne({ companyId: new mongoose.Types.ObjectId(companyId) }).sort({ createdAt: -1 }).exec();
  }

  async findByCompanyPaginated(
    companyId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<IWebsiteAnalysisDocument>> {
    const filter = { companyId: new mongoose.Types.ObjectId(companyId) };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      WebsiteAnalysis.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      WebsiteAnalysis.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}
