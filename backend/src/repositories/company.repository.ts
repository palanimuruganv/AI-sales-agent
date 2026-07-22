import mongoose from 'mongoose';
import { Company, type ICompanyDocument } from '../models/Company.js';
import { BaseRepository } from './base.repository.js';
import type { PaginatedResult } from '../types/index.js';

export class CompanyRepository extends BaseRepository<ICompanyDocument> {
  constructor() {
    super(Company);
  }

  async findByOwnerPaginated(
    ownerId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ICompanyDocument>> {
    const filter = { ownerId: new mongoose.Types.ObjectId(ownerId) };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Company.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Company.countDocuments(filter).exec(),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  findByIdAndOwner(id: string, ownerId: string): Promise<ICompanyDocument | null> {
    return Company.findOne({
      _id: id,
      ownerId: new mongoose.Types.ObjectId(ownerId),
    }).exec();
  }
}
