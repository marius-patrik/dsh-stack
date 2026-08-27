/**
 * Derives every group the sidebar tree renders from the raw session,
 * workspace, terminal and container feeds.
 *
 * This is the tree's whole classification rule in one place: which chat is
 * pinned, archived, a subagent of another chat, or attached to a workspace
 * folder -- and what is left over, which is the `Global` group (formerly
 * `Ungrouped`, renamed for issue #97). Terminals and containers are split
 * apart here rather than merged into a single `Active` list, which is what
 * issue #96 asked for; chats are no longer duplicated into a live group at
 * all, because they belong to the workspaces section they are grouped under.
 *
 * No React, no markup: given the feeds, the answer is the same every time,
 * which is what makes the rest of the tree renderable from a description.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/session-grouping
 */

/** localStorage key holding the ids the user pinned. */
var __DSH_PINNED_SESSIONS_KEY = "dsh_pinned_sessions";
/** localStorage key holding the ids the user archived. */
var __DSH_ARCHIVED_SESSIONS_KEY = "dsh_archived_sessions";

/**
 * Read one localStorage-backed id set, tolerating absent or corrupt storage.
 * @param key - storage key.
 * @returns a Set of ids; empty when nothing is stored.
 */
function __dshReadSessionIdSet(key) {
  var set = new Set();
  try {
    var stored = JSON.parse(localStorage.getItem(key) || "[]");
    if (Array.isArray(stored))
      stored.forEach(function (id) {
        set.add(id);
      });
  } catch (error) {
    return set;
  }
  return set;
}

/**
 * Persist one localStorage-backed id set.
 * @param key - storage key.
 * @param set - the ids to store.
 */
function __dshWriteSessionIdSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch (error) {
    // Storage is unavailable; the in-memory set still drives this page.
  }
}

/**
 * Classify one snapshot of the session and workspace feeds into the groups
 * the sidebar tree renders.
 * @param input - `{ sessionList, workspaceList, terminals, containers }`.
 * @returns the derived groups, predicates and pin/archive mutators.
 */
function __dshGroupSessions(input) {
  var sessionList = input.sessionList || {};
  var workspaceList = input.workspaceList || {};
  var workspaces = workspaceList.items || [];
  var sessionsById = sessionList.byId || {};
  var sessionIds =
    sessionList.ids && sessionList.ids.length > 0
      ? sessionList.ids
      : sessionList.order && sessionList.order.length > 0
        ? sessionList.order
        : Object.keys(sessionsById);

  var pinnedIds = __dshReadSessionIdSet(__DSH_PINNED_SESSIONS_KEY);
  var archivedIds = __dshReadSessionIdSet(__DSH_ARCHIVED_SESSIONS_KEY);
  [
    workspaceList.archivedSessionIds,
    workspaceList.global && workspaceList.global.archivedSessionIds,
  ]
    .filter(Boolean)
    .forEach(function (ids) {
      ids.forEach(function (id) {
        archivedIds.add(id);
      });
    });

  /**
   * The id of a session's parent, across the field names the feeds use.
   * @param session - a session row.
   * @returns the parent id, or null at the top level.
   */
  function parentIdOf(session) {
    if (!session) return null;
    return (
      session.parentId || session.parentSessionId || session.parentSession || session.parent || null
    );
  }

  /**
   * True when a session hangs off another listed session, so it renders as a
   * subagent under its parent instead of as a top-level row.
   * @param session - a session row.
   * @returns whether the session is a subagent child.
   */
  function isSubagentChild(session) {
    var parentId = parentIdOf(session);
    return Boolean(parentId && (sessionsById[parentId] || sessionIds.indexOf(parentId) !== -1));
  }

  /**
   * Newest-first children of one session.
   * @param parentId - the parent session id.
   * @returns the subagent rows.
   */
  function subagentsOf(parentId) {
    if (!parentId) return [];
    return sessionIds
      .map(function (id) {
        return sessionsById[id];
      })
      .filter(function (session) {
        return session && parentIdOf(session) === parentId;
      })
      .sort(byRecency);
  }

  /**
   * Sort comparator putting the most recently updated session first.
   * @param left - a session row.
   * @param right - a session row.
   * @returns the comparison result.
   */
  function byRecency(left, right) {
    return (right.updatedAt || 0) - (left.updatedAt || 0);
  }

  /**
   * True when a session is archived, by stored id or by its own flags.
   * @param session - a session row, possibly undefined.
   * @param sessionId - the id, when the row itself is not to hand.
   * @returns whether the session is archived.
   */
  function isArchived(session, sessionId) {
    var id = sessionId || (session && session.id);
    if (id && archivedIds.has(id)) return true;
    return Boolean(
      session && (session.isArchived || session.archived || session.status === "archived"),
    );
  }

  /**
   * True when a session is pinned, by stored id or by its own flags.
   * @param session - a session row, possibly undefined.
   * @param sessionId - the id, when the row itself is not to hand.
   * @returns whether the session is pinned.
   */
  function isPinned(session, sessionId) {
    var id = sessionId || (session && session.id);
    if (id && pinnedIds.has(id)) return true;
    return Boolean(session && (session.isPinned || session.pinned || session.favorite));
  }

  /**
   * True when a session reports itself as currently doing work. Chats no
   * longer get their own live group (#96), so this drives the per-row running
   * indicator instead of a separate list.
   * @param session - a session row.
   * @returns whether the session is running.
   */
  function isRunning(session) {
    if (!session) return false;
    return Boolean(
      session.busy === true ||
        session.running === true ||
        session.status === "busy" ||
        session.status === "running" ||
        session.phase === "running",
    );
  }

  /**
   * Every top-level, unarchived session matching one predicate, newest first.
   * @param accept - predicate over a session row.
   * @returns the matching rows.
   */
  function topLevelSessions(accept) {
    return sessionIds
      .map(function (id) {
        return sessionsById[id];
      })
      .filter(function (session) {
        if (!session || isSubagentChild(session) || isArchived(session, session.id)) return false;
        return accept(session);
      })
      .sort(byRecency);
  }

  /**
   * Strip a trailing slash so workspace paths and directory paths compare.
   * @param path - a filesystem path.
   * @returns the normalised path.
   */
  function normalisePath(path) {
    if (!path) return path;
    return path.length > 1 && path.endsWith("/") ? path.slice(0, -1) : path;
  }

  var folderSessions = {};
  var accountedIds = {};

  /**
   * File one session under a workspace folder, marking it accounted for so it
   * does not also fall into the Global group.
   * @param path - the workspace's filesystem path.
   * @param sessionId - the session id.
   */
  function fileUnderFolder(path, sessionId) {
    var folder = normalisePath(path);
    if (!folder) return;
    if (!folderSessions[folder]) folderSessions[folder] = [];
    var session = sessionsById[sessionId];
    if (!session) return;
    accountedIds[sessionId] = true;
    if (!isSubagentChild(session) && !isArchived(session, sessionId))
      folderSessions[folder].push(session);
  }

  workspaces.forEach(function (workspace) {
    (workspace.sessionIds || []).forEach(function (sessionId) {
      fileUnderFolder(workspace.cwd || workspace.path, sessionId);
    });
  });

  sessionIds.forEach(function (sessionId) {
    var session = sessionsById[sessionId];
    if (!session || accountedIds[sessionId] || !session.workspaceId) return;
    var matched = workspaces.find(function (workspace) {
      return workspace.workspaceId === session.workspaceId;
    });
    if (matched) fileUnderFolder(matched.cwd || matched.path, sessionId);
  });

  return {
    sessionsById: sessionsById,
    sessionIds: sessionIds,
    workspaces: workspaces,
    currentSessionId: sessionList.current,
    folderSessions: folderSessions,
    normalisePath: normalisePath,
    subagentsOf: subagentsOf,
    isPinned: isPinned,
    isArchived: isArchived,
    isRunning: isRunning,
    pinned: topLevelSessions(function (session) {
      return isPinned(session, session.id);
    }),
    /**
     * Sessions belonging to no workspace folder and not pinned: the `Global`
     * group. Named `Ungrouped` before #97.
     */
    global: topLevelSessions(function (session) {
      return !accountedIds[session.id] && !isPinned(session, session.id);
    }),
    archived: sessionIds
      .map(function (id) {
        return sessionsById[id];
      })
      .filter(function (session) {
        return session && !isSubagentChild(session) && isArchived(session, session.id);
      })
      .sort(byRecency),
    terminals: (input.terminals || []).filter(function (terminal) {
      return Boolean(terminal.attached);
    }),
    containers: (input.containers || []).filter(function (container) {
      return Boolean(container.isRunning);
    }),
    /**
     * Flip one session's pinned state and persist it.
     * @param sessionId - the session id.
     */
    togglePinned: function (sessionId) {
      if (pinnedIds.has(sessionId)) pinnedIds.delete(sessionId);
      else pinnedIds.add(sessionId);
      __dshWriteSessionIdSet(__DSH_PINNED_SESSIONS_KEY, pinnedIds);
    },
    /**
     * Mark one session archived locally and persist it.
     * @param sessionId - the session id.
     */
    markArchived: function (sessionId) {
      archivedIds.add(sessionId);
      __dshWriteSessionIdSet(__DSH_ARCHIVED_SESSIONS_KEY, archivedIds);
    },
    /**
     * Clear one session's local archived mark and persist it.
     * @param sessionId - the session id.
     */
    clearArchived: function (sessionId) {
      archivedIds.delete(sessionId);
      __dshWriteSessionIdSet(__DSH_ARCHIVED_SESSIONS_KEY, archivedIds);
    },
  };
}
