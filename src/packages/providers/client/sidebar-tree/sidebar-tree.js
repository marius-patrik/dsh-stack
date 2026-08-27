/**
 * The sidebar tree: the component mounted into the harness `sidebar.workspaces`
 * slot, and the single implementation owner of the sidebar's groups, rows and
 * row context menus.
 *
 * It was extracted out of `src/packages/providers/client.js` for issue #138.
 * Three product decisions landed with the extraction:
 *
 * - #96 -- the old `Active` group, which mixed running chats, live terminal
 *   sessions and running containers into one list, is replaced by a
 *   `Terminals` group and a `Containers` group. Chats are not duplicated into
 *   a live group at all; they stay in the workspaces section they belong to
 *   and carry a running indicator on the row itself.
 * - #97 -- `Ungrouped` is `Global`.
 * - #103 -- the arrangement is a user preference, `treeLayout`:
 *   `sections` keeps the discrete blocks,
 *   `unified` nests every group under one root with no separators. The
 *   preference is read from the store `@dsh-stack/sidebar-preferences`
 *   publishes on the page, not copied into this bundle.
 *
 * Every row action runs through `session-action-dispatch`, so an action that
 * cannot proceed reports instead of silently resolving (#98).
 *
 * @module @dsh-stack/providers/client/sidebar-tree/sidebar-tree
 */

/**
 * Build the sidebar tree component bound to one providers client runtime.
 * @param runtime - `{ React, h, glyphs, SelectDropdownMenu, RenameTerminalModal, renderAppIcon, formatTimeAgo, ensureTreeStyles, ensureModelPickerDecoration, quotasApi }`.
 * @returns the React component to register into `sidebar.workspaces`.
 */
function __dshCreateSidebarTree(runtime) {
  var React = runtime.React;
  var h = runtime.h;
  var glyphs = runtime.glyphs;
  var quotasApi = runtime.quotasApi;

  var ROOT_PATH = "/";
  var DEFAULT_DIRECTORY = "/Users/user/Projects";
  var AUTO_EXPANDED_PATHS = [ROOT_PATH, "/Users", "/Users/user", DEFAULT_DIRECTORY];
  var LIVE_POLL_INTERVAL_MS = 5000;
  var SEARCH_TOGGLE_EVENT = "dsh:sidebar-search-toggle";
  var SEARCH_TRIGGER_EVENT = "dsh:trigger-sidebar-search";
  var SEARCH_VISIBILITY_KEY = "dsh_show_sidebar_search";

  /**
   * Where `@dsh-stack/sidebar-preferences` publishes its store, and how it
   * announces itself. This bundle is hand-authored and concatenated rather
   * than built by tsdown, so it cannot inline the preference module the way
   * every other client bundle does; it reads the one published store instead
   * of carrying a second copy of it.
   */
  var PREFERENCES_GLOBAL = "__dshSidebarPreferences";
  var PREFERENCES_INSTALLED_EVENT = "dsh-stack.sidebar.preferences:installed";
  var DEFAULT_TREE_LAYOUT = "sections";

  var renderTreeRow = __dshCreateTreeRow(runtime);
  var renderRowActionsMenu = __dshCreateRowActionsMenu(runtime);
  var renderTreeNotice = __dshCreateTreeNotice(runtime);
  var renderLiveProcessRow = __dshCreateLiveProcessRow(runtime, { renderTreeRow: renderTreeRow });

  /**
   * Read one feed hook defensively: a slot's injected hook may be absent while
   * the host is still assembling, and the tree still has to render.
   * @param useFeed - the injected hook, when the host provided one.
   * @param fallback - the shape to fall back to.
   * @returns the feed snapshot.
   */
  function readFeed(useFeed, fallback) {
    if (typeof useFeed !== "function") return fallback;
    try {
      return (
        useFeed(function (snapshot) {
          return snapshot;
        }) || fallback
      );
    } catch (error) {
      return fallback;
    }
  }

  /**
   * Subscribe to one window event for the lifetime of a component.
   * @param name - the event name.
   * @param handler - the listener.
   * @returns the effect cleanup.
   */
  function listenOnWindow(name, handler) {
    window.addEventListener(name, handler);
    return function () {
      window.removeEventListener(name, handler);
    };
  }

  /**
   * Whether the sidebar search affordance is switched on, as the settings
   * section last left it.
   * @returns the stored visibility.
   */
  function readSearchVisibility() {
    if (typeof window === "undefined" || !window.localStorage) return true;
    return window.localStorage.getItem(SEARCH_VISIBILITY_KEY) !== "false";
  }

  /**
   * The published sidebar preference store, once its browser half has run.
   * @returns the store, or null while it has not loaded yet.
   */
  function preferenceStore() {
    return (typeof window !== "undefined" && window[PREFERENCES_GLOBAL]) || null;
  }

  /**
   * The persisted tree layout, falling back while the store is absent.
   * @returns `sections` or `unified`.
   */
  function readTreeLayout() {
    var store = preferenceStore();
    var value = store ? store.get().treeLayout : DEFAULT_TREE_LAYOUT;
    return value === "unified" ? "unified" : DEFAULT_TREE_LAYOUT;
  }

  /**
   * The empty-state line one group shows when it has nothing to list.
   * @param key - React key.
   * @param padLeft - the line's indent in pixels.
   * @param text - the message.
   * @returns the element.
   */
  function renderEmptyGroupLine(key, padLeft, text) {
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
   * The sidebar tree.
   * @param props - the `sidebar.workspaces` slot props plus the session
   * actions injected by the providers plugin's slot registration.
   * @returns the tree, or the collapsed rail when the sidebar is narrow.
   */
  function SidebarTree(props) {
    runtime.ensureTreeStyles();
    runtime.ensureModelPickerDecoration();

    var wide = Boolean(props && props.wide);

    var treeLayoutState = React.useState(readTreeLayout);
    var treeLayout = treeLayoutState[0],
      setTreeLayout = treeLayoutState[1];

    var sessionList = readFeed(props && props.useSessions, { ids: [], byId: {} });
    var workspaceList = readFeed(props && props.useWorkspaces, { items: [] });

    var openGroupsState = React.useState({
      root: true,
      pinned: true,
      terminals: true,
      containers: true,
      host: true,
      drive: true,
      global: true,
      archived: false,
    });
    var openGroups = openGroupsState[0],
      setOpenGroups = openGroupsState[1];

    var expandedPathsState = React.useState(function () {
      var initial = {};
      AUTO_EXPANDED_PATHS.forEach(function (path) {
        initial[path] = true;
      });
      return initial;
    });
    var expandedPaths = expandedPathsState[0],
      setExpandedPaths = expandedPathsState[1];

    var expandedSubagentsState = React.useState({});
    var expandedSubagents = expandedSubagentsState[0],
      setExpandedSubagents = expandedSubagentsState[1];

    var dirCacheState = React.useState({});
    var dirCache = dirCacheState[0],
      setDirCache = dirCacheState[1];

    var loadingPathsState = React.useState({});
    var loadingPaths = loadingPathsState[0],
      setLoadingPaths = loadingPathsState[1];

    var terminalsState = React.useState([]);
    var terminals = terminalsState[0],
      setTerminals = terminalsState[1];

    var containersState = React.useState([]);
    var containers = containersState[0],
      setContainers = containersState[1];

    var plusMenuState = React.useState(null);
    var plusMenu = plusMenuState[0],
      setPlusMenu = plusMenuState[1];

    var openMenuState = React.useState(null);
    var openMenu = openMenuState[0],
      setOpenMenu = openMenuState[1];

    var renameTerminalState = React.useState(null);
    var renameTerminal = renameTerminalState[0],
      setRenameTerminal = renameTerminalState[1];

    var searchQueryState = React.useState("");
    var searchQuery = searchQueryState[0],
      setSearchQuery = searchQueryState[1];

    var searchExpandedState = React.useState(false);
    var searchExpanded = searchExpandedState[0],
      setSearchExpanded = searchExpandedState[1];

    var showSearchButtonState = React.useState(readSearchVisibility);
    var showSearchButton = showSearchButtonState[0],
      setShowSearchButton = showSearchButtonState[1];

    var viewOptionsOpenState = React.useState(false);
    var viewOptionsOpen = viewOptionsOpenState[0],
      setViewOptionsOpen = viewOptionsOpenState[1];

    var noticeState = React.useState(null);
    var notice = noticeState[0],
      setNotice = noticeState[1];

    var searchInputRef = React.useRef(null);
    var expandSidebarRef = React.useRef(null);
    expandSidebarRef.current = props && props.expandSidebar;
    var viewOptionsButtonRef = React.useRef(null);
    var railPlusButtonRef = React.useRef(null);

    var fetchDirectory = React.useCallback(function (path) {
      if (!path) return;
      setLoadingPaths(function (previous) {
        var next = Object.assign({}, previous);
        next[path] = true;
        return next;
      });
      fetch(quotasApi + "/fs?path=" + encodeURIComponent(path))
        .then(function (response) {
          return response.json();
        })
        .then(function (body) {
          setDirCache(function (previous) {
            var next = Object.assign({}, previous);
            next[path] = body.entries || [];
            return next;
          });
        })
        .catch(function () {
          setDirCache(function (previous) {
            var next = Object.assign({}, previous);
            next[path] = previous[path] || [];
            return next;
          });
        })
        .finally(function () {
          setLoadingPaths(function (previous) {
            var next = Object.assign({}, previous);
            delete next[path];
            return next;
          });
        });
    }, []);

    var reloadLiveProcesses = React.useCallback(function () {
      fetch(quotasApi + "/tmux/sessions")
        .then(function (response) {
          return response.json();
        })
        .then(function (body) {
          setTerminals(body.sessions || []);
        })
        .catch(function () {});
      fetch(quotasApi + "/docker/containers")
        .then(function (response) {
          return response.json();
        })
        .then(function (body) {
          setContainers(body.containers || []);
        })
        .catch(function () {});
    }, []);

    React.useEffect(
      function () {
        AUTO_EXPANDED_PATHS.forEach(fetchDirectory);
        reloadLiveProcesses();
        var timer = setInterval(reloadLiveProcesses, LIVE_POLL_INTERVAL_MS);
        return function () {
          clearInterval(timer);
        };
      },
      [fetchDirectory, reloadLiveProcesses],
    );

    React.useEffect(function () {
      var unsubscribe = null;
      var /** syncTreeLayout implementation. */
        syncTreeLayout = function () {
          setTreeLayout(readTreeLayout());
          var store = preferenceStore();
          if (store && !unsubscribe) unsubscribe = store.subscribe(syncTreeLayout);
        };
      syncTreeLayout();
      var stopListening = listenOnWindow(PREFERENCES_INSTALLED_EVENT, syncTreeLayout);
      return function () {
        stopListening();
        if (unsubscribe) unsubscribe();
      };
    }, []);

    React.useEffect(function () {
      return listenOnWindow(SEARCH_TOGGLE_EVENT, function (event) {
        var enabled =
          event && event.detail && event.detail.enabled !== undefined
            ? event.detail.enabled
            : readSearchVisibility();
        setShowSearchButton(Boolean(enabled));
      });
    }, []);

    React.useEffect(function () {
      return listenOnWindow(SEARCH_TRIGGER_EVENT, function () {
        setSearchExpanded(true);
        if (typeof expandSidebarRef.current === "function") expandSidebarRef.current();
        setTimeout(function () {
          if (!searchInputRef.current) return;
          searchInputRef.current.focus();
          if (typeof searchInputRef.current.select === "function") searchInputRef.current.select();
        }, 80);
      });
    }, []);

    var grouping = __dshGroupSessions({
      sessionList: sessionList,
      workspaceList: workspaceList,
      terminals: terminals,
      containers: containers,
    });

    var dispatch = __dshCreateSessionActionDispatch(props, function (failure) {
      setNotice({ tone: "error", message: failure.message });
    });

    /**
     * Flip one group's open state.
     * @param id - the group id.
     */
    function toggleGroup(id) {
      setOpenGroups(function (previous) {
        var next = Object.assign({}, previous);
        next[id] = !next[id];
        return next;
      });
    }

    /**
     * Refresh the live feeds after a mutation.
     */
    function refresh() {
      reloadLiveProcesses();
    }

    /**
     * Post one non-blocking message above the tree.
     * @param message - the text.
     */
    function informUser(message) {
      setNotice({ tone: "info", message: message });
    }

    /**
     * Report one problem above the tree.
     * @param problem - `{ tone, message }`.
     */
    function reportProblem(problem) {
      setNotice(problem);
    }

    var controller = Object.assign(
      {
        treeLayout: treeLayout,
        grouping: grouping,
        currentSessionId: grouping.currentSessionId,
        defaultDirectory: DEFAULT_DIRECTORY,
        openMenu: openMenu,
        setOpenMenu: setOpenMenu,
        plusMenu: plusMenu,
        setPlusMenu: setPlusMenu,
        expandedPaths: expandedPaths,
        expandedSubagents: expandedSubagents,
        dirCache: dirCache,
        loadingPaths: loadingPaths,
        searchQuery: searchQuery,
        setSearchQuery: setSearchQuery,
        searchExpanded: searchExpanded,
        showSearchButton: showSearchButton,
        searchInputRef: searchInputRef,
        viewOptionsOpen: viewOptionsOpen,
        setViewOptionsOpen: setViewOptionsOpen,
        viewOptionsButtonRef: viewOptionsButtonRef,
        railPlusButtonRef: railPlusButtonRef,

        /**
         * Whether one label survives the current search query.
         * @param text - the label.
         * @returns whether it matches.
         */
        matchesSearch: function (text) {
          if (!searchQuery || !searchQuery.trim()) return true;
          return (text || "").toLowerCase().indexOf(searchQuery.trim().toLowerCase()) !== -1;
        },
        /**
         * Build a right-click handler opening one row's action menu at the cursor.
         * @param menuId - the row's menu id.
         * @returns the handler.
         */
        openMenuAt: function (menuId) {
          return function (event) {
            event.preventDefault();
            event.stopPropagation();
            setOpenMenu({ id: menuId, pos: { x: event.clientX, y: event.clientY } });
          };
        },
        /**
         * Build a right-click handler opening one row's New Item menu at the cursor.
         * @param anchorKey - the row's `+` anchor key.
         * @returns the handler.
         */
        openNewItemMenuAt: function (anchorKey) {
          return function (event) {
            event.preventDefault();
            event.stopPropagation();
            setPlusMenu({ key: anchorKey, pos: { x: event.clientX, y: event.clientY } });
          };
        },
        /**
         * Expand or collapse one directory, fetching it on first expand.
         * @param path - the directory path.
         */
        toggleDirectory: function (path) {
          setExpandedPaths(function (previous) {
            var next = Object.assign({}, previous);
            if (next[path]) delete next[path];
            else {
              next[path] = true;
              if (!dirCache[path]) fetchDirectory(path);
            }
            return next;
          });
        },
        /**
         * Expand or collapse one chat's subagents.
         * @param sessionId - the parent session id.
         */
        toggleSubagentExpand: function (sessionId) {
          setExpandedSubagents(function (previous) {
            var next = Object.assign({}, previous);
            if (next[sessionId]) delete next[sessionId];
            else next[sessionId] = true;
            return next;
          });
        },
        /** Reveal the search field and focus it. */
        openSearch: function () {
          setSearchExpanded(true);
          setTimeout(function () {
            if (searchInputRef.current) searchInputRef.current.focus();
          }, 50);
        },
        /** Clear and hide the search field. */
        closeSearch: function () {
          setSearchQuery("");
          setSearchExpanded(false);
        },
        /**
         * Widen the sidebar from the collapsed rail. The shell owns the fold
         * state and hands the tree `expandSidebar`; without it there is nothing
         * the tree can do on its own, so it says so rather than doing nothing.
         */
        expandSidebar: function () {
          if (typeof expandSidebarRef.current === "function") {
            expandSidebarRef.current();
            return;
          }
          setNotice({
            tone: "error",
            message: "Expand sidebar failed: the sidebar shell did not provide expandSidebar.",
          });
        },
        /** Widen the sidebar and open the search field. */
        expandAndSearch: function () {
          controller.expandSidebar();
          setTimeout(function () {
            setSearchExpanded(true);
            if (searchInputRef.current) searchInputRef.current.focus();
          }, 150);
        },
      },
      __dshCreateTreeActions({
        dispatch: dispatch,
        grouping: grouping,
        quotasApi: quotasApi,
        defaultDirectory: DEFAULT_DIRECTORY,
        refresh: refresh,
        inform: informUser,
        report: reportProblem,
        fetchDirectory: fetchDirectory,
        setRenameTerminal: setRenameTerminal,
      }),
    );

    var newItemMenu = __dshCreateNewItemMenu(runtime, controller);
    var renderChatRow = __dshCreateChatRow(
      runtime,
      { renderTreeRow: renderTreeRow, renderRowActionsMenu: renderRowActionsMenu },
      controller,
    );
    var renderArchivedChatRow = __dshCreateArchivedChatRow(
      runtime,
      { renderTreeRow: renderTreeRow, renderRowActionsMenu: renderRowActionsMenu },
      controller,
    );
    var renderDirectoryEntries = __dshCreateDirectoryEntries(
      runtime,
      {
        renderTreeRow: renderTreeRow,
        renderChatRow: renderChatRow,
        newItemMenu: newItemMenu,
      },
      controller,
    );
    var group = __dshCreateTreeGroup(runtime, { renderTreeRow: renderTreeRow }, controller);

    if (!wide) return __dshCreateCollapsedRail(runtime, { newItemMenu: newItemMenu }, controller)();

    var visiblePinned = grouping.pinned.filter(matchesChat);
    var visibleGlobal = grouping.global.filter(matchesChat);

    /**
     * Whether one chat survives the search query.
     * @param chat - the session row.
     * @returns whether it matches.
     */
    function matchesChat(chat) {
      return controller.matchesSearch((chat.title || "") + " " + (chat.id || ""));
    }

    /**
     * The indent of a chat row sitting directly under a group at one depth.
     * @param depth - the group's depth.
     * @returns the left padding in pixels.
     */
    function rowIndent(depth) {
      return group.indentAt(depth) + 8;
    }

    /**
     * The Terminals group -- live tmux sessions, split out of the old `Active`
     * group by issue #96.
     * @param depth - the group's depth.
     * @returns the group element.
     */
    function renderTerminalsGroup(depth) {
      var rows = grouping.terminals.filter(function (terminal) {
        return controller.matchesSearch(terminal.name);
      });
      return group.render({
        key: "terminals",
        depth: depth,
        icon: h(glyphs.terminals, { size: 14 }),
        label: "Terminals",
        badge: { text: rows.length, tone: "live" },
        open: openGroups.terminals,
        onToggle: function () {
          toggleGroup("terminals");
        },
        actions: newItemMenu.renderButton(null, "terminals-plus"),
        children:
          rows.length > 0
            ? rows.map(function (terminal) {
                var menuId = "terminal::" + terminal.name;
                return renderLiveProcessRow({
                  key: "live-term::" + terminal.name,
                  glyph: glyphs.terminals,
                  label: "Terminal: " + terminal.name,
                  padLeft: rowIndent(depth),
                  onOpen: function () {
                    controller.openTerminal(terminal.name);
                  },
                  onContextMenu: controller.openMenuAt(menuId),
                  actions: renderRowActionsMenu({
                    menuId: menuId,
                    menuTitle: "Terminal Actions (…)",
                    openMenu: openMenu,
                    setOpenMenu: setOpenMenu,
                    items: [
                      {
                        id: "rename",
                        label: "Rename Terminal…",
                        icon: h(glyphs.edit, { size: 13 }),
                      },
                    ],
                    onSelect: function (actionId) {
                      setOpenMenu(null);
                      if (actionId === "rename") controller.renameTerminalSession(terminal.name);
                    },
                  }),
                });
              })
            : renderEmptyGroupLine("no-terminals", rowIndent(depth) + 8, "(no live terminals)"),
      });
    }

    /**
     * The Containers group -- running sandbox containers, split out of the old
     * `Active` group by issue #96.
     * @param depth - the group's depth.
     * @returns the group element.
     */
    function renderContainersGroup(depth) {
      var rows = grouping.containers.filter(function (container) {
        return controller.matchesSearch(container.name || container.image || container.id);
      });
      return group.render({
        key: "containers",
        depth: depth,
        icon: h(glyphs.containers, { size: 14 }),
        label: "Containers",
        badge: { text: rows.length, tone: "live" },
        open: openGroups.containers,
        onToggle: function () {
          toggleGroup("containers");
        },
        actions: newItemMenu.renderButton(null, "containers-plus"),
        children:
          rows.length > 0
            ? rows.map(function (container) {
                return renderLiveProcessRow({
                  key: "live-cont::" + container.id,
                  glyph: glyphs.containers,
                  label:
                    "Container: " +
                    (container.name || container.image || String(container.id).slice(0, 12)),
                  padLeft: rowIndent(depth),
                  onOpen: function () {
                    controller.openContainer(container.id);
                  },
                });
              })
            : renderEmptyGroupLine(
                "no-containers",
                rowIndent(depth) + 8,
                "(no running containers)",
              ),
      });
    }

    /**
     * The Host Machine group and the drive group nested inside it, which is
     * where the filesystem and the chats filed under it live.
     * @param depth - the group's depth.
     * @returns the group element.
     */
    function renderHostGroup(depth) {
      var rootChats = grouping.folderSessions[grouping.normalisePath(ROOT_PATH)] || [];
      return group.render({
        key: "host",
        depth: depth,
        icon: h(glyphs.hostMachine, { size: 15 }),
        label: "Host Machine",
        open: openGroups.host,
        onToggle: function () {
          toggleGroup("host");
        },
        actions: newItemMenu.renderButton(ROOT_PATH, "host-plus"),
        children: group.render({
          key: "drive",
          depth: depth + 1,
          separator: false,
          icon: h(glyphs.hardDrive, { size: 15 }),
          label: "Macintosh HD",
          open: openGroups.drive,
          onToggle: function () {
            toggleGroup("drive");
          },
          actions: newItemMenu.renderButton(ROOT_PATH, "drive-plus"),
          children: [
            rootChats.length > 0
              ? h(
                  "div",
                  {
                    key: "root-chats",
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      marginBottom: "4px",
                      paddingBottom: "4px",
                      borderBottom: "1px dashed var(--dsw-alias-border-l1)",
                    },
                  },
                  rootChats.map(function (chat) {
                    return renderChatRow(chat, group.indentAt(depth + 2));
                  }),
                )
              : null,
            renderDirectoryEntries(ROOT_PATH, depth + 2),
          ],
        }),
      });
    }

    /**
     * The Global group -- top-level chats belonging to no workspace folder.
     * Called `Ungrouped` before issue #97.
     * @param depth - the group's depth.
     * @returns the group element.
     */
    function renderGlobalGroup(depth) {
      return group.render({
        key: "global",
        depth: depth,
        separator: false,
        icon: h(glyphs.blueFolder, { size: 14 }),
        label: "Global",
        badge: { text: visibleGlobal.length, tone: "muted" },
        open: openGroups.global,
        onToggle: function () {
          toggleGroup("global");
        },
        actions: newItemMenu.renderButton(null, "global-plus"),
        children:
          visibleGlobal.length > 0
            ? visibleGlobal.map(function (chat) {
                return renderChatRow(chat, rowIndent(depth));
              })
            : renderEmptyGroupLine("no-global", rowIndent(depth) + 8, "(no global sessions)"),
      });
    }

    /**
     * Every group of the tree, in order, at one base depth.
     * @param depth - 0 for the split-sections layout, 1 under the unified root.
     * @returns the group elements.
     */
    function renderGroups(depth) {
      return [
        visiblePinned.length > 0
          ? group.render({
              key: "pinned",
              depth: depth,
              icon: h(glyphs.pin, { size: 14 }),
              label: "Pinned",
              badge: { text: visiblePinned.length, tone: "accent" },
              open: openGroups.pinned,
              onToggle: function () {
                toggleGroup("pinned");
              },
              actions: newItemMenu.renderButton(null, "pinned-plus"),
              children: visiblePinned.map(function (chat) {
                return renderChatRow(chat, rowIndent(depth));
              }),
            })
          : null,
        renderTerminalsGroup(depth),
        renderContainersGroup(depth),
        renderHostGroup(depth),
        renderGlobalGroup(depth),
        grouping.archived.length > 0
          ? group.render({
              key: "archived",
              depth: depth,
              separator: false,
              icon: h(glyphs.archiveBox, { size: 14 }),
              label: "Archived",
              badge: { text: grouping.archived.length, tone: "accent" },
              open: openGroups.archived,
              onToggle: function () {
                toggleGroup("archived");
              },
              actions: newItemMenu.renderButton(null, "archived-plus"),
              children: grouping.archived.map(function (chat) {
                return renderArchivedChatRow(chat, rowIndent(depth));
              }),
            })
          : null,
      ];
    }

    return h(
      "div",
      {
        className: "dsh-sidebar-tree-container",
        "data-dsh-tree-layout": treeLayout,
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "stretch",
          width: "100%",
          height: "100%",
          overflowY: "auto",
          gap: "2px",
          padding: "0 0 8px 0",
        },
      },
      __dshCreateTreeHeader(runtime, { newItemMenu: newItemMenu }, controller)(),
      renderTreeNotice(notice, function () {
        setNotice(null);
      }),
      group.unified
        ? group.render({
            key: "unified-root",
            depth: 0,
            separator: false,
            icon: h(glyphs.workspace, { size: 15 }),
            label: "Workspaces",
            open: openGroups.root,
            onToggle: function () {
              toggleGroup("root");
            },
            actions: newItemMenu.renderButton(null, "unified-root-plus"),
            children: renderGroups(1),
          })
        : renderGroups(0),
      renameTerminal
        ? h(runtime.RenameTerminalModal, {
            oldName: renameTerminal,
            onClose: function () {
              setRenameTerminal(null);
            },
            onRenamed: refresh,
          })
        : null,
    );
  }

  return SidebarTree;
}
