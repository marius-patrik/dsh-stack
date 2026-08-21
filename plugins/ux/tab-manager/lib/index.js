import Schema from '@deepseek-ai/schemastery';
export const name = 'tab-manager';
export const inject = ['slots', 'sessions', 'webServer'];
export const optional = ['icons'];
export class TabManagerService {
    ctx;
    tabs = new Map();
    panes = new Map();
    mainPaneId = 'pane-main';
    bottomDockOpen = false;
    bottomDockHeight = 280;
    constructor(ctx) {
        this.ctx = ctx;
        this.panes.set(this.mainPaneId, {
            id: this.mainPaneId,
            orientation: 'horizontal',
            tabs: [],
            activeTabId: null
        });
    }
    openTab(tab, paneId = this.mainPaneId) {
        const pane = this.panes.get(paneId) || this.panes.get(this.mainPaneId);
        if (!pane.tabs.includes(tab.id)) {
            pane.tabs.push(tab.id);
        }
        pane.activeTabId = tab.id;
        this.tabs.set(tab.id, { ...tab, paneId: pane.id, active: true });
        if (this.ctx.emit) {
            this.ctx.emit('tabs:opened', { tab, paneId: pane.id });
        }
    }
    closeTab(id) {
        const tab = this.tabs.get(id);
        if (!tab)
            return;
        const pane = this.panes.get(tab.paneId || this.mainPaneId);
        if (pane) {
            pane.tabs = pane.tabs.filter((t) => t !== id);
            if (pane.activeTabId === id) {
                pane.activeTabId = pane.tabs.length > 0 ? pane.tabs[pane.tabs.length - 1] || null : null;
            }
        }
        this.tabs.delete(id);
        if (this.ctx.emit) {
            this.ctx.emit('tabs:closed', { id });
        }
    }
    closeOtherTabs(targetId) {
        const tab = this.tabs.get(targetId);
        if (!tab)
            return;
        const pane = this.panes.get(tab.paneId || this.mainPaneId);
        if (pane) {
            const toClose = pane.tabs.filter((t) => t !== targetId);
            for (const t of toClose) {
                this.closeTab(t);
            }
        }
    }
    splitPane(fromPaneId, orientation, tabId) {
        const newPaneId = 'pane-' + Date.now();
        const newPane = {
            id: newPaneId,
            orientation,
            tabs: tabId ? [tabId] : [],
            activeTabId: tabId || null
        };
        this.panes.set(newPaneId, newPane);
        if (tabId) {
            const oldPane = this.panes.get(fromPaneId);
            if (oldPane) {
                oldPane.tabs = oldPane.tabs.filter((t) => t !== tabId);
            }
            const t = this.tabs.get(tabId);
            if (t)
                t.paneId = newPaneId;
        }
        return newPane;
    }
    toggleBottomDock(open) {
        this.bottomDockOpen = open !== undefined ? open : !this.bottomDockOpen;
        return this.bottomDockOpen;
    }
    isBottomDockOpen() {
        return this.bottomDockOpen;
    }
    getTabs() {
        return Array.from(this.tabs.values());
    }
    getPanes() {
        return Array.from(this.panes.values());
    }
}
export const Config = Schema.object({
    enableSplitPanes: Schema.boolean().default(true),
    defaultBottomDockHeight: Schema.number().default(280)
});
export function apply(ctx, config) {
    const service = new TabManagerService(ctx);
    ctx.tabManager = service;
}
