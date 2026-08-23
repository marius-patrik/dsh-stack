import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import type { ComponentType } from 'react';
import { createSkinRuntime } from '@dsh-stack/skin-runtime';
import { CodexBrandMark, CodexBrandName } from '@dsh-stack/skin-codex/client';
import { ClaudeBrandMark, ClaudeBrandName } from '@dsh-stack/skin-claude/client';
import { DeepSeekBrandMark, DeepSeekBrandName } from '@dsh-stack/skin-deepseek/client';

export const inject = ['slots'];

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

  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', () =>
      ctx.slots.inject('conversation.hero.brand.mark', function* () {
        yield ctx.slots.register({ name: `stack-skin:${active}:sidebar-mark` }, selected.mark);
        yield ctx.slots.register({ name: `stack-skin:${active}:sidebar-name` }, selected.name);
        yield ctx.slots.register({ name: `stack-skin:${active}:hero-mark` }, selected.mark);
      })))
  );
}
