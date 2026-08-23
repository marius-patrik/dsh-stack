export interface SidebarLogoState {
  readonly showBrandLogo: boolean;
  readonly collapsed: boolean;
  readonly assetId: string;
}

export interface SidebarSettings {
  /** One setting controls the brand mark in both sidebar states. */
  readonly showBrandLogo: boolean;
}

export interface SidebarConversationSettings {
  /** Controls the large New Conversation action in the sidebar. */
  readonly showNewConversation: boolean;
}

export interface SkinDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly logoAssetId: string;
  readonly darkLogoAssetId?: string;
  readonly lightLogoAssetId?: string;
  readonly sidebarBranding?: {
    readonly collapsedAssetId?: string;
    readonly expandedAssetId?: string;
  };
}

export interface WorkspaceThemeState {
  readonly activeSkinId: string;
  readonly skins: readonly SkinDefinition[];
}

export function resolveSidebarLogo(
  settings: SidebarSettings,
  skin: SkinDefinition,
  collapsed: boolean,
): SidebarLogoState {
  const surface = skin.sidebarBranding;
  const assetId = collapsed
    ? (surface?.collapsedAssetId ?? skin.logoAssetId)
    : (surface?.expandedAssetId ?? skin.logoAssetId);

  return {
    showBrandLogo: settings.showBrandLogo,
    collapsed,
    assetId,
  };
}

export function shouldShowNewConversation(settings: SidebarConversationSettings): boolean {
  return settings.showNewConversation;
}
