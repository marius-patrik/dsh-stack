/**
 * Everything a sidebar row or menu can actually do: open a chat, pin, rename,
 * fork, archive, restore, delete, start a terminal or container, adopt a
 * directory as a workspace, open a file or repository tab.
 *
 * Keeping them here rather than inside the component means the tree's render
 * path holds state and composition only, and every mutating action is in one
 * place where the rule that none of them may fail quietly is visible.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/tree-actions
 */

/**
 * Build the tree's action surface.
 * @param seam - `{ dispatch, grouping, quotasApi, defaultDirectory, refresh, inform, report, fetchDirectory, setRenameTerminal }`.
 * @returns the actions, ready to merge into the tree controller.
 */
function __dshCreateTreeActions(seam) {
  return {
    /**
     * Make one chat the current session.
     * @param sessionId - the session id.
     * @param title - the session title, for the focus event.
     */
    openChat: function (sessionId, title) {
      if (!sessionId) return;
      if (typeof window !== "undefined") {
        window.__dsh_current_session_id__ = sessionId;
        if (title) window.__dsh_current_session_title__ = title;
      }
      seam.dispatch.open(sessionId).catch(function () {});
      window.dispatchEvent(
        new CustomEvent("dsh:focus-chat", {
          detail: { id: sessionId, title: title || "Conversation" },
        }),
      );
    },
    /**
     * Pin or unpin one chat.
     * @param sessionId - the session id.
     */
    togglePinned: function (sessionId) {
      seam.grouping.togglePinned(sessionId);
      seam.refresh();
    },
    /**
     * Ask for a new title and rename, reporting when the rename cannot proceed.
     * @param kind - "chat" or "subagent", for the prompt copy.
     * @param session - the session row.
     */
    promptRename: function (kind, session) {
      var title = prompt("Rename " + kind + ":", session.title || "");
      if (!title) return;
      seam.dispatch.rename(session.id, title).then(refresh, function () {});
    },
    /**
     * Fork one chat.
     * @param sessionId - the session id.
     */
    forkChat: function (sessionId) {
      seam.dispatch.fork(sessionId).then(refresh, function () {});
    },
    /**
     * Archive one chat.
     * @param sessionId - the session id.
     */
    archiveChat: function (sessionId) {
      seam.dispatch.archive(sessionId).then(refresh, function () {});
      seam.grouping.markArchived(sessionId);
      seam.refresh();
    },
    /**
     * Restore one archived chat.
     * @param sessionId - the session id.
     */
    unarchiveChat: function (sessionId) {
      seam.grouping.clearArchived(sessionId);
      fetch(seam.quotasApi + "/sessions/unarchive", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: sessionId }),
      }).catch(function () {
        seam.inform("Restored locally, but the host did not confirm the change.");
      });
      seam.refresh();
    },
    /**
     * Delete one archived chat for good, after confirming.
     * @param sessionId - the session id.
     */
    deleteChatPermanently: function (sessionId) {
      if (!confirm("Permanently delete this archived session?")) return;
      seam.grouping.clearArchived(sessionId);
      fetch(seam.quotasApi + "/sessions/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: sessionId }),
      }).catch(function () {
        seam.report({
          tone: "error",
          message: "Delete failed: the host did not accept the request.",
        });
      });
      seam.refresh();
    },
    /**
     * Archive every empty or "pong" chat.
     */
    archiveEmptyChats: function () {
      seam.grouping.sessionIds.forEach(function (id) {
        var session = seam.grouping.sessionsById[id];
        var title = ((session && (session.displayTitle || session.title || session.name)) || "")
          .trim()
          .toLowerCase();
        if (title !== "pong" && title !== "ping") return;
        seam.grouping.markArchived(id);
        seam.dispatch.archive(id).catch(function () {});
      });
      fetch(seam.quotasApi + "/sessions/archive-pong", { method: "POST" })
        .then(function (response) {
          return response.json();
        })
        .then(function (body) {
          seam.inform("Archived " + (body.archivedCount || 0) + " empty / pong sessions.");
          seam.refresh();
        })
        .catch(function () {
          seam.report({
            tone: "error",
            message: "Archive empty chats failed: the host did not accept the request.",
          });
          seam.refresh();
        });
    },
    /**
     * Start a chat in one directory, creating its workspace when needed.
     * @param path - the directory path.
     */
    startChatIn: function (path) {
      var existing = seam.grouping.workspaces.find(function (workspace) {
        return workspace.path === path;
      });
      if (existing) {
        seam.dispatch.startSession(existing.workspaceId).catch(function () {});
        return;
      }
      seam.dispatch.createWorkspace(path).then(
        function (created) {
          seam.dispatch
            .startSession(created ? created.workspaceId : undefined)
            .catch(function () {});
        },
        function () {},
      );
    },
    /**
     * Start a named terminal session in one directory.
     * @param path - the directory path.
     */
    startTerminalIn: function (path) {
      var suggestion = (path || "").split("/").pop() || "term";
      var name = prompt(
        "Terminal session name:",
        suggestion + "-" + Math.floor(Math.random() * 1000),
      );
      if (!name) return;
      fetch(seam.quotasApi + "/tmux/sessions/new", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name, cwd: path }),
      })
        .then(function () {
          seam.refresh();
          window.dispatchEvent(new CustomEvent("dsh:open-terminal", { detail: { session: name } }));
        })
        .catch(function () {
          seam.report({
            tone: "error",
            message: "New terminal failed: the host did not accept the request.",
          });
        });
    },
    /**
     * Open a sandbox container rooted at one directory.
     * @param path - the directory path.
     */
    startContainerIn: function (path) {
      window.dispatchEvent(new CustomEvent("dsh:open-container", { detail: { cwd: path } }));
    },
    /**
     * Create a subdirectory of one directory.
     * @param path - the parent directory path.
     */
    createDirectoryIn: function (path) {
      var name = prompt("New directory name in " + path + ":");
      if (!name || !name.trim()) return;
      fetch(seam.quotasApi + "/fs/mkdir", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: path + "/" + name.trim() }),
      })
        .then(function () {
          seam.fetchDirectory(path);
        })
        .catch(function () {
          seam.report({
            tone: "error",
            message: "New directory failed: the host did not accept the request.",
          });
        });
    },
    /**
     * Adopt one directory as a workspace and start a chat in it.
     * @param path - the suggested directory path.
     */
    openFolderAsWorkspace: function (path) {
      var chosen = prompt("Enter directory path for new Workspace:", path || seam.defaultDirectory);
      if (!chosen || !chosen.trim()) return;
      var target = chosen.trim();
      seam.dispatch.createWorkspace(target).then(
        function (created) {
          seam.dispatch
            .startSession(created ? created.workspaceId : undefined)
            .catch(function () {});
          seam.refresh();
        },
        function () {},
      );
    },
    /**
     * Open one file in a main-area tab.
     * @param entry - the file entry.
     */
    openFileTab: function (entry) {
      window.dispatchEvent(
        new CustomEvent("dsh:open-file-tab", {
          detail: {
            id: "file::" + entry.path,
            type: "file",
            title: entry.name,
            path: entry.path,
          },
        }),
      );
    },
    /**
     * Open one repository in a main-area tab.
     * @param entry - the directory entry.
     */
    openRepoTab: function (entry) {
      window.dispatchEvent(
        new CustomEvent("dsh:open-repo-tab", {
          detail: {
            id: "repo::" + entry.path,
            type: "repo",
            title: entry.name,
            path: entry.path,
          },
        }),
      );
    },
    /**
     * Open one terminal session in the terminal surface.
     * @param name - the tmux session name.
     */
    openTerminal: function (name) {
      window.dispatchEvent(new CustomEvent("dsh:open-terminal", { detail: { session: name } }));
    },
    /**
     * Open whichever terminal session comes first, from the collapsed rail.
     */
    openFirstTerminal: function () {
      window.dispatchEvent(
        new CustomEvent("dsh:open-terminal", {
          detail: { session: seam.grouping.terminals[0] ? seam.grouping.terminals[0].name : "0" },
        }),
      );
    },
    /**
     * Rename one terminal session through the terminal rename modal.
     * @param name - the tmux session name.
     */
    renameTerminalSession: function (name) {
      seam.setRenameTerminal(name);
    },
    /**
     * Open one container in the container surface.
     * @param id - the container id.
     */
    openContainer: function (id) {
      window.dispatchEvent(new CustomEvent("dsh:open-container", { detail: { id: id } }));
    },
  };
}
