/**
 * Automated Multi-Machine Node Deployer.
 * Uses Tailscale SSH / SSH to deploy dsh worker nodes across cluster machines.
 */
import type { NetworkNode } from './types.js';
export interface DeploymentProgress {
    nodeId: string;
    stage: 'idle' | 'checking-ssh' | 'provisioning' | 'starting-service' | 'connected' | 'failed';
    logs: string[];
    error?: string;
}
export declare class RemoteDeployer {
    private activeDeployments;
    getProgress(nodeId: string): DeploymentProgress | undefined;
    /**
     * Shell bootstrap script served at /hosts/bootstrap.sh for Unix worker nodes.
     */
    generateUnixBootstrap(coordinatorUrl: string): string;
    /**
     * PowerShell bootstrap script served at /hosts/bootstrap.ps1 for Windows worker nodes.
     */
    generateWindowsBootstrap(coordinatorUrl: string): string;
    /**
     * Execute automated deployment over Tailscale SSH to a remote node.
     */
    deployToNode(node: NetworkNode, coordinatorUrl: string): Promise<DeploymentProgress>;
}
