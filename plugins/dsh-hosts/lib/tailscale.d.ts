/**
 * Tailscale CLI scanner and integration for dsh-hosts.
 */
import type { NetworkNode } from './types.js';
export declare function scanTailscaleTopology(): Promise<{
    self: NetworkNode | null;
    peers: NetworkNode[];
    active: boolean;
}>;
