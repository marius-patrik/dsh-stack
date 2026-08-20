/**
 * Local network interface scanner.
 */
import { networkInterfaces } from 'node:os';
export function scanLocalInterfaces() {
    const ifaces = networkInterfaces();
    const results = [];
    for (const name of Object.keys(ifaces)) {
        const list = ifaces[name];
        if (!list)
            continue;
        for (const info of list) {
            if (info.family === 'IPv4' && !info.internal) {
                results.push({
                    name,
                    address: info.address,
                    family: info.family,
                    internal: info.internal,
                });
            }
        }
    }
    return results;
}
export function getPrimaryLanIp() {
    const list = scanLocalInterfaces();
    const preferred = list.find(i => i.name === 'en0' || i.name === 'eth0' || i.name === 'wlan0');
    return preferred?.address || list[0]?.address;
}
