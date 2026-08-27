/**
 * The filesystem half of the sidebar tree: directory rows, the chats filed
 * under them, and file rows, expanded lazily from the quotas filesystem API.
 *
 * Right-clicking a directory used to set the tree's context-menu state to an
 * id nothing rendered a menu for, so the menu never appeared -- one more of
 * the "context menu does nothing" reports behind issue #98. A directory's
 * context menu is now the same New Item menu its `+` button opens, placed at
 * the cursor.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/directory-entries
 */

/**
 * Build the directory renderer for one render pass.
 * @param runtime - the sidebar tree runtime (`h`, glyphs, `renderAppIcon`).
 * @param parts - `{ renderTreeRow, renderChatRow, newItemMenu }`.
 * @param controller - the tree controller for this render pass.
 * @returns `renderDirectoryEntries(directoryPath, depth)`.
 */
function __dshCreateDirectoryEntries(runtime, parts, controller) {
  var h = runtime.h;
  var glyphs = runtime.glyphs;

  var VENDOR_DIRECTORIES = ["node_modules", ".git", "dist", "lib", ".turbo"];
  var BUNDLE_SUFFIXES = [".app", ".dmg", ".pkg"];

  /**
   * The placeholder shown while a directory loads, or when it is empty.
   * @param key - React key.
   * @param padLeft - the row's indent in pixels.
   * @param text - the message.
   * @returns the placeholder element.
   */
  function renderPlaceholder(key, padLeft, text) {
    return h(
      "div",
      {
        key: key,
        style: {
          padding: "4px 8px 4px " + padLeft + "px",
          fontSize: "11px",
          color: "var(--dsw-alias-label-tertiary)",
        },
      },
      text,
    );
  }

  /**
   * True when a name ends in one of the macOS bundle suffixes.
   * @param name - the entry name.
   * @returns whether the entry is an application bundle.
   */
  function isBundle(name) {
    return BUNDLE_SUFFIXES.some(function (suffix) {
      return (name || "").endsWith(suffix);
    });
  }

  /**
   * The glyph a directory row shows, by what the directory is.
   * @param entry - the directory entry.
   * @param traits - `{ isVendor, isRepo, isWorkspace }`.
   * @returns the icon element.
   */
  function directoryIcon(entry, traits) {
    if (isBundle(entry.name)) return runtime.renderAppIcon(entry.name, 16, entry.path);
    if (entry.name === "Applications") return h(glyphs.app, { size: 15 });
    if (entry.name === "Library") return h(glyphs.library, { size: 15 });
    if (entry.name.toLowerCase() === "system") return h(glyphs.system, { size: 15 });
    if (entry.name.toLowerCase() === "users") return h(glyphs.users, { size: 15 });
    if (traits.isRepo) return h(glyphs.repo, { size: 15 });
    if (traits.isWorkspace) return h(glyphs.workspace, { size: 15 });
    return h(glyphs.folderOpen, { size: 15 });
  }

  /**
   * Classify one directory entry against the workspace list.
   * @param entry - the directory entry.
   * @returns `{ isVendor, isWorkspace, isRepo }`.
   */
  function traitsOf(entry) {
    var lowered = (entry.name || "").toLowerCase();
    var isVendor =
      VENDOR_DIRECTORIES.indexOf(entry.name) !== -1 ||
      entry.name === "Applications" ||
      entry.name === "Library" ||
      lowered === "system" ||
      lowered === "users";
    var entryPath = controller.grouping.normalisePath(entry.path);
    var isWorkspace =
      !isVendor &&
      controller.grouping.workspaces.some(function (workspace) {
        var workspacePath = controller.grouping.normalisePath(workspace.path || workspace.cwd);
        return Boolean(workspacePath) && workspacePath === entryPath && entryPath !== "/Users/user";
      });
    return {
      isVendor: isVendor,
      isWorkspace: isWorkspace,
      isRepo: !isVendor && Boolean(entry.isRepo || isWorkspace),
    };
  }

  /**
   * One file row.
   * @param entry - the file entry.
   * @param padLeft - the row's indent in pixels.
   * @returns the row element.
   */
  function renderFileRow(entry, padLeft) {
    var isApplication = isBundle(entry.name) || (entry.name || "").endsWith(".exe");
    return parts.renderTreeRow({
      key: entry.path,
      className: "dsh-tree-sessionRow",
      padLeft: padLeft,
      height: 28,
      icon: isApplication
        ? runtime.renderAppIcon(entry.name, 15, entry.path)
        : h(glyphs.file, { size: 13 }),
      iconStyle: {
        width: "16px",
        color: isApplication ? "var(--dsw-alias-primary)" : "var(--dsw-alias-label-tertiary)",
      },
      title: entry.name,
      titleHint: entry.path,
      titleStyle: { fontSize: "12px", marginLeft: "4px" },
      onClick: function () {
        controller.openFileTab(entry);
      },
    });
  }

  /**
   * One directory row, with its chats and children when expanded.
   * @param entry - the directory entry.
   * @param depth - the entry's depth in the tree.
   * @returns the row element and any expanded children.
   */
  function renderDirectoryRow(entry, depth) {
    var traits = traitsOf(entry);
    var isExpanded = Boolean(controller.expandedPaths[entry.path]);
    var chats = controller.grouping.folderSessions[entry.path] || [];
    return h(
      "div",
      { key: entry.path, style: { display: "flex", flexDirection: "column", width: "100%" } },
      parts.renderTreeRow({
        key: "row",
        className: "dsh-tree-projectRow",
        padLeft: 8 + depth * 16,
        height: 28,
        ariaExpanded: isExpanded,
        icon: directoryIcon(entry, traits),
        chevron: { open: isExpanded },
        title: entry.name,
        titleHint: entry.path,
        badge: chats.length > 0 ? { text: chats.length, tone: "accent" } : null,
        onClick: function () {
          controller.toggleDirectory(entry.path);
        },
        onDoubleClick: traits.isRepo
          ? function (event) {
              event.stopPropagation();
              controller.openRepoTab(entry);
            }
          : undefined,
        onContextMenu: controller.openNewItemMenuAt("folder-plus::" + entry.path),
        actions: parts.newItemMenu.renderButton(entry.path, "folder-plus::" + entry.path),
      }),
      isExpanded
        ? h(
            "div",
            { style: { display: "flex", flexDirection: "column", width: "100%" } },
            chats.map(function (chat) {
              return parts.renderChatRow(chat, 8 + (depth + 1) * 16);
            }),
            renderDirectoryEntries(entry.path, depth + 1),
          )
        : null,
    );
  }

  /**
   * Every entry of one directory at one depth.
   * @param directoryPath - the directory to list.
   * @param depth - the directory's depth in the tree.
   * @returns the rows, a placeholder, or null when search hides them all.
   */
  function renderDirectoryEntries(directoryPath, depth) {
    var padLeft = 8 + depth * 16 + 16;
    if (controller.loadingPaths[directoryPath])
      return renderPlaceholder("loading-" + directoryPath, padLeft, "Loading…");
    var entries = controller.dirCache[directoryPath];
    if (!entries || entries.length === 0)
      return renderPlaceholder("empty-" + directoryPath, padLeft, "(empty)");
    var visible = entries.filter(function (entry) {
      return controller.matchesSearch(entry.name);
    });
    if (visible.length === 0) return null;
    return visible.map(function (entry) {
      return entry.isDirectory
        ? renderDirectoryRow(entry, depth)
        : renderFileRow(entry, 8 + depth * 16);
    });
  }

  return renderDirectoryEntries;
}
