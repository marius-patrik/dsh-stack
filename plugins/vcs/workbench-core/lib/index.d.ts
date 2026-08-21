import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "workbench-core";
export declare const inject: string[];
export declare const optional: string[];
export interface RepoDetails {
    path: string;
    branch: string;
    remoteUrl?: string;
    isLocalOnly: boolean;
    ahead: number;
    behind: number;
    uncommittedChanges: number;
}
export declare class ReposWorkbenchService {
    private ctx;
    private repos;
    constructor(ctx: Context);
    registerRepo(details: RepoDetails): void;
    getRepo(targetPath: string): RepoDetails | undefined;
    listRepos(): RepoDetails[];
    getOverview(repoPath: string): {
        path: string;
        repoName: string;
        branch: string;
        remoteUrl: string | undefined;
        isLocalOnly: boolean;
        uncommittedChanges: number;
    };
    private registerVcsTools;
}
export declare const Config: Schema<Schemastery.ObjectS<{
    enableAutoFetch: Schema<boolean, boolean>;
    supportLocalOnly: Schema<boolean, boolean>;
}>, Schemastery.ObjectT<{
    enableAutoFetch: Schema<boolean, boolean>;
    supportLocalOnly: Schema<boolean, boolean>;
}>>;
export declare function apply(ctx: Context, config: any): void;
