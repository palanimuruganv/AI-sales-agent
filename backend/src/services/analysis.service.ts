import type { AnalysisRepository } from '../repositories/analysis.repository.js';
import type { CompanyRepository } from '../repositories/company.repository.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import type { IAnalysisDocument } from '../models/Analysis.js';
import type { AnalysisPriority, PaginatedResult } from '../types/index.js';
import mongoose from 'mongoose';

export type CreateAnalysisInput = {
  companyId: string;
  businessProblems?: string[];
  softwareOpportunities?: string[];
  websiteAudit?: string;
  aiSummary?: string;
  priority?: AnalysisPriority;
  confidence?: number;
};

export type UpdateAnalysisInput = Omit<CreateAnalysisInput, 'companyId'>;

export class AnalysisService {
  constructor(
    private readonly analysisRepository: AnalysisRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  private async assertCompanyOwned(ownerId: string, companyId: string): Promise<void> {
    const company = await this.companyRepository.findByIdAndOwner(companyId, ownerId);
    if (!company) {
      throw new NotFoundError('Company');
    }
  }

  async create(ownerId: string, input: CreateAnalysisInput): Promise<IAnalysisDocument> {
    await this.assertCompanyOwned(ownerId, input.companyId);
    const existing = await this.analysisRepository.findByCompanyAndOwner(
      input.companyId,
      ownerId,
    );
    if (existing) {
      throw new ConflictError('Analysis already exists for this company');
    }
    return this.analysisRepository.create({
      companyId: new mongoose.Types.ObjectId(input.companyId),
      ownerId: new mongoose.Types.ObjectId(ownerId),
      businessProblems: input.businessProblems ?? [],
      softwareOpportunities: input.softwareOpportunities ?? [],
      websiteAudit: input.websiteAudit,
      aiSummary: input.aiSummary,
      priority: input.priority ?? 'medium',
      confidence: input.confidence,
    } as Parameters<AnalysisRepository['create']>[0]);
  }

  async list(
    ownerId: string,
    page: number,
    limit: number,
    companyId?: string,
  ): Promise<PaginatedResult<IAnalysisDocument>> {
    return this.analysisRepository.findByOwnerPaginated(ownerId, page, limit, companyId);
  }

  async getById(ownerId: string, id: string): Promise<IAnalysisDocument> {
    const analysis = await this.analysisRepository.findByIdAndOwner(id, ownerId);
    if (!analysis) {
      throw new NotFoundError('Analysis');
    }
    return analysis;
  }

  async update(
    ownerId: string,
    id: string,
    input: UpdateAnalysisInput,
  ): Promise<IAnalysisDocument> {
    await this.getById(ownerId, id);
    const updated = await this.analysisRepository.updateById(id, { $set: input });
    if (!updated) {
      throw new NotFoundError('Analysis');
    }
    return updated;
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.getById(ownerId, id);
    const deleted = await this.analysisRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError('Analysis');
    }
  }
}
