import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'tab-manager';
export const inject = ['slots', 'sessions', 'webServer'];
export const optional = ['icons'];

export interface WorkspaceTab {
  id: string;
  type: 'chat' | 'file' | 'repo' | 'diff' | 'terminal' | 'container';
  title: string;
  path?: string;
  active?: boolean;
}

export class TabManagerService {
  private tabs = new Map<string, WorkspaceTab>();
  private activeTabId: string | null = null;

  openTab(tab: WorkspaceTab): void {
    this.tabs.set(tab.id, { ...tab, active: true });
    this.activeTabId = tab.id;
  }

  closeTab(id: string): void {
    this.tabs.delete(id);
    if (this.activeTabId === id) {
      const remaining = Array.from(this.tabs.keys());
      this.activeTabId = remaining.length > 0 ? remaining[0] || null : null;
    }
  }

  getTabs(): WorkspaceTab[] {
    return Array.from(this.tabs.values());
  }

  getActiveTab(): WorkspaceTab | null {
    return this.activeTabId ? this.tabs.get(this.activeTabId) || null : null;
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).tabManager = new TabManagerService();
}
