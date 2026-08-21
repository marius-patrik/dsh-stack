import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'tab-manager';
export const inject = ['slots', 'sessions', 'webServer'];
export const optional: string[] = ['icons'];

export interface WorkspaceTab {
  id: string;
  type: 'chat' | 'file' | 'repo' | 'diff' | 'terminal' | 'container';
  title: string;
  path?: string;
  pinned?: boolean;
  active?: boolean;
  paneId?: string;
}

export interface SplitPane {
  id: string;
  orientation: 'horizontal' | 'vertical';
  tabs: string[]; // tab IDs
  activeTabId: string | null;
}

export class TabManagerService {
  private tabs = new Map<string, WorkspaceTab>();
  private panes = new Map<string, SplitPane>();
  private mainPaneId = 'pane-main';
  private bottomDockOpen = false;
  private bottomDockHeight = 280;

  constructor(private ctx: Context) {
    this.panes.set(this.mainPaneId, {
      id: this.mainPaneId,
      orientation: 'horizontal',
      tabs: [],
      activeTabId: null
    });
  }

  openTab(tab: WorkspaceTab, paneId: string = this.mainPaneId): void {
    const pane = this.panes.get(paneId) || this.panes.get(this.mainPaneId)!;
    if (!pane.tabs.includes(tab.id)) {
      pane.tabs.push(tab.id);
    }
    pane.activeTabId = tab.id;
    this.tabs.set(tab.id, { ...tab, paneId: pane.id, active: true });

    if ((this.ctx as any).emit) {
      (this.ctx as any).emit('tabs:opened', { tab, paneId: pane.id });
    }
  }

  closeTab(id: string): void {
    const tab = this.tabs.get(id);
    if (!tab) return;
    const pane = this.panes.get(tab.paneId || this.mainPaneId);
    if (pane) {
      pane.tabs = pane.tabs.filter((t) => t !== id);
      if (pane.activeTabId === id) {
        pane.activeTabId = pane.tabs.length > 0 ? pane.tabs[pane.tabs.length - 1] || null : null;
      }
    }
    this.tabs.delete(id);
    if ((this.ctx as any).emit) {
      (this.ctx as any).emit('tabs:closed', { id });
    }
  }

  closeOtherTabs(targetId: string): void {
    const tab = this.tabs.get(targetId);
    if (!tab) return;
    const pane = this.panes.get(tab.paneId || this.mainPaneId);
    if (pane) {
      const toClose = pane.tabs.filter((t) => t !== targetId);
      for (const t of toClose) {
        this.closeTab(t);
      }
    }
  }

  splitPane(fromPaneId: string, orientation: 'horizontal' | 'vertical', tabId?: string): SplitPane {
    const newPaneId = 'pane-' + Date.now();
    const newPane: SplitPane = {
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
      if (t) t.paneId = newPaneId;
    }
    return newPane;
  }

  toggleBottomDock(open?: boolean): boolean {
    this.bottomDockOpen = open !== undefined ? open : !this.bottomDockOpen;
    return this.bottomDockOpen;
  }

  isBottomDockOpen(): boolean {
    return this.bottomDockOpen;
  }

  getTabs(): WorkspaceTab[] {
    return Array.from(this.tabs.values());
  }

  getPanes(): SplitPane[] {
    return Array.from(this.panes.values());
  }
}

export const Config = Schema.object({
  enableSplitPanes: Schema.boolean().default(true),
  defaultBottomDockHeight: Schema.number().default(280)
});

export function apply(ctx: Context, config: any) {
  const service = new TabManagerService(ctx);
  (ctx as any).tabManager = service;
}
