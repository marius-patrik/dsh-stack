import Schema from '@deepseek-ai/schemastery';
export const name = 'icon-engine';
export const inject = ['webServer', 'slots'];
export const optional = [];
export class IconEngineService {
    packs = new Map();
    mappings = new Map();
    registerPack(pack) {
        this.packs.set(pack.id, pack);
    }
    setMapping(pattern, iconId) {
        this.mappings.set(pattern, iconId);
    }
    resolveIcon(fileNameOrType) {
        const ext = fileNameOrType.includes('.') ? fileNameOrType.split('.').pop() || '' : fileNameOrType;
        return this.mappings.get(ext) || 'file';
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.icons = new IconEngineService();
}
