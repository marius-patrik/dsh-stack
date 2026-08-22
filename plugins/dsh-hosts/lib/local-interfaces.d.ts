/**
 * Local network interface scanner.
 */
export interface LocalInterfaceInfo {
    name: string;
    address: string;
    family: string;
    internal: boolean;
}
export declare function scanLocalInterfaces(): LocalInterfaceInfo[];
export declare function getPrimaryLanIp(): string | undefined;
