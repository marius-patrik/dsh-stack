import assert from "node:assert";

const plugin = await import("./lib/index.js");
assert.equal(plugin.name, "dsh-voice");
assert.equal(typeof plugin.apply, "function");
assert.ok(Array.isArray(plugin.inject));
assert.equal(plugin.default, undefined);
console.log("loader shape ok:", plugin.name, "inject=", JSON.stringify(plugin.inject));

// Config schema validates
const config = plugin.Config;
assert.ok(config);
console.log("config schema ok");

// TTS provider table
const providers = plugin.TTS_PROVIDERS;
assert.ok(Array.isArray(providers) || typeof providers === "object");
console.log("tts providers ok");

// Auth header construction
const headers = plugin.authHeaders;
assert.equal(typeof headers, "function");
console.log("auth headers ok");

// Route factories
assert.equal(typeof plugin.makeTtsHandler, "function");
assert.equal(typeof plugin.makeSttHandler, "function");
assert.equal(typeof plugin.makeConfigHandler, "function");
console.log("route factories ok");

// Tool registration
assert.equal(typeof plugin.registerVoiceTools, "function");
console.log("tool registration ok");

// Speech functions
assert.equal(typeof plugin.synthesizeSpeech, "function");
assert.equal(typeof plugin.transcribeAudio, "function");
assert.equal(typeof plugin.resolveCredential, "function");
console.log("speech functions ok");

// Client bundle
import { readFileSync } from "node:fs";
const clientPath = new URL("./lib/client.js", import.meta.url);
const clientSrc = readFileSync(clientPath, "utf8");
assert.ok(clientSrc.includes("__ModuleLoader__.load"), "client bundle uses __ModuleLoader__");
assert.ok(clientSrc.includes("dsh-voice"), "client bundle has plugin id");
console.log("voice client ok");

console.log("plugin check passed");
