import type { Context } from '@deepseek-ai/cordis';

export const name = 'icon-engine';
export const inject: readonly string[] = [];
export const optional: readonly string[] = [];

export interface IconPack {
  readonly id: string;
  readonly label: string;
  readonly resolve: (key: string) => string | null;
}

export interface IconRequest {
  readonly fileName?: string;
  readonly extension?: string;
  readonly languageId?: string;
  readonly folderName?: string;
  readonly isRoot?: boolean;
  readonly expanded?: boolean;
}

export class IconEngine {
  private readonly packs = new Map<string, IconPack>();

  registerPack(pack: IconPack): void {
    if (this.packs.has(pack.id)) throw new Error(`Icon pack already registered: ${pack.id}`);
    this.packs.set(pack.id, pack);
  }

  removePack(id: string): boolean {
    return this.packs.delete(id);
  }

  packsList(): readonly IconPack[] {
    return [...this.packs.values()];
  }

  resolve(request: IconRequest): string {
    for (const key of keysFor(request)) {
      for (const pack of this.packs.values()) {
        const icon = pack.resolve(key);
        if (icon) return icon;
      }
    }
    return 'file';
  }
}

function keysFor(request: IconRequest): readonly string[] {
  const keys: string[] = [];
  if (request.fileName) keys.push(`file:${request.fileName}`);
  if (request.isRoot && request.folderName) {
    keys.push(`root:${request.expanded ? 'expanded' : 'collapsed'}:${request.folderName}`);
  }
  if (request.folderName) {
    keys.push(`folder:${request.expanded ? 'expanded' : 'collapsed'}:${request.folderName}`);
    keys.push(`folder:${request.folderName}`);
  }
  if (request.languageId) keys.push(`language:${request.languageId}`);
  if (request.extension) {
    const extension = request.extension.startsWith('.') ? request.extension.slice(1) : request.extension;
    keys.push(`extension:${extension.toLowerCase()}`);
  }
  return keys;
}

export function apply(ctx: Context): void {
  ctx.provide('stack.icons', new IconEngine());
}
