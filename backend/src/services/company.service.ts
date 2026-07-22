import type { CompanyRepository } from '../repositories/company.repository.js';
import { NotFoundError } from '../utils/errors.js';
import type { ICompanyDocument } from '../models/Company.js';
import type { CompanyStatus, PaginatedResult } from '../types/index.js';
import mongoose from 'mongoose';

export type CreateCompanyInput = {
  companyName: string;
  website?: string;
  industry?: string;
  employees?: number;
  country?: string;
  linkedin?: string;
  email?: string;
  phone?: string;
  status?: CompanyStatus;
  leadScore?: number;
};

export type UpdateCompanyInput = Partial<CreateCompanyInput>;

export class CompanyService {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async create(ownerId: string, input: CreateCompanyInput): Promise<ICompanyDocument> {
    return this.companyRepository.create({
      ...input,
      ownerId: new mongoose.Types.ObjectId(ownerId),
      status: input.status ?? 'new',
    } as Parameters<CompanyRepository['create']>[0]);
  }

  async list(
    ownerId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ICompanyDocument>> {
    return this.companyRepository.findByOwnerPaginated(ownerId, page, limit);
  }

  async getById(ownerId: string, id: string): Promise<ICompanyDocument> {
    const company = await this.companyRepository.findByIdAndOwner(id, ownerId);
    if (!company) {
      throw new NotFoundError('Company');
    }
    return company;
  }

  async update(
    ownerId: string,
    id: string,
    input: UpdateCompanyInput,
  ): Promise<ICompanyDocument> {
    await this.getById(ownerId, id);
    const updated = await this.companyRepository.updateById(id, { $set: input });
    if (!updated) {
      throw new NotFoundError('Company');
    }
    return updated;
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.getById(ownerId, id);
    const deleted = await this.companyRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError('Company');
    }
  }
}
