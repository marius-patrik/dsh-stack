import type { ClientContext } from "@deepseek-ai/dsh-client-runtime/client";
import type { ComponentType } from "react";
import type {} from "@deepseek-ai/dsh-client-ui-conversation/client";
import type {} from "@deepseek-ai/dsh-client-ui-sidebar/client";
import { createSkinRuntime } from "@dsh-stack/skin-runtime";
import { CodexBrandMark, CodexBrandName } from "@dsh-stack/skin-codex/client";
import { ClaudeBrandMark, ClaudeBrandName } from "@dsh-stack/skin-claude/client";
import { DeepSeekBrandMark, DeepSeekBrandName } from "@dsh-stack/skin-deepseek/client";

export const inject = ["slots"];

const runtime = createSkinRuntime(undefined, () => window.location.reload());

interface SkinComponents {
  readonly mark: ComponentType<{ size?: number }>;
  readonly name: ComponentType;
}

const components: Record<string, SkinComponents> = {
  deepseek: { mark: DeepSeekBrandMark, name: DeepSeekBrandName },
  claude: { mark: ClaudeBrandMark, name: ClaudeBrandName },
  codex: { mark: CodexBrandMark, name: CodexBrandName },
};

export function apply(ctx: ClientContext): void {
  const active = runtime.getActive();
  const selected = components[active] ?? components.deepseek!;

  ctx.slots.inject("sidebar.brand.mark", function* () {
    yield ctx.slots.register(
      { name: "sidebar.brand.mark", inject: () => ({ size: 24 }) },
      selected.mark,
    );
  });

  ctx.slots.inject("sidebar.brand.name", function* () {
    yield ctx.slots.register({ name: "sidebar.brand.name", inject: () => ({}) }, selected.name);
  });

  ctx.slots.inject("conversation.hero.brand.mark", function* () {
    yield ctx.slots.register(
      { name: "conversation.hero.brand.mark", inject: () => ({ size: 24 }) },
      selected.mark,
    );
  });
}
