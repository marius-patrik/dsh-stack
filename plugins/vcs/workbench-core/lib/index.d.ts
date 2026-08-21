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
}
export declare class ReposWorkbenchService {
    private repos;
    registerRepo(details: RepoDetails): void;
    getRepo(path: string): RepoDetails | undefined;
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
