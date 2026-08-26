/**
 * `formatters`: owns file formatting on the web profile. The harness web
 * UI is read-only, so this plugin works through the seams the agent uses to
 * write: a model-facing `format` tool over per-extension formatter commands
 * (`prettier`, `black`, `gofmt`, ...) and, when enabled, automatic reformatting
 * after every successful `edit`/`write` via the `tools/post-execute` waterfall.
 * Formatters run through `ctx.subprocess` — never shell-interpreted. The
 * `dsh formatter` CLI (bin/formatter.mjs) manages the `formatters` settings
 * section; changes apply on the next boot.
 * @module formatters
 */

import type { Context } from "@deepseek-ai/cordis";
import z from "@deepseek-ai/schemastery";
import type {} from "@deepseek-ai/dsh-fs";
import type {} from "@deepseek-ai/dsh-subprocess";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { installSettingsSection } from "@deepseek-ai/dsh-settings";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import {
  NS,
  FormatterConfig,
  FormatterSettings,
  formatterFor,
  autoFormatEnabled,
  type FormatterSettings as FormatterSettingsType,
  type FormatterConfig as FormatterConfigType,
} from "./settings.js";
import { formatFile, resolveTarget, targetPathFromArguments } from "./format.js";

export type * from "./settings.js";
export type * from "./format.js";

export const name = "formatters";
export const inject = ["fs", "subprocess", "tools"];

export const Config: z<FormatterConfig> = FormatterConfig;

/**
 * Pick the formatter command for a path's extension, if one is configured.
 */
function commandFor(
  settings: FormatterSettingsType | undefined,
  entry: FormatterConfigType | undefined,
  path: string,
) {
  const ext = path.toLowerCase().slice(path.lastIndexOf(".")).trimEnd();
  if (!ext.startsWith(".")) return undefined;
  return formatterFor(settings, entry, ext);
}

/**
 * Register the `format` tool and the auto-format-on-edit hook.
 * @param ctx - the plugin context carrying `fs`, `subprocess`, and `tools`.
 * @param config - the plugin's deployment configuration.
 */
export function apply(ctx: Context, config: FormatterConfigType): void {
  installSettingsSection(
    ctx,
    NS,
    FormatterSettings,
// jscpd:ignore-start -- small settings-wiring block mirrored in repos/src/index.ts and tools/src/index.ts for different domains
    { formatters: {}, autoFormatOnEdit: true },
    {
      setSource: () => {
        /* live reads below go through the settings scope */
      },
      onChange: () => {},
    },
  );

  ctx.inject(["settings"], (sctx) => {
    const /** settings implementation. */
      settings = () => sctx.settings.get(NS) as FormatterSettingsType | undefined;
// jscpd:ignore-end

    ctx.tools.register(
      defineTool({
        name: "format",
        description:
          "Format a file with its configured formatter (prettier, black, gofmt, ...). Returns the before and after content when the formatter changed the file.",
        parameters: {
          path: {
            type: "string",
            required: true,
            description: "Path of the file to format, resolved by the filesystem backend.",
          },
        },
        output: {
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              path: { type: "string", required: true },
              before: { type: "string", required: true },
              after: { type: "string", required: true },
            },
          },
          render: (args, value) => [
            {
              type: "text",
              text:
                value.before === value.after
                  ? `The file ${value.path} is already formatted.`
                  : `The file ${value.path} has been formatted.`,
            },
          ],
        },
        /** execute implementation. */
        async execute(args, exec) {
          const command = commandFor(settings(), config, args.path);
          if (!command)
            throw new Error(
              `no formatter configured for "${args.path}" — add one via \`dsh formatter add <ext> <command>\``,
            );
          const target = await resolveTarget(ctx, args.path, exec.signal);
          if (!target) throw new Error(`cannot resolve ${args.path}`);
          return await formatFile(ctx, target, command, exec.signal);
        },
      }),
    );

    ctx.on("tools/post-execute", async (exec, _result, next) => {
      if (!autoFormatEnabled(settings(), config)) return next();
      if (exec.name !== "edit" && exec.name !== "write") return next();
      const rawPath = targetPathFromArguments(exec.arguments);
      if (!rawPath) return next();
      const command = commandFor(settings(), config, rawPath);
      if (!command) return next();
      try {
        const target = await resolveTarget(ctx, rawPath, exec.signal);
        if (!target) return next();
        const outcome = await formatFile(ctx, target, command, exec.signal);
        if (outcome.before === outcome.after) return next();
        const downstream = await next();
        const note =
          `[auto-format] ${outcome.path} was reformatted after ${exec.name}:\n` +
          `before:\n${outcome.before}\nafter:\n${outcome.after}`;
        const noteMessage = createUserMessage({
          content: [{ type: "text", text: note }],
          source: { kind: "plugin", plugin: "formatters" },
        });
        return {
          ...downstream,
          additionalContexts: [noteMessage, ...(downstream.additionalContexts ?? [])],
        };
      } catch (error: unknown) {
        ctx.logger.warn(
          `formatters: auto-format failed for ${rawPath}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return next();
      }
    });
  });
}
