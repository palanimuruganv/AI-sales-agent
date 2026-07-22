import type { EmailRepository } from '../repositories/email.repository.js';
import type { CompanyRepository } from '../repositories/company.repository.js';
import { NotFoundError } from '../utils/errors.js';
import type { IEmailDocument } from '../models/Email.js';
import type { EmailStatus, PaginatedResult } from '../types/index.js';
import mongoose from 'mongoose';

export type CreateEmailInput = {
  companyId: string;
  subject: string;
  body: string;
  status?: EmailStatus;
};

export type UpdateEmailInput = {
  subject?: string;
  body?: string;
  status?: EmailStatus;
};

export class EmailService {
  constructor(
    private readonly emailRepository: EmailRepository,
    private readonly companyRepository: CompanyRepository,
  ) {}

  private async assertCompanyOwned(ownerId: string, companyId: string): Promise<void> {
    const company = await this.companyRepository.findByIdAndOwner(companyId, ownerId);
    if (!company) {
      throw new NotFoundError('Company');
    }
  }

  async create(ownerId: string, input: CreateEmailInput): Promise<IEmailDocument> {
    await this.assertCompanyOwned(ownerId, input.companyId);
    return this.emailRepository.create({
      companyId: new mongoose.Types.ObjectId(input.companyId),
      ownerId: new mongoose.Types.ObjectId(ownerId),
      subject: input.subject,
      body: input.body,
      status: input.status ?? 'draft',
    } as Parameters<EmailRepository['create']>[0]);
  }

  async list(
    ownerId: string,
    page: number,
    limit: number,
    companyId?: string,
  ): Promise<PaginatedResult<IEmailDocument>> {
    return this.emailRepository.findByOwnerPaginated(ownerId, page, limit, companyId);
  }

  async getById(ownerId: string, id: string): Promise<IEmailDocument> {
    const email = await this.emailRepository.findByIdAndOwner(id, ownerId);
    if (!email) {
      throw new NotFoundError('Email');
    }
    return email;
  }

  async update(ownerId: string, id: string, input: UpdateEmailInput): Promise<IEmailDocument> {
    await this.getById(ownerId, id);
    const updated = await this.emailRepository.updateById(id, { $set: input });
    if (!updated) {
      throw new NotFoundError('Email');
    }
    return updated;
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.getById(ownerId, id);
    const deleted = await this.emailRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundError('Email');
    }
  }
}
