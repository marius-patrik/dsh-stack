/**
 * Permanent Virtual Cluster Domain and Ingress Manager.
 * Allows dsh to have a fixed cluster address (e.g. dsh.local or custom domain).
 */
export interface VirtualDomainConfig {
    clusterDomain: string;
    enableMdns: boolean;
    permanentPort: number;
}
export declare class VirtualDomainManager {
    private config;
    constructor(config?: Partial<VirtualDomainConfig>);
    /**
     * Get the primary permanent address for accessing the dsh cluster.
     */
    getPermanentAddress(tailnetDns?: string): string;
    /**
     * Register permanent local mDNS name (dsh.local) via dns-sd on macOS / avahi on Linux.
     */
    registerMdns(): Promise<boolean>;
}
