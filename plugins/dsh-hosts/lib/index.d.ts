/**
 * dsh-hosts: Multi-node device and cluster manager Cordis plugin.
 * @module dsh-hosts
 */
import { Service, type Context } from '@deepseek-ai/cordis';
import type { AccessConfig, ClusterStatus, IHostsService, NetworkNode } from './types.js';
export * from './types.js';
export declare const name = "dsh-hosts";
export declare const inject: string[];
declare module '@deepseek-ai/cordis' {
    interface Context {
        hosts: HostsService;
    }
}
export declare class HostsService extends Service implements IHostsService {
    readonly config?: Partial<AccessConfig> | undefined;
    private gateway;
    private readonly clusterManager;
    private readonly deployer;
    private readonly syncEngine;
    private readonly domainManager;
    private cachedStatus;
    private lastScan;
    constructor(ctx: Context, config?: Partial<AccessConfig> | undefined);
    getAccessConfig(): AccessConfig;
    listNodes(): Promise<NetworkNode[]>;
    getClusterStatus(): Promise<ClusterStatus>;
    rescanTopology(): Promise<ClusterStatus>;
    deployWorker(nodeId: string): Promise<{
        ok: boolean;
        message: string;
        command?: string;
    }>;
}
export declare function apply(ctx: Context, config?: Partial<AccessConfig>): void;
