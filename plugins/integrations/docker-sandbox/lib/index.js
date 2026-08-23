import Schema from '@deepseek-ai/schemastery';
export const name = 'docker-sandbox';
export const inject = ['tools', 'integrations', 'webServer'];
export const optional = [];
export const Config = Schema.object({});
export function apply(ctx) {
    // Mounts Docker sandbox manager
}
