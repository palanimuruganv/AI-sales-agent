import mongoose from 'mongoose';
import { Analysis, type IAnalysisDocument } from '../models/Analysis.js';
import { BaseRepository } from './base.repository.js';
import type { PaginatedResult } from '../types/index.js';

export class AnalysisRepository extends BaseRepository<IAnalysisDocument> {
  constructor() {
    super(Analysis);
  }

  async findByOwnerPaginated(
    ownerId: string,
    page: number,
    limit: number,
    companyId?: string,
  ): Promise<PaginatedResult<IAnalysisDocument>> {
    const filter: Record<string, unknown> = {
      ownerId: new mongoose.Types.ObjectId(ownerId),
    };
    if (companyId) {
      filter.companyId = new mongoose.Types.ObjectId(companyId);
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Analysis.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).exec(),
      Analysis.countDocuments(filter).exec(),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  findByIdAndOwner(id: string, ownerId: string): Promise<IAnalysisDocument | null> {
    return Analysis.findOne({
      _id: id,
      ownerId: new mongoose.Types.ObjectId(ownerId),
    }).exec();
  }

  findByCompanyAndOwner(
    companyId: string,
    ownerId: string,
  ): Promise<IAnalysisDocument | null> {
    return Analysis.findOne({
      companyId: new mongoose.Types.ObjectId(companyId),
      ownerId: new mongoose.Types.ObjectId(ownerId),
    }).exec();
  }
}
