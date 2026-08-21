import Schema from '@deepseek-ai/schemastery';
export const name = 'icon-pack-lucide';
export const inject = ['icons'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    if (ctx.icons) {
        ctx.icons.registerPack({
            id: 'lucide-animated',
            name: 'Lucide Animated SVG Icons',
            getIcon: (name) => '<svg class="dsh-icon-animated"></svg>'
        });
    }
}
