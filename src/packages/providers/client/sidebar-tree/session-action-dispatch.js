/**
 * Runs a sidebar row's context-menu action and refuses to let it fail
 * quietly.
 *
 * Issue #98 was not that the pin / rename / fork / archive handlers were
 * unbound -- they were wired correctly. It was that every one of them
 * degraded to a no-op: an absent cordis service or an absent session binding
 * (`ctx.sessions.binding(id)` is documented to return `undefined` "for a
 * session neither listed nor already scoped") resolved as though the action
 * had succeeded, so the menu closed and nothing happened. It appeared to work
 * on whichever session happened to be scoped and did nothing on the rest.
 *
 * Every action the tree offers therefore goes through this dispatcher, which
 * has exactly one rule: an action that cannot proceed reports a failure the
 * user can see. There is no path through it that returns success for work
 * that did not happen.
 *
 * @module @dsh-stack/providers/client/sidebar-tree/session-action-dispatch
 */

/**
 * Build the dispatcher over one set of injected session actions.
 * @param actions - the slot-injected `{ renameSession, forkSession, archiveSession, createWorkspace, startSession }`.
 * @param report - invoked with `{ action, sessionId, message }` when an action cannot proceed.
 * @returns the dispatcher.
 */
function __dshCreateSessionActionDispatch(actions, report) {
  var available = actions || {};

  /**
   * Surface one failure through the reporter and the console, and answer with
   * a rejected promise so no caller mistakes it for success.
   * @param action - the action name shown to the user.
   * @param subject - what the action was aimed at.
   * @param message - why it could not proceed.
   * @returns a rejected promise carrying the same message.
   */
  function fail(action, subject, message) {
    var text = action + " failed: " + message;
    if (typeof console !== "undefined" && console.error)
      console.error("dsh sidebar: " + text, subject);
    if (typeof report === "function") report({ action: action, subject: subject, message: text });
    return Promise.reject(new Error(text));
  }

  /**
   * Invoke one injected action, converting both "the action is not wired" and
   * "the action rejected" into a reported failure.
   * @param action - the action name shown to the user.
   * @param subject - what the action was aimed at.
   * @param name - the key on the injected action set.
   * @param call - invokes the resolved action.
   * @returns the action's own promise, or a rejected one.
   */
  function run(action, subject, name, call) {
    var implementation = available[name];
    if (typeof implementation !== "function")
      return fail(
        action,
        subject,
        "the host did not provide " +
          name +
          ". The sidebar is running without the sessions or workspaces service it needs.",
      );
    var result;
    try {
      result = call(implementation);
    } catch (error) {
      return fail(action, subject, error && error.message ? error.message : String(error));
    }
    if (!result || typeof result.then !== "function") return Promise.resolve(result);
    return result.catch(function (error) {
      return fail(action, subject, error && error.message ? error.message : String(error));
    });
  }

  return {
    /**
     * Open one session in the main area.
     * @param sessionId - the session id.
     * @returns completion of the open.
     */
    open: function (sessionId) {
      return run("Open chat", sessionId, "open", function (call) {
        return call(sessionId);
      });
    },
    /**
     * Rename one session.
     * @param sessionId - the session id.
     * @param title - the new title.
     * @returns completion of the rename.
     */
    rename: function (sessionId, title) {
      return run("Rename", sessionId, "renameSession", function (call) {
        return call(sessionId, title);
      });
    },
    /**
     * Fork one session and open the child.
     * @param sessionId - the source session id.
     * @returns completion of the fork.
     */
    fork: function (sessionId) {
      return run("Fork", sessionId, "forkSession", function (call) {
        return call(sessionId);
      });
    },
    /**
     * Archive one session through the workspaces service.
     * @param sessionId - the session id.
     * @returns completion of the archive.
     */
    archive: function (sessionId) {
      return run("Archive", sessionId, "archiveSession", function (call) {
        return call(sessionId);
      });
    },
    /**
     * Create a workspace for one directory.
     * @param path - the directory path.
     * @returns the created workspace.
     */
    createWorkspace: function (path) {
      return run("Open workspace", path, "createWorkspace", function (call) {
        return call({ path: path });
      });
    },
    /**
     * Start a new chat, optionally inside an existing workspace.
     * @param workspaceId - the workspace to start in, or undefined.
     * @returns completion of the start.
     */
    startSession: function (workspaceId) {
      return run("New conversation", workspaceId, "startSession", function (call) {
        return call(workspaceId);
      });
    },
  };
}
