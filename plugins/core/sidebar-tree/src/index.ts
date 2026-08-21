import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'sidebar-tree';
export const inject = ['slots', 'sessions'];
export const optional = ['icons'];

export const Config = Schema.object({
  showArchived: Schema.boolean().default(true),
  strictTriColor: Schema.boolean().default(true)
});

export function apply(ctx: Context) {
  // Mounts 5-tier sidebar navigation tree (Pinned, Active, Host Root, Ungrouped, Archived)
}
