import type { Context } from '@deepseek-ai/cordis';
import type { IconEngineService, IconPack } from '@stack/icon-engine';

export const name = 'vscode-icons';
export const inject = ['icons'];
export const optional: readonly string[] = [];

export interface VscodeIconTheme {
  readonly id: string;
  readonly label: string;
  readonly fileNames?: Readonly<Record<string, string>>;
  readonly fileExtensions?: Readonly<Record<string, string>>;
  readonly languageIds?: Readonly<Record<string, string>>;
  readonly folderNames?: Readonly<Record<string, string>>;
  readonly folderNamesExpanded?: Readonly<Record<string, string>>;
  readonly rootFolderNames?: Readonly<Record<string, string>>;
  readonly rootFolderNamesExpanded?: Readonly<Record<string, string>>;
}

export class VscodeIconsService {
  private readonly themes = new Map<string, VscodeIconTheme>();

  constructor(private readonly icons: IconEngineService) {}

  registerTheme(theme: VscodeIconTheme): void {
    if (!theme.id.trim()) throw new Error('VS Code icon theme id must not be empty');
    if (this.themes.has(theme.id)) throw new Error(`VS Code icon theme already registered: ${theme.id}`);
    this.themes.set(theme.id, theme);

    const pack: IconPack = {
      id: `vscode:${theme.id}`,
      name: theme.label,
      getIcon: (key) => resolveThemeIcon(theme, key),
    };
    this.icons.registerPack(pack);
  }

  getTheme(id: string): VscodeIconTheme | undefined {
    return this.themes.get(id);
  }

  listThemes(): readonly VscodeIconTheme[] {
    return [...this.themes.values()];
  }
}

function resolveThemeIcon(theme: VscodeIconTheme, key: string): string | null {
  const [kind, ...rest] = key.split(':');
  const value = rest.join(':');

  switch (kind) {
    case 'file':
      return theme.fileNames?.[value] ?? null;
    case 'extension':
      return theme.fileExtensions?.[value] ?? null;
    case 'language':
      return theme.languageIds?.[value] ?? null;
    case 'folder': {
      const [state, folder] = value.split(/:(.*)/s);
      return (state === 'expanded' ? theme.folderNamesExpanded?.[folder] : theme.folderNames?.[folder]) ?? null;
    }
    case 'root': {
      const [state, folder] = value.split(/:(.*)/s);
      return (state === 'expanded' ? theme.rootFolderNamesExpanded?.[folder] : theme.rootFolderNames?.[folder]) ?? null;
    }
    default:
      return null;
  }
}

export function apply(ctx: Context): void {
  ctx.provide('vscode.icons', new VscodeIconsService(ctx.icons));
}
