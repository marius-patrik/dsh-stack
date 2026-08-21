import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'icon-pack-lucide';
export const inject = ['icons'];
export const optional: string[] = [];

export const Config = Schema.object({});

export function apply(ctx: Context) {
  if ((ctx as any).icons) {
    (ctx as any).icons.registerPack({
      id: 'lucide-animated',
      name: 'Lucide Animated SVG Icons',
      getIcon: (name: string) => '<svg class="dsh-icon-animated"></svg>'
    });
  }
}
