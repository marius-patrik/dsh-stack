import assert from "node:assert/strict";
import * as plugin from "./lib/index.js";
import { assertLoaderShape } from "../../scripts/plugin-check-kit.mjs";

assertLoaderShape(plugin, "agent-loops");

console.log("loader shape ok: agent-loops inject=", JSON.stringify(plugin.inject));
console.log("plugin check passed");
