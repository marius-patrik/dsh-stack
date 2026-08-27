// jscpd:ignore-start -- per-package check-plugin.mjs scaffolding, duplicated by design across sibling packages
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import { Context } from "@deepseek-ai/cordis";
import assert from "node:assert";
import { assertLoaderShape } from "../../scripts/plugin-check-kit.mjs";

const root = mkdtempSync(join(tmpdir(), "themes-"));

const plugin = await import("./lib/index.js");
const theme = await import("./lib/theme.js");
const store = await import("./lib/store.js");
const catalog = await import("./lib/catalog.js");
const { NS } = await import("./lib/settings.js");

assertLoaderShape(plugin, "themes");
assert.equal(plugin.THEMES_ROUTE, "/themes.json");
assert.equal(plugin.ALIAS_TOKENS.length, 13);
console.log("loader shape ok:", plugin.name, "inject=", JSON.stringify(plugin.inject));

// theme: VS Code JSON → definition (mapping + scheme + fallbacks).
const vsSource = theme.parseVsCodeTheme(
  JSON.stringify({
    name: "Monokai Pro",
    type: "dark",
    colors: {
      "editor.background": "#2d2a2e",
      "editor.foreground": "#fcfcfa",
      "sideBar.background": "#221f22",
    },
  }),
);
assert.equal(vsSource.type, "dark");
assert.equal(vsSource.colors["editor.background"], "#2d2a2e");
const vsDef = theme.mapTheme(vsSource);
assert.equal(vsDef.id, "monokai-pro");
assert.equal(vsDef.colorScheme, "dark");
assert.equal(vsDef.tokens["--dsw-alias-bg-base"], "#2d2a2e");
assert.equal(vsDef.tokens["--dsw-specific-sidebar-fill"], "#221f22");
assert.equal(vsDef.tokens["--dsw-alias-label-primary"], "#fcfcfa");
assert.equal(
  vsDef.tokens["--dsw-alias-state-success-primary"],
  theme.TOKEN_FALLBACKS["--dsw-alias-state-success-primary"].dark,
);
assert.equal(Object.keys(vsDef.tokens).length, 13);
console.log("vs-code map ok:", vsDef.id);

// theme: light scheme + rgb-normalization.
const lightDef = theme.mapTheme(
  theme.parseVsCodeTheme(
    JSON.stringify({
      name: "Paper",
      type: "light",
      colors: { "editor.background": "#fff" },
    }),
  ),
);
assert.equal(lightDef.colorScheme, "light");
assert.equal(lightDef.tokens["--dsw-alias-bg-base"], "#ffffff");
assert.equal(theme.normalizeColor("#ABC"), "#aabbcc");
console.log("light + normalize ok");

// theme: tmTheme XML parsing (background → editor.background, scheme infer).
const tmDef = theme.mapTheme(
  theme.parseTmThemeXml(`
  <dict>
    <key>name</key><string>Midnight</string>
    <key>settings</key><dict>
      <key>background</key><string>#0b1021</string>
      <key>foreground</key><string>#d8dee9</string>
    </dict>
  </dict>
`),
);
assert.equal(tmDef.id, "midnight");
assert.equal(tmDef.colorScheme, "dark");
assert.equal(tmDef.tokens["--dsw-alias-bg-base"], "#0b1021");
assert.equal(tmDef.tokens["--dsw-alias-label-primary"], "#d8dee9");
console.log("tmtheme parse ok:", tmDef.id);

// store: save / list / read / remove round-trip under a temp home.
const home = join(root, "home");
const handle = store.storeHandle(home, "themes");
assert.equal(handle.dir, join(home, "themes"));
assert.equal((await store.listThemes(handle)).length, 0);
await store.saveTheme(handle, { ...vsDef, name: "Monokai Pro" });
const listed = await store.listThemes(handle);
assert.equal(listed.length, 1);
assert.equal(listed[0].id, "monokai-pro");
assert.equal((await store.readTheme(handle, "monokai-pro.json")).name, "Monokai Pro");
assert.ok(await store.removeTheme(handle, "monokai-pro"));
assert.equal((await store.listThemes(handle)).length, 0);
console.log("store round-trip ok");

// store: corrupt file is skipped with a warning.
writeFileSync(handle.file("broken.json"), "{not json");
const warned = [];
const afterCorrupt = await store.listThemes(handle, (m) => warned.push(m));
assert.equal(afterCorrupt.length, 0);
assert.ok(warned.length === 1);
console.log("store corrupt-skip ok");

// catalog: extract themes from a real vsix (zip) via system unzip.
const extRoot = join(root, "ext");
mkdirSync(join(extRoot, "extension", "themes"), { recursive: true });
writeFileSync(
  join(extRoot, "extension", "themes", "aurora.json"),
  JSON.stringify({
    name: "Aurora",
    type: "dark",
    colors: { "editor.background": "#000000" },
  }),
);
const vsixPath = join(root, "aurora.vsix");
execFileSync("zip", ["-q", "-r", vsixPath, "extension"], { cwd: extRoot });
const extracted = await catalog.extractThemesFromVsix(vsixPath);
assert.equal(extracted.length, 1);
assert.equal(extracted[0].name, "Aurora");
assert.equal(extracted[0].type, "dark");
console.log("catalog vsix extraction ok");

// catalog: search against a local catalog server.
const catalogServer = createServer((req, res) => {
  if (req.url.includes("/api/-/search")) {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        extensions: [
          {
            namespace: "octref",
            name: "theme-monokai-pro",
            displayName: "Monokai Pro",
            description: "A theme",
            version: "1.0.0",
            downloadCount: 123,
            files: { download: "http://127.0.0.1:1/monokai.vsix" },
          },
        ],
      }),
    );
  } else {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => catalogServer.listen(0, "127.0.0.1", resolve));
const catalogUrl = `http://127.0.0.1:${catalogServer.address().port}`;
const hits = await catalog.searchCatalog(catalogUrl, "monokai");
assert.equal(hits.length, 1);
assert.equal(hits[0].namespace, "octref");
assert.equal(hits[0].download, "http://127.0.0.1:1/monokai.vsix");
await new Promise((resolve) => catalogServer.close(resolve));
console.log("catalog search ok");

// plugin: apply over stub settings + webServer; /themes.json route registered
// and answers with the store contents.
const ctx = new Context();
const registered = [];
const sections = new Map([[NS, { active: "" }]]);
ctx.provide("settings", {
  get: (ns) => sections.get(ns),
  /** register implementation. */
  register(_ns, _schema, opts) {
    sections.set(_ns, opts.base);
    return {
      get: (ns) => sections.get(ns),
      watch: () => undefined,
    };
  },
});
ctx.provide("webServer", {
  /** register implementation. */
  register(route) {
    registered.push(route);
    return () => undefined;
  },
});
const themesHome = join(root, "route-home");
const storeFor = store.storeHandle(themesHome, "themes");
await store.saveTheme(storeFor, { ...vsDef, name: "Monokai Pro" });
process.env.DSH_HOME = themesHome;
plugin.apply(ctx, {});
await new Promise((resolve) => setTimeout(resolve, 200));
const themesRoute = registered.find((r) => r.path === "/themes.json");
assert.ok(themesRoute, "expected /themes.json route to be registered");
assert.equal(themesRoute.kind, "exact");
sections.set(NS, { active: "monokai-pro" });
const res = {
  _status: 0,
  _body: "",
  /** writeHead implementation. */
  writeHead(s) {
    this._status = s;
  },
  /** end implementation. */
  end(b) {
    this._body = b;
  },
};
await themesRoute.handler({ url: "/themes.json" }, res);
assert.equal(res._status, 200);
assert.ok(res._body.includes('"monokai-pro"'));
assert.ok(res._body.includes('"active":"monokai-pro"'));
assert.ok(res._body.includes('"root":"themes"'));
delete process.env.DSH_HOME;
console.log("plugin route wiring ok");

// client bundle: hand-authored bundle registers the loader id and exports
// apply + inject(['slots','theme']).
const bundleText = readFileSync(new URL("./lib/client.js", import.meta.url), "utf8");
assert.ok(bundleText.includes("__ModuleLoader__.load"));
assert.ok(bundleText.includes('id: "themes"'));
assert.ok(bundleText.includes("exports.apply = apply"));
assert.ok(bundleText.includes('exports.inject = ["slots", "theme"]'));
const loader = {};
globalThis.window = {
  __ModuleLoader__: {
    load: (spec) => {
      loader.spec = spec;
    },
  },
};
await import(new URL("./lib/client.js", import.meta.url));
assert.equal(loader.spec.id, "@dsh-stack/themes");
const clientExports = loader.spec.factory((spec) => {
  if (spec === "react") return {};
  throw new Error("unexpected require: " + spec);
}, {});
assert.deepEqual(clientExports.inject, ["slots", "theme"]);
const clientRegistrants = new Map();
globalThis.fetch = async () => ({ ok: true, json: async () => ({ active: "", themes: [] }) });
const clientCtx = {
  /** effect implementation. */
  effect(fn) {
    fn();
  },
  /** on implementation. */
  on() {
    return () => undefined;
  },
  theme: {
    getTheme: () => ({ active: { id: "light" }, themes: [] }),
    /** setTheme implementation. */
    setTheme() {},
    /** register implementation. */
    register() {
      return () => undefined;
    },
  },
  slots: {
    /** inject implementation. */
    inject(name, fn) {
      clientRegistrants.set(name, fn);
    },
    /** register implementation. */
    register(spec) {
      return spec;
    },
  },
};
clientExports.apply(clientCtx);
const themesSection = clientRegistrants.get("settings.section")();
assert.equal(themesSection.name, "settings.section");
assert.equal(themesSection.id, "themes");
assert.equal(themesSection.order, 30);
assert.equal(themesSection.label(), "Themes");
assert.ok(themesSection.inject().applyTheme, "themes section applyTheme callback missing");
const themesGlyph = clientRegistrants.get("settings.section.icon")();
assert.equal(themesGlyph.name, "settings.section.icon");
assert.equal(themesGlyph.id, "themes");
console.log("client bundle shape ok");

rmSync(root, { recursive: true, force: true });
console.log("plugin check passed");

// jscpd:ignore-end
