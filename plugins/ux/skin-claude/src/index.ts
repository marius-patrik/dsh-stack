import type { Context } from '@deepseek-ai/cordis';

export const name = 'skin-claude';
export const inject = ['workspace.sidebar'];
export const optional = ['skin'];

export const definition = {
  id: 'claude',
  displayName: 'Claude',
  logoAssetId: 'brand/claude/logo',
  sidebarBranding: {
    collapsedAssetId: 'brand/claude/logo-mark',
    expandedAssetId: 'brand/claude/logo',
  },
} as const;

export function apply(ctx: Context) {
  void ctx;
}
