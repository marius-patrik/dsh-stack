import { relative } from "node:path";
import { root, listPluginPackageDirs, listBundlePackageDirs } from "./scripts/lib/repo-paths.mjs";

const plugin = {
  entry: ["src/index.{ts,tsx,mjs,js}", "src/client.{ts,tsx}", "client.js", "*.mjs", "bin/*.mjs"],
  project: ["src/**/*.{ts,tsx}", "*.mjs", "bin/*.mjs"],
};
const bundle = {
  entry: ["src/index.{ts,tsx,mjs,js}", "*.mjs"],
  project: ["src/**/*.{ts,tsx}", "*.mjs"],
  ignoreDependencies: ["@dsh-stack/.+"],
};
const workspaces = {
  ".": {
    entry: ["scripts/*.mjs", "scripts/**/*.test.mjs", "scripts/client-runtime/*.js"],
    project: ["scripts/**/*.{mjs,js}"],
  },
};
for (const dir of await listPluginPackageDirs()) {
  workspaces[relative(root, dir).replaceAll("\\", "/")] = { ...plugin };
}
for (const dir of await listBundlePackageDirs()) {
  workspaces[relative(root, dir).replaceAll("\\", "/")] = { ...bundle };
}
workspaces["plugins/stack/ai/providers/providers"].ignoreDependencies = ["@dsh-stack/sidebar-preferences"];
workspaces["plugins/stack/ux/themes/skin-claude"].ignoreDependencies = ["@types/react"];
workspaces["plugins/stack/ux/themes/skin-codex"].ignoreDependencies = ["@types/react"];

export default {
  ignoreBinaries: ["script", "dns-sd", "sips", "tailscale"],
  rules: { duplicates: "warn" },
  workspaces,
  ignoreDependencies: ["@deepseek-ai/dsh-client-ui-slots"],
};
