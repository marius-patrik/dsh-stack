import type { Context } from '@deepseek-ai/cordis';

export const name = 'skin-deepseek';
export const inject = ['workspace.sidebar'];
export const optional = ['skin'];

export const definition = {
  id: 'deepseek',
  displayName: 'DeepSeek',
  logoAssetId: 'brand/deepseek/logo',
  sidebarBranding: {
    collapsedAssetId: 'brand/deepseek/logo-mark',
    expandedAssetId: 'brand/deepseek/logo',
  },
} as const;

export function apply(ctx: Context) {
  void ctx;
}
