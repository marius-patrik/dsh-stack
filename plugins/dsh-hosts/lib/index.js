/**
 * dsh-hosts: Multi-node device and cluster manager Cordis plugin.
 * @module dsh-hosts
 */
import { Service } from '@deepseek-ai/cordis';
import { scanTailscaleTopology } from './tailscale.js';
import { getPrimaryLanIp } from './local-interfaces.js';
import { AccessGateway } from './gateway.js';
import { ClusterManager } from './cluster.js';
import { RemoteDeployer } from './deployer.js';
import { ClusterSyncEngine } from './sync.js';
import { VirtualDomainManager } from './virtual-domain.js';
export * from './types.js';
export const name = 'dsh-hosts';
export const inject = ['webServer'];
export class HostsService extends Service {
    config;
    gateway = null;
    clusterManager = new ClusterManager();
    deployer = new RemoteDeployer();
    syncEngine = new ClusterSyncEngine();
    domainManager = new VirtualDomainManager();
    cachedStatus = null;
    lastScan = 0;
    constructor(ctx, config) {
        super(ctx, 'hosts');
        this.config = config;
        const access = this.getAccessConfig();
        this.gateway = new AccessGateway(access);
        // Advertise local mDNS domain (dsh.local)
        void this.domainManager.registerMdns();
        const server = ctx.webServer;
        if (server) {
            server.register({
                kind: 'exact',
                path: '/hosts/api/status',
                handler: async (_req, res) => {
                    const status = await this.getClusterStatus();
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    res.end(JSON.stringify(status));
                },
            });
            server.register({
                kind: 'exact',
                path: '/hosts/api/health',
                handler: async (_req, res) => {
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    res.end(JSON.stringify({ ok: true, timestamp: Date.now() }));
                },
            });
            server.register({
                kind: 'exact',
                path: '/hosts/bootstrap.sh',
                handler: async (_req, res) => {
                    const script = this.deployer.generateUnixBootstrap(access.permanentUrl);
                    res.writeHead(200, { 'Content-Type': 'text/x-shellscript', 'Access-Control-Allow-Origin': '*' });
                    res.end(script);
                },
            });
            server.register({
                kind: 'exact',
                path: '/hosts/bootstrap.ps1',
                handler: async (_req, res) => {
                    const script = this.deployer.generateWindowsBootstrap(access.permanentUrl);
                    res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
                    res.end(script);
                },
            });
            server.register({
                kind: 'exact',
                path: '/hosts/api/sync/manifest',
                handler: async (_req, res) => {
                    const manifest = await this.syncEngine.buildManifest('coordinator');
                    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                    res.end(JSON.stringify(manifest));
                },
            });
        }
        // Start network access gateway
        void this.gateway.start().catch((err) => {
            console.warn(`[dsh-hosts] gateway notice: ${err?.message || err}`);
        });
        ctx.effect(() => {
            return () => {
                if (this.gateway) {
                    void this.gateway.stop();
                    this.gateway = null;
                }
            };
        }, 'dsh-hosts: gateway lifecycle');
    }
    getAccessConfig() {
        const gatewayPort = this.config?.gatewayPort ?? 3080;
        const backendPort = this.config?.backendPort ?? 3081;
        const mode = this.config?.mode ?? 'tailnet';
        const lanIp = getPrimaryLanIp();
        const tailnetDns = 'mac.taildbbf82.ts.net';
        const permanentUrl = this.domainManager.getPermanentAddress(tailnetDns);
        return {
            mode,
            gatewayPort,
            backendPort,
            activeUrl: `http://${tailnetDns}:${gatewayPort}`,
            permanentUrl,
            tailnetDns,
            lanIp,
            clusterDomain: 'dsh.local',
        };
    }
    async listNodes() {
        const status = await this.getClusterStatus();
        return status.nodes;
    }
    async getClusterStatus() {
        const now = Date.now();
        if (this.cachedStatus && now - this.lastScan < 10000) {
            return this.cachedStatus;
        }
        return this.rescanTopology();
    }
    async rescanTopology() {
        const ts = await scanTailscaleTopology();
        const access = this.getAccessConfig();
        const nodes = [];
        if (ts.self) {
            ts.self.activeUrl = access.activeUrl;
            nodes.push(ts.self);
        }
        for (const peer of ts.peers) {
            if (peer.dnsName) {
                peer.activeUrl = `http://${peer.dnsName}:${access.gatewayPort}`;
            }
            else if (peer.ips[0]) {
                peer.activeUrl = `http://${peer.ips[0]}:${access.gatewayPort}`;
            }
            nodes.push(peer);
        }
        const onlineNodes = nodes.filter(n => n.online).length;
        const manifest = await this.syncEngine.buildManifest(ts.self?.id || 'self');
        const trackedFiles = Object.keys(manifest.files).length;
        this.cachedStatus = {
            coordinator: ts.self,
            nodes,
            totalNodes: nodes.length,
            onlineNodes,
            access,
            syncStatus: {
                synced: true,
                lastSync: Date.now(),
                trackedFiles,
            },
        };
        this.lastScan = Date.now();
        return this.cachedStatus;
    }
    async deployWorker(nodeId) {
        const status = await this.getClusterStatus();
        const node = status.nodes.find(n => n.id === nodeId);
        if (!node) {
            return { ok: false, message: `Node with id ${nodeId} not found` };
        }
        const command = this.clusterManager.generateWorkerCommand(node, status.access.permanentUrl);
        return {
            ok: true,
            message: `Run this command on ${node.name} (${node.os}) to connect it as a worker node:`,
            command,
        };
    }
}
export function apply(ctx, config) {
    ctx.plugin(HostsService, config);
}
