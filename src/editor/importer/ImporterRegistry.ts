import type { Editor } from '../Editor';

export interface ImportResult {
  assetId: string;
  entityIds: string[];
}

export interface Importer {
  id: string;
  label: string;
  extensions: string[];
  import(file: File, editor: Editor): Promise<ImportResult>;
}

export class ImporterRegistry {
  private importers = new Map<string, Importer>();

  register(importer: Importer): void {
    this.importers.set(importer.id, importer);
  }

  findByFileName(fileName: string): Importer | undefined {
    const lower = fileName.toLowerCase();
    return [...this.importers.values()].find((importer) => importer.extensions.some((extension) => lower.endsWith(extension)));
  }
}
