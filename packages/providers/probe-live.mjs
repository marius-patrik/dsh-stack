#!/usr/bin/env node
/** Live wire-truth probe: every provider route against its REAL endpoint with
 * REAL vault credentials — resolve (with refresh) + minimal streamed completion.
 * Usage: node probe-live.mjs [provider-id ...] */
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import * as providers from "./lib/index.js";
import * as dialects from "dsh-dialects";
import { Context } from "@deepseek-ai/cordis";
import { AccountsService } from "/Users/user/Projects/dsh-stack/plugins/dsh-credentials/lib/index.js";

const home = resolve(process.env.DSH_HOME ?? join(homedir(), ".agents"));
const ctx = new Context();
dialects.apply(ctx, {});
// Use the REAL AccountsService (multi-account, importers, fallbacks) —
// anything less is a shim that disagrees with what the live server resolves.
const accounts = new AccountsService(ctx, { home, keyFile: join(home, "accounts.key") });
const llm = {
  configurable: [],
  adapter: undefined,
  /** registerConfigurableProviders implementation. */
  registerConfigurableProviders(entries) {
    this.configurable.push(...entries);
  },
  /** registerAdapter implementation. */
  registerAdapter(_ids, adapter) {
    this.adapter = adapter;
    return { replace: () => {}, dispose: () => {} };
  },
};
ctx.provide("llm", llm);
ctx.provide("settings", {
  register: (_ns, _s, opts) => ({ get: () => opts.base, watch: () => undefined }),
});
providers.apply(ctx, { mode: "all" });
// sanity: accounts service read path
const probe = await accounts.resolve("KIMI_SUB_OAUTH_TOKEN");
console.log("accounts sanity: KIMI_SUB_OAUTH_TOKEN " + (probe ? "PRESENT" : "MISSING"));

const only = process.argv.slice(2);
const ids = providers.PROVIDER_IDS.filter((id) => only.length === 0 || only.includes(id));
// explicit model override: --model=provider:model
const modelArg = process.argv.slice(2).find((a) => a.startsWith("--model="));
const modelOverride = modelArg
  ? (() => {
      const s = modelArg.slice(8);
      const i = s.indexOf(":");
      return [s.slice(0, i), s.slice(i + 1)];
    })()
  : null;
const /** firstModel implementation. */
  firstModel = async (id) => {
    const route = providers.providerRoute(id);
    try {
      const models = await llm.adapter.listModels(id);
      if (models.length > 0) return { model: models[0].id, via: "discovery" };
      if (route?.models?.[0]?.id)
        return { model: route.models[0].id, via: "static (discovery empty — gated?)" };
      return { model: undefined, via: "none" };
    } catch (e) {
      if (route?.models?.[0]?.id)
        return {
          model: route.models[0].id,
          via: "static (discovery: " + String(e?.code ?? e?.message ?? e).slice(0, 60) + ")",
        };
      console.log("  listModels(" + id + ") error: " + String(e?.message ?? e).slice(0, 150));
      return { model: undefined, via: "none" };
    }
  };

const results = [];
for (const id of ids) {
  const fm = await firstModel(id);
  const model = modelOverride && modelOverride[0] === id ? modelOverride[1] : fm.model;
  const started = Date.now();
  const row = { provider: id, model, via: fm.via };
  try {
    if (!model) throw new Error("no models (discovery+static both empty)");
    const gate = await ctx.dshProviders.gate(id);
    if (gate?.reason) row.gate = gate.reason.code;
    let text = "";
    const isLocal = providers.providerRoute(id)?.kind === "local";
    const timeoutMs = isLocal ? 180_000 : 45_000;
    const timeout = new Promise((_, rej) =>
      setTimeout(() => rej(new Error("probe timeout " + timeoutMs / 1000 + "s")), timeoutMs),
    );
    const run = (async () => {
      for await (const chunk of llm.adapter.stream({
        provider: id,
        model,
        messages: [{ role: "user", content: [{ type: "text", text: "Reply with exactly: ok" }] }],
      })) {
        if (chunk?.type === "text" && typeof chunk.text === "string") text += chunk.text;
        else if (typeof chunk?.text === "string") text += chunk.text;
      }
    })();
    await Promise.race([run, timeout]);
    row.status = "OK";
    row.text = text.slice(0, 40);
  } catch (error) {
    row.status = error?.code ?? "ERROR";
    row.error = String(error?.message ?? error).slice(0, 160);
  }
  row.ms = Date.now() - started;
  results.push(row);
  const mark = row.status === "OK" ? "PASS" : "FAIL";
  console.log(
    mark +
      " " +
      id +
      " (" +
      model +
      ", " +
      row.via +
      ") " +
      row.ms +
      "ms" +
      (row.text ? ' — "' + row.text + '"' : "") +
      (row.error ? " — " + row.error : "") +
      (row.gate ? " [gate: " + row.gate + "]" : ""),
  );
}
const ok = results.filter((r) => r.status === "OK").length;
console.log("RESULT " + ok + "/" + results.length + " providers executing");
