import Schema from '@deepseek-ai/schemastery';
export const name = 'mesh-hosts';
export const inject = ['tools', 'integrations', 'accounts'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Tailscale mesh device discovery
}
