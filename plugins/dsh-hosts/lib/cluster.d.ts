/**
 * Multi-node cluster coordinator and worker deployment generator.
 */
import type { NetworkNode } from './types.js';
export declare class ClusterManager {
    /**
     * Generate an automated one-line startup command for pairing a remote node
     * to this coordinator over Tailscale.
     */
    generateWorkerCommand(targetNode: NetworkNode, coordinatorUrl: string): string;
    /**
     * Validate node reachability via HTTP ping.
     */
    pingNode(node: NetworkNode): Promise<boolean>;
}
