import type { IconEngine } from '@dsh-stack/icon-engine';

export const name = 'vscode-icons';
export const version = '0.1.0';

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

export class VscodeIconThemeRegistry {
  private readonly themes = new Map<string, VscodeIconTheme>();

  constructor(private readonly icons: IconEngine) {}

  register(theme: VscodeIconTheme): void {
    if (!theme.id.trim()) throw new Error('VS Code theme id must not be empty');
    if (this.themes.has(theme.id)) throw new Error(`VS Code theme already registered: ${theme.id}`);
    this.themes.set(theme.id, theme);
    this.icons.registerPack({
      id: `vscode:${theme.id}`,
      label: theme.label,
      resolve: (key) => resolve(theme, key),
    });
  }

  get(id: string): VscodeIconTheme | undefined {
    return this.themes.get(id);
  }

  list(): readonly VscodeIconTheme[] {
    return [...this.themes.values()];
  }
}

function resolve(theme: VscodeIconTheme, key: string): string | null {
  const [kind, ...parts] = key.split(':');
  const value = parts.join(':');
  switch (kind) {
    case 'file': return theme.fileNames?.[value] ?? null;
    case 'extension': return theme.fileExtensions?.[value] ?? null;
    case 'language': return theme.languageIds?.[value] ?? null;
    case 'folder': {
      const split = value.indexOf(':');
      if (split < 0) return theme.folderNames?.[value] ?? null;
      const expanded = value.slice(0, split) === 'expanded';
      const folder = value.slice(split + 1);
      return (expanded ? theme.folderNamesExpanded?.[folder] : theme.folderNames?.[folder]) ?? null;
    }
    case 'root': {
      const split = value.indexOf(':');
      if (split < 0) return theme.rootFolderNames?.[value] ?? null;
      const expanded = value.slice(0, split) === 'expanded';
      const folder = value.slice(split + 1);
      return (expanded ? theme.rootFolderNamesExpanded?.[folder] : theme.rootFolderNames?.[folder]) ?? null;
    }
    default: return null;
  }
}
