import assert from "node:assert/strict";
import * as plugin from "./lib/index.js";
import { assertLoaderShape } from "../../scripts/plugin-check-kit.mjs";

assertLoaderShape(plugin, "hosts");

console.log("loader shape ok: hosts inject=", JSON.stringify(plugin.inject));
console.log("plugin check passed");
