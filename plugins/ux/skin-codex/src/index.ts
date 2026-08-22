import type { Context } from '@deepseek-ai/cordis';

export const name = 'skin-codex';
export const inject = ['workspace.sidebar'];
export const optional = ['skin'];

export const definition = {
  id: 'codex',
  displayName: 'Codex',
  logoAssetId: 'brand/codex/logo',
  sidebarBranding: {
    collapsedAssetId: 'brand/codex/logo-mark',
    expandedAssetId: 'brand/codex/logo',
  },
} as const;

export function apply(ctx: Context) {
  void ctx;
}
