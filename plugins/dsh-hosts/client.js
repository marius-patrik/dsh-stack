(function () {
  if (typeof globalThis.crypto === 'undefined') globalThis.crypto = {};
  if (typeof globalThis.crypto.randomUUID !== 'function') {
    globalThis.crypto.randomUUID = function () {
      if (typeof globalThis.crypto.getRandomValues === 'function') {
        try {
          return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function (c) {
            return (c ^ (globalThis.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16);
          });
        } catch (e) {}
      }
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
  }
})();

window.__ModuleLoader__.load({
  id: "dsh-hosts",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;

    var STATUS_ROUTE = "/hosts/api/status";

    function createHostsStore() {
      var listeners = new Set();
      var state = { data: null, status: "idle", error: null };
      function emit() {
        listeners.forEach(function (listener) { listener(); });
      }
      function load() {
        state = { data: state.data, status: "loading", error: null };
        emit();
        return fetch(STATUS_ROUTE)
          .then(function (res) {
            if (!res.ok) throw new Error("HTTP " + res.status);
            return res.json();
          })
          .then(function (data) {
            state = { data: data, status: "ready", error: null };
            emit();
          })
          .catch(function (err) {
            state = { data: state.data, status: "error", error: String(err && err.message || err) };
            emit();
          });
      }
      return {
        getSnapshot: function () { return state; },
        subscribe: function (listener) {
          listeners.add(listener);
          return function () { listeners.delete(listener); };
        },
        load: load,
      };
    }

    function HostsGlyph() {
      var React = require("react");
      return React.createElement(
        "svg",
        { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": "true" },
        React.createElement("rect", { x: 2, y: 3, width: 12, height: 4, rx: 1, stroke: "currentColor", strokeWidth: 1.25 }),
        React.createElement("rect", { x: 2, y: 9, width: 12, height: 4, rx: 1, stroke: "currentColor", strokeWidth: 1.25 }),
        React.createElement("circle", { cx: 4.5, cy: 5, r: 0.75, fill: "currentColor" }),
        React.createElement("circle", { cx: 4.5, cy: 11, r: 0.75, fill: "currentColor" }),
        React.createElement("circle", { cx: 7, cy: 5, r: 0.75, fill: "currentColor" }),
        React.createElement("circle", { cx: 7, cy: 11, r: 0.75, fill: "currentColor" })
      );
    }

    function HostsSettingsSection(props) {
      var React = require("react");
      var h = React.createElement;
      var state = props.useHosts(function (s) { return s; });
      var data = state && state.data;
      var nodes = (data && data.nodes) || [];
      var access = data && data.access;
      var sync = data && data.syncStatus;

      var selectedDeployNode = React.useState(null);
      var deployNode = selectedDeployNode[0];
      var setDeployNode = selectedDeployNode[1];

      var copyNotification = React.useState(null);
      var copyMsg = copyNotification[0];
      var setCopyMsg = copyNotification[1];

      React.useEffect(function () {
        if (state && state.status === "idle") props.load();
      }, [state && state.status]);

      function copyText(text, label) {
        if (navigator && navigator.clipboard) {
          navigator.clipboard.writeText(text);
          setCopyMsg(label || "Copied!");
          setTimeout(function () { setCopyMsg(null); }, 2000);
        }
      }

      var nodeCard = function (node) {
        var isOnline = node.online;
        var isSelf = node.isSelf;
        var dotColor = isOnline ? "#3fb950" : "#8b949e";
        var osBadge = (node.os || "").toUpperCase();

        return h(
          "div",
          {
            key: node.id,
            style: {
              padding: "12px 14px",
              borderRadius: "8px",
              border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.2))",
              background: isSelf ? "rgba(99, 102, 241, 0.06)" : "var(--dsw-alias-surface, rgba(128,128,128,0.03))",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            },
          },
          h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "8px" } },
            h("span", {
              style: {
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: dotColor,
                boxShadow: isOnline ? "0 0 6px rgba(63, 185, 80, 0.5)" : "none",
              },
            }),
            h("strong", { style: { fontSize: "14px" } }, node.name),
            h(
              "span",
              {
                style: {
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: isSelf ? "#6366f1" : "rgba(128,128,128,0.2)",
                  color: isSelf ? "#fff" : "inherit",
                },
              },
              isSelf ? "COORDINATOR" : osBadge
            ),
            h(
              "span",
              {
                style: {
                  marginLeft: "auto",
                  fontSize: "11px",
                  opacity: 0.6,
                },
              },
              isOnline ? "Online" : "Offline"
            )
          ),
          h(
            "div",
            { style: { fontSize: "12px", opacity: 0.8, display: "flex", flexWrap: "wrap", gap: "12px" } },
            node.ips && node.ips[0] ? h("span", null, "IP: ", h("code", null, node.ips[0])) : null,
            node.dnsName ? h("span", null, "DNS: ", h("code", null, node.dnsName)) : null
          ),
          node.capabilities && node.capabilities.length > 0 ? h(
            "div",
            { style: { display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "2px" } },
            node.capabilities.map(function (cap) {
              return h(
                "span",
                {
                  key: cap,
                  style: {
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "rgba(128,128,128,0.12)",
                    opacity: 0.8,
                  },
                },
                cap
              );
            })
          ) : null,
          !isSelf ? h(
            "div",
            { style: { display: "flex", gap: "8px", marginTop: "4px" } },
            h(
              "button",
              {
                type: "button",
                onClick: function () {
                  setDeployNode(deployNode === node.id ? null : node.id);
                },
                style: {
                  fontSize: "11px",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.3))",
                  background: "transparent",
                  cursor: "pointer",
                  color: "inherit",
                },
              },
              deployNode === node.id ? "Hide Deploy Command" : "Deploy Worker Node"
            )
          ) : null,
          deployNode === node.id ? h(
            "div",
            {
              style: {
                marginTop: "6px",
                padding: "8px",
                borderRadius: "6px",
                background: "rgba(0,0,0,0.35)",
                fontSize: "11px",
                fontFamily: "monospace",
              },
            },
            h("div", { style: { marginBottom: "4px", opacity: 0.7 } }, "Run on " + node.name + ":"),
            h(
              "code",
              { style: { display: "block", wordBreak: "break-all", color: "#38bdf8" } },
              node.os === "windows"
                ? "powershell -Command \"irm " + (access ? access.permanentUrl : "") + "/hosts/bootstrap.ps1 | iex\""
                : "curl -fsSL " + (access ? access.permanentUrl : "") + "/hosts/bootstrap.sh | sh"
            )
          ) : null
        );
      };

      return h(
        "section",
        { style: { display: "flex", flexDirection: "column", gap: "16px" } },
        h(
          "header",
          { style: { display: "flex", alignItems: "center", gap: "12px" } },
          h("h2", { style: { fontSize: "16px", margin: 0 } }, "Hosts & Cluster"),
          h(
            "button",
            {
              type: "button",
              onClick: function () { props.load(); },
              disabled: state && state.status === "loading",
              style: {
                marginLeft: "auto",
                padding: "4px 12px",
                cursor: "pointer",
                borderRadius: "6px",
                border: "1px solid var(--dsw-alias-border, rgba(128,128,128,0.35))",
                background: "transparent",
                color: "inherit",
                font: "inherit",
                fontSize: "12px",
              },
            },
            state && state.status === "loading" ? "Scanning…" : "Re-scan Devices"
          )
        ),
        access ? h(
          "div",
          {
            style: {
              padding: "14px",
              borderRadius: "8px",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              background: "rgba(99, 102, 241, 0.08)",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            },
          },
          h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "8px" } },
            h("strong", { style: { fontSize: "13px" } }, "Permanent Cluster Address"),
            h("span", { style: { fontSize: "11px", opacity: 0.7 } }, "(Loopback Protected & Synced)")
          ),
          h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "10px" } },
            h("code", { style: { fontSize: "13px", color: "#6366f1", fontWeight: 600 } }, access.permanentUrl),
            h(
              "button",
              {
                type: "button",
                onClick: function () { copyText(access.permanentUrl, "URL Copied!"); },
                style: {
                  padding: "3px 10px",
                  fontSize: "11px",
                  borderRadius: "4px",
                  border: "1px solid rgba(99, 102, 241, 0.5)",
                  background: "#6366f1",
                  color: "#fff",
                  cursor: "pointer",
                },
              },
              copyMsg || "Copy URL"
            )
          ),
          h(
            "div",
            { style: { display: "flex", gap: "16px", fontSize: "11px", opacity: 0.8, marginTop: "4px" } },
            sync ? h("span", null, "Sync Engine: ", h("strong", { style: { color: "#3fb950" } }, "Active (" + sync.trackedFiles + " files tracked)")) : null,
            access.lanIp ? h("span", null, "LAN IP: ", h("code", null, access.lanIp)) : null
          )
        ) : null,
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: "10px" } },
          h(
            "div",
            { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
            h("h3", { style: { fontSize: "13px", margin: 0, opacity: 0.8 } }, "Cluster Nodes & Devices (" + nodes.length + ")"),
            data ? h("span", { style: { fontSize: "11px", opacity: 0.6 } }, data.onlineNodes + " Online") : null
          ),
          state && state.error ? h("p", { style: { color: "#f85149", fontSize: "12px" } }, state.error) : null,
          nodes.map(nodeCard)
        )
      );
    }

    function apply(ctx) {
      var store = createHostsStore();
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({
          name: "settings.section",
          id: "hosts",
          order: 12,
          label: function () { return "Hosts"; },
          inject: function () {
            return {
              hooks: { hosts: store },
              load: function () { store.load(); },
            };
          },
        }, HostsSettingsSection);
      }, "dsh-hosts: hosts settings section");

      ctx.slots.inject("settings.section.icon", function () {
        return ctx.slots.register({
          name: "settings.section.icon",
          id: "hosts",
          order: 0,
        }, HostsGlyph);
      }, "dsh-hosts: hosts nav glyph");
    }

    exports.apply = apply;
    exports.inject = ["slots"];
    return module.exports;
  }
});
