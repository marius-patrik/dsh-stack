import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'settings-dialog';
export const inject = ['slots', 'locale'];
export const optional = ['icons'];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  // Mounts draggable/resizable settings modal frame & navigation rails
}
