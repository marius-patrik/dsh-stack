import type { Context } from '@deepseek-ai/cordis';
import Schema from '@deepseek-ai/schemastery';

export const name = 'vault-credentials';
export const inject = ['webServer'];
export const optional: string[] = [];

export interface VaultAccount {
  accountName: string;
  provider: string;
  tokenRef: string;
  expiresAt?: number;
}

export class AccountsService {
  private accounts = new Map<string, VaultAccount>();

  set(account: VaultAccount): void {
    this.accounts.set(account.accountName, account);
  }

  get(accountName: string): VaultAccount | undefined {
    return this.accounts.get(accountName);
  }

  list(): VaultAccount[] {
    return Array.from(this.accounts.values());
  }
}

export const Config = Schema.object({});

export function apply(ctx: Context) {
  (ctx as any).accounts = new AccountsService();
}
