import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import csvParser from 'csv-parser';
import mongoose from 'mongoose';
import { BadRequestError } from '../utils/errors.js';
import type { ICompanyDocument } from '../models/Company.js';

export interface CsvImportSummary {
  totalRows: number;
  uploaded: number;
  duplicates: number;
  failed: number;
  processingTime: number;
  importBatchId: string;
  errors: string[];
}

export interface CsvImportRepositoryLike {
  bulkInsertCompanies(data: Array<Partial<ICompanyDocument> & { ownerId?: string | mongoose.Types.ObjectId }>): Promise<ICompanyDocument[]>;
  findDuplicateWebsites(ownerId: string, websites: string[]): Promise<Set<string>>;
}

interface ParsedCompanyRow {
  companyName?: string;
  website?: string;
  industry?: string;
  email?: string;
  phone?: string;
  country?: string;
  [key: string]: string | undefined;
}

export class CsvImportService {
  constructor(private readonly repository: CsvImportRepositoryLike) {}

  async importCompanies(ownerId: string, filePath: string): Promise<CsvImportSummary> {
    const startTime = Date.now();
    const importBatchId = this.createImportBatchId(filePath, startTime);
    const errors: string[] = [];
    const pendingRows: Array<Partial<ICompanyDocument> & { ownerId?: string | mongoose.Types.ObjectId }> = [];
    const seenWebsites = new Set<string>();
    const batchSize = 100;
    let totalRows = 0;
    let uploaded = 0;
    let duplicates = 0;
    let failed = 0;

    const stream = createReadStream(filePath, { encoding: 'utf8' });
    const parser = csvParser({ headers: true });
    stream.pipe(parser);

    const flushBatch = async (): Promise<void> => {
      if (!pendingRows.length) {
        return;
      }
      const insertedCompanies = await this.repository.bulkInsertCompanies(pendingRows);
      uploaded += insertedCompanies.length;
      pendingRows.length = 0;
    };

    try {
      for await (const row of parser as AsyncIterable<ParsedCompanyRow>) {
        if (this.isHeaderRow(row)) {
          continue;
        }

        if (this.isEmptyRow(row)) {
          continue;
        }

        totalRows += 1;
        const normalizedRow = this.normalizeRow(row);
        const validation = this.validateRow(normalizedRow);
        if (!validation.isValid) {
          failed += 1;
          errors.push(...validation.errors);
          continue;
        }

        const website = this.normalizeWebsite(normalizedRow.website);
        if (!website) {
          failed += 1;
          continue;
        }

        if (seenWebsites.has(website)) {
          duplicates += 1;
          continue;
        }
        seenWebsites.add(website);

        const duplicateWebsites = await this.repository.findDuplicateWebsites(ownerId, [website]);
        if (duplicateWebsites.has(website)) {
          duplicates += 1;
          continue;
        }

        pendingRows.push({
          ownerId: new mongoose.Types.ObjectId(ownerId),
          companyName: normalizedRow.companyName,
          website,
          industry: normalizedRow.industry,
          email: normalizedRow.email,
          phone: normalizedRow.phone,
          country: normalizedRow.country,
          status: 'new',
          analysisStatus: 'PENDING',
          importBatchId,
        });

        if (pendingRows.length >= batchSize) {
          await flushBatch();
        }
      }

      await flushBatch();
    } catch {
      throw new BadRequestError('Unable to read uploaded CSV file');
    }

    return {
      totalRows,
      uploaded,
      duplicates,
      failed,
      processingTime: Date.now() - startTime,
      importBatchId,
      errors,
    };
  }

  private normalizeRow(row: ParsedCompanyRow): ParsedCompanyRow {
    const normalized = Object.entries(row).reduce<Record<string, string | undefined>>((acc, [key, value]) => {
      if (key.startsWith('_')) {
        const index = Number(key.slice(1));
        const fieldName = ['companyName', 'website', 'industry', 'email', 'phone', 'country'][index];
        if (fieldName) {
          acc[fieldName] = this.normalizeOptionalValue(value);
        }
        return acc;
      }
      acc[key] = this.normalizeOptionalValue(value);
      return acc;
    }, {});

    return {
      companyName: normalized.companyName,
      website: normalized.website,
      industry: normalized.industry,
      email: normalized.email,
      phone: normalized.phone,
      country: normalized.country,
    };
  }

  private validateRow(row: ParsedCompanyRow): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!row.companyName) {
      errors.push('Missing companyName');
    }
    if (!row.website) {
      errors.push('Missing website');
    }
    if (!row.industry) {
      errors.push('Missing industry');
    }

    return { isValid: errors.length === 0, errors };
  }

  private normalizeWebsite(value?: string): string {
    const normalized = this.normalizeOptionalValue(value);
    if (!normalized) {
      return '';
    }
    try {
      const url = new URL(normalized);
      return url.hostname.toLowerCase();
    } catch {
      return normalized.toLowerCase();
    }
  }

  private normalizeOptionalValue(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private isEmptyRow(row: ParsedCompanyRow): boolean {
    return Object.values(row).every((value) => !this.normalizeOptionalValue(value));
  }

  private isHeaderRow(row: ParsedCompanyRow): boolean {
    return Object.entries(row).some(([key, value]) => key === '_0' && value === 'Company Name');
  }

  private createImportBatchId(filePath: string, startTime: number): string {
    return createHash('sha256').update(`${filePath}:${startTime}`).digest('hex').slice(0, 16);
  }
}
