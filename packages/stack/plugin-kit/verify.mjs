import assert from "node:assert/strict";
import { definePack, definePlugin, validateCatalog } from "./lib/index.js";

const plugin = definePlugin({ id: "test.feature", version: "1.0.0", description: "test" });
const pack = definePack({
  id: "test.pack",
  version: "1.0.0",
  description: "test",
  plugins: [plugin.id],
});
validateCatalog({ plugins: [plugin], packs: [pack] });
assert.equal(plugin.id, "test.feature");
console.log("Plugin kit verification passed.");
