import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "tab-manager";
export declare const inject: string[];
export declare const optional: string[];
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
    tabs: string[];
    activeTabId: string | null;
}
export declare class TabManagerService {
    private ctx;
    private tabs;
    private panes;
    private mainPaneId;
    private bottomDockOpen;
    private bottomDockHeight;
    constructor(ctx: Context);
    openTab(tab: WorkspaceTab, paneId?: string): void;
    closeTab(id: string): void;
    closeOtherTabs(targetId: string): void;
    splitPane(fromPaneId: string, orientation: 'horizontal' | 'vertical', tabId?: string): SplitPane;
    toggleBottomDock(open?: boolean): boolean;
    isBottomDockOpen(): boolean;
    getTabs(): WorkspaceTab[];
    getPanes(): SplitPane[];
}
export declare const Config: Schema<Schemastery.ObjectS<{
    enableSplitPanes: Schema<boolean, boolean>;
    defaultBottomDockHeight: Schema<number, number>;
}>, Schemastery.ObjectT<{
    enableSplitPanes: Schema<boolean, boolean>;
    defaultBottomDockHeight: Schema<number, number>;
}>>;
export declare function apply(ctx: Context, config: any): void;
