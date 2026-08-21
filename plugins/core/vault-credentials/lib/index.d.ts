import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';
export declare const name = "vault-credentials";
export declare const inject: string[];
export declare const optional: string[];
export interface VaultAccount {
    accountName: string;
    provider: string;
    tokenRef: string;
    expiresAt?: number;
}
export declare class AccountsService {
    private accounts;
    set(account: VaultAccount): void;
    get(accountName: string): VaultAccount | undefined;
    list(): VaultAccount[];
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare function apply(ctx: Context): void;
