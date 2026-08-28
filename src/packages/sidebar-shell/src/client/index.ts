import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { SidebarRootInjected } from "@deepseek-ai/dsh-client-ui-sidebar/client";
import type {} from "@deepseek-ai/dsh-client-ui-layout/client";
import { SidebarRoot } from "./SidebarRoot.js";

export const inject = ["slots", "layout", "workspaces", "locale"];

/** Register the stack sidebar shell into the layout sidebar slot. */
export function apply(ctx: ClientContext): void {
  /**
   * Registers the stack sidebar shell into the layout sidebar slot.
   *
   * Guarantees that the sidebar is registered with the specified slots and injects
   * the `injectProps` function to provide session management and sidebar toggling.
   *
   * @param ctx - The client context providing workspace and layout operations.
   */
  const injectProps = (): SidebarRootInjected => ({
    startSession: (workspaceId) => ctx.workspaces.startSession(workspaceId),
    toggleSidebar: () => ctx.layout.toggleSidebar(),
  });

  ctx.effect(
    () =>
      ctx.slots.register(
        {
          name: "sidebar",
          locale: "sidebar",
          children: {
            "sidebar.brand.mark": { kind: "single", scope: "root" },
            "sidebar.brand.name": { kind: "single", scope: "root" },
            "sidebar.workspaces": { kind: "single", scope: "root" },
            "sidebar.settings": { kind: "single", scope: "root" },
            "sidebar.footer.action": { kind: "list", scope: "root" },
          },
          inject: injectProps,
        },
        SidebarRoot,
      ),
    "stack-sidebar: slot registration",
  );
}
