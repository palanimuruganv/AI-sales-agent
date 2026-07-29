import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { CsvImportService } from '../csvImport.service.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('CsvImportService', () => {
  it('imports valid rows and skips invalid and duplicate records', async () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'csv-import-'));
    tempDirs.push(tempDir);
    const filePath = join(tempDir, 'companies.csv');

    writeFileSync(
      filePath,
      [
        'Company Name,Website,Industry,Email,Phone,Country',
        'Acme,https://acme.com,Software,info@acme.com,,US',
        'Invalid,,Tech,, ,',
        'Duplicate,https://acme.com,Software,, ,',
      ].join('\n'),
    );

    const service = new CsvImportService({
      bulkInsertCompanies: async (data: Array<Record<string, unknown>>) => data as Array<Record<string, unknown>>,
      findDuplicateWebsites: async (_ownerId: string, websites: string[]) => {
        const existing = new Set<string>(['acme.com']);
        return new Set(websites.filter((website) => existing.has(website)));
      },
    } as never);

    const summary = await service.importCompanies('owner-id', filePath);

    assert.equal(summary.totalRows, 3);
    assert.equal(summary.uploaded, 1);
    assert.equal(summary.duplicates, 1);
    assert.equal(summary.failed, 1);
    assert.equal(summary.importBatchId.length > 0, true);
  });
});
