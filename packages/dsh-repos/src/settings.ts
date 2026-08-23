/**
 * dsh-repos settings: the `dsh-repos` section owns the repo workflow defaults
 * (default remote and branch). The plugin exposes model-facing repo tools
 * (`repo-status`, `repo-branch`, `repo-commit`, `repo-push`, `repo-pr`) that
 * run `git` through `ctx.subprocess`; GitHub pushes and PRs consume the vault
 * token resolved by dsh-credentials — this plugin never stores credentials.
 * @module dsh-repos/settings
 */

import z from "@deepseek-ai/schemastery";
import { settingsNamespace } from "@deepseek-ai/dsh-settings";

/** Settings namespace owning the repo workflow defaults. */
export const NS = settingsNamespace("dsh-repos");

/** The user-facing section: remote and branch defaults for the repo tools. */
export interface RepoSettings {
  /** Default remote name for push and PR tools (default `origin`). */
  remote: string;
  /** Default base branch for PRs when the target is not stated (default `main`). */
  defaultBaseBranch: string;
}

export const RepoSettings: z<RepoSettings> = z.object({
  remote: z.string().default("origin"),
  defaultBaseBranch: z.string().default("main"),
});

/** The plugin's deployment configuration: optional entry-level defaults. */
export interface RepoConfig {
  /** Default remote name, deployment-level (settings win). */
  remote?: string;
  /** Default base branch, deployment-level (settings win). */
  defaultBaseBranch?: string;
}

export const RepoConfig: z<RepoConfig> = z.object({
  remote: z.string().default("origin"),
  defaultBaseBranch: z.string().default("main"),
});

/** The effective default remote, settings first then deployment entry. */
export function defaultRemote(
  settings: RepoSettings | undefined,
  entry: RepoConfig | undefined,
): string {
  return settings?.remote ?? entry?.remote ?? "origin";
}

/** The effective default base branch, settings first then deployment entry. */
export function defaultBaseBranch(
  settings: RepoSettings | undefined,
  entry: RepoConfig | undefined,
): string {
  return settings?.defaultBaseBranch ?? entry?.defaultBaseBranch ?? "main";
}
