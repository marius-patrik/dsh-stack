/**
 * Bi-Directional State Synchronizer for dsh-hosts cluster.
 * Synchronizes sessions, vaults, and presets across multiple nodes.
 */
export interface FileManifestEntry {
    path: string;
    size: number;
    mtime: number;
    hash: string;
}
export interface ClusterSyncManifest {
    timestamp: number;
    nodeId: string;
    files: Record<string, FileManifestEntry>;
}
export declare class ClusterSyncEngine {
    private homeDir;
    constructor(homeDir?: string);
    /**
     * Build an incremental file manifest with SHA-256 hashes.
     */
    buildManifest(nodeId: string): Promise<ClusterSyncManifest>;
    private scanDirRecursive;
    /**
     * Compare two manifests and derive files to push/pull.
     */
    diffManifests(local: ClusterSyncManifest, remote: ClusterSyncManifest): {
        needsPull: string[];
        needsPush: string[];
    };
}
