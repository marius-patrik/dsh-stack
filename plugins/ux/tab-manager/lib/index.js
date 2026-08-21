import Schema from '@deepseek-ai/schemastery';
export const name = 'tab-manager';
export const inject = ['slots', 'sessions', 'webServer'];
export const optional = ['icons'];
export class TabManagerService {
    tabs = new Map();
    activeTabId = null;
    openTab(tab) {
        this.tabs.set(tab.id, { ...tab, active: true });
        this.activeTabId = tab.id;
    }
    closeTab(id) {
        this.tabs.delete(id);
        if (this.activeTabId === id) {
            const remaining = Array.from(this.tabs.keys());
            this.activeTabId = remaining.length > 0 ? remaining[0] || null : null;
        }
    }
    getTabs() {
        return Array.from(this.tabs.values());
    }
    getActiveTab() {
        return this.activeTabId ? this.tabs.get(this.activeTabId) || null : null;
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.tabManager = new TabManagerService();
}
