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
    active?: boolean;
}
export declare class TabManagerService {
    private tabs;
    private activeTabId;
    openTab(tab: WorkspaceTab): void;
    closeTab(id: string): void;
    getTabs(): WorkspaceTab[];
    getActiveTab(): WorkspaceTab | null;
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
