window.__ModuleLoader__.load({
  id: "dsh-themes",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    //#region lib/client.js
    /**
     * dsh-themes client half (hand-authored bundle, no build step): after the
     * harness ui-theme service exists, fetch the node half's theme directory
     * (`/themes.json`), register every installed theme into `ctx.theme`, and
     * apply the stored active choice. The node half already mapped each VS
     * Code/TextMate source onto the semantic `--dsw-alias-*` vocabulary, so
     * this bundle only mirrors registry-ready definitions.
     *
     * Also owns the Themes settings section (order 30): a live switcher over
     * the theme registry. The inject face exposes a `themeSnapshot`
     * observable (bound by the renderer as `useThemeSnapshot`) and an
     * `applyTheme` callback; the nav glyph registers under the section id.
     *
     * Re-running the bundle (HMR / entry refresh) is idempotent: themes are
     * skipped when already registered, the active choice is re-applied, and
     * the section + glyph re-register through the slot ledger.
     */
    var THEMES_ROUTE = "/themes.json";
    /** createThemeObservable implementation. */
    function createThemeObservable(ctx) {
      var listeners = new Set();
      var snapshot = ctx.theme.getTheme();
      var off = ctx.on("theme/change", function (next) {
        snapshot = next;
        listeners.forEach(function (listener) {
          listener();
        });
      });
      return {
        getSnapshot: function () {
          return snapshot;
        },
        subscribe: function (listener) {
          listeners.add(listener);
          return function () {
            listeners.delete(listener);
          };
        },
        dispose: off,
      };
    }
    /** applyBorderStyle implementation. */
    function applyBorderStyle(style) {
      if (typeof document === "undefined") return;
      var id = "dsh-border-style-override";
      var el = document.getElementById(id);
      if (!el) {
        el = document.createElement("style");
        el.id = id;
        document.head.appendChild(el);
      }
      if (style === "none") {
        el.textContent =
          "\n" +
          ":root {\n" +
          "  --dsw-alias-border-l1: transparent !important;\n" +
          "  --dsw-alias-border-l2: transparent !important;\n" +
          "  --dsw-alias-border-l2-darkmode-thin: transparent !important;\n" +
          "  --dsw-alias-border-l4: transparent !important;\n" +
          "}\n" +
          '[class*="card"], [class*="sectionHeader"], [class*="footer"], [class*="headerActions"] {\n' +
          "  border-color: transparent !important;\n" +
          "}\n" +
          '[class*="cardWorkspaceTrigger"]::after {\n' +
          "  display: none !important;\n" +
          "}\n";
      } else if (style === "high") {
        el.textContent =
          "\n" +
          ":root {\n" +
          "  --dsw-alias-border-l1: rgba(255, 255, 255, 0.28) !important;\n" +
          "  --dsw-alias-border-l2: rgba(255, 255, 255, 0.42) !important;\n" +
          "  --dsw-alias-border-l2-darkmode-thin: rgba(255, 255, 255, 0.35) !important;\n" +
          "  --dsw-alias-border-l4: rgba(255, 255, 255, 0.40) !important;\n" +
          "}\n" +
          '[class*="card"] {\n' +
          "  border: 1.5px solid rgba(255, 255, 255, 0.32) !important;\n" +
          "}\n";
      } else {
        el.textContent = "";
      }
    }

    /** applyOledStyles implementation. */
    function applyOledStyles(isOled) {
      if (typeof document === "undefined") return;
      var id = "dsh-oled-style-override";
      var el = document.getElementById(id);
      if (!el) {
        el = document.createElement("style");
        el.id = id;
        document.head.appendChild(el);
      }
      if (isOled) {
        el.textContent =
          "\n" +
          ':root, body, [data-theme="oled"] {\n' +
          "  --dsw-specific-input-major: #000000 !important;\n" +
          "  --dsw-specific-tip: #000000 !important;\n" +
          "  --dsw-alias-surface-l0: #000000 !important;\n" +
          "  --dsw-alias-surface-l1: #050505 !important;\n" +
          "  --dsw-alias-surface-l2: #0a0a0a !important;\n" +
          "  --dsw-alias-bg-base: #000000 !important;\n" +
          "  --dsw-alias-bg-layer-1: #000000 !important;\n" +
          "  --dsw-alias-bg-layer-2: #050505 !important;\n" +
          "  --dsw-alias-border-l1: #161616 !important;\n" +
          "  --dsw-alias-border-l2: #1e1e1e !important;\n" +
          "  --dsw-alias-border-l2-darkmode-thin: #1a1a1a !important;\n" +
          "  --dsw-specific-bubble: #060606 !important;\n" +
          "  --dsw-specific-user-bubble: #0f0f0f !important;\n" +
          "  --dsw-specific-bubble-highlight: #141414 !important;\n" +
          "  --dsw-alias-markdown-code-block-banner: #050505 !important;\n" +
          "  --dsw-alias-markdown-inline-code: #0a0a0a !important;\n" +
          "  --dsw-alias-markdown-placeholder: #050505 !important;\n" +
          "  --dsw-alias-markdown-tag: #050505 !important;\n" +
          "  --dsw-alias-tooltip-bg: #0a0a0a !important;\n" +
          "}\n" +
          '[class*="card"] {\n' +
          "  background: #000000 !important;\n" +
          "  border-color: #1a1a1a !important;\n" +
          "  box-shadow: 0 10px 36px rgba(0,0,0,0.95) !important;\n" +
          "}\n" +
          '[data-message-role="assistant"] > div[class*="content"],\n' +
          '[data-message-role="assistant"] [class*="Message_bubble"],\n' +
          '[data-message-role="assistant"] [class*="bubble"],\n' +
          '[data-slot="conversation.message.assistant"] [class*="content"] {\n' +
          "  background: #060606 !important;\n" +
          "  border-color: #181818 !important;\n" +
          "  box-shadow: none !important;\n" +
          "}\n" +
          '[data-message-role="user"] > div[class*="content"],\n' +
          '[data-message-role="user"] [class*="Message_bubble"],\n' +
          '[data-message-role="user"] [class*="bubble"],\n' +
          '[data-slot="conversation.message.user"] [class*="content"] {\n' +
          "  background: #0f0f0f !important;\n" +
          "  border-color: #202020 !important;\n" +
          "  box-shadow: none !important;\n" +
          "}\n" +
          '[class*="modes"], [class*="tools"], [class*="select"] {\n' +
          "  background-color: transparent !important;\n" +
          "}\n" +
          '[data-goal-bar], [data-goal-bar] > div, [class*="GoalBar"], [class*="goal-bar"], [class*="goalDisplay"], [class*="GoalDisplay"], [class*="AgentGoal"], [class*="agentGoal"] {\n' +
          "  background: #000000 !important;\n" +
          "  border-color: #1a1a1a !important;\n" +
          "  box-shadow: none !important;\n" +
          "}\n" +
          '[data-goal-bar] input, [class*="GoalBar"] input {\n' +
          "  background: transparent !important;\n" +
          "  color: #fff !important;\n" +
          "}\n";
      } else {
        el.textContent = "";
      }
    }

    /** ThemesGlyph implementation. */
    function ThemesGlyph(props) {
      var React = require("react");
      var size = (props && props.size) || 16;
      return React.createElement(
        "svg",
        {
          width: size,
          height: size,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          className: "dsh-themes-navGlyph dsh-icon-animated",
        },
        React.createElement("circle", { cx: "13.5", cy: "6.5", r: ".5", fill: "currentColor" }),
        React.createElement("circle", { cx: "17.5", cy: "10.5", r: ".5", fill: "currentColor" }),
        React.createElement("circle", { cx: "8.5", cy: "7.5", r: ".5", fill: "currentColor" }),
        React.createElement("circle", { cx: "6.5", cy: "12.5", r: ".5", fill: "currentColor" }),
        React.createElement("path", {
          d: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",
        }),
      );
    }

    /** ThemesSection implementation. */
    function ThemesSection(props) {
      var React = require("react");
      var h = React.createElement;
      var useThemeSnapshot = props.useThemeSnapshot,
        applyTheme = props.applyTheme;
      var snapshot = useThemeSnapshot(function (s) {
        return s;
      });
      var themes = snapshot && snapshot.themes ? snapshot.themes : [];
      var active = snapshot ? snapshot.active.id : null;

      var borderStyleState = React.useState(function () {
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            return window.localStorage.getItem("dsh_border_style") || "soft";
          }
        } catch (e) {}
        return "soft";
      });
      var borderStyle = borderStyleState[0],
        setBorderStyle = borderStyleState[1];

      var heroBannerState = React.useState(function () {
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            return window.localStorage.getItem("dsh_show_hero_banner") !== "false";
          }
        } catch (e) {}
        return true;
      });
      var showHeroBanner = heroBannerState[0],
        setShowHeroBanner = heroBannerState[1];

      var /** setBorderChoice implementation. */
        setBorderChoice = function (style) {
          setBorderStyle(style);
          try {
            if (typeof window !== "undefined" && window.localStorage) {
              window.localStorage.setItem("dsh_border_style", style);
            }
          } catch (e) {}
          applyBorderStyle(style);
          if (typeof window !== "undefined")
            window.dispatchEvent(new CustomEvent("dsh:settings-change"));
        };

      var /** toggleHeroBanner implementation. */
        toggleHeroBanner = function () {
          var next = !showHeroBanner;
          setShowHeroBanner(next);
          try {
            if (typeof window !== "undefined" && window.localStorage) {
              window.localStorage.setItem("dsh_show_hero_banner", next ? "true" : "false");
            }
          } catch (e) {}
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("dsh:settings-change"));
            window.dispatchEvent(new Event("storage"));
          }
        };

      var groups = {};
      for (var i = 0; i < themes.length; i++) {
        var theme = themes[i];
        (groups[theme.colorScheme] = groups[theme.colorScheme] || []).push(theme);
      }
      var /** themeButton implementation. */
        themeButton = function (theme) {
          var isActive = theme.id === active;
          return h(
            "button",
            {
              key: theme.id,
              type: "button",
              onClick: function () {
                applyTheme(theme.id);
                applyOledStyles(theme.id === "oled");
              },
              "aria-pressed": isActive,
              style: {
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: isActive
                  ? "1px solid var(--dsw-alias-border-accent)"
                  : "1px solid var(--dsw-alias-border-l2)",
                borderRadius: "10px",
                padding: "12px 14px",
                background: isActive
                  ? "var(--dsw-specific-sidebar-nav-item-active)"
                  : "transparent",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "14px",
                color: "var(--dsw-alias-label-primary)",
                textAlign: "left",
              },
            },
            h("span", {
              style: {
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                flex: "none",
                background: theme.colorScheme === "dark" ? "#1f2430" : "#ffffff",
                border: "1px solid var(--dsw-alias-border-l2)",
              },
            }),
            h("span", null, theme.id),
            isActive
              ? h("strong", { style: { marginLeft: "auto", fontSize: "12px" } }, "Active")
              : null,
          );
        };
      var /** schemeGroup implementation. */
        schemeGroup = function (scheme) {
          var list = groups[scheme];
          if (!list || list.length === 0) return null;
          return h(
            "div",
            { key: scheme, style: { display: "grid", gap: "8px" } },
            h(
              "div",
              {
                style: {
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--dsw-alias-label-secondary)",
                },
              },
              scheme === "light" ? "Light Palettes" : "Dark Palettes",
            ),
            h(
              "div",
              {
                style: {
                  display: "grid",
                  gap: "8px",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                },
              },
              list.map(themeButton),
            ),
          );
        };
      var currentScheme = snapshot && snapshot.active ? snapshot.active.colorScheme : "dark";

      var isOledActive = snapshot && snapshot.active ? snapshot.active.id === "oled" : false;

      var modeButtons = h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            paddingBottom: "16px",
            borderBottom: "1px solid var(--dsw-alias-border-l1)",
          },
        },
        h(
          "div",
          { style: { fontSize: "13px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } },
          "Theme Mode",
        ),
        h(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "10px",
            },
          },
          [
            { id: "system", label: "System", desc: "Sync with OS theme" },
            { id: "light", label: "Light", desc: "Clean bright contrast" },
            { id: "dark", label: "Dark", desc: "Standard dark theme" },
            { id: "oled", label: "OLED Black", desc: "Pure #000000 pitch black input & panels" },
          ].map(function (mode) {
            var isSelected =
              mode.id === "oled"
                ? isOledActive
                : mode.id === "system"
                  ? false
                  : mode.id === currentScheme && !isOledActive;
            return h(
              "button",
              {
                key: mode.id,
                type: "button",
                onClick: function () {
                  if (mode.id === "oled") {
                    applyTheme("oled");
                    applyOledStyles(true);
                    return;
                  }
                  applyOledStyles(false);
                  var targetTheme =
                    mode.id === "light"
                      ? groups["light"] && groups["light"][0]
                        ? groups["light"][0].id
                        : "light"
                      : groups["dark"] && groups["dark"][0]
                        ? groups["dark"][0].id
                        : "dark";
                  applyTheme(targetTheme);
                },
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: isSelected
                    ? "1px solid var(--dsw-alias-primary, #6366f1)"
                    : "1px solid var(--dsw-alias-border-l2)",
                  background: isSelected
                    ? "rgba(99, 102, 241, 0.1)"
                    : "var(--dsw-alias-surface-l1, rgba(128,128,128,0.03))",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "inherit",
                },
              },
              h(
                "div",
                {
                  style: {
                    fontSize: "14px",
                    fontWeight: 600,
                    color: isSelected
                      ? "var(--dsw-alias-primary, #6366f1)"
                      : "var(--dsw-alias-label-primary)",
                  },
                },
                mode.label,
              ),
              h(
                "div",
                { style: { fontSize: "11px", color: "var(--dsw-alias-label-secondary)" } },
                mode.desc,
              ),
            );
          }),
        ),
      );

      var borderButtons = h(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            paddingBottom: "16px",
            borderBottom: "1px solid var(--dsw-alias-border-l1)",
          },
        },
        h(
          "div",
          { style: { fontSize: "13px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } },
          "Border Style",
        ),
        h(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "10px",
            },
          },
          [
            { id: "soft", label: "Soft Borders", desc: "Subtle translucent lines (Default)" },
            { id: "none", label: "No Borders", desc: "Minimalist borderless cards" },
            { id: "high", label: "High Contrast", desc: "Crisp defined component borders" },
          ].map(function (b) {
            var isSelected = borderStyle === b.id;
            return h(
              "button",
              {
                key: b.id,
                type: "button",
                onClick: function () {
                  setBorderChoice(b.id);
                },
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: isSelected
                    ? "1px solid var(--dsw-alias-primary, #6366f1)"
                    : "1px solid var(--dsw-alias-border-l2)",
                  background: isSelected
                    ? "rgba(99, 102, 241, 0.1)"
                    : "var(--dsw-alias-surface-l1, rgba(128,128,128,0.03))",
                  cursor: "pointer",
                  textAlign: "left",
                  color: "inherit",
                },
              },
              h(
                "div",
                {
                  style: {
                    fontSize: "14px",
                    fontWeight: 600,
                    color: isSelected
                      ? "var(--dsw-alias-primary, #6366f1)"
                      : "var(--dsw-alias-label-primary)",
                  },
                },
                b.label,
              ),
              h(
                "div",
                { style: { fontSize: "11px", color: "var(--dsw-alias-label-secondary)" } },
                b.desc,
              ),
            );
          }),
        ),
      );

      var bannerSection = h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderRadius: "10px",
            border: "1px solid var(--dsw-alias-border-l2)",
            background: "var(--dsw-alias-surface-l1, rgba(128,128,128,0.03))",
          },
        },
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: "3px" } },
          h(
            "div",
            {
              style: { fontSize: "14px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" },
            },
            "Into the Unknown Greeting Banner",
          ),
          h(
            "div",
            { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } },
            "Show the illustration and headline banner on new conversation screens",
          ),
        ),
        h(
          "button",
          {
            type: "button",
            onClick: toggleHeroBanner,
            style: {
              position: "relative",
              width: "44px",
              height: "24px",
              borderRadius: "12px",
              border: "none",
              background: showHeroBanner
                ? "var(--dsw-alias-primary, #6366f1)"
                : "var(--dsw-alias-border-l2, #444)",
              cursor: "pointer",
              transition: "background 150ms ease",
            },
          },
          h("span", {
            style: {
              position: "absolute",
              top: "2px",
              left: showHeroBanner ? "22px" : "2px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "#ffffff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              transition: "left 150ms ease",
            },
          }),
        ),
      );

      return h(
        "div",
        { style: { display: "grid", gap: "20px", maxWidth: "760px" } },
        h(
          "div",
          null,
          h("h2", { style: { margin: "0 0 6px" } }, "Appearance & Styles"),
          h(
            "p",
            { style: { margin: 0, color: "var(--dsw-alias-label-secondary)" } },
            "Customize visual styles, theme modes, borders, and layout preferences.",
          ),
        ),
        modeButtons,
        borderButtons,
        bannerSection,
        h("div", { style: { display: "grid", gap: "12px" } }, ["light", "dark"].map(schemeGroup)),
      );
    }

    var OLED_THEME = {
      id: "oled",
      name: "OLED Pitch Black",
      colorScheme: "dark",
      tokens: {
        "--dsw-alias-bg-base": "#000000",
        "--dsw-alias-bg-layer-1": "#000000",
        "--dsw-alias-bg-layer-2": "#050505",
        "--dsw-alias-bg-layer-3": "#0a0a0a",
        "--dsw-specific-sidebar-fill": "#000000",
        "--dsw-specific-input-major": "#000000",
        "--dsw-specific-selector": "#0e0e0e",
        "--dsw-alias-border-l2-darkmode-thin": "#1c1c1c",
        "--dsw-shadow-lv2": "0 8px 32px rgba(0,0,0,0.95)",
        "--dsw-alias-surface-l0": "#000000",
        "--dsw-alias-surface-l1": "#0a0a0a",
        "--dsw-alias-surface-l2": "#121212",
        "--dsw-alias-border-l1": "#1a1a1a",
        "--dsw-alias-border-l2": "#262626",
        "--dsw-alias-border-l4": "#222222",
        "--dsw-alias-border-accent": "#6366f1",
        "--dsw-alias-label-primary": "#ffffff",
        "--dsw-alias-label-secondary": "#a8a8a8",
        "--dsw-alias-label-tertiary": "#6b6b6b",
        "--dsw-alias-interactive-bg-hover": "rgba(255, 255, 255, 0.08)",
        "--dsw-alias-interactive-bg-hover-solid": "rgba(255, 255, 255, 0.12)",
        "--dsw-specific-sidebar-nav-item-hover": "rgba(255, 255, 255, 0.06)",
        "--dsw-specific-sidebar-nav-item-active": "rgba(255, 255, 255, 0.12)",
        "--dsw-alias-primary": "#6366f1",
      },
    };

    /** apply implementation. */
    function apply(ctx) {
      var themeObservable;
      var /** getSavedTheme implementation. */
        getSavedTheme = function () {
          try {
            if (typeof window !== "undefined" && window.localStorage) {
              return window.localStorage.getItem("dsh_active_theme");
            }
          } catch (e) {}
          return null;
        };
      var /** saveActiveTheme implementation. */
        saveActiveTheme = function (id) {
          try {
            if (typeof window !== "undefined" && window.localStorage) {
              window.localStorage.setItem("dsh_active_theme", id);
            }
          } catch (e) {}
        };

      // Initialize border styles and OLED styles on boot
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          var initBorder = window.localStorage.getItem("dsh_border_style") || "soft";
          applyBorderStyle(initBorder);
          var initTheme = window.localStorage.getItem("dsh_active_theme");
          if (initTheme === "oled") applyOledStyles(true);
        }
      } catch (e) {}

      ctx.effect(() => {
        themeObservable = createThemeObservable(ctx);
        return () => {
          themeObservable.dispose();
        };
      }, "dsh-themes: theme snapshot source");
      ctx.effect(() => {
        var disposed = false;
        var registrations = [];
        var savedTheme = getSavedTheme();

        try {
          var known = new Set(ctx.theme.getTheme().themes.map((t) => t.id));
          if (!known.has(OLED_THEME.id)) {
            registrations.push(ctx.theme.register(OLED_THEME));
            known.add(OLED_THEME.id);
          }
          if (
            savedTheme &&
            (savedTheme === "oled" ||
              savedTheme === "light" ||
              savedTheme === "dark" ||
              savedTheme === "system")
          ) {
            try {
              ctx.theme.setTheme(savedTheme);
              applyOledStyles(savedTheme === "oled");
            } catch (err) {}
          }
        } catch (e) {}
        var cancel = fetch(THEMES_ROUTE)
          .then((response) => {
            if (!response.ok)
              throw new Error(`dsh-themes: ${THEMES_ROUTE} failed (HTTP ${response.status})`);
            return response.json();
          })
          .then((body) => {
            if (disposed) return;
            var theme = ctx.theme;
            var known = new Set(theme.getTheme().themes.map((t) => t.id));
            if (!known.has(OLED_THEME.id)) {
              registrations.push(theme.register(OLED_THEME));
              known.add(OLED_THEME.id);
            }
            for (var i = 0; i < (body.themes || []).length; i++) {
              var item = body.themes[i];
              if (known.has(item.id)) continue;
              known.add(item.id);
              registrations.push(
                theme.register({
                  id: item.id,
                  colorScheme: item.colorScheme,
                  tokens: item.tokens,
                }),
              );
            }
            var targetTheme = savedTheme || body.active;
            if (
              targetTheme &&
              (targetTheme === "system" ||
                targetTheme === "light" ||
                targetTheme === "dark" ||
                known.has(targetTheme))
            ) {
              try {
                theme.setTheme(targetTheme);
                applyOledStyles(targetTheme === "oled");
              } catch (err) {}
            }
          })
          .catch((error) => {
            console.error("[dsh-themes]", error);
          });
        return () => {
          disposed = true;
          for (var i = 0; i < registrations.length; i++) registrations[i]();
          registrations = [];
        };
      }, "dsh-themes: theme directory sync");
      ctx.slots.inject(
        "settings.section",
        () =>
          ctx.slots.register(
            {
              name: "settings.section",
              id: "themes",
              order: 30,
              label: () => "Themes",
              inject: () => ({
                hooks: { themeSnapshot: themeObservable },
                applyTheme: (id) => {
                  saveActiveTheme(id);
                  applyOledStyles(id === "oled");
                  try {
                    ctx.theme.setTheme(id);
                  } catch (err) {
                    console.error("[dsh-themes] failed to set theme:", err);
                  }
                },
              }),
            },
            ThemesSection,
          ),
        "dsh-themes: themes settings section",
      );
      ctx.slots.inject(
        "settings.section.icon",
        () =>
          ctx.slots.register(
            {
              name: "settings.section.icon",
              id: "themes",
              order: 0,
            },
            ThemesGlyph,
          ),
        "dsh-themes: themes nav glyph",
      );
    }
    //#endregion
    exports.apply = apply;
    exports.inject = ["slots", "theme"];
    return module.exports;
  },
});
