import Schema from '@deepseek-ai/schemastery';
export const name = 'vault-credentials';
export const inject = ['webServer'];
export const optional = [];
export class AccountsService {
    accounts = new Map();
    set(account) {
        this.accounts.set(account.accountName, account);
    }
    get(accountName) {
        return this.accounts.get(accountName);
    }
    list() {
        return Array.from(this.accounts.values());
    }
}
export const Config = Schema.object({});
export function apply(ctx) {
    ctx.accounts = new AccountsService();
}
