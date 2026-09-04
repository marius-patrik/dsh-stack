/**
 * `agent-tools`: config-file custom tools for the dsh harness. The plugin reads
 * the `agent-tools` settings section (a map of tool name → definition) and
 * registers each definition as a model-facing `ctx.tools` entry that runs its
 * `command` through `ctx.subprocess` — never shell-interpreted — with `{name}`
 * argument placeholders substituted from the call. The `dsh tool` CLI
 * (bin/tool.mjs) manages the section; changes apply on the next boot.
 *
 * The `tools` seam this registers into is the harness' own tool registry, so a
 * custom tool is indistinguishable from a shipped one to the model: same schema
 * validation, same output contract, same post-execute pipeline.
 * @module agent-tools
 */

import type { Context } from "@deepseek-ai/cordis";
import z from "@deepseek-ai/schemastery";
import type {} from "@deepseek-ai/dsh-subprocess";
import type {} from "@deepseek-ai/dsh-settings";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { installSettingsSection } from "@deepseek-ai/dsh-settings";
import type { ParameterSchemaSpec, ValueSchemaSpec } from "@deepseek-ai/dsh-tools";
import {
  NS,
  ToolSettings,
  ToolsConfig,
  toolsFor,
  commandArgv,
  type ToolSettings as ToolSettingsType,
  type ToolsConfig as ToolsConfigType,
  type ToolConfig as ToolConfigType,
  type ToolParameter as ToolParameterType,
} from "./settings.js";

export type * from "./settings.js";

export const name = "agent-tools";
export const inject = ["subprocess", "tools"];

export const Config: z<ToolsConfig> = ToolsConfig;

/** The cwd a custom tool runs in: the caller's cwd (paths resolve via the filesystem seam). */
function runCwd(): string {
  return process.cwd();
}

/** Map a config-file parameter spec onto the tool-schema `ValueSchemaSpec` shape. */
function parameterSchema(param: ToolParameterType): ValueSchemaSpec {
  return {
    type: param.type,
    ...(param.description !== undefined ? { description: param.description } : {}),
  };
}

/** The schema a config-file tool's validated arguments are checked against. */
function parametersSchema(tool: ToolConfigType): ParameterSchemaSpec {
  const properties: Record<string, ValueSchemaSpec & { required?: true }> = {};
  for (const [name, param] of Object.entries(tool.parameters ?? {})) {
    properties[name] = {
      ...parameterSchema(param),
      ...(param.required === true ? { required: true as const } : {}),
    };
  }
  return properties;
}

/**
 * Run one custom tool command and resolve with the canonical outcome: stdout,
 * stderr, and the exit code. A nonzero exit is a result, not a throw — the
 * model sees the failure text and can react to it.
 */
async function runToolCommand(ctx: Context, argv: string[], signal?: AbortSignal) {
  const spawn = await ctx.subprocess.spawn({
    argv,
    cwd: runCwd(),
    stdio: {
      stdin: { data: "" },
      stdout: { maxBytes: 1_000_000 },
      stderr: { maxBytes: 1_000_000 },
    },
    graceMs: 30_000,
    signal,
  });
  const outcome = await spawn.done;
  return {
    stdout: spawn.collected.stdout?.readFrom(0).text ?? "",
    stderr: spawn.collected.stderr?.readFrom(0).text ?? "",
    exitCode: outcome.exitCode ?? -1,
  };
}

/**
 * Register every configured custom tool as a `ctx.tools` entry. Re-running
 * apply (e.g. a settings reload) registers the current map.
 * @param ctx - the plugin context carrying `subprocess` and `tools`.
 * @param config - the plugin's deployment configuration.
 */
export function apply(ctx: Context, config: ToolsConfigType): void {
  installSettingsSection(
    ctx,
    NS,
    ToolSettings,
    // jscpd:ignore-start -- small settings-wiring block mirrored in formatters/src/index.ts for a different domain
    { tools: {} },
    {
      setSource: () => {},
      onChange: () => {},
    },
  );

  ctx.inject(["settings"], (sctx) => {
    /**
     * Provides tool settings as an object of type `ToolSettingsType` or `undefined`.
     *
     * Guarantees the returned settings object contains the tool's description and parameters.
     * Returns `undefined` if settings are not found for the given namespace.
     */
    const settings = () => sctx.settings.get(NS) as ToolSettingsType | undefined;
    // jscpd:ignore-end

    for (const [name, tool] of Object.entries(toolsFor(settings(), config))) {
      ctx.tools.register(
        defineTool({
          name,
          description: tool.description,
          parameters: parametersSchema(tool),
          output: {
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                stdout: { type: "string", required: true },
                stderr: { type: "string", required: true },
                exitCode: { type: "integer", required: true },
              },
            },
            render: (_args, value) => [
              {
                type: "text",
                text:
                  value.exitCode === 0
                    ? value.stdout.length > 0
                      ? value.stdout
                      : `exit ${value.exitCode}`
                    : `exit ${value.exitCode}\n${value.stderr.length > 0 ? value.stderr : value.stdout}`,
              },
            ],
          },
          /** execute implementation. */
          async execute(args, exec) {
            const argv = commandArgv(tool, args as Record<string, unknown>);
            return await runToolCommand(ctx, argv, exec.signal);
          },
        }),
      );
    }
  });
}
