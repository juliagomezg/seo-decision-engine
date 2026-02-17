import { promises as fs } from 'fs';
import path from 'path';
import { PublishedResultBundleSchema } from '@/types/schemas';
import type { PublishedResultBundle } from '@/types/schemas';

const DATA_DIR = path.join(process.cwd(), 'data', 'results');

function sanitizeId(id: string): string {
  return id.replace(/[^a-z0-9-]/g, '');
}

export interface ResultStore {
  save(bundle: PublishedResultBundle): Promise<void>;
  get(id: string): Promise<PublishedResultBundle | null>;
  list(): Promise<Array<{ id: string; keyword: string; published_at: string }>>;
}

class FileResultStore implements ResultStore {
  private async ensureDir(): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  private filePath(id: string): string {
    const safe = sanitizeId(id);
    if (!safe) throw new Error('Invalid result ID');
    return path.join(DATA_DIR, `${safe}.json`);
  }

  async save(bundle: PublishedResultBundle): Promise<void> {
    await this.ensureDir();
    const filePath = this.filePath(bundle.id);
    await fs.writeFile(filePath, JSON.stringify(bundle, null, 2), 'utf-8');
  }

  async get(id: string): Promise<PublishedResultBundle | null> {
    try {
      const filePath = this.filePath(id);
      const raw = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(raw);
      // Defense in depth: validate on read
      return PublishedResultBundleSchema.parse(data);
    } catch {
      return null;
    }
  }

  async list(): Promise<Array<{ id: string; keyword: string; published_at: string }>> {
    try {
      await this.ensureDir();
      const files = await fs.readdir(DATA_DIR);
      const results: Array<{ id: string; keyword: string; published_at: string }> = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
          const data = JSON.parse(raw);
          const parsed = PublishedResultBundleSchema.parse(data);
          results.push({
            id: parsed.id,
            keyword: parsed.keyword,
            published_at: parsed.published_at,
          });
        } catch {
          // Skip invalid files
        }
      }

      return results.sort((a, b) => b.published_at.localeCompare(a.published_at));
    } catch {
      return [];
    }
  }
}

export const resultStore: ResultStore = new FileResultStore();
