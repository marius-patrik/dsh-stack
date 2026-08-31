import assert from "node:assert/strict";
import { defaultSidebarPreferences } from "./lib/index.js";

assert.deepEqual(defaultSidebarPreferences, {
  showBrandLogo: true,
  showNewConversation: true,
  showFiles: true,
});
console.log("Sidebar preference verification passed.");
