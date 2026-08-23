/**
 * Loopback Access Gateway for dsh-hosts.
 * Binds the public/Tailscale port and transparently proxies to the local 127.0.0.1 harness backend.
 */
import type { AccessConfig } from './types.js';
export declare class AccessGateway {
    private config;
    private server;
    private running;
    constructor(config: AccessConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    isRunning(): boolean;
}
