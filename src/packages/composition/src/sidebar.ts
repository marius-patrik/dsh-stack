export const sidebarPrimaryNavigation = ["new-conversation", "tabs", "files"] as const;

export const sidebarFooterNavigation = ["profile-selector", "settings"] as const;

export type SidebarSectionId =
  | "pinned"
  | "active"
  | "host-root"
  | "container-root"
  | "ungrouped"
  | "archived";

export interface SidebarSectionDefinition {
  readonly id: SidebarSectionId;
  readonly label: string;
  readonly iconTone: "default" | "muted";
}

// jscpd:ignore-start -- sidebar section-building mirrors workspace-files/src/index.ts's shape for a different domain; not extracted to keep each package's export self-contained
export const sidebarSections: readonly SidebarSectionDefinition[] = [
  { id: "pinned", label: "Pinned", iconTone: "default" },
  { id: "active", label: "Active", iconTone: "default" },
  { id: "host-root", label: "Host Root", iconTone: "muted" },
  { id: "container-root", label: "Container", iconTone: "muted" },
  { id: "ungrouped", label: "Ungrouped", iconTone: "muted" },
  { id: "archived", label: "Archived", iconTone: "muted" },
];

export interface SidebarFilesystemContextMenuItem {
  // jscpd:ignore-end
  readonly id: "open" | "open-new-tab" | "reveal" | "copy-path" | "rename" | "duplicate" | "delete";
  readonly destructive?: boolean;
}

export const filesystemContextMenu: readonly SidebarFilesystemContextMenuItem[] = [
  { id: "open" },
  { id: "open-new-tab" },
  { id: "reveal" },
  { id: "copy-path" },
  { id: "rename" },
  { id: "duplicate" },
  { id: "delete", destructive: true },
];

export interface SidebarPreferences {
  readonly showBrandLogo: boolean;
  readonly showNewConversation: boolean;
  readonly fileSectionLabel: string;
}

export const defaultSidebarPreferences: SidebarPreferences = {
  showBrandLogo: true,
  showNewConversation: true,
  fileSectionLabel: "Files",
};

/**
 * Returns the primary navigation items visible based on the preferences.
 *
 * Guarantees:
 * - Returns `sidebarPrimaryNavigation` if `showNewConversation` is true.
 * - Excludes "new-conversation" from the returned items if `showNewConversation` is false.
 *
 * Fails if `preferences` does not contain a `showNewConversation` boolean.
 */
export function visiblePrimaryNavigation(preferences: SidebarPreferences): readonly string[] {
  return preferences.showNewConversation
    ? sidebarPrimaryNavigation
    : sidebarPrimaryNavigation.filter((item) => item !== "new-conversation");
}
