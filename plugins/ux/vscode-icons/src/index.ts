import type { Context } from '@deepseek-ai/cordis';

export const name = 'vscode-icons';
export const inject = ['icons'];
export const optional: string[] = [];

export interface VscodeIconTheme {
  id: string;
  label: string;
  fonts: readonly string[];
  fileNames?: Readonly<Record<string, string>>;
  fileExtensions?: Readonly<Record<string, string>>;
  languageIds?: Readonly<Record<string, string>>;
  folderNames?: Readonly<Record<string, string>>;
  folderNamesExpanded?: Readonly<Record<string, string>>;
  rootFolderNames?: Readonly<Record<string, string>>;
  rootFolderNamesExpanded?: Readonly<Record<string, string>>;
}

export interface IconRegistrationService {
  registerPack(pack: {
    id: string;
    name: string;
    getIcon(name: string): string | null;
  }): void;
}

/**
 * Adapter contract for VS Code-style icon themes.
 *
 * The plugin owns only format adaptation and theme registration. Resolution and
 * rendering remain owned by the canonical icon engine.
 */
export class VscodeIconsService {
  private readonly themes = new Map<string, VscodeIconTheme>();

  constructor(private readonly icons: IconRegistrationService) {}

  registerTheme(theme: VscodeIconTheme): void {
    if (!theme.id.trim()) throw new Error('VS Code icon theme id must not be empty');
    if (this.themes.has(theme.id)) throw new Error(`VS Code icon theme already registered: ${theme.id}`);
    this.themes.set(theme.id, theme);
  }

  getTheme(id: string): VscodeIconTheme | undefined {
    return this.themes.get(id);
  }

  listThemes(): readonly VscodeIconTheme[] {
    return [...this.themes.values()];
  }

  registerPack(theme: VscodeIconTheme): void {
    this.registerTheme(theme);
    this.icons.registerPack({
      id: `vscode:${theme.id}`,
      name: theme.label,
      getIcon: (name) => resolveThemeIcon(theme, name),
    });
  }
}

function resolveThemeIcon(theme: VscodeIconTheme, name: string): string | null {
  if (theme.fileNames?.[name]) return theme.fileNames[name];
  if (theme.folderNames?.[name]) return theme.folderNames[name];
  if (theme.rootFolderNames?.[name]) return theme.rootFolderNames[name];
  return theme.fileExtensions?.[name] ?? theme.languageIds?.[name] ?? null;
}

export function apply(ctx: Context): void {
  const service = new VscodeIconsService(ctx.icons as IconRegistrationService);
  ctx.provide('vscode.icons', service);
}
