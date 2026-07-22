import mongoose from 'mongoose';
import { Email, type IEmailDocument } from '../models/Email.js';
import { BaseRepository } from './base.repository.js';
import type { PaginatedResult } from '../types/index.js';

export class EmailRepository extends BaseRepository<IEmailDocument> {
  constructor() {
    super(Email);
  }

  async findByOwnerPaginated(
    ownerId: string,
    page: number,
    limit: number,
    companyId?: string,
  ): Promise<PaginatedResult<IEmailDocument>> {
    const filter: Record<string, unknown> = {
      ownerId: new mongoose.Types.ObjectId(ownerId),
    };
    if (companyId) {
      filter.companyId = new mongoose.Types.ObjectId(companyId);
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Email.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      Email.countDocuments(filter).exec(),
    ]);
    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  findByIdAndOwner(id: string, ownerId: string): Promise<IEmailDocument | null> {
    return Email.findOne({
      _id: id,
      ownerId: new mongoose.Types.ObjectId(ownerId),
    }).exec();
  }
}
