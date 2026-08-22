import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'sidebar-tree';
export const inject = ['slots', 'sessions'];
export const optional = ['icons', 'profiles', 'settings', 'skin'];

export const Config = Schema.object({
  showArchived: Schema.boolean().default(true),
  showBrandLogo: Schema.boolean().default(true),
  showNewConversation: Schema.boolean().default(true),
  fileSectionLabel: Schema.string().default('Files'),
  strictTriColor: Schema.boolean().default(true),
});

export const sidebarNavigationOrder = [
  'new-conversation',
  'tabs',
  'files',
  'settings',
] as const;

export const fileSections = [
  { id: 'pinned', label: 'Pinned', iconTone: 'default' },
  { id: 'active', label: 'Active', iconTone: 'default' },
  { id: 'host-root', label: 'Host Root', iconTone: 'muted' },
  { id: 'container-root', label: 'Container', iconTone: 'muted' },
  { id: 'ungrouped', label: 'Ungrouped', iconTone: 'muted' },
  { id: 'archived', label: 'Archived', iconTone: 'muted' },
] as const;

export type FileRowKind = 'file' | 'directory' | 'workspace' | 'repository';
export type FileRowAction =
  | 'open'
  | 'open-new-tab'
  | 'reveal'
  | 'copy-path'
  | 'rename'
  | 'duplicate'
  | 'delete';

export interface SidebarFileRow {
  readonly id: string;
  readonly kind: FileRowKind;
  readonly label: string;
  readonly path: string;
  readonly actions: readonly FileRowAction[];
}

export const defaultFileRowActions: readonly FileRowAction[] = [
  'open',
  'open-new-tab',
  'reveal',
  'copy-path',
  'rename',
  'duplicate',
  'delete',
];

export function createFileRow(
  id: string,
  kind: FileRowKind,
  label: string,
  path: string,
): SidebarFileRow {
  return {
    id,
    kind,
    label,
    path,
    actions: defaultFileRowActions,
  };
}

export function apply(ctx: Context) {
  // The UI host mounts one canonical sidebar surface. DSH owns lifecycle and
  // dependency resolution; Stack only contributes ordering/configuration and
  // the shared file-row interaction contract.
  void ctx;
}
