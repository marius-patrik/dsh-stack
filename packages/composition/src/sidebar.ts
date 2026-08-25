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

export const sidebarSections: readonly SidebarSectionDefinition[] = [
  { id: "pinned", label: "Pinned", iconTone: "default" },
  { id: "active", label: "Active", iconTone: "default" },
  { id: "host-root", label: "Host Root", iconTone: "muted" },
  { id: "container-root", label: "Container", iconTone: "muted" },
  { id: "ungrouped", label: "Ungrouped", iconTone: "muted" },
  { id: "archived", label: "Archived", iconTone: "muted" },
];

export interface SidebarFilesystemContextMenuItem {
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

/** visiblePrimaryNavigation implementation. */
export function visiblePrimaryNavigation(preferences: SidebarPreferences): readonly string[] {
  return preferences.showNewConversation
    ? sidebarPrimaryNavigation
    : sidebarPrimaryNavigation.filter((item) => item !== "new-conversation");
}
