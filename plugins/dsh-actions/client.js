window.__ModuleLoader__.load({
	id: "dsh-actions",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		//#region lib/client.js
		/**
		 * dsh-actions client half (hand-authored bundle, no build step):
		 * contributes the Actions page to the Settings section. The node
		 * half owns the per-session controller (`/mode` command,
		 * agent/pre-step + tools/pre-execute + agent/request hooks); this bundle
		 * only surfaces the mode roster — the mode vocabulary, the configured
		 * default, and any per-mode route / tool policies — served at
		 * `/actions`.
		 *
		 * Re-running the bundle (HMR / entry refresh) is idempotent through the
		 * slot ledger.
		 */
		var MODES_ROUTE = "/actions";
		function SessionModesGlyph() {
			var React = require("react");
			var P = require("@deepseek-ai/dsh-client-ui-primitives");
			return React.createElement(P.IconListPenOutline16, { size: 16, className: "dsh-actions-navGlyph" });
		}
		function SessionModesSection(props) {
			var React = require("react");
			var h = React.createElement;
			var useState = React.useState, useEffect = React.useEffect;
			var state = useState(null);
			var payload = state[0], setPayload = state[1];
			useEffect(function () {
				var cancelled = false;
				fetch(MODES_ROUTE).then(function (response) {
					return response.json();
				}).then(function (body) {
					if (!cancelled) setPayload(body);
				}).catch(function (error) {
					console.error("[dsh-actions]", error);
				});
				return function () { cancelled = true; };
			}, []);
			if (payload === null) {
				return h("div", { style: { color: "var(--dsw-alias-label-secondary)" } }, "Loading session modes…");
			}
			var modes = payload.modes || [];
			var defaultMode = payload.defaultMode;
			var routes = payload.routes || {};
			var tools = payload.tools || {};
			return h("div", { style: { display: "grid", gap: "20px", maxWidth: "760px" } },
				h("div", null,
					h("h2", { style: { margin: "0 0 6px" } }, "Actions"),
					h("p", { style: { margin: 0, color: "var(--dsw-alias-label-secondary)" } }, "Each session runs under one mode; the active mode is set per session via the /mode command. Below is the vocabulary and the policies configured for this agent.")),
				h("div", { style: { display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" } },
					modes.map(function (mode) {
						var isDefault = mode === defaultMode;
						return h("div", { key: mode, style: { display: "flex", alignItems: "center", gap: "10px", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: "10px", padding: "12px 14px" } },
							h("span", { style: { fontWeight: 600, fontSize: "14px" } }, mode),
							isDefault ? h("span", { style: { marginLeft: "auto", fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "default") : null);
					})),
				h("div", { style: { display: "grid", gap: "8px" } },
					h("div", { style: { fontSize: "13px", fontWeight: 600, color: "var(--dsw-alias-label-secondary)" } }, "Policies"),
					modes.map(function (mode) {
						var route = routes[mode];
						var allowed = tools[mode];
						var parts = [];
						if (route) parts.push(route.provider + "/" + route.model);
						if (allowed) parts.push(allowed.length + " tool" + (allowed.length === 1 ? "" : "s"));
						if (parts.length === 0) return null;
						return h("div", { key: mode, style: { display: "flex", gap: "10px", alignItems: "baseline", fontSize: "13px" } },
							h("span", { style: { minWidth: "90px", fontWeight: 600 } }, mode),
							h("span", { style: { color: "var(--dsw-alias-label-secondary)" } }, parts.join(" · ")));
					})));
		}
		function apply(ctx) {
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "actions",
				order: 20,
				label: () => "Actions",
				inject: () => ({}),
			}, SessionModesSection), "dsh-actions: session modes settings");
			ctx.slots.inject("settings.section.icon", () => ctx.slots.register({
				name: "settings.section.icon",
				id: "actions",
				order: 0,
			}, SessionModesGlyph), "dsh-actions: session modes nav glyph");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = ["slots"];
		return module.exports;
	}
});
