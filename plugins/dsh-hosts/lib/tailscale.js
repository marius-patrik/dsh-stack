/**
 * Tailscale CLI scanner and integration for dsh-hosts.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);
function normalizeOS(osRaw) {
    const os = (osRaw || '').toLowerCase();
    if (os.includes('mac') || os.includes('darwin'))
        return 'macos';
    if (os.includes('win'))
        return 'windows';
    if (os.includes('linux'))
        return 'linux';
    if (os.includes('ios'))
        return 'ios';
    if (os.includes('android'))
        return 'android';
    return 'other';
}
function normalizeRole(node) {
    if (node.isSelf)
        return 'coordinator';
    if (node.os === 'ios' || node.os === 'android')
        return 'client';
    if (node.os === 'windows' || node.os === 'linux' || node.os === 'macos')
        return 'worker';
    return 'peer';
}
export async function scanTailscaleTopology() {
    try {
        const { stdout } = await execFileAsync('tailscale', ['status', '--json'], { timeout: 4000 });
        const data = JSON.parse(stdout);
        let selfNode = null;
        if (data.Self) {
            const s = data.Self;
            const os = normalizeOS(s.OS);
            const dns = (s.DNSName || '').replace(/\.$/, '');
            selfNode = {
                id: s.ID || 'self',
                name: s.HostName || 'mac',
                hostname: s.HostName || 'mac',
                dnsName: dns || undefined,
                ips: s.TailscaleIPs || [],
                os,
                online: true,
                isSelf: true,
                role: 'coordinator',
                capabilities: ['web-server', 'orchestration', 'workspace-host', 'storage-sync'],
            };
        }
        const peers = [];
        for (const [key, p] of Object.entries(data.Peer || {})) {
            // Filter internal tailscale funnel ingress nodes
            if (p.HostName?.startsWith('funnel-ingress'))
                continue;
            const os = normalizeOS(p.OS);
            const hostname = p.HostName || key;
            const dns = (p.DNSName || '').replace(/\.$/, '');
            const isOnline = Boolean(p.Online);
            const role = normalizeRole({ isSelf: false, os, hostname });
            const capabilities = [];
            if (role === 'worker') {
                capabilities.push('agent-runner', 'inference-worker', 'workspace-mirror');
            }
            else if (role === 'client') {
                capabilities.push('web-client');
            }
            peers.push({
                id: p.ID || key,
                name: hostname,
                hostname,
                dnsName: dns || undefined,
                ips: p.TailscaleIPs || [],
                os,
                online: isOnline,
                isSelf: false,
                role,
                capabilities,
                lastSeen: p.LastSeen,
            });
        }
        return { self: selfNode, peers, active: true };
    }
    catch (_error) {
        return { self: null, peers: [], active: false };
    }
}
