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
  id: "dsh-providers",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;

    var React = require("react");
    var h = React.createElement;
    var Fragment = React.Fragment;
    var P = require("@deepseek-ai/dsh-client-ui-primitives");

    var NS = "dsh-providers";
    var VAULT_API = "/vault/api";
    var QUOTAS_API = "/quotas/api";

    var TREE_STYLES = `
@keyframes dsh-row-in {
  from { opacity: 0; transform: translateY(-2px); }
  to { opacity: 1; transform: translateY(0); }
}
.dsh-tree-projectRow {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  border-radius: 6px;
  padding: 0 6px;
  cursor: pointer;
  user-select: none;
  color: var(--dsw-alias-label-primary);
  box-sizing: border-box;
  width: 100%;
  font-size: 12px;
  transition: background 120ms ease;
}
.dsh-tree-projectRow:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-tree-slot {
  flex: none;
  width: 16px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-tree-projectRow .dsh-tree-chevron,
.dsh-tree-sessionRow.dsh-has-children .dsh-tree-chevron {
  display: none;
}
.dsh-tree-projectRow:hover .dsh-tree-chevron,
.dsh-tree-sessionRow.dsh-has-children:hover .dsh-tree-chevron {
  display: inline-flex;
}
.dsh-tree-projectRow:hover .dsh-tree-icon,
.dsh-tree-sessionRow.dsh-has-children:hover .dsh-tree-icon {
  display: none;
}
.dsh-tree-sessionRow:not(.dsh-has-children) .dsh-tree-chevron {
  display: none !important;
}
.dsh-tree-sessionRow:not(.dsh-has-children) .dsh-tree-icon {
  display: inline-flex !important;
}
.dsh-tree-arrow {
  transition: transform 150ms var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1));
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.dsh-tree-arrowOpen {
  transform: rotate(90deg);
}
.dsh-tree-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  line-height: 18px;
  font-weight: 500;
}
.dsh-tree-actions {
  display: none;
  align-items: center;
  gap: 3px;
  height: 20px;
  margin-left: auto;
}
.dsh-tree-projectRow:hover .dsh-tree-actions,
.dsh-tree-sessionRow:hover .dsh-tree-actions {
  display: inline-flex !important;
}
.dsh-tree-actionBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--dsw-alias-label-secondary);
  cursor: pointer;
  padding: 0;
}
.dsh-tree-actionBtn:hover {
  background: var(--dsw-alias-button-elevated-fill, rgba(128,128,128,0.25));
  color: var(--dsw-alias-label-primary);
}
.dsh-tree-sessionRow {
  display: flex;
  align-items: center;
  height: 30px;
  gap: 4px;
  border-radius: 6px;
  padding: 0 6px 0 16px;
  cursor: pointer;
  user-select: none;
  color: var(--dsw-alias-label-primary);
  box-sizing: border-box;
  width: 100%;
  font-size: 12px;
  animation: dsh-row-in 150ms var(--ds-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1));
  transition: background 100ms;
}
.dsh-tree-sessionRow:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08)) !important;
}
.dsh-tree-sessionRowActive,
.dsh-tree-sessionRowActive:hover {
  background: var(--dsw-alias-surface-l2, rgba(255, 255, 255, 0.12)) !important;
}
/* Model Picker trigger icon (Single Lucide Cube in pure crisp white) */
[data-slot="conversation.input.model"] > button::before,
button[class*="ModelSelect_trigger"]::before {
  content: '';
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-right: 6px;
  flex-shrink: 0;
  vertical-align: middle;
  background-color: var(--dsw-alias-label-primary, #ffffff) !important;
  -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/%3E%3Cpolyline points='3.27 6.96 12 12.01 20.73 6.96'/%3E%3Cline x1='12' y1='22.08' x2='12' y2='12'/%3E%3C/svg%3E") no-repeat center / contain;
  mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'/%3E%3Cpolyline points='3.27 6.96 12 12.01 20.73 6.96'/%3E%3Cline x1='12' y1='22.08' x2='12' y2='12'/%3E%3C/svg%3E") no-repeat center / contain;
}

/* Prevent duplicate icons inside the trigger button */
[data-slot="conversation.input.model"] > button > svg:first-child,
button[class*="ModelSelect_trigger"] > svg:not(:last-child) {
  display: none !important;
}

/* Remove duplicate right-side cube or menu option cube ::before */
[class*="ModelSelect_menu"] button::before,
[class*="ModelSelect_menu"] [class*="cell"]::before,
[class*="ModelSelect_menu"] [class*="option"]::before,
[class*="ModelSelect_cellValue"]::before,
[class*="cellValue"]::before {
  content: none !important;
  display: none !important;
}

/* Universal Animated Lucide Icons */
svg:not([class*="badge"]),
.dsh-icon-animated {
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), stroke 180ms ease, fill 180ms ease, opacity 180ms ease !important;
  transform-origin: center center;
}

button:hover svg:not([class*="badge"]),
a:hover svg:not([class*="badge"]),
[role="button"]:hover svg:not([class*="badge"]),
[role="menuitem"]:hover svg:not([class*="badge"]),
[role="tab"]:hover svg:not([class*="badge"]),
.dsh-tree-projectRow:hover svg:not([class*="badge"]),
.dsh-tree-sessionRow:hover svg:not([class*="badge"]) {
  transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), stroke 180ms ease, fill 180ms ease !important;
}

/* Refresh / Sync / Reload */
button:hover svg[class*="refresh"], button:hover svg[class*="reload"], button:hover svg[class*="loop"],
button:hover .dsh-icon-refresh, .dsh-icon-refresh:hover, [role="button"]:hover svg[class*="refresh"] {
  transform: rotate(180deg) !important;
}

/* Trash / Delete */
button:hover svg[class*="trash"], button:hover svg[class*="delete"],
button:hover .dsh-icon-trash, .dsh-icon-trash:hover, [role="button"]:hover svg[class*="trash"] {
  transform: rotate(-15deg) !important;
}

/* Edit / Pencil */
button:hover svg[class*="edit"], button:hover svg[class*="pencil"],
button:hover .dsh-icon-edit, .dsh-icon-edit:hover, [role="button"]:hover svg[class*="edit"] {
  transform: rotate(-15deg) !important;
}

/* Plus / Add / New */
button:hover svg[class*="plus"], button:hover svg[class*="add"],
button:hover .dsh-icon-plus, .dsh-icon-plus:hover, [role="button"]:hover svg[class*="plus"] {
  transform: rotate(90deg) !important;
}

/* Pin */
button:hover svg[class*="pin"], .dsh-tree-sessionRow:hover svg[class*="pin"],
button:hover .dsh-icon-pin, .dsh-icon-pin:hover, [role="button"]:hover svg[class*="pin"] {
  transform: rotate(-18deg) !important;
}

/* Search */
button:hover svg[class*="search"], button:hover .dsh-icon-search, .dsh-icon-search:hover, [role="button"]:hover svg[class*="search"] {
  transform: rotate(-12deg) !important;
}

/* Settings / Sliders / Gear */
button:hover svg[class*="setting"], button:hover svg[class*="gear"], button:hover svg[class*="slider"],
button:hover .dsh-icon-sliders, button:hover .dsh-icon-settings, .dsh-icon-sliders:hover, .dsh-icon-settings:hover, [role="button"]:hover svg[class*="setting"] {
  transform: rotate(45deg) !important;
}

/* Terminal / Code / Prompt */
button:hover svg[class*="terminal"], button:hover svg[class*="code"], .dsh-tree-sessionRow:hover svg[class*="terminal"],
button:hover .dsh-icon-terminal, .dsh-icon-terminal:hover, [role="button"]:hover svg[class*="terminal"] {
  transform: translateX(2px) !important;
}

/* Folder */
button:hover svg[class*="folder"], .dsh-tree-projectRow:hover svg[class*="folder"],
button:hover .dsh-icon-folder, .dsh-icon-folder:hover, [role="button"]:hover svg[class*="folder"] {
  transform: translateY(-1.5px) !important;
}

/* Containers / Box / Cube */
button:hover svg[class*="container"], button:hover svg[class*="box"], button:hover svg[class*="cube"],
button:hover .dsh-icon-containers, .dsh-icon-containers:hover, [role="button"]:hover svg[class*="container"] {
  transform: translateY(-1.5px) !important;
}

/* Chat / Conversation / Message */
button:hover svg[class*="chat"], button:hover svg[class*="message"], .dsh-tree-sessionRow:hover svg[class*="chat"],
button:hover .dsh-icon-chat, .dsh-icon-chat:hover, [role="button"]:hover svg[class*="chat"] {
  transform: translateY(-1px) !important;
}

/* Mic / Voice */
button:hover svg[class*="mic"], button:hover svg[class*="voice"], button:hover svg[class*="audio"],
button:hover .dsh-icon-mic, .dsh-icon-mic:hover, [role="button"]:hover svg[class*="mic"] {
  transform: translateY(-1px) !important;
}

/* Dock / Panel Toggle */
button:hover svg[class*="dock"], button:hover svg[class*="panel"],
button:hover .dsh-icon-dock, .dsh-icon-dock:hover, [role="button"]:hover svg[class*="dock"] {
  transform: translateX(1.5px) !important;
}

/* Branch / Git */
button:hover svg[class*="branch"], button:hover svg[class*="git"],
button:hover .dsh-icon-branch, .dsh-icon-branch:hover, [role="button"]:hover svg[class*="branch"] {
  transform: rotate(15deg) !important;
}

/* Eye / Preview */
button:hover svg[class*="eye"], button:hover svg[class*="view"],
button:hover .dsh-icon-eye, .dsh-icon-eye:hover, [role="button"]:hover svg[class*="eye"] {
  transform: translateY(-1px) !important;
}

/* Copy */
button:hover svg[class*="copy"], button:hover .dsh-icon-copy, .dsh-icon-copy:hover, [role="button"]:hover svg[class*="copy"] {
  transform: translateY(-1px) !important;
}

/* Cut / Scissors */
button:hover svg[class*="cut"], button:hover svg[class*="scissors"], button:hover .dsh-icon-cut, .dsh-icon-cut:hover, [role="button"]:hover svg[class*="cut"] {
  transform: rotate(-15deg) !important;
}

/* Ellipsis / More */
button:hover svg[class*="ellipsis"], button:hover svg[class*="more"], button:hover .dsh-icon-ellipsis, .dsh-icon-ellipsis:hover, [role="button"]:hover svg[class*="ellipsis"] {
  transform: rotate(90deg) !important;
}

/* Chevron / Arrow */
.dsh-tree-projectRow:hover .dsh-tree-arrow, .dsh-tree-projectRow:hover svg[class*="chevron"], .dsh-tree-projectRow:hover svg[class*="arrow"] {
  transform: translateX(1.5px) !important;
}
.dsh-tree-projectRow:hover .dsh-tree-arrowOpen {
  transform: rotate(90deg) translateY(-1px) !important;
}

.dsh-model-star-btn {
  transition: color 150ms ease, opacity 150ms ease;
  cursor: pointer;
}
.dsh-model-star-btn:hover {
  opacity: 1;
}

@keyframes dsh-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.dsh-spinning {
  animation: dsh-spin 1s linear infinite !important;
}
.dsh-tree-sessionTitle {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 18px;
  margin-left: 4px;
}
.dsh-term-tabs::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
.dsh-term-tabs {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
`;

    var stylesInjected = false;
    function ensureTreeStyles() {
      if (stylesInjected || typeof document === 'undefined') return;
      var el = document.createElement("style");
      el.textContent = TREE_STYLES;
      document.head.appendChild(el);
      stylesInjected = true;
    }

    var modelDecoratorInstalled = false;
    function ensureModelPickerDecoration() {
      if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
      if (modelDecoratorInstalled) return;
      modelDecoratorInstalled = true;

      var getFavoriteModels = function () {
        try {
          var raw = window.localStorage.getItem('dsh_favorite_models');
          return raw ? JSON.parse(raw) : [];
        } catch (e) {
          return [];
        }
      };

      var setFavoriteModels = function (favs) {
        try {
          window.localStorage.setItem('dsh_favorite_models', JSON.stringify(favs));
        } catch (e) {}
      };

      var STAR_GRAY_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
      var STAR_GOLD_SVG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="#eab308" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

      var updateTimer = null;
      var scheduleUpdate = function () {
        if (updateTimer) clearTimeout(updateTimer);
        updateTimer = setTimeout(updateModelDecorations, 100);
      };

      var updateModelDecorations = function () {
        // 1. Remove old inline brand icons if any
        var oldBrandIcons = document.querySelectorAll('.dsh-prov-brand-icon');
        oldBrandIcons.forEach(function (icon) { icon.remove(); });

        // 2. Decorate model dropdown options with Star/Favorite buttons and build Favorites group at top
        var modelMenus = document.querySelectorAll('[role="menu"][id*="menu"], [class*="ModelSelect_menu"]');
        modelMenus.forEach(function (menu) {
          var options = menu.querySelectorAll('button[role="menuitemradio"], button[class*="option"]');
          if (options.length === 0) return;

          var favs = getFavoriteModels();
          var groupsContainer = menu.querySelector('[class*="groups"]') || menu;
          var favOptionsMap = {};

          var stopAll = function (e) {
            if (e) {
              e.preventDefault();
              e.stopPropagation();
              if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
            }
          };

          options.forEach(function (opt) {
            if (opt.closest('.dsh-favorites-group')) return;

            var modelNameEl = opt.querySelector('[class*="modelName"]') || opt;
            var modelKey = (opt.getAttribute('title') || modelNameEl.textContent || '').trim();
            if (!modelKey) return;

            var isFav = favs.indexOf(modelKey) !== -1;
            if (isFav) {
              favOptionsMap[modelKey] = opt;
            }

            var starBtn = opt.querySelector('.dsh-model-star-btn');
            if (!starBtn) {
              starBtn = document.createElement('span');
              starBtn.setAttribute('role', 'button');
              starBtn.setAttribute('tabindex', '0');
              starBtn.className = 'dsh-model-star-btn';
              starBtn.style.border = 'none';
              starBtn.style.background = 'transparent';
              starBtn.style.padding = '0';
              starBtn.style.width = '20px';
              starBtn.style.height = '20px';
              starBtn.style.cursor = 'pointer';
              starBtn.style.display = 'inline-flex';
              starBtn.style.alignItems = 'center';
              starBtn.style.justifyContent = 'center';
              starBtn.style.flex = '0 0 20px';
              starBtn.style.flexShrink = '0';
              starBtn.style.marginLeft = 'auto';
              starBtn.style.zIndex = '10';

              var toggleFav = function (e) {
                stopAll(e);
                var currentFavs = getFavoriteModels();
                var idx = currentFavs.indexOf(modelKey);
                if (idx === -1) currentFavs.push(modelKey);
                else currentFavs.splice(idx, 1);
                setFavoriteModels(currentFavs);
                scheduleUpdate();
              };

              starBtn.addEventListener('pointerdown', function (e) { stopAll(e); toggleFav(e); });
              starBtn.addEventListener('mousedown', function (e) { stopAll(e); });
              starBtn.addEventListener('pointerup', function (e) { stopAll(e); });
              starBtn.addEventListener('mouseup', function (e) { stopAll(e); });
              starBtn.addEventListener('click', function (e) { stopAll(e); });

              var copyEl = opt.querySelector('[class*="optionCopy"]');
              var checkEl = opt.querySelector('[class*="check"]');
              if (checkEl) {
                opt.insertBefore(starBtn, checkEl);
                if (!checkEl.querySelector('svg') && !checkEl.textContent.trim()) {
                  checkEl.style.display = 'none';
                } else {
                  checkEl.style.display = 'grid';
                }
              } else if (copyEl && copyEl.nextSibling) {
                opt.insertBefore(starBtn, copyEl.nextSibling);
              } else {
                opt.appendChild(starBtn);
              }
            } else {
              var checkElExisting = opt.querySelector('[class*="check"]');
              if (checkElExisting) {
                if (!checkElExisting.querySelector('svg') && !checkElExisting.textContent.trim()) {
                  checkElExisting.style.display = 'none';
                } else {
                  checkElExisting.style.display = 'grid';
                }
              }
            }

            starBtn.title = isFav ? 'Remove from Favorites' : 'Add to Favorites';
            starBtn.style.color = isFav ? '#eab308' : 'var(--dsw-alias-label-tertiary, #888)';
            starBtn.innerHTML = isFav ? STAR_GOLD_SVG : STAR_GRAY_SVG;
          });

          // Build or update Favorites section at top of menu
          var existingFavGroup = groupsContainer.querySelector('.dsh-favorites-group');
          var favKeys = Object.keys(favOptionsMap);

          if (favKeys.length === 0) {
            if (existingFavGroup) existingFavGroup.remove();
          } else {
            if (!existingFavGroup) {
              existingFavGroup = document.createElement('section');
              existingFavGroup.className = 'dsh-favorites-group';
              existingFavGroup.setAttribute('role', 'group');
              existingFavGroup.style.display = 'flex';
              existingFavGroup.style.flexDirection = 'column';
              existingFavGroup.style.marginBottom = '6px';
              existingFavGroup.style.paddingBottom = '4px';
              existingFavGroup.style.borderBottom = '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))';

              var titleDiv = document.createElement('div');
              titleDiv.className = 'dsh-favorites-title';
              titleDiv.style.padding = '4px 10px 2px';
              titleDiv.style.fontSize = '10.5px';
              titleDiv.style.fontWeight = '700';
              titleDiv.style.color = '#eab308';
              titleDiv.style.textTransform = 'uppercase';
              titleDiv.style.letterSpacing = '0.5px';
              titleDiv.style.display = 'flex';
              titleDiv.style.alignItems = 'center';
              titleDiv.style.gap = '4px';
              titleDiv.innerHTML = '<span>★ Favorites</span>';
              existingFavGroup.appendChild(titleDiv);

              groupsContainer.insertBefore(existingFavGroup, groupsContainer.firstChild);
            }

            var oldClones = existingFavGroup.querySelectorAll('.dsh-fav-cloned-option');
            oldClones.forEach(function (c) { c.remove(); });

            favKeys.forEach(function (key) {
              var origOpt = favOptionsMap[key];
              if (!origOpt) return;
              var clone = origOpt.cloneNode(true);
              clone.className = origOpt.className + ' dsh-fav-cloned-option';
              clone.addEventListener('click', function (e) {
                if (e.target.closest('.dsh-model-star-btn')) return;
                origOpt.click();
              });

              var cloneStar = clone.querySelector('.dsh-model-star-btn');
              if (cloneStar) {
                var handleCloneToggle = function (e) {
                  stopAll(e);
                  var currentFavs = getFavoriteModels();
                  var idx = currentFavs.indexOf(key);
                  if (idx !== -1) {
                    currentFavs.splice(idx, 1);
                    setFavoriteModels(currentFavs);
                    scheduleUpdate();
                  }
                };
                cloneStar.addEventListener('pointerdown', function (e) { stopAll(e); handleCloneToggle(e); });
                cloneStar.addEventListener('mousedown', function (e) { stopAll(e); });
                cloneStar.addEventListener('pointerup', function (e) { stopAll(e); });
                cloneStar.addEventListener('mouseup', function (e) { stopAll(e); });
                cloneStar.addEventListener('click', function (e) { stopAll(e); });
              }

              var cloneCheck = clone.querySelector('[class*="check"]');
              if (cloneCheck) {
                if (!cloneCheck.querySelector('svg') && !cloneCheck.textContent.trim()) {
                  cloneCheck.style.display = 'none';
                } else {
                  cloneCheck.style.display = 'grid';
                }
              }
              existingFavGroup.appendChild(clone);
            });
          }
        });
      };

      var observer = new MutationObserver(scheduleUpdate);
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }
      scheduleUpdate();
    }

    var PROVIDERS_CATALOG = [
      {
        id: "antigravity",
        name: "Google Antigravity",
        category: "ai",
        description: "Google Antigravity project credentials & multi-model quota pools",
        prefixes: ["ANTIGRAVITY_"],
        defaultKeys: ["ANTIGRAVITY_PROJECT"],
        probeIds: ["antigravity-sub"],
        oauthProviderId: null,
        hasSubscription: true,
        hasDualAntigravityQuotas: true,
        models: [
          { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash", context: "1M", tags: ["Reasoning", "Agentic Coding", "Multimodal"], isDefault: true },
          { id: "gemini-3.6-flash", name: "Gemini 3.6 Flash", context: "1M", tags: ["Fast", "Multimodal", "Tools"] },
          { id: "gemini-3.1-pro", name: "Gemini 3.1 Pro", context: "1M", tags: ["Deep Reasoning", "Architecture", "1M Context"] },
        ],
      },
      {
        id: "ollama",
        name: "Ollama (Local Inference)",
        category: "ai",
        description: "Local model runner on host (127.0.0.1:11434) running Qwen 2.5/3.8, DeepSeek R1 & Llama 3",
        prefixes: ["OLLAMA_"],
        defaultKeys: ["OLLAMA_HOST"],
        probeIds: ["ollama-local"],
        oauthProviderId: null,
        hasSubscription: false,
        models: [
          { id: "qwen3.8:27b", name: "Qwen 3.8 27B", context: "262k", tags: ["27.3B Q4_K_M", "Tools", "Thinking", "Vision", "Coding"], isDefault: true },
        ],
      },
      {
        id: "anthropic",
        name: "Anthropic / Claude",
        category: "ai",
        description: "Claude Code embedded runner, subscription OAuth, and Anthropic API keys",
        prefixes: ["CLAUDE_", "ANTHROPIC_"],
        defaultKeys: ["CLAUDE_SUB_OAUTH_TOKEN", "CLAUDE_API_KEY", "ANTHROPIC_API_KEY"],
        probeIds: ["claude-sub", "anthropic-api"],
        oauthProviderId: "claude",
        hasSubscription: true,
        models: [
          { id: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet", context: "200k", tags: ["Reasoning", "Coding", "Vision", "Tools"], isDefault: true },
          { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", context: "200k", tags: ["Coding", "Vision", "Tools"] },
          { id: "claude-3-5-haiku", name: "Claude 3.5 Haiku", context: "200k", tags: ["Fast", "Tools"] },
          { id: "claude-3-opus", name: "Claude 3 Opus", context: "200k", tags: ["Reasoning", "Analysis"] },
        ],
      },
      {
        id: "openai",
        name: "OpenAI / ChatGPT",
        category: "ai",
        description: "ChatGPT Codex subscription tokens and OpenAI platform API keys",
        prefixes: ["OPENAI_", "CODEX_CHATGPT_"],
        defaultKeys: ["OPENAI_API_KEY", "CODEX_CHATGPT_ACCESS_TOKEN"],
        probeIds: ["openai-api"],
        oauthProviderId: null,
        hasSubscription: true,
        models: [
          { id: "gpt-4o", name: "GPT-4o (Omni)", context: "128k", tags: ["Multimodal", "Fast", "Tools"], isDefault: true },
          { id: "gpt-4o-mini", name: "GPT-4o Mini", context: "128k", tags: ["Fast", "Lightweight"] },
          { id: "o1", name: "OpenAI o1", context: "200k", tags: ["Deep Reasoning", "STEM"] },
          { id: "o3-mini", name: "OpenAI o3-mini", context: "200k", tags: ["Reasoning", "Coding"] },
        ],
      },
      {
        id: "deepseek",
        name: "DeepSeek",
        category: "ai",
        description: "DeepSeek platform API key (DeepSeek V3 & R1)",
        prefixes: ["DEEPSEEK_"],
        defaultKeys: ["DEEPSEEK_API_KEY"],
        probeIds: ["deepseek-api"],
        oauthProviderId: null,
        hasSubscription: false,
        models: [
          { id: "deepseek-chat", name: "DeepSeek-V3", context: "64k", tags: ["671B MoE", "Coding", "General"], isDefault: true },
          { id: "deepseek-reasoner", name: "DeepSeek-R1", context: "64k", tags: ["Reasoning", "Math", "Logic"] },
        ],
      },
      {
        id: "google",
        name: "Google Gemini",
        category: "ai",
        description: "Google Gemini OAuth tokens and Gemini API keys",
        prefixes: ["GEMINI_"],
        defaultKeys: ["GEMINI_SUB_OAUTH_TOKEN", "GEMINI_API_KEY"],
        probeIds: ["gemini-sub", "gemini-api"],
        oauthProviderId: null,
        hasSubscription: true,
        models: [
          { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", context: "1M", tags: ["Multimodal", "Realtime", "Tools"], isDefault: true },
          { id: "gemini-2.0-pro-exp", name: "Gemini 2.0 Pro", context: "2M", tags: ["Complex Reasoning", "Coding"] },
          { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", context: "2M", tags: ["2M Context", "Analysis"] },
        ],
      },
      {
        id: "grok",
        name: "xAI / Grok",
        category: "ai",
        description: "Grok subscription OAuth and xAI API keys",
        prefixes: ["GROK_", "XAI_"],
        defaultKeys: ["GROK_SUB_OAUTH_TOKEN", "XAI_API_KEY"],
        probeIds: ["grok-sub", "grok-api"],
        oauthProviderId: "grok",
        hasSubscription: true,
        models: [
          { id: "grok-2", name: "Grok 2", context: "128k", tags: ["Reasoning", "Realtime Search"], isDefault: true },
          { id: "grok-2-vision", name: "Grok 2 Vision", context: "32k", tags: ["Vision", "Multimodal"] },
        ],
      },
      {
        id: "kimi",
        name: "Moonshot / Kimi",
        category: "ai",
        description: "Kimi subscription OAuth and Moonshot API keys",
        prefixes: ["KIMI_"],
        defaultKeys: ["KIMI_SUB_OAUTH_TOKEN", "KIMI_API_KEY"],
        probeIds: ["kimi-sub"],
        oauthProviderId: "kimi",
        hasSubscription: true,
        models: [
          { id: "kimi-k1.5", name: "Kimi k1.5", context: "128k", tags: ["Long Context", "Reasoning"], isDefault: true },
          { id: "moonshot-v1-128k", name: "Moonshot v1 128k", context: "128k", tags: ["Analysis"] },
          { id: "moonshot-v1-32k", name: "Moonshot v1 32k", context: "32k", tags: ["Fast"] },
        ],
      },
      {
        id: "cursor",
        name: "Cursor",
        category: "ai",
        description: "Cursor subscription token and embedded runner",
        prefixes: ["CURSOR_"],
        defaultKeys: ["CURSOR_SUB_TOKEN", "CURSOR_EMAIL"],
        probeIds: [],
        oauthProviderId: "cursor",
        hasSubscription: true,
        models: [
          { id: "cursor-fast", name: "Cursor Fast", context: "128k", tags: ["Autocompletion", "Edit"], isDefault: true },
          { id: "cursor-small", name: "Cursor Small", context: "64k", tags: ["Speed"] },
        ],
      },
      {
        id: "github",
        name: "GitHub Platform",
        category: "platform",
        description: "GitHub CLI, Copilot bridge, and repository integrations (Account: marius-patrik)",
        prefixes: ["GITHUB_"],
        defaultKeys: ["GITHUB_OAUTH_TOKEN", "GITHUB_USER"],
        probeIds: [],
        oauthProviderId: "github",
        hasSubscription: true,
        models: [
          { id: "copilot-chat", name: "Copilot Chat", context: "128k", tags: ["Coding", "Workspace"], isDefault: true },
        ],
      },
      {
        id: "zen",
        name: "OpenCode Zen",
        category: "ai",
        description: "OpenCode Zen API key and smart routing",
        prefixes: ["ZEN_"],
        defaultKeys: ["ZEN_API_KEY"],
        probeIds: ["zen"],
        oauthProviderId: null,
        hasSubscription: false,
        models: [
          { id: "zen-big-picker", name: "Zen Big Picker", context: "128k", tags: ["Smart Routing"], isDefault: true },
          { id: "zen-fast", name: "Zen Fast", context: "64k", tags: ["Low Latency"] },
        ],
      },
      {
        id: "other",
        name: "Other Providers",
        category: "ai",
        description: "Custom endpoints, Mistral, Groq, OpenRouter, and additional API keys",
        prefixes: ["MISTRAL_", "GROQ_", "OPENROUTER_", "CUSTOM_"],
        defaultKeys: ["MISTRAL_API_KEY", "GROQ_API_KEY", "OPENROUTER_API_KEY"],
        probeIds: [],
        oauthProviderId: null,
        hasSubscription: false,
        models: [],
      },
    ];

    function ProvidersGlyph(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-providers';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("line", { x1: "22", x2: "2", y1: "12", y2: "12" }),
        h("path", { d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" }),
        h("line", { x1: "6", x2: "6.01", y1: "16", y2: "16" }),
        h("line", { x1: "10", x2: "10.01", y1: "16", y2: "16" })
      );
    }

    function TerminalsGlyph(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-terminal';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("polyline", { points: "4 17 10 11 4 5" }),
        h("line", { x1: "12", x2: "20", y1: "19", y2: "19" })
      );
    }

    function ContainersGlyph(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-containers';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("path", { d: "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" }),
        h("path", { d: "m7 16.5-4.74-2.85" }),
        h("path", { d: "m7 16.5 5-3" }),
        h("path", { d: "M7 16.5v5.17" }),
        h("path", { d: "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" }),
        h("path", { d: "m17 16.5-5-3" }),
        h("path", { d: "m17 16.5 4.74-2.85" }),
        h("path", { d: "M17 16.5v5.17" }),
        h("path", { d: "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" }),
        h("path", { d: "M12 8 7.26 5.15" }),
        h("path", { d: "m12 8 4.74-2.85" }),
        h("path", { d: "M12 13.5V8" })
      );
    }

    function ToolsGlyph(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-tools';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })
      );
    }

    function LoopsGlyph(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-refresh';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
        h("path", { d: "M21 3v5h-5" }),
        h("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
        h("path", { d: "M8 16H3v5" })
      );
    }

    function TriangleRightFill14(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-chevron';
      var style = props && props.style ? props.style : undefined;
      return h("svg", {
        width: size, height: size, className: className, style: style, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("polyline", { points: "9 18 15 12 9 6" })
      );
    }

    function PassGlyph(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-pass';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("circle", { cx: "7.5", cy: "15.5", r: "5.5" }),
        h("path", { d: "m21 2-9.6 9.6" }),
        h("path", { d: "m15.5 7.5 3 3L22 7l-3-3" })
      );
    }

    function DataGlyph(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-data';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("polygon", { points: "12 2 2 7 12 12 22 7 12 2" }),
        h("polyline", { points: "2 17 12 22 22 17" }),
        h("polyline", { points: "2 12 12 17 22 12" })
      );
    }

    function ChatGlyph(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-chat';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
      );
    }

    function RefreshGlyph(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-refresh';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
        h("path", { d: "M21 3v5h-5" }),
        h("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
        h("path", { d: "M8 16H3v5" })
      );
    }

    function TrashGlyph(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-trash';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("path", { d: "M3 6h18" }),
        h("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
        h("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }),
        h("line", { x1: "10", x2: "10", y1: "11", y2: "17" }),
        h("line", { x1: "14", x2: "14", y1: "11", y2: "17" })
      );
    }

    function EditGlyph(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-edit';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("path", { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" }),
        h("path", { d: "m15 5 4 4" })
      );
    }

    function FileGlyph(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-file';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("path", { d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" }),
        h("path", { d: "M14 2v4a2 2 0 0 0 2 2h4" })
      );
    }

    function SubagentGlyph(props) {
      var size = props && props.size ? props.size : 12;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-subagent';
      return h("svg", {
        width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true",
      },
        h("circle", { cx: "12", cy: "18", r: "3" }),
        h("circle", { cx: "6", cy: "6", r: "3" }),
        h("circle", { cx: "18", cy: "6", r: "3" }),
        h("path", { d: "M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" }),
        h("path", { d: "M12 12v3" })
      );
    }

    function CutGlyph(props) {
      var size = (props && props.size) ? props.size : 13;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-cut';
      return h("svg", { width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("circle", { cx: "6", cy: "6", r: "3" }),
        h("circle", { cx: "6", cy: "18", r: "3" }),
        h("line", { x1: "20", y1: "4", x2: "8.12", y2: "15.88" }),
        h("line", { x1: "14.47", y1: "14.48", x2: "20", y2: "20" }),
        h("line", { x1: "8.12", y1: "8.12", x2: "12", y2: "12" })
      );
    }

    function CopyGlyph(props) {
      var size = (props && props.size) ? props.size : 13;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-copy';
      return h("svg", { width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
        h("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
      );
    }

    function PlusGlyph(props) {
      var size = (props && props.size) || 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-plus';
      return h("svg", { width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "M5 12h14" }),
        h("path", { d: "M12 5v14" })
      );
    }

    function EllipsisGlyph(props) {
      var size = (props && props.size) || 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-ellipsis';
      return h("svg", { width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("circle", { cx: "12", cy: "12", r: "1" }),
        h("circle", { cx: "19", cy: "12", r: "1" }),
        h("circle", { cx: "5", cy: "12", r: "1" })
      );
    }

    function EyeGlyph(props) {
      var size = (props && props.size) || 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-eye';
      return h("svg", { width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" }),
        h("circle", { cx: "12", cy: "12", r: "3" })
      );
    }

    function DockToggleGlyph(props) {
      var size = (props && props.size) || 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-dock';
      var style = (props && props.style) || undefined;
      return h("svg", { width: size, height: size, className: className, style: style, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
        h("path", { d: "M9 3v18" })
      );
    }

    function BranchGlyph(props) {
      var size = (props && props.size) || 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-branch';
      return h("svg", { width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("line", { x1: "6", x2: "6", y1: "3", y2: "15" }),
        h("circle", { cx: "18", cy: "6", r: "3" }),
        h("circle", { cx: "6", cy: "18", r: "3" }),
        h("path", { d: "M18 9a9 9 0 0 1-9 9" })
      );
    }

    function FolderOpenGlyph(props) {
      var size = (props && props.size) || 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-folder';
      return h("svg", { width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" })
      );
    }

    function SearchGlyph(props) {
      var size = (props && props.size) || 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-search';
      return h("svg", { width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("circle", { cx: "11", cy: "11", r: "8" }),
        h("path", { d: "m21 21-4.3-4.3" })
      );
    }

    function MicGlyph(props) {
      var size = (props && props.size) || 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-mic';
      var style = (props && props.style) || undefined;
      return h("svg", { width: size, height: size, className: className, style: style, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" }),
        h("path", { d: "M19 10v2a7 7 0 0 1-14 0v-2" }),
        h("line", { x1: "12", x2: "12", y1: "19", y2: "22" })
      );
    }

    function formatTokenCount(num) {
      if (num === undefined || num === null || isNaN(num)) return "0";
      if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
      if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
      if (num >= 1000) return (num / 1000).toFixed(1) + "k";
      return String(num);
    }

    // High-speed ANSI to HTML converter
    function ansiToHtml(raw) {
      if (!raw) return "";
      var text = raw
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      var COLOR_MAP = {
        30: "#4e5569", 31: "#ff7b72", 32: "#7ee787", 33: "#f2cc60",
        34: "#79c0ff", 35: "#d2a8ff", 36: "#56d4dd", 37: "#e6edf3",
        90: "#8b949e", 91: "#ffa198", 92: "#aff5b4", 93: "#fbe59e",
        94: "#a5d6ff", 95: "#e2c5ff", 96: "#76e3ea", 97: "#ffffff",
      };

      var BG_MAP = {
        40: "#161b22", 41: "#b62324", 42: "#1f6feb", 43: "#9e6a03",
        44: "#1f6feb", 45: "#8957e5", 46: "#1b7c83", 47: "#8b949e",
      };

      var parts = text.split(/\x1b\[([0-9;]+)m/);
      var html = "";
      var curColor = null;
      var curBg = null;
      var isBold = false;
      var isDim = false;
      var isUnderline = false;

      for (var i = 0; i < parts.length; i++) {
        if (i % 2 === 1) {
          var codes = parts[i].split(";");
          for (var c = 0; c < codes.length; c++) {
            var code = parseInt(codes[c], 10);
            if (code === 0) {
              curColor = null; curBg = null; isBold = false; isDim = false; isUnderline = false;
            } else if (code === 1) {
              isBold = true;
            } else if (code === 2) {
              isDim = true;
            } else if (code === 4) {
              isUnderline = true;
            } else if (COLOR_MAP[code]) {
              curColor = COLOR_MAP[code];
            } else if (BG_MAP[code]) {
              curBg = BG_MAP[code];
            }
          }
        } else {
          var chunk = parts[i];
          if (chunk) {
            var style = "";
            if (curColor) style += "color:" + curColor + ";";
            if (curBg) style += "background:" + curBg + ";";
            if (isBold) style += "font-weight:700;";
            if (isDim) style += "opacity:0.65;";
            if (isUnderline) style += "text-decoration:underline;";

            if (style) {
              html += '<span style="' + style + '">' + chunk + "</span>";
            } else {
              html += chunk;
            }
          }
        }
      }
      return html;
    }

    function ProviderBrandIcon(props) {
      var id = (props.id || "").toLowerCase();
      var size = props.size || 18;

      var appPath = null;
      if (id === "cursor") appPath = "/Applications/Cursor.app";
      else if (id === "vscode" || id === "code") appPath = "/Applications/Visual Studio Code.app";
      else if (id === "chrome" || id === "google") appPath = "/Applications/Google Chrome.app";
      else if (id === "safari") appPath = "/Applications/Safari.app";
      else if (id === "terminal" || id === "tmux") appPath = "/System/Applications/Utilities/Terminal.app";

      if (appPath) {
        return h("img", {
          src: "/quotas/api/fs/icon?path=" + encodeURIComponent(appPath),
          width: size,
          height: size,
          alt: id,
          className: "dsh-icon-animated",
          style: {
            width: size + "px",
            height: size + "px",
            objectFit: "contain",
            display: "inline-flex",
            verticalAlign: "middle",
            flexShrink: 0,
            borderRadius: "3px",
          },
          onError: function (e) {
            e.currentTarget.style.display = "none";
          }
        });
      }

      // If no real native macOS app icon exists on disk, render nothing
      return null;
    }

    // 1a. SETTINGS: ACCOUNTS SECTION
    function AccountsSection() {
      var state = React.useState({
        accounts: [],
        snapshots: [],
        integrationsMeta: null,
        loading: true,
        error: null,
      });
      var data = state[0], setData = state[1];
      var expandedKeysState = React.useState({});
      var expandedKeys = expandedKeysState[0], setExpandedKeys = expandedKeysState[1];
      var revealedState = React.useState({});
      var revealed = revealedState[0], setRevealed = revealedState[1];
      var editModalState = React.useState(null);
      var editModal = editModalState[0], setEditModal = editModalState[1];
      var addKeyModalState = React.useState(null);
      var addKeyModal = addKeyModalState[0], setAddKeyModal = addKeyModalState[1];
      var oauthModalState = React.useState(null);
      var oauthModal = oauthModalState[0], setOauthModal = oauthModalState[1];
      var probingState = React.useState({});
      var probing = probingState[0], setProbing = probingState[1];

      var load = React.useCallback(function () {
        setData(function (s) { return Object.assign({}, s, { loading: true }); });
        Promise.all([
          fetch(VAULT_API + "/accounts").then(function (r) { return r.json(); }).catch(function () { return { rows: [] }; }),
          fetch(QUOTAS_API + "/snapshots").then(function (r) { return r.json(); }).catch(function () { return { snapshots: [] }; }),
          fetch(QUOTAS_API + "/integrations").then(function (r) { return r.json(); }).catch(function () { return null; }),
        ]).then(function (res) {
          setData({
            accounts: (res[0] && res[0].rows) || [],
            snapshots: (res[1] && res[1].snapshots) || [],
            integrationsMeta: res[2] || null,
            loading: false,
            error: null,
          });
        }).catch(function (err) {
          setData(function (s) { return Object.assign({}, s, { loading: false, error: err.message }); });
        });
      }, []);

      React.useEffect(function () { load(); }, [load]);

      var handleProbe = function (providerId) {
        setProbing(function (s) { var n = Object.assign({}, s); n[providerId] = true; return n; });
        fetch(QUOTAS_API + "/refresh/" + encodeURIComponent(providerId), { method: "POST" })
          .then(function () { load(); })
          .finally(function () { setProbing(function (s) { var n = Object.assign({}, s); n[providerId] = false; return n; }); });
      };

      var handleProbeAll = function () {
        setProbing(function (s) { return Object.assign({}, s, { all: true }); });
        fetch(QUOTAS_API + "/refresh", { method: "POST" })
          .then(function () { load(); })
          .finally(function () { setProbing(function (s) { var n = Object.assign({}, s); n.all = false; return n; }); });
      };

      var toggleKeys = function (provId) { setExpandedKeys(function (s) { var n = Object.assign({}, s); n[provId] = !n[provId]; return n; }); };

      var toggleReveal = function (keyId) {
        if (revealed[keyId]) {
          setRevealed(function (s) { var n = Object.assign({}, s); delete n[keyId]; return n; });
          return;
        }
        var parts = keyId.split("::");
        var ref = parts[0], account = parts[1];
        fetch(VAULT_API + "/accounts/" + encodeURIComponent(ref) + "?account=" + encodeURIComponent(account))
          .then(function (r) { return r.json(); })
          .then(function (res) {
            setRevealed(function (s) { var n = Object.assign({}, s); n[keyId] = res.value || "(empty)"; return n; });
          });
      };

      return h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "20px", padding: "4px 0", maxWidth: "900px" } },
        h(
          "div",
          { style: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))", paddingBottom: "16px" } },
          h("div", null,
            h("h2", { style: { margin: "0 0 4px 0", fontSize: "18px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, "Accounts & Credentials"),
            h("div", { style: { fontSize: "13px", color: "var(--dsw-alias-label-secondary)" } }, "Manage AI platform API keys, subscription OAuth logins, and real sliding window token quotas.")
          ),
          h("div", { style: { display: "flex", gap: "8px" } },
            h("button", { onClick: handleProbeAll, disabled: probing.all, style: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "7px", background: "var(--dsw-alias-primary, #6366f1)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: probing.all ? "wait" : "pointer" } }, h(RefreshGlyph, { size: 14 }), probing.all ? "Probing All…" : "Probe All Health"),
            h("button", { onClick: load, style: { display: "inline-flex", alignItems: "center", padding: "7px 12px", borderRadius: "7px", background: "var(--dsw-alias-surface-l2, rgba(128,128,128,0.1))", border: "1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.2))", color: "var(--dsw-alias-label-primary)", cursor: "pointer" } }, h(RefreshGlyph, { size: 14 }))
          )
        ),
        PROVIDERS_CATALOG.filter(function (p) { return p.category === "ai" || p.hasSubscription || p.prefixes.length > 0; }).map(function (prov) {
          var provRows = (data.accounts || []).filter(function (r) { return prov.prefixes.some(function (p) { return r.ref && r.ref.startsWith(p); }); });
          var activeSnapshots = (data.snapshots || []).filter(function (s) { return prov.probeIds.indexOf(s.provider) !== -1; });
          var isConfigured = provRows.length > 0;
          var primarySnap = activeSnapshots[0];
          var status = primarySnap ? primarySnap.status : (isConfigured ? "available" : "unconfigured");
          var isLiveHealthy = status === "available" || status === "ok";
          var isDegraded = status === "error" || status === "degraded" || status === "rate_limited";
          var isKeysOpen = Boolean(expandedKeys[prov.id]);
          var isClaude = prov.id === "anthropic";
          var isAntigravity = prov.id === "antigravity";
          var claudeStats = data.integrationsMeta && data.integrationsMeta.claudeStats ? data.integrationsMeta.claudeStats : null;
          var antigravityQuotas = data.integrationsMeta && data.integrationsMeta.antigravity ? data.integrationsMeta.antigravity : null;

          return h(
            "div",
            { key: prov.id, style: { borderRadius: "10px", border: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.18))", background: "var(--dsw-alias-surface-l0, rgba(255,255,255,0.02))", overflow: "hidden", display: "flex", flexDirection: "column" } },
            h(
              "div",
              { style: { padding: "16px 20px", display: "flex", flexDirection: "column", gap: "14px", background: "var(--dsw-alias-surface-l1, rgba(128,128,128,0.03))", borderBottom: isKeysOpen ? "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.12))" : "none" } },
              h(
                "div",
                { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" } },
                h("div", { style: { display: "flex", flexDirection: "column", gap: "4px" } },
                  h("div", { style: { display: "flex", alignItems: "center", gap: "10px" } },
                    h(ProviderBrandIcon, { id: prov.id, size: 22 }),
                    h("span", { style: { fontSize: "15px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, prov.name),
                    h("span", { style: { display: "inline-flex", alignItems: "center", gap: "5px", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, background: isLiveHealthy ? "rgba(63, 185, 80, 0.15)" : isDegraded ? "rgba(248, 81, 73, 0.15)" : "rgba(128, 128, 128, 0.12)", color: isLiveHealthy ? "#3fb950" : isDegraded ? "#f85149" : "var(--dsw-alias-label-secondary)" } },
                      h("span", { style: { width: "6px", height: "6px", borderRadius: "50%", background: isLiveHealthy ? "#3fb950" : isDegraded ? "#f85149" : "#888", boxShadow: isLiveHealthy ? "0 0 6px #3fb950" : "none" } }),
                      isLiveHealthy ? "LIVE HEALTHY" : isDegraded ? "DEGRADED" : "UNCONFIGURED"
                    ),
                    prov.hasSubscription ? h("span", { style: { padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: "rgba(99, 102, 241, 0.12)", color: "var(--dsw-alias-primary, #6366f1)", border: "1px solid rgba(99, 102, 241, 0.25)" } }, "SUBSCRIPTION") : null
                  ),
                  h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, prov.description)
                ),
                h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                  prov.probeIds.length > 0 ? h("button", { onClick: function () { handleProbe(prov.probeIds[0]); }, disabled: probing[prov.probeIds[0]], style: { padding: "5px 10px", borderRadius: "6px", fontSize: "11px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l2)", color: "var(--dsw-alias-label-primary)", cursor: "pointer" } }, h(RefreshGlyph, { size: 12 }), probing[prov.probeIds[0]] ? "Testing…" : "Probe Health") : null,
                  prov.oauthProviderId ? h("button", { onClick: function () { setOauthModal({ providerId: prov.oauthProviderId, label: prov.name }); }, style: { padding: "5px 10px", borderRadius: "6px", fontSize: "11px", border: "1px solid #6366f1", background: "rgba(99, 102, 241, 0.1)", color: "#6366f1", cursor: "pointer" } }, h(PassGlyph, { size: 12 }), "Sign In (OAuth)") : null,
                  h("button", { onClick: function () { setAddKeyModal({ prov: prov, account: "default" }); }, style: { padding: "5px 10px", borderRadius: "6px", fontSize: "11px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l2)", color: "var(--dsw-alias-label-primary)", cursor: "pointer" } }, "+ Add Key")
                )
              ),
              isClaude && claudeStats ? h("div", { style: { display: "flex", flexDirection: "column", gap: "10px", padding: "12px 14px", borderRadius: "8px", background: "var(--dsw-alias-surface-l2, rgba(128,128,128,0.06))", border: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.1))" } },
                h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" } },
                  h("div", { style: { display: "flex", gap: "8px", alignItems: "baseline" } },
                    h("span", { style: { fontSize: "17px", fontWeight: 700, color: "var(--dsw-alias-label-primary)" } }, formatTokenCount(claudeStats.totalTokens) + " Tokens"),
                    h("span", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary)" } }, "(" + (claudeStats.totalTokens || 0).toLocaleString() + " total)")
                  ),
                  h("div", { style: { display: "flex", gap: "10px", fontSize: "11px", color: "var(--dsw-alias-label-secondary)" } },
                    h("span", null, h("strong", { style: { color: "var(--dsw-alias-label-primary)" } }, (claudeStats.messages || 0).toLocaleString()), " messages"),
                    h("span", null, h("strong", { style: { color: "var(--dsw-alias-label-primary)" } }, (claudeStats.totalToolCalls || 0).toLocaleString()), " tool calls")
                  )
                )
              ) : null,
              isAntigravity && antigravityQuotas ? h("div", { style: { display: "flex", flexDirection: "column", gap: "10px", padding: "12px 14px", borderRadius: "8px", background: "var(--dsw-alias-surface-l2, rgba(128,128,128,0.06))", border: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.1))" } },
                h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                  h("div", { style: { display: "flex", gap: "8px", alignItems: "baseline" } },
                    h("span", { style: { fontSize: "15px", fontWeight: 700, color: "var(--dsw-alias-label-primary)" } }, "Antigravity Multi-Pool Runtime"),
                    h("span", { style: { padding: "2px 7px", borderRadius: "10px", fontSize: "10px", fontWeight: 600, background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" } }, antigravityQuotas.status || "Active")
                  ),
                  h("div", { style: { fontSize: "11px", color: "var(--dsw-alias-label-secondary)" } }, "Context: " + (antigravityQuotas.contextWindow || "1M tokens"))
                )
              ) : null,
              h("div", { style: { display: "flex", gap: "10px", marginTop: "2px" } },
                h("button", { onClick: function () { toggleKeys(prov.id); }, style: { padding: "6px 12px", borderRadius: "6px", fontSize: "12px", border: "1px solid " + (isKeysOpen ? "#6366f1" : "var(--dsw-alias-border-l2)"), background: isKeysOpen ? "rgba(99, 102, 241, 0.1)" : "transparent", color: isKeysOpen ? "#6366f1" : "var(--dsw-alias-label-secondary)", cursor: "pointer" } }, h(PassGlyph, { size: 13 }), " Configured Keys & Accounts (" + provRows.length + ") " + (isKeysOpen ? "▲" : "▼"))
              )
            ),
            isKeysOpen ? h("div", { style: { padding: "16px 20px", background: "var(--dsw-alias-surface-l0, rgba(0,0,0,0.1))", display: "flex", flexDirection: "column", gap: "12px" } },
              provRows.length === 0 ? h("div", { style: { padding: "16px", textAlign: "center", fontSize: "12px", color: "var(--dsw-alias-label-tertiary)" } }, "No credentials configured. Click '+ Add Key' above.") : provRows.map(function (row) {
                var accountName = row.account || "default";
                var keyId = row.ref + "::" + accountName;
                var isRev = Boolean(revealed[keyId]);
                var valDisplay = isRev ? revealed[keyId] : (row.inVault ? "••••••••••••••••••••••••••••••••" : "(not set)");
                return h("div", { key: keyId, style: { padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--dsw-alias-border-l1)", background: "var(--dsw-alias-surface-l1)", display: "flex", flexDirection: "column", gap: "8px" } },
                  h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                    h("div", { style: { display: "flex", gap: "8px", alignItems: "center" } }, h("code", { style: { fontSize: "13px", fontWeight: 600 } }, row.ref), h("span", { style: { padding: "1px 6px", borderRadius: "4px", fontSize: "10px", background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" } }, "@" + accountName)),
                    h("div", { style: { display: "flex", gap: "6px" } },
                      h("button", { onClick: function () { toggleReveal(keyId); }, style: { padding: "4px 8px", borderRadius: "4px", fontSize: "11px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", cursor: "pointer" } }, isRev ? "Hide" : "Reveal"),
                      h("button", { onClick: function () { fetch(VAULT_API + "/accounts/" + encodeURIComponent(row.ref) + "?account=" + encodeURIComponent(accountName)).then(function (r) { return r.json(); }).then(function (res) { if (res.value) navigator.clipboard.writeText(res.value); }); }, style: { padding: "4px 8px", borderRadius: "4px", fontSize: "11px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", cursor: "pointer" } }, "Copy"),
                      h("button", { onClick: function () { setEditModal({ ref: row.ref, account: accountName }); }, style: { padding: "4px 8px", borderRadius: "4px", fontSize: "11px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", cursor: "pointer" } }, "Edit")
                    )
                  ),
                  h("code", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary)" } }, valDisplay)
                );
              })
            ) : null
          );
        }),
        editModal ? h(EditValueModal, { target: editModal, onClose: function () { setEditModal(null); }, onSaved: load }) : null,
        addKeyModal ? h(AddKeyModal, { target: addKeyModal, onClose: function () { setAddKeyModal(null); }, onSaved: load }) : null,
        oauthModal ? h(OAuthFlowModal, { target: oauthModal, onClose: function () { setOauthModal(null); }, onDone: load }) : null
      );
    }

    // 1b. SETTINGS: MODELS SECTION
    function ModelsSection() {
      var addModelModalState = React.useState(null);
      var addModelModal = addModelModalState[0], setAddModelModal = addModelModalState[1];

      return h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "20px", padding: "4px 0", maxWidth: "900px" } },
        h(
          "div",
          { style: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))", paddingBottom: "16px" } },
          h("div", null,
            h("h2", { style: { margin: "0 0 4px 0", fontSize: "18px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, "AI Models Catalog"),
            h("div", { style: { fontSize: "13px", color: "var(--dsw-alias-label-secondary)" } }, "Explore supported AI models by provider, context window capacities, reasoning tags, and custom model endpoints.")
          ),
          h("div", { style: { display: "flex", gap: "8px" } },
            h("button", { onClick: function () { setAddModelModal({ prov: PROVIDERS_CATALOG[0] }); }, style: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "7px", background: "var(--dsw-alias-primary, #6366f1)", color: "#fff", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer" } }, "+ Add Custom Model")
          )
        ),
        PROVIDERS_CATALOG.filter(function (p) { return p.models && p.models.length > 0; }).map(function (prov) {
          return h(
            "div",
            { key: "models::" + prov.id, style: { borderRadius: "10px", border: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.18))", background: "var(--dsw-alias-surface-l0, rgba(255,255,255,0.02))", overflow: "hidden", display: "flex", flexDirection: "column", padding: "16px 20px", gap: "12px" } },
            h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
              h("div", { style: { display: "flex", alignItems: "center", gap: "10px" } },
                h(ProviderBrandIcon, { id: prov.id, size: 20 }),
                h("span", { style: { fontSize: "14px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, prov.name),
                h("span", { style: { padding: "1px 6px", borderRadius: "10px", fontSize: "10.5px", background: "rgba(99,102,241,0.12)", color: "#6366f1", fontWeight: 600 } }, prov.models.length + " models")
              )
            ),
            h("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "10px" } },
              prov.models.map(function (m) {
                return h("div", { key: m.id, style: { padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--dsw-alias-border-l1)", background: "var(--dsw-alias-surface-l1)", display: "flex", flexDirection: "column", gap: "6px" } },
                  h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                    h("div", { style: { display: "flex", alignItems: "center", gap: "6px" } },
                      h(ProviderBrandIcon, { id: prov.id, size: 14 }),
                      h("span", { style: { fontSize: "13px", fontWeight: 600 } }, m.name)
                    ),
                    m.isDefault ? h("span", { style: { padding: "1px 5px", borderRadius: "3px", fontSize: "9px", fontWeight: 700, background: "#6366f1", color: "#fff" } }, "DEFAULT") : null
                  ),
                  h("code", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary)" } }, m.id),
                  h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "2px" } },
                    h("span", { style: { padding: "1px 5px", borderRadius: "3px", fontSize: "10px", background: "rgba(128,128,128,0.1)" } }, m.context + " ctx"),
                    (m.tags || []).map(function (tag) { return h("span", { key: tag, style: { padding: "1px 5px", borderRadius: "3px", fontSize: "10px", background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" } }, tag); })
                  )
                );
              })
            )
          );
        }),
        addModelModal ? h(AddModelModal, { target: addModelModal, onClose: function () { setAddModelModal(null); }, onSaved: function () {} }) : null
      );
    }

    // 1c. SETTINGS: APPS SECTION
    function AppsSection() {
      var state = React.useState({
        integrationsMeta: null,
        loading: true,
      });
      var data = state[0], setData = state[1];

      React.useEffect(function () {
        fetch(QUOTAS_API + "/integrations")
          .then(function (r) { return r.json(); })
          .then(function (res) { setData({ integrationsMeta: res, loading: false }); })
          .catch(function () { setData({ integrationsMeta: null, loading: false }); });
      }, []);

      var ollamaMeta = data.integrationsMeta && data.integrationsMeta.ollama ? data.integrationsMeta.ollama : null;

      return h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "20px", padding: "4px 0", maxWidth: "850px" } },
        h(
          "div",
          { style: { borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))", paddingBottom: "16px" } },
          h("h2", { style: { margin: "0 0 4px 0", fontSize: "18px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, "Developer Apps & Local Runners"),
          h("div", { style: { fontSize: "13px", color: "var(--dsw-alias-label-secondary)" } }, "Manage local inference runtimes (Ollama, vLLM), developer platforms, MCP tools, and speech engines.")
        ),
        // Ollama Local Runner
        h(
          "div",
          { style: { borderRadius: "10px", border: "1px solid var(--dsw-alias-border-l1)", background: "var(--dsw-alias-surface-l1)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
            h("div", { style: { display: "flex", alignItems: "center", gap: "10px" } },
              h(ProviderBrandIcon, { id: "ollama", size: 22 }),
              h("div", null,
                h("div", { style: { fontSize: "15px", fontWeight: 600 } }, "Ollama Local Engine"),
                h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "Local offline LLM runner on http://127.0.0.1:11434")
              )
            ),
            h("span", { style: { padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: ollamaMeta ? "rgba(99, 102, 241, 0.15)" : "rgba(128,128,128,0.15)", color: ollamaMeta ? "#6366f1" : "var(--dsw-alias-label-secondary)" } }, ollamaMeta ? "ONLINE" : "STANDBY")
          ),
          ollamaMeta ? h("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } },
            h("div", { style: { fontSize: "12px", fontWeight: 600 } }, "Installed Local Models:"),
            (ollamaMeta.availableModels || []).map(function (m) {
              return h("div", { key: m.name, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", borderRadius: "5px", background: "var(--dsw-alias-surface-l2)" } },
                h("span", { style: { fontSize: "12px" } }, m.name),
                h("span", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary)" } }, m.size ? (m.size / (1024*1024*1024)).toFixed(1) + " GB" : "")
              );
            })
          ) : null
        ),
        // MCP Tools Runner
        h(
          "div",
          { style: { borderRadius: "10px", border: "1px solid var(--dsw-alias-border-l1)", background: "var(--dsw-alias-surface-l1)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" } },
          h("div", { style: { display: "flex", alignItems: "center", gap: "10px" } },
            h(ToolsGlyph, { size: 22 }),
            h("div", null,
              h("div", { style: { fontSize: "15px", fontWeight: 600 } }, "Model Context Protocol (MCP) Tools"),
              h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "Dynamic external tool servers and agent execution bridges")
            )
          ),
          h("span", { style: { padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" } }, "ENABLED")
        ),
        // Voice & Speech Engine
        h(
          "div",
          { style: { borderRadius: "10px", border: "1px solid var(--dsw-alias-border-l1)", background: "var(--dsw-alias-surface-l1)", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" } },
          h("div", { style: { display: "flex", alignItems: "center", gap: "10px" } },
            h(MicGlyph, { size: 22, style: { color: "#6366f1" } }),
            h("div", null,
              h("div", { style: { fontSize: "15px", fontWeight: 600 } }, "Voice & Audio Synthesis Engine"),
              h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "Neural text-to-speech (Edge TTS, OpenAI, ElevenLabs) and audio controls")
            )
          ),
          h("span", { style: { padding: "3px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: "rgba(99, 102, 241, 0.15)", color: "#6366f1" } }, "ACTIVE")
        )
      );
    }

    // 2. SETTINGS: TMUX CONFIGURATION
    function TmuxSettingsSection() {
      var shellState = React.useState("/bin/zsh");
      var shell = shellState[0], setShell = shellState[1];
      var historyState = React.useState("10000");
      var history = historyState[0], setHistory = historyState[1];
      var mouseState = React.useState(true);
      var mouse = mouseState[0], setMouse = mouseState[1];
      var autoContainState = React.useState(true);
      var autoContain = autoContainState[0], setAutoContain = autoContainState[1];
      var savedState = React.useState(false);
      var saved = savedState[0], setSaved = savedState[1];

      var handleSave = function () {
        setSaved(true);
        setTimeout(function () { setSaved(false); }, 2500);
      };

      return h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "20px", padding: "4px 0", maxWidth: "800px" } },
        h("div", { style: { borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))", paddingBottom: "16px" } },
          h("h2", { style: { margin: "0 0 4px 0", fontSize: "18px", fontWeight: 600 } }, "Tmux Engine Configuration"),
          h("div", { style: { fontSize: "13px", color: "var(--dsw-alias-label-secondary)" } }, "Configure the in-process tmux multiplexer, default shell, scrollback buffer, and agent containment.")
        ),
        h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "8px", background: "var(--dsw-alias-surface-l1)", border: "1px solid var(--dsw-alias-border-l1)" } },
            h("div", null, h("div", { style: { fontSize: "14px", fontWeight: 600 } }, "Default Shell"), h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "Shell executed when launching new tmux terminal sessions")),
            h("select", { value: shell, onChange: function (e) { setShell(e.target.value); }, style: { padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l2)", color: "inherit" } },
              h("option", { value: "/bin/zsh" }, "Zsh (/bin/zsh)"),
              h("option", { value: "/bin/bash" }, "Bash (/bin/bash)"),
              h("option", { value: "/bin/sh" }, "POSIX Shell (/bin/sh)")
            )
          ),
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "8px", background: "var(--dsw-alias-surface-l1)", border: "1px solid var(--dsw-alias-border-l1)" } },
            h("div", null, h("div", { style: { fontSize: "14px", fontWeight: 600 } }, "Scrollback History Limit"), h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "Maximum line count retained in terminal screen buffer")),
            h("input", { type: "number", value: history, onChange: function (e) { setHistory(e.target.value); }, style: { width: "100px", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l2)", color: "inherit" } })
          ),
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "8px", background: "var(--dsw-alias-surface-l1)", border: "1px solid var(--dsw-alias-border-l1)" } },
            h("div", null, h("div", { style: { fontSize: "14px", fontWeight: 600 } }, "Mouse Mode Support"), h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "Enable mouse scrolling and pane focus (set -g mouse on)")),
            h("input", { type: "checkbox", checked: mouse, onChange: function (e) { setMouse(e.target.checked); }, style: { width: "18px", height: "18px", cursor: "pointer" } })
          ),
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "8px", background: "var(--dsw-alias-surface-l1)", border: "1px solid var(--dsw-alias-border-l1)" } },
            h("div", null, h("div", { style: { fontSize: "14px", fontWeight: 600 } }, "Agent Task Containment"), h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "Automatically contain and multiplex background agent CLI subprocesses inside tmux")),
            h("input", { type: "checkbox", checked: autoContain, onChange: function (e) { setAutoContain(e.target.checked); }, style: { width: "18px", height: "18px", cursor: "pointer" } })
          ),
          h("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: "8px" } },
            h("button", { onClick: handleSave, style: { padding: "8px 18px", borderRadius: "7px", border: "none", background: "var(--dsw-alias-primary, #6366f1)", color: "#fff", fontWeight: 600, cursor: "pointer" } }, saved ? "Saved & Applied ✓" : "Save Tmux Configuration")
          )
        )
      );
    }

    // 3. SETTINGS: DOCKER CONFIGURATION
    function DockerSettingsSection() {
      var imageState = React.useState("node:22-alpine");
      var image = imageState[0], setImage = imageState[1];
      var memoryState = React.useState("2GB");
      var memory = memoryState[0], setMemory = memoryState[1];
      var networkState = React.useState("bridge");
      var network = networkState[0], setNetwork = networkState[1];
      var autoPruneState = React.useState(false);
      var autoPrune = autoPruneState[0], setAutoPrune = autoPruneState[1];
      var savedState = React.useState(false);
      var saved = savedState[0], setSaved = savedState[1];

      var handleSave = function () {
        setSaved(true);
        setTimeout(function () { setSaved(false); }, 2500);
      };

      return h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "20px", padding: "4px 0", maxWidth: "800px" } },
        h("div", { style: { borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))", paddingBottom: "16px" } },
          h("h2", { style: { margin: "0 0 4px 0", fontSize: "18px", fontWeight: 600 } }, "Docker Sandbox Configuration"),
          h("div", { style: { fontSize: "13px", color: "var(--dsw-alias-label-secondary)" } }, "Configure default container isolation images, memory quotas, and network sandboxing.")
        ),
        h("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } },
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "8px", background: "var(--dsw-alias-surface-l1)", border: "1px solid var(--dsw-alias-border-l1)" } },
            h("div", null, h("div", { style: { fontSize: "14px", fontWeight: 600 } }, "Default Sandbox Image"), h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "Base container image for agent sandboxed execution")),
            h("select", { value: image, onChange: function (e) { setImage(e.target.value); }, style: { padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l2)", color: "inherit" } },
              h("option", { value: "node:22-alpine" }, "Node.js 22 Alpine (Fast & Lightweight)"),
              h("option", { value: "python:3.11-slim" }, "Python 3.11 Slim (Data & Scripting)"),
              h("option", { value: "ubuntu:22.04" }, "Ubuntu 22.04 LTS (Full Environment)")
            )
          ),
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "8px", background: "var(--dsw-alias-surface-l1)", border: "1px solid var(--dsw-alias-border-l1)" } },
            h("div", null, h("div", { style: { fontSize: "14px", fontWeight: 600 } }, "Container Memory Quota"), h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "Maximum RAM allocated per sandboxed container")),
            h("select", { value: memory, onChange: function (e) { setMemory(e.target.value); }, style: { padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l2)", color: "inherit" } },
              h("option", { value: "1GB" }, "1 GB"),
              h("option", { value: "2GB" }, "2 GB (Recommended)"),
              h("option", { value: "4GB" }, "4 GB"),
              h("option", { value: "8GB" }, "8 GB")
            )
          ),
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "8px", background: "var(--dsw-alias-surface-l1)", border: "1px solid var(--dsw-alias-border-l1)" } },
            h("div", null, h("div", { style: { fontSize: "14px", fontWeight: 600 } }, "Network Sandboxing"), h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "Isolation mode for agent container networking")),
            h("select", { value: network, onChange: function (e) { setNetwork(e.target.value); }, style: { padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l2)", color: "inherit" } },
              h("option", { value: "bridge" }, "Bridge (Standard Outbound Access)"),
              h("option", { value: "none" }, "None / Air-Gapped (No Network Access)"),
              h("option", { value: "host" }, "Host Network")
            )
          ),
          h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "8px", background: "var(--dsw-alias-surface-l1)", border: "1px solid var(--dsw-alias-border-l1)" } },
            h("div", null, h("div", { style: { fontSize: "14px", fontWeight: 600 } }, "Auto-Prune Idle Sandboxes"), h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "Automatically clean up stopped sandboxes after session completion")),
            h("input", { type: "checkbox", checked: autoPrune, onChange: function (e) { setAutoPrune(e.target.checked); }, style: { width: "18px", height: "18px", cursor: "pointer" } })
          ),
          h("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: "8px" } },
            h("button", { onClick: handleSave, style: { padding: "8px 18px", borderRadius: "7px", border: "none", background: "var(--dsw-alias-primary, #6366f1)", color: "#fff", fontWeight: 600, cursor: "pointer" } }, saved ? "Saved & Applied ✓" : "Save Docker Configuration")
          )
        )
      );
    }

    // 4. SETTINGS: TOOLS SECTION
    function ToolsSection() {
      var TOOLS_LIST = [
        { id: "read_file", name: "Read File", cat: "Coding", desc: "Read file contents, slices, and text ranges", perm: "Auto-Approve" },
        { id: "write_to_file", name: "Write File", cat: "Coding", desc: "Create new files or overwrite existing files", perm: "Prompt" },
        { id: "replace_file_content", name: "Edit Code (Replace)", cat: "Coding", desc: "Precise contiguous code replacements", perm: "Auto-Approve" },
        { id: "run_command", name: "Run Terminal Command", cat: "Coding", desc: "Execute CLI commands in host/sandbox shell", perm: "Prompt" },
        { id: "search_web", name: "Web Search", cat: "Research", desc: "Query live web results via search engine", perm: "Auto-Approve" },
        { id: "read_url_content", name: "Fetch URL Markdown", cat: "Research", desc: "Extract clean markdown from web documentation", perm: "Auto-Approve" },
        { id: "invoke_subagent", name: "Invoke Subagent", cat: "Orchestration", desc: "Spawn background specialist subagents", perm: "Auto-Approve" },
        { id: "manage_task", name: "Manage Tasks", cat: "Orchestration", desc: "List, status, kill, or send input to tasks", perm: "Auto-Approve" },
        { id: "schedule", name: "Schedule / Timers", cat: "Orchestration", desc: "One-shot timers and recurring cron jobs", perm: "Auto-Approve" },
        { id: "mcp_deepseek_harness", name: "MCP DeepSeek Harness", cat: "MCP Protocol", desc: "Model Context Protocol bridge into dsh runtime", perm: "Auto-Approve" },
      ];

      return h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "20px", padding: "4px 0", maxWidth: "840px" } },
        h("div", { style: { borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))", paddingBottom: "16px" } },
          h("h2", { style: { margin: "0 0 4px 0", fontSize: "18px", fontWeight: 600 } }, "Tools & MCP Capabilities"),
          h("div", { style: { fontSize: "13px", color: "var(--dsw-alias-label-secondary)" } }, "Inspect built-in agent coding tools, registered MCP servers, and execution approval policies.")
        ),
        h("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } },
          TOOLS_LIST.map(function (t) {
            return h(
              "div",
              { key: t.id, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderRadius: "8px", background: "var(--dsw-alias-surface-l1)", border: "1px solid var(--dsw-alias-border-l1)" } },
              h("div", { style: { display: "flex", flexDirection: "column", gap: "2px" } },
                h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                  h("strong", { style: { fontSize: "14px" } }, t.name),
                  h("code", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary)" } }, t.id),
                  h("span", { style: { padding: "1px 6px", borderRadius: "4px", fontSize: "10px", background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" } }, t.cat)
                ),
                h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, t.desc)
              ),
              h("span", { style: { padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, background: t.perm === "Auto-Approve" ? "rgba(99, 102, 241, 0.15)" : "rgba(128, 128, 128, 0.15)", color: t.perm === "Auto-Approve" ? "#6366f1" : "var(--dsw-alias-label-secondary)" } }, t.perm)
            );
          })
        )
      );
    }

    // 5. SETTINGS: LOOPS SECTION
    function LoopsSection() {
      var LOOPS_LIST = [
        { id: "darkfactory-orchestrator", name: "DarkFactory Autonomous Work Loop", interval: "Continuous / Baton Handoff", status: "Active", desc: "Multi-provider quota recovery & session watchdog" },
        { id: "metrics-telemetry", name: "Metrics & Quota Sync", interval: "Every 5m", status: "Active", desc: "Refreshes token counters & sliding window utilization" },
        { id: "sandbox-watchdog", name: "Docker Container Prune Loop", interval: "Hourly (0 * * * *)", status: "Idle", desc: "Cleans up unattached stopped sandbox instances" },
      ];

      return h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "20px", padding: "4px 0", maxWidth: "840px" } },
        h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))", paddingBottom: "16px" } },
          h("div", null,
            h("h2", { style: { margin: "0 0 4px 0", fontSize: "18px", fontWeight: 600 } }, "Autonomous Work Loops"),
            h("div", { style: { fontSize: "13px", color: "var(--dsw-alias-label-secondary)" } }, "Manage autonomous execution loops, recurring cron jobs, and background workers.")
          ),
          h("button", { onClick: function () { alert("Use `/loop <interval> <prompt>` or the schedule tool to add new autonomous loops."); }, style: { padding: "7px 14px", borderRadius: "7px", border: "none", background: "var(--dsw-alias-primary, #6366f1)", color: "#fff", fontWeight: 600, fontSize: "12px", cursor: "pointer" } }, "+ Schedule Loop")
        ),
        h("div", { style: { display: "flex", flexDirection: "column", gap: "12px" } },
          LOOPS_LIST.map(function (loop) {
            return h(
              "div",
              { key: loop.id, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderRadius: "8px", background: "var(--dsw-alias-surface-l1)", border: "1px solid var(--dsw-alias-border-l1)" } },
              h("div", { style: { display: "flex", flexDirection: "column", gap: "4px" } },
                h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                  h("strong", { style: { fontSize: "14px" } }, loop.name),
                  h("span", { style: { padding: "1px 6px", borderRadius: "4px", fontSize: "10px", background: "rgba(99, 102, 241, 0.15)", color: "#6366f1", fontWeight: 600 } }, loop.status)
                ),
                h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, loop.desc),
                h("div", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary)" } }, "Interval: " + loop.interval)
              ),
              h("div", { style: { display: "flex", gap: "6px" } },
                h("button", { style: { padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", fontSize: "11px", cursor: "pointer" } }, "Trigger Now"),
                h("button", { style: { padding: "5px 10px", borderRadius: "5px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", fontSize: "11px", cursor: "pointer" } }, "Pause")
              )
            );
          })
        )
      );
    }

    // 6. DOCKED BOTTOM TERMINAL PANEL WITH TABS
    function BottomTerminalPanel(props) {
      ensureTreeStyles();
      var onClose = props.onClose;
      var initialSession = props.initialSession || "0";
      var initialContainerId = props.initialContainerId || null;
      var state = React.useState({ sessions: [], loading: true, error: null });
      var data = state[0], setData = state[1];
      var selectedSessionState = React.useState(initialContainerId ? null : initialSession);
      var selectedSession = selectedSessionState[0], setSelectedSession = selectedSessionState[1];
      
      var windowsState = React.useState([]);
      var windows = windowsState[0], setWindows = windowsState[1];

      var bufferState = React.useState("Connecting to tmux interactive runner…");
      var buffer = bufferState[0], setBuffer = bufferState[1];
      
      var cmdState = React.useState("");
      var cmd = cmdState[0], setCmd = cmdState[1];
      
      var isFocusedState = React.useState(true);
      var isFocused = isFocusedState[0], setIsFocused = isFocusedState[1];

      var newModalState = React.useState(false);
      var newModal = newModalState[0], setNewModal = newModalState[1];

      var heightState = React.useState(290);
      var height = heightState[0], setHeight = heightState[1];
      var isMaximizedState = React.useState(false);
      var isMaximized = isMaximizedState[0], setIsMaximized = isMaximizedState[1];

      // Container state
      var containersState = React.useState([]);
      var containers = containersState[0], setContainers = containersState[1];
      var selectedContainerState = React.useState(initialContainerId);
      var selectedContainer = selectedContainerState[0], setSelectedContainer = selectedContainerState[1];
      var containerLogsState = React.useState("Loading container logs…");
      var containerLogs = containerLogsState[0], setContainerLogs = containerLogsState[1];
      // activeView: "chat" | "terminal" | "container"
      var activeViewState = React.useState(props.initialView || (initialContainerId ? "container" : (initialSession ? "terminal" : "terminal")));
      var activeView = activeViewState[0], setActiveView = activeViewState[1];
      var panelPlusMenuState = React.useState(false);
      var panelPlusMenuOpen = panelPlusMenuState[0], setPanelPlusMenuOpen = panelPlusMenuState[1];
      var isCollapsedState = React.useState(false);
      var isCollapsed = isCollapsedState[0], setIsCollapsed = isCollapsedState[1];
      var tabActionsBtnRef = React.useRef(null);
      var tabActionsOpenState = React.useState(false);
      var tabActionsOpen = tabActionsOpenState[0], setTabActionsOpen = tabActionsOpenState[1];

      var terminalContainerRef = React.useRef(null);
      var terminalPreRef = React.useRef(null);

      // Drag to resize handler
      var handleResizeStart = function (e) {
        e.preventDefault();
        var startY = e.clientY;
        var startHeight = height;
        var handleMove = function (moveEvent) {
          var delta = startY - moveEvent.clientY;
          var newHeight = Math.max(160, Math.min(window.innerHeight * 0.88, startHeight + delta));
          setHeight(newHeight);
          setIsMaximized(false);
        };
        var handleUp = function () {
          document.removeEventListener("pointermove", handleMove);
          document.removeEventListener("pointerup", handleUp);
        };
        document.addEventListener("pointermove", handleMove);
        document.addEventListener("pointerup", handleUp);
      };

      var loadSessions = React.useCallback(function () {
        fetch(QUOTAS_API + "/tmux/sessions")
          .then(function (r) { return r.json(); })
          .then(function (res) {
            var list = res.sessions || [];
            if (list.length === 0) {
              fetch(QUOTAS_API + "/tmux/sessions/new", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name: selectedSession || "0" }),
              }).then(function () {
                fetch(QUOTAS_API + "/tmux/sessions")
                  .then(function (r2) { return r2.json(); })
                  .then(function (res2) {
                    var l2 = res2.sessions || [];
                    setData({ sessions: l2, loading: false, error: null });
                    if (l2.length > 0) setSelectedSession(l2[0].name);
                  });
              });
              return;
            }
            setData({ sessions: list, loading: false, error: null });
            if (!list.some(function (s) { return s.name === selectedSession; })) {
              setSelectedSession(list[0].name);
            }
          });
      }, [selectedSession]);

      var loadWindows = React.useCallback(function (sessName) {
        if (!sessName) return;
        fetch(QUOTAS_API + "/tmux/sessions/windows?name=" + encodeURIComponent(sessName))
          .then(function (r) { return r.json(); })
          .then(function (res) { setWindows(res.windows || []); });
      }, []);

      var loadBuffer = React.useCallback(function (sessName) {
        if (!sessName) return;
        fetch(QUOTAS_API + "/tmux/sessions/capture?ansi=1&name=" + encodeURIComponent(sessName))
          .then(function (r) { return r.json(); })
          .then(function (res) {
            setBuffer(res.buffer || "(empty session)");
          });
      }, []);

      React.useEffect(function () { loadSessions(); }, [loadSessions]);
      React.useEffect(function () {
        loadWindows(selectedSession);
        loadBuffer(selectedSession);
      }, [selectedSession, loadWindows, loadBuffer]);

      // High-frequency live buffer streaming (every 600ms)
      React.useEffect(function () {
        var interval = setInterval(function () {
          loadBuffer(selectedSession);
        }, 600);
        return function () { clearInterval(interval); };
      }, [selectedSession, loadBuffer]);

      // Auto-scroll to bottom on buffer update
      React.useEffect(function () {
        if (terminalPreRef.current) {
          terminalPreRef.current.scrollTop = terminalPreRef.current.scrollHeight;
        }
      }, [buffer, containerLogs]);

      // Container data loading
      var loadContainers = React.useCallback(function () {
        fetch(QUOTAS_API + "/docker/containers")
          .then(function (r) { return r.json(); })
          .then(function (res) { setContainers(res.containers || []); })
          .catch(function () {});
      }, []);

      var loadContainerLogs = React.useCallback(function (cId) {
        if (!cId) return;
        fetch(QUOTAS_API + "/docker/containers/logs?id=" + encodeURIComponent(cId))
          .then(function (r) { return r.json(); })
          .then(function (res) { setContainerLogs(res.logs || "(no logs)"); });
      }, []);

      React.useEffect(function () {
        var onOpenTerm = function (e) {
          var sess = (e && e.detail && e.detail.session) ? e.detail.session : "0";
          setActiveView("terminal");
          setSelectedSession(sess);
          setSelectedContainer(null);
          setIsCollapsed(false);
          loadBuffer(sess);
          loadWindows(sess);
        };
        var onOpenCont = function (e) {
          var id = (e && e.detail && e.detail.id) ? e.detail.id : null;
          setActiveView("container");
          setSelectedContainer(id);
          setSelectedSession(null);
          setIsCollapsed(false);
          if (id) loadContainerLogs(id);
        };
        window.addEventListener("dsh:open-terminal", onOpenTerm);
        window.addEventListener("dsh:open-container", onOpenCont);
        return function () {
          window.removeEventListener("dsh:open-terminal", onOpenTerm);
          window.removeEventListener("dsh:open-container", onOpenCont);
        };
      }, [loadBuffer, loadWindows, loadContainerLogs]);

      React.useEffect(function () { loadContainers(); var t = setInterval(loadContainers, 5000); return function () { clearInterval(t); }; }, [loadContainers]);
      React.useEffect(function () {
        if (activeView === "container" && selectedContainer) loadContainerLogs(selectedContainer);
      }, [activeView, selectedContainer, loadContainerLogs]);
      // Live container log streaming (every 2s)
      React.useEffect(function () {
        if (activeView !== "container" || !selectedContainer) return;
        var interval = setInterval(function () { loadContainerLogs(selectedContainer); }, 2000);
        return function () { clearInterval(interval); };
      }, [activeView, selectedContainer, loadContainerLogs]);

      var handleContainerAction = function (cId, action) {
        fetch(QUOTAS_API + "/docker/containers/action", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: cId, action: action }),
        }).then(function () { loadContainers(); });
      };

      var selectTerminalTab = function (name) {
        setActiveView("terminal");
        setSelectedSession(name);
        setSelectedContainer(null);
        setIsCollapsed(false);
      };

      var selectContainerTab = function (c) {
        setActiveView("container");
        setSelectedContainer(c.id);
        setSelectedSession(null);
        setIsCollapsed(false);
      };

      // Send key actions
      var sendKey = function (key) {
        fetch(QUOTAS_API + "/tmux/sessions/send-keys", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: selectedSession, keys: key, isLiteral: false }),
        }).then(function () {
          setTimeout(function () { loadBuffer(selectedSession); }, 40);
        });
      };

      var sendLiteral = function (text, pressEnter) {
        fetch(QUOTAS_API + "/tmux/sessions/send-keys", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: selectedSession, keys: text, isLiteral: true, pressEnter: Boolean(pressEnter) }),
        }).then(function () {
          setTimeout(function () { loadBuffer(selectedSession); }, 60);
        });
      };

      var handleExecuteCommand = function (e) {
        if (e) e.preventDefault();
        if (!cmd.trim()) return;
        sendLiteral(cmd, true);
        setCmd("");
      };

      var handleKeyDown = function (e) {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

        if (e.key === "Enter") {
          sendKey("Enter");
          e.preventDefault();
        } else if (e.key === "Backspace") {
          sendKey("BSpace");
          e.preventDefault();
        } else if (e.key === "Tab") {
          sendKey("Tab");
          e.preventDefault();
        } else if (e.key === "ArrowUp") {
          sendKey("Up");
          e.preventDefault();
        } else if (e.key === "ArrowDown") {
          sendKey("Down");
          e.preventDefault();
        } else if (e.key === "ArrowLeft") {
          sendKey("Left");
          e.preventDefault();
        } else if (e.key === "ArrowRight") {
          sendKey("Right");
          e.preventDefault();
        } else if (e.key === "Escape") {
          sendKey("Escape");
          e.preventDefault();
        } else if (e.ctrlKey) {
          if (e.key === "c" || e.key === "C") { sendKey("C-c"); e.preventDefault(); }
          else if (e.key === "d" || e.key === "D") { sendKey("C-d"); e.preventDefault(); }
          else if (e.key === "l" || e.key === "L") { sendKey("C-l"); e.preventDefault(); }
          else if (e.key === "z" || e.key === "Z") { sendKey("C-z"); e.preventDefault(); }
        } else if (e.key.length === 1 && !e.metaKey && !e.altKey) {
          sendLiteral(e.key, false);
          e.preventDefault();
        }
      };

      var handleSelectWindow = function (idx) {
        fetch(QUOTAS_API + "/tmux/sessions/select-window", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: selectedSession, index: idx }),
        }).then(function () {
          loadWindows(selectedSession);
          loadBuffer(selectedSession);
        });
      };

      var handleNewWindow = function () {
        var winName = prompt("New Window Name:", "sh");
        if (!winName) return;
        fetch(QUOTAS_API + "/tmux/sessions/new-window", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: selectedSession, windowName: winName }),
        }).then(function () {
          loadWindows(selectedSession);
          loadBuffer(selectedSession);
        });
      };

      var handleKill = function (name) {
        if (!confirm("Kill tmux session '" + name + "'?")) return;
        fetch(QUOTAS_API + "/tmux/sessions/kill", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: name }),
        }).then(function () { loadSessions(); });
      };

      var sidebarRightState = React.useState(260);
      var sidebarRight = sidebarRightState[0], setSidebarRight = sidebarRightState[1];
      var detailsWidthState = React.useState(0);
      var detailsWidth = detailsWidthState[0], setDetailsWidth = detailsWidthState[1];

      React.useEffect(function () {
        var updateOffsets = function () {
          var centerEl = document.querySelector('[class*="centerCol"]');
          if (centerEl) {
            var cRect = centerEl.getBoundingClientRect();
            if (cRect.width > 0) {
              setSidebarRight(cRect.left);
              setDetailsWidth(window.innerWidth - cRect.right);
              return;
            }
          }
          var sidebarEl = document.querySelector('[class*="sidebarCol"]');
          if (sidebarEl) {
            var sRect = sidebarEl.getBoundingClientRect();
            if (sRect.right > 0) setSidebarRight(sRect.right);
          }
          var detailsEl = document.querySelector('[class*="detailsCol"]');
          if (detailsEl) {
            var dRect = detailsEl.getBoundingClientRect();
            var dWidth = window.innerWidth - dRect.left;
            if (dWidth >= 0 && dRect.width > 0) setDetailsWidth(dWidth);
            else setDetailsWidth(0);
          }
        };

        updateOffsets();
        var timer = setInterval(updateOffsets, 200);
        window.addEventListener("resize", updateOffsets);
        return function () {
          clearInterval(timer);
          window.removeEventListener("resize", updateOffsets);
        };
      }, []);

      var currentHeight = isCollapsed ? "38px" : (isMaximized ? "84vh" : height + "px");

      // Broadcast panel geometry for top view occupants
      React.useEffect(function () {
        if (typeof window !== "undefined") {
          window.__dsh_panel_collapsed__ = isCollapsed;
          window.__dsh_panel_height__ = currentHeight;
          window.dispatchEvent(new CustomEvent("dsh:panel-geometry-changed", {
            detail: { collapsed: isCollapsed, height: currentHeight }
          }));
        }
      }, [isCollapsed, currentHeight]);

      // Push chat messages up without expanding centerCol layout bounds
      React.useEffect(function () {
        var centerCol = document.querySelector('[class*="centerCol"]');
        if (centerCol) {
          centerCol.style.paddingBottom = isCollapsed ? "38px" : currentHeight;
          centerCol.style.marginBottom = "0px";
          centerCol.style.transition = "padding-bottom 120ms ease";
        }
        return function () {
          var col = document.querySelector('[class*="centerCol"]');
          if (col) {
            col.style.paddingBottom = "0px";
            col.style.marginBottom = "0px";
          }
        };
      }, [currentHeight, isCollapsed]);

      return h(
        "div",
        {
          ref: terminalContainerRef,
          tabIndex: 0,
          onKeyDown: handleKeyDown,
          onFocus: function () { setIsFocused(true); },
          onBlur: function () { setIsFocused(false); },
          style: {
            position: "fixed",
            bottom: 0,
            left: sidebarRight + "px",
            right: detailsWidth + "px",
            height: currentHeight,
            zIndex: 9000,
            background: "var(--dsw-alias-bg-layer-0, #000000)",
            borderTop: "1px solid var(--dsw-alias-border-l2, rgba(255,255,255,0.15))",
            borderLeft: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.12))",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.4)",
            outline: "none",
            transition: isMaximized ? "height 150ms cubic-bezier(0.4, 0, 0.2, 1)" : "none",
            fontFamily: "var(--ds-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
          },
        },
        // Top Resize Drag Handle (visible when expanded)
        (!isCollapsed && activeView !== "chat") ? h(
          "div",
          {
            onPointerDown: handleResizeStart,
            style: {
              position: "absolute",
              top: "-4px",
              left: 0,
              right: 0,
              height: "8px",
              cursor: "row-resize",
              zIndex: 100000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
          },
          h("div", {
            style: {
              width: "36px",
              height: "3px",
              borderRadius: "2px",
              background: "var(--dsw-alias-border-l2, rgba(255,255,255,0.2))",
              opacity: 0.7,
              transition: "background 150ms, opacity 150ms",
            }
          })
        ) : null,
        // Header Tab Bar
        h(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              height: "38px",
              background: "var(--dsw-alias-bg-layer-0, #000000)",
              borderBottom: (activeView === "chat" || isCollapsed) ? "none" : "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.12))",
              padding: "0 8px 0 10px",
              userSelect: "none",
            },
          },
          // Unified Tabs Container (matching TopConversationTabBar)
          h(
            "div",
            {
              className: "dsh-top-tab-bar",
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "var(--dsw-alias-surface-l1, rgba(255,255,255,0.04))",
                padding: "2px 4px",
                borderRadius: "8px",
                border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.12))",
                userSelect: "none",
                maxWidth: "calc(100% - 90px)",
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              },
              onDragOver: function (e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; },
              onDrop: function (e) {
                e.preventDefault();
                setIsCollapsed(false);
                try {
                  var raw = e.dataTransfer.getData("text/dsh-tab");
                  if (raw) {
                    var tabData = JSON.parse(raw);
                    window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-bottom", { detail: tabData }));
                    if (tabData.type === "terminal") selectTerminalTab(tabData.id);
                    else if (tabData.type === "container") { setSelectedContainer(tabData.id); setActiveView("container"); setIsCollapsed(false); }
                    else if (tabData.type === "chat") { setActiveView("chat"); setSelectedSession(null); setSelectedContainer(null); setIsCollapsed(false); }
                  }
                } catch (err) {}
              },
            },
            // 0. Conversation Tab (rendered ONLY IF explicitly moved to bottom panel)
            (function () {
              if (activeView !== "chat") return null;
              return h(
                "div",
                {
                  key: "tab-conversation",
                  draggable: true,
                  onDragStart: function (e) {
                    e.dataTransfer.setData("text/dsh-tab", JSON.stringify({ id: "chat-main", type: "chat", title: "Conversation", from: "bottom" }));
                  },
                  onClick: function () {
                    setActiveView("chat");
                    setSelectedSession(null);
                    setSelectedContainer(null);
                    setIsCollapsed(false);
                  },
                  onContextMenu: function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-top", { detail: { id: "chat-main", type: "chat", title: "Conversation" } }));
                  },
                  style: {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 8px",
                    borderRadius: "5px",
                    background: "var(--dsw-alias-interactive-bg-active, rgba(99, 102, 241, 0.18))",
                    border: "1px solid var(--dsw-alias-primary, #6366f1)",
                    color: "var(--dsw-alias-label-primary, #fff)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 120ms ease",
                    whiteSpace: "nowrap",
                  },
                },
                h(ChatGlyph, { size: 12 }),
                h("span", null, "Conversation"),
                h("button", {
                  type: "button",
                  title: "Restore to Top Tab Bar",
                  onClick: function (e) {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-top", { detail: { id: "chat-main", type: "chat", title: "Conversation" } }));
                  },
                  style: {
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "14px",
                    height: "14px",
                    marginLeft: "2px",
                    border: "none",
                    borderRadius: "3px",
                    background: "transparent",
                    color: "inherit",
                    opacity: 0.6,
                    cursor: "pointer",
                    fontSize: "12px",
                  }
                }, "×")
              );
            })(),
            // 1. Terminal Tabs (filtered against Top Tab Bar for deduplication)
            (function () {
              var topMap = (typeof window !== "undefined" && window.__dsh_top_tab_ids__) ? window.__dsh_top_tab_ids__ : {};
              var visibleSessions = data.sessions.filter(function (s) { return !topMap[s.name] && !topMap["term-" + s.name]; });
              return visibleSessions.map(function (s) {
                var isSel = activeView === "terminal" && s.name === selectedSession;
                return h(
                  "div",
                  {
                    key: "term-" + s.name,
                    draggable: true,
                    onDragStart: function (e) {
                      e.dataTransfer.setData("text/dsh-tab", JSON.stringify({ id: s.name, type: "terminal", title: s.name, session: s.name, from: "bottom" }));
                    },
                    onClick: function () { selectTerminalTab(s.name); },
                    onContextMenu: function (e) {
                      e.preventDefault();
                      e.stopPropagation();
                      setTabActionsOpen(true);
                    },
                    style: {
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "3px 8px",
                      borderRadius: "5px",
                      background: isSel ? "var(--dsw-alias-interactive-bg-active, rgba(99, 102, 241, 0.18))" : "transparent",
                      border: isSel ? "1px solid var(--dsw-alias-primary, #6366f1)" : "1px solid transparent",
                      color: isSel ? "var(--dsw-alias-label-primary, #fff)" : "var(--dsw-alias-label-secondary, #8b949e)",
                      fontSize: "12px",
                      fontWeight: isSel ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 120ms ease",
                      whiteSpace: "nowrap",
                    },
                  },
                  h(TerminalsGlyph, { size: 12 }),
                  h("span", null, s.name),
                  h("span", { style: { fontSize: "10px", opacity: 0.5, marginLeft: "1px" } }, s.windows + "w"),
                  h("button", {
                    type: "button",
                    title: "Kill Session",
                    onClick: function (e) { e.stopPropagation(); handleKill(s.name); },
                    style: {
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "14px",
                      height: "14px",
                      marginLeft: "2px",
                      padding: 0,
                      border: "none",
                      borderRadius: "3px",
                      background: "transparent",
                      color: "inherit",
                      opacity: 0.6,
                      cursor: "pointer",
                      fontSize: "12px",
                    },
                    onMouseEnter: function (e) { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#f85149"; },
                    onMouseLeave: function (e) { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.color = "inherit"; },
                  }, "×")
                );
              });
            })(),
            // 2. Container Tabs (filtered against Top Tab Bar for deduplication)
            (function () {
              var topMap = (typeof window !== "undefined" && window.__dsh_top_tab_ids__) ? window.__dsh_top_tab_ids__ : {};
              var visibleContainers = containers.filter(function (c) { return !topMap[c.id] && !topMap["container-sandboxes"]; });
              return visibleContainers.map(function (c) {
                var isSel = activeView === "container" && selectedContainer === c.id;
                return h(
                  "div",
                  {
                    key: "cont-" + c.id,
                    draggable: true,
                    onDragStart: function (e) {
                      e.dataTransfer.setData("text/dsh-tab", JSON.stringify({ id: c.id, type: "container", title: c.name || c.id.substring(0, 12), from: "bottom" }));
                    },
                    onClick: function () { selectContainerTab(c); },
                    style: {
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "3px 8px",
                      borderRadius: "5px",
                      background: isSel ? "var(--dsw-alias-interactive-bg-active, rgba(99, 102, 241, 0.18))" : "transparent",
                      border: isSel ? "1px solid var(--dsw-alias-primary, #6366f1)" : "1px solid transparent",
                      color: isSel ? "var(--dsw-alias-label-primary, #fff)" : "var(--dsw-alias-label-secondary, #8b949e)",
                      fontSize: "12px",
                      fontWeight: isSel ? 600 : 400,
                      cursor: "pointer",
                      transition: "all 120ms ease",
                      whiteSpace: "nowrap",
                    },
                  },
                  h(ContainersGlyph, { size: 12 }),
                  h("span", null, c.name || c.id.substring(0, 12)),
                  h("span", { style: { width: "6px", height: "6px", borderRadius: "50%", background: c.isRunning ? "#3fb950" : "#888", marginLeft: "2px" } }),
                  h("button", {
                    type: "button",
                    title: "Close Container View",
                    onClick: function (e) {
                      e.stopPropagation();
                      setContainers(function (prev) { return prev.filter(function (x) { return x.id !== c.id; }); });
                      if (selectedContainer === c.id) {
                        setActiveView("terminal");
                      }
                    },
                    style: {
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "14px",
                      height: "14px",
                      marginLeft: "2px",
                      padding: 0,
                      border: "none",
                      borderRadius: "3px",
                      background: "transparent",
                      color: "inherit",
                      opacity: 0.6,
                      cursor: "pointer",
                      fontSize: "12px",
                    },
                    onMouseEnter: function (e) { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#f85149"; },
                    onMouseLeave: function (e) { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.color = "inherit"; },
                  }, "×")
                );
              });
            })(),
            // 3. Plus Button with Dropdown Context Menu
            (function () {
              var panelPlusBtnRef = React.useRef(null);
              return h(
                "div",
                { style: { position: "relative", display: "inline-flex", alignItems: "center" } },
                h(
                  "button",
                  {
                    ref: panelPlusBtnRef,
                    type: "button",
                    title: "New Session / Terminal / Container",
                    onClick: function (e) {
                      e.stopPropagation();
                      setPanelPlusMenuOpen(function (v) { return !v; });
                    },
                    style: {
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "22px",
                      height: "22px",
                      borderRadius: "4px",
                      border: "none",
                      background: "transparent",
                      color: "var(--dsw-alias-label-secondary)",
                      cursor: "pointer",
                    },
                    onMouseEnter: function (e) { e.currentTarget.style.background = "var(--dsw-alias-interactive-bg-hover)"; },
                    onMouseLeave: function (e) { e.currentTarget.style.background = "transparent"; },
                  },
                  h(PlusGlyph, { size: 13 })
                ),
                h(SelectDropdownMenu, {
                  open: panelPlusMenuOpen,
                  anchorRef: panelPlusBtnRef,
                  onClose: function () { setPanelPlusMenuOpen(false); },
                  items: [
                    { id: "chat", label: "Conversation", icon: h(ChatGlyph, { size: 13 }) },
                    { id: "terminal", label: "Terminal", icon: h(TerminalsGlyph, { size: 13 }) },
                    { id: "container", label: "Container", icon: h(ContainersGlyph, { size: 13 }) },
                  ],
                  onSelect: function (actionId) {
                    setPanelPlusMenuOpen(false);
                    setIsCollapsed(false);
                    if (actionId === "chat") {
                      setActiveView("chat");
                      var startBtn = document.querySelector('[class*="brand"], [class*="newSession"]');
                      if (startBtn) startBtn.click();
                      window.dispatchEvent(new CustomEvent("dsh:new-session"));
                    } else if (actionId === "terminal") {
                      setNewModal(true);
                    } else if (actionId === "container") {
                      window.dispatchEvent(new CustomEvent("dsh:open-container", { detail: { id: null } }));
                    }
                  }
                })
              );
            })()
          ),
          // Right Controls Bar (3-dots specialized actions + collapse/expand toggle)
          h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "4px" } },
            windows.length > 1
              ? h(
                  "div",
                  {
                    className: "dsh-term-tabs",
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      marginRight: "6px",
                      overflowX: "auto",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    },
                  },
                  windows.map(function (w) {
                    return h(
                      "button",
                      {
                        key: w.index,
                        onClick: function () { handleSelectWindow(w.index); },
                        style: {
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "none",
                          background: w.active ? "var(--dsw-alias-interactive-bg-active, #238636)" : "rgba(255,255,255,0.05)",
                          color: "#fff",
                          fontSize: "11px",
                          cursor: "pointer",
                        },
                      },
                      w.index + ":" + w.name
                    );
                  }),
                  h("button", { onClick: handleNewWindow, title: "New window in this session", style: { padding: "2px 6px", borderRadius: "4px", border: "1px dashed var(--dsw-alias-border-l2)", background: "transparent", color: "var(--dsw-alias-label-secondary)", fontSize: "11px", cursor: "pointer" } }, "+")
                )
              : null,
            // Specialized 3-dots actions menu
            h("div", { style: { position: "relative", display: "inline-flex", alignItems: "center" } },
              h("button", {
                ref: tabActionsBtnRef,
                type: "button",
                title: "Actions (…)",
                onClick: function (e) {
                  e.stopPropagation();
                  setTabActionsOpen(function (v) { return !v; });
                },
                style: {
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "26px",
                  height: "26px",
                  borderRadius: "6px",
                  border: "none",
                  background: "transparent",
                  color: "var(--dsw-alias-label-secondary)",
                  cursor: "pointer",
                },
                onMouseEnter: function (e) { e.currentTarget.style.background = "var(--dsw-alias-interactive-bg-hover)"; },
                onMouseLeave: function (e) { e.currentTarget.style.background = "transparent"; },
              }, h(EllipsisGlyph, { size: 14 })),
              h(SelectDropdownMenu, {
                open: tabActionsOpen,
                anchorRef: tabActionsBtnRef,
                onClose: function () { setTabActionsOpen(false); },
                items: [
                  { id: "move-top", label: "Move to Main Area", icon: h(EyeGlyph, { size: 13 }) },
                  { id: "move-right", label: "Move to Secondary Sidebar", icon: h(DockToggleGlyph, { size: 13 }) },
                  activeView === "terminal" ? { id: "refresh", label: "Refresh Buffer", icon: h(RefreshGlyph, { size: 13 }) } : null,
                  activeView === "terminal" ? { id: "clear", label: "Clear Buffer (Ctrl+L)", icon: h(TrashGlyph, { size: 13 }) } : null,
                  activeView === "terminal" ? { id: "new-window", label: "New Window in Session", icon: h(PlusGlyph, { size: 13 }) } : null,
                  activeView === "terminal" ? { id: "new-session", label: "New Terminal Session", icon: h(TerminalsGlyph, { size: 13 }) } : null,
                  activeView === "terminal" ? { id: "kill", label: "Kill Current Session", icon: h(TrashGlyph, { size: 13 }), danger: true } : null,
                  activeView === "container" && selectedContainer ? { id: "stop-container", label: "Stop Container", icon: h(TrashGlyph, { size: 13 }) } : null,
                  activeView === "container" && selectedContainer ? { id: "start-container", label: "Start Container", icon: h(PlusGlyph, { size: 13 }) } : null,
                ].filter(Boolean),
                onSelect: function (actionId) {
                  setTabActionsOpen(false);
                  if (actionId === "move-top") {
                    if (activeView === "terminal" && selectedSession) {
                      var targetSess = selectedSession;
                      setSessions(function (prev) { return prev.filter(function (s) { return s.name !== targetSess; }); });
                      window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-top", {
                        detail: { id: targetSess, type: "terminal", title: targetSess, session: targetSess }
                      }));
                    } else if (activeView === "container" && selectedContainer) {
                      var targetCont = selectedContainer;
                      setContainers(function (prev) { return prev.filter(function (c) { return c.id !== targetCont; }); });
                      window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-top", {
                        detail: { id: targetCont, type: "container", title: targetCont }
                      }));
                    } else if (activeView === "chat") {
                      window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-top", {
                        detail: { id: "chat-main", type: "chat", title: "Conversation" }
                      }));
                    }
                  } else if (actionId === "move-right") {
                    if (activeView === "terminal" && selectedSession) {
                      var targetS = selectedSession;
                      setSessions(function (prev) { return prev.filter(function (s) { return s.name !== targetS; }); });
                      window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-right", {
                        detail: { id: targetS, type: "terminal", title: targetS, session: targetS }
                      }));
                    } else if (activeView === "container" && selectedContainer) {
                      var targetC = selectedContainer;
                      setContainers(function (prev) { return prev.filter(function (c) { return c.id !== targetC; }); });
                      window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-right", {
                        detail: { id: targetC, type: "container", title: targetC }
                      }));
                    }
                  } else if (actionId === "stop-container" && selectedContainer) {
                    fetch(QUOTAS_API + "/docker/containers/action", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: selectedContainer, action: "stop" }) });
                  } else if (actionId === "start-container" && selectedContainer) {
                    fetch(QUOTAS_API + "/docker/containers/action", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: selectedContainer, action: "start" }) });
                  } else if (actionId === "refresh") {
                    loadBuffer(selectedSession);
                  } else if (actionId === "clear") {
                    sendKey("C-l");
                  } else if (actionId === "new-window") {
                    handleNewWindow();
                  } else if (actionId === "new-session") {
                    setNewModal(true);
                  } else if (actionId === "kill") {
                    if (selectedSession) handleKill(selectedSession);
                  }
                }
              })
            ),
            // Collapse / Expand toggle button (Panel Dock Icon)
            h("button", {
              type: "button",
              onClick: function () { setIsCollapsed(function (v) { return !v; }); },
              title: isCollapsed ? "Expand Bottom Dock" : "Collapse Bottom Dock",
              style: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                border: "none",
                background: "transparent",
                color: "var(--dsw-alias-label-secondary)",
                cursor: "pointer",
                padding: "4px",
              },
              onMouseEnter: function (e) { e.currentTarget.style.background = "var(--dsw-alias-interactive-bg-hover)"; },
              onMouseLeave: function (e) { e.currentTarget.style.background = "transparent"; },
            }, h(DockToggleGlyph, {
              size: 14,
              style: {
                transform: isCollapsed ? "rotate(-90deg)" : "rotate(90deg)",
                transition: "transform 150ms ease",
              }
            }))
          )
        ),
        // Body content: terminal or container view (rendered when not collapsed)
        !isCollapsed && (activeView === "terminal") ? h(
          // Terminal Buffer Output
          "pre",
          {
            ref: terminalPreRef,
            style: {
              flex: 1,
              margin: 0,
              padding: "12px 16px",
              color: "var(--dsw-alias-label-primary, #c9d1d9)",
              fontFamily: "var(--ds-font-mono, 'JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', monospace)",
              fontSize: "12.5px",
              lineHeight: "1.48",
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              cursor: "text",
              background: "var(--dsw-alias-bg-layer-1, #0d1117)",
            },
            dangerouslySetInnerHTML: { __html: ansiToHtml(buffer) + '<span style="display:inline-block;width:7px;height:14px;background:#7ee787;margin-left:2px;vertical-align:middle;animation:blink 1s step-start infinite;"></span>' },
          }
        ) : activeView === "container" ? h(React.Fragment, null,
          // Container info bar
          (function () {
            var selCont = containers.find(function (c) { return c.id === selectedContainer; });
            if (!selCont) return h("div", { style: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--dsw-alias-label-tertiary)", fontSize: "13px" } }, "No container selected");
            return h(React.Fragment, null,
              // Container action bar
              h("div", {
                style: {
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 16px",
                  background: "var(--dsw-alias-bg-layer-2, #161b22)",
                  borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))",
                },
              },
                h("div", { style: { display: "flex", gap: "10px", alignItems: "center" } },
                  h("strong", { style: { color: "var(--dsw-alias-label-primary)", fontSize: "13px" } }, selCont.name || selCont.id.substring(0, 12)),
                  h("code", { style: { fontSize: "11px", color: "var(--dsw-alias-label-secondary)", background: "var(--dsw-alias-surface-l1, rgba(128,128,128,0.06))", padding: "1px 6px", borderRadius: "4px" } }, selCont.image),
                  h("span", { style: { padding: "1px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 600, background: selCont.isRunning ? "rgba(63, 185, 80, 0.15)" : "rgba(128,128,128,0.1)", color: selCont.isRunning ? "#3fb950" : "var(--dsw-alias-label-tertiary)" } }, selCont.isRunning ? "RUNNING" : "STOPPED")
                ),
                h("div", { style: { display: "flex", gap: "6px" } },
                  selCont.isRunning
                    ? h("button", { onClick: function () { handleContainerAction(selCont.id, "stop"); }, style: { padding: "4px 10px", borderRadius: "5px", border: "1px solid rgba(248, 81, 73, 0.3)", background: "rgba(248, 81, 73, 0.08)", color: "#f85149", fontSize: "11px", fontWeight: 500, cursor: "pointer" } }, "Stop")
                    : h("button", { onClick: function () { handleContainerAction(selCont.id, "start"); }, style: { padding: "4px 10px", borderRadius: "5px", border: "none", background: "var(--dsw-alias-primary, #6366f1)", color: "#fff", fontSize: "11px", fontWeight: 500, cursor: "pointer" } }, "Start"),
                  h("button", { onClick: function () { handleContainerAction(selCont.id, "restart"); }, style: { padding: "4px 10px", borderRadius: "5px", border: "1px solid var(--dsw-alias-border-l1)", background: "transparent", color: "var(--dsw-alias-label-secondary)", fontSize: "11px", cursor: "pointer" } }, "Restart"),
                  h("button", { onClick: function () { loadContainerLogs(selCont.id); }, style: { padding: "4px 10px", borderRadius: "5px", border: "1px solid var(--dsw-alias-border-l1)", background: "transparent", color: "var(--dsw-alias-label-secondary)", fontSize: "11px", cursor: "pointer" } }, h(RefreshGlyph, { size: 12 }))
                )
              ),
              // Container logs
              h("pre", {
                ref: terminalPreRef,
                style: {
                  flex: 1,
                  margin: 0,
                  padding: "12px 16px",
                  color: "var(--dsw-alias-label-primary, #c9d1d9)",
                  fontFamily: "var(--ds-font-mono, 'JetBrains Mono', 'Fira Code', 'Menlo', 'Consolas', monospace)",
                  fontSize: "12.5px",
                  lineHeight: "1.48",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  background: "var(--dsw-alias-bg-layer-1, #0d1117)",
                },
              }, containerLogs)
            );
          })()
        ) : null,
        newModal ? h(NewSessionModal, { onClose: function () { setNewModal(false); }, onCreated: loadSessions }) : null
      );
    }
    var FullPageTerminalsWorkspace = BottomTerminalPanel;

    // 7. DOCKABLE CONTAINERS WORKSPACE
    function FullPageContainersWorkspace(props) {
      var onClose = props.onClose;
      var initialContainerId = props.initialContainerId;
      var state = React.useState({ containers: [], loading: true, error: null });
      var data = state[0], setData = state[1];
      var selectedContainerState = React.useState(null);
      var selectedContainer = selectedContainerState[0], setSelectedContainer = selectedContainerState[1];
      var logsState = React.useState("Loading container logs…");
      var logs = logsState[0], setLogs = logsState[1];
      var actionState = React.useState({});
      var actionMap = actionState[0], setActionMap = actionState[1];
      var containerRef = React.useRef(null);
      var isNarrowState = React.useState(false);
      var isNarrow = isNarrowState[0], setIsNarrow = isNarrowState[1];

      React.useLayoutEffect(function () {
        if (!containerRef.current) return;
        var checkWidth = function () {
          if (containerRef.current) {
            setIsNarrow(containerRef.current.clientWidth < 420);
          }
        };
        checkWidth();
        var obs = new ResizeObserver(checkWidth);
        obs.observe(containerRef.current);
        return function () { obs.disconnect(); };
      }, []);

      var loadContainers = React.useCallback(function () {
        fetch(QUOTAS_API + "/docker/containers")
          .then(function (r) { return r.json(); })
          .then(function (res) {
            var list = res.containers || [];
            setData({ containers: list, loading: false, error: null });
            if (list.length > 0) {
              if (initialContainerId) {
                var found = list.find(function (c) { return c.id === initialContainerId; });
                setSelectedContainer(found || list[0]);
              } else if (!selectedContainer) {
                setSelectedContainer(list[0]);
              }
            }
          })
          .catch(function (err) {
            setData({ containers: [], loading: false, error: err.message });
          });
      }, [selectedContainer, initialContainerId]);

      var loadLogs = React.useCallback(function (cId) {
        if (!cId) return;
        fetch(QUOTAS_API + "/docker/containers/logs?id=" + encodeURIComponent(cId))
          .then(function (r) { return r.json(); })
          .then(function (res) { setLogs(res.logs || "(no logs)"); })
          .catch(function (err) { setLogs("Error loading logs: " + err.message); });
      }, []);

      React.useEffect(function () { loadContainers(); }, [loadContainers]);
      React.useEffect(function () { if (selectedContainer) loadLogs(selectedContainer.id); }, [selectedContainer, loadLogs]);

      var handleAction = function (id, action) {
        setActionMap(function (s) { var n = Object.assign({}, s); n[id] = action; return n; });
        fetch(QUOTAS_API + "/docker/containers/action", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: id, action: action }),
        })
          .then(function () { loadContainers(); })
          .finally(function () { setActionMap(function (s) { var n = Object.assign({}, s); delete n[id]; return n; }); });
      };

      return h(
        "div",
        {
          ref: containerRef,
          className: "dsh-containers-workspace",
          style: {
            width: "100%",
            height: "100%",
            background: "var(--dsw-alias-bg-layer-0, #000000)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            color: "var(--dsw-alias-label-primary, #fff)",
            fontFamily: "var(--ds-font-sans, system-ui, sans-serif)",
          }
        },
        // Content Area (adaptive row / column based on container width)
        h(
          "div",
          {
            style: {
              display: "flex",
              flex: 1,
              overflow: "hidden",
              flexDirection: isNarrow ? "column" : "row",
            }
          },
          // Container List
          h(
            "div",
            {
              style: {
                width: isNarrow ? "100%" : "200px",
                maxHeight: isNarrow ? "130px" : "100%",
                borderRight: isNarrow ? "none" : "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.12))",
                borderBottom: isNarrow ? "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.12))" : "none",
                background: "var(--dsw-alias-bg-layer-0, #000000)",
                display: "flex",
                flexDirection: "column",
                padding: "6px",
                gap: "4px",
                overflowY: "auto",
                flexShrink: 0,
              }
            },
            data.containers.length === 0 ? h("div", { style: { padding: "12px 8px", fontSize: "11px", color: "var(--dsw-alias-label-tertiary, #666)", textAlign: "center" } }, "No containers found") : null,
            data.containers.map(function (c) {
              var isSel = selectedContainer && selectedContainer.id === c.id;
              return h(
                "div",
                {
                  key: c.id,
                  onClick: function () { setSelectedContainer(c); },
                  style: {
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: isSel ? "var(--dsw-alias-interactive-bg-active, rgba(99, 102, 241, 0.18))" : "transparent",
                    border: isSel ? "1px solid var(--dsw-alias-primary, #6366f1)" : "1px solid transparent",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  },
                },
                h("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                  h("span", { style: { fontSize: "12px", fontWeight: 600, color: isSel ? "#fff" : "var(--dsw-alias-label-primary, #ccc)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, c.name || c.id.substring(0, 12)),
                  h("span", { style: { padding: "1px 4px", borderRadius: "3px", fontSize: "8.5px", fontWeight: 700, background: c.isRunning ? "rgba(99, 102, 241, 0.2)" : "rgba(128,128,128,0.15)", color: c.isRunning ? "var(--dsw-alias-primary, #6366f1)" : "var(--dsw-alias-label-tertiary, #888)" } }, c.isRunning ? "RUNNING" : "STOPPED")
                ),
                h("span", { style: { fontSize: "10.5px", color: "var(--dsw-alias-label-tertiary, #777)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, c.image)
              );
            })
          ),
          // Selected Container Details & Logs
          h(
            "div",
            {
              style: {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "var(--dsw-alias-bg-layer-0, #000000)",
                overflow: "hidden",
              }
            },
            // Container Logs Console
            h("pre", {
              style: {
                flex: 1,
                margin: 0,
                padding: "10px 12px",
                color: "var(--dsw-alias-label-primary, #c9d1d9)",
                fontFamily: "var(--ds-font-mono, monospace)",
                fontSize: "11px",
                lineHeight: "1.4",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                background: "var(--dsw-alias-bg-layer-1, #080808)",
              }
            }, logs)
          )
        )
      );
    }

    function SelectDropdownMenu(props) {
      var open = props.open, onClose = props.onClose, items = props.items, onSelect = props.onSelect, anchorRef = props.anchorRef, position = props.position;
      var menuRef = React.useRef(null);
      var posState = React.useState({ top: 0, left: 0 });
      var pos = posState[0], setPos = posState[1];

      React.useLayoutEffect(function () {
        if (!open) return;
        var menuWidth = 190;
        var menuHeight = (items ? items.length : 4) * 36 + 10;
        if (position && typeof position.x === "number") {
          var top = (position.y + menuHeight > window.innerHeight) ? Math.max(8, position.y - menuHeight) : position.y;
          var left = (position.x + menuWidth > window.innerWidth) ? Math.max(8, position.x - menuWidth) : position.x;
          setPos({ top: Math.max(8, top), left: Math.max(8, left) });
        } else if (anchorRef && anchorRef.current) {
          var rect = anchorRef.current.getBoundingClientRect();
          var top2 = (rect.bottom + menuHeight > window.innerHeight) ? (rect.top - menuHeight - 4) : (rect.bottom + 4);
          var left2 = (rect.right - menuWidth < 10) ? Math.max(10, rect.left) : (rect.right - menuWidth);
          setPos({ top: Math.max(8, top2), left: Math.max(8, left2) });
        }
      }, [open, anchorRef, position, items ? items.length : 0]);

      React.useEffect(function () {
        if (!open) return;
        var handlePointerDown = function (e) {
          if (menuRef.current && !menuRef.current.contains(e.target) && (!anchorRef || !anchorRef.current || !anchorRef.current.contains(e.target))) {
            onClose();
          }
        };
        document.addEventListener("pointerdown", handlePointerDown);
        return function () { document.removeEventListener("pointerdown", handlePointerDown); };
      }, [open, onClose, anchorRef]);

      if (!open) return null;

      var isFixed = Boolean((anchorRef && anchorRef.current) || position);
      return h(
        "div",
        {
          ref: menuRef,
          style: {
            position: isFixed ? "fixed" : "absolute",
            top: isFixed ? pos.top + "px" : "calc(100% + 4px)",
            left: isFixed ? pos.left + "px" : "auto",
            right: isFixed ? "auto" : 0,
            zIndex: 10000000,
            minWidth: "190px",
            background: "var(--dsw-alias-surface-l0, #1e1e2e)",
            border: "1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25))",
            borderRadius: "8px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.65)",
            padding: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          },
          onClick: function (e) { e.stopPropagation(); },
        },
        items.map(function (item) {
          var isDanger = Boolean(item.danger);
          return h(
            "button",
            {
              key: item.id,
              type: "button",
              style: {
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                padding: "7px 10px",
                borderRadius: "5px",
                border: "none",
                background: "transparent",
                color: isDanger ? "#f85149" : "var(--dsw-alias-label-primary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 100ms",
              },
              onMouseEnter: function (e) {
                e.currentTarget.style.background = isDanger ? "rgba(248, 81, 73, 0.15)" : "var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.15))";
              },
              onMouseLeave: function (e) {
                e.currentTarget.style.background = "transparent";
              },
              onClick: function (e) {
                e.stopPropagation();
                onSelect(item.id);
                onClose();
              },
            },
            item.icon ? h("span", { style: { display: "inline-flex", flexShrink: 0 } }, item.icon) : null,
            h("span", { style: { flex: 1 } }, item.label)
          );
        })
      );
    }

    // Interactive Tmux Terminal Component (Unified for Main Area, Bottom Panel, and Right Sidebar)
    function InteractiveTmuxTerminal(props) {
      var sessionName = props.sessionName || "0";
      var style = props.style || {};
      var bufferState = React.useState("Connecting to " + sessionName + "…");
      var buffer = bufferState[0], setBuffer = bufferState[1];
      var preRef = React.useRef(null);
      var containerRef = React.useRef(null);
      var isFocusedState = React.useState(false);
      var isFocused = isFocusedState[0], setIsFocused = isFocusedState[1];

      var sendKey = function (key) {
        fetch(QUOTAS_API + "/tmux/sessions/send-keys", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: sessionName, keys: key, isLiteral: false }),
        }).then(function () {
          fetch(QUOTAS_API + "/tmux/sessions/capture?ansi=1&name=" + encodeURIComponent(sessionName))
            .then(function (r) { return r.json(); })
            .then(function (res) { if (res && res.buffer !== undefined) setBuffer(res.buffer || "(empty)"); });
        });
      };

      var sendLiteral = function (text) {
        fetch(QUOTAS_API + "/tmux/sessions/send-keys", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: sessionName, keys: text, isLiteral: true }),
        }).then(function () {
          fetch(QUOTAS_API + "/tmux/sessions/capture?ansi=1&name=" + encodeURIComponent(sessionName))
            .then(function (r) { return r.json(); })
            .then(function (res) { if (res && res.buffer !== undefined) setBuffer(res.buffer || "(empty)"); });
        });
      };

      var handleKeyDown = function (e) {
        if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
        if (e.key === "Enter") {
          sendKey("Enter"); e.preventDefault();
        } else if (e.key === "Backspace") {
          sendKey("BSpace"); e.preventDefault();
        } else if (e.key === "Tab") {
          sendKey("Tab"); e.preventDefault();
        } else if (e.key === "ArrowUp") {
          sendKey("Up"); e.preventDefault();
        } else if (e.key === "ArrowDown") {
          sendKey("Down"); e.preventDefault();
        } else if (e.key === "ArrowLeft") {
          sendKey("Left"); e.preventDefault();
        } else if (e.key === "ArrowRight") {
          sendKey("Right"); e.preventDefault();
        } else if (e.key === "Escape") {
          sendKey("Escape"); e.preventDefault();
        } else if (e.ctrlKey) {
          if (e.key === "c" || e.key === "C") { sendKey("C-c"); e.preventDefault(); }
          else if (e.key === "d" || e.key === "D") { sendKey("C-d"); e.preventDefault(); }
          else if (e.key === "l" || e.key === "L") { sendKey("C-l"); e.preventDefault(); }
          else if (e.key === "z" || e.key === "Z") { sendKey("C-z"); e.preventDefault(); }
        } else if (e.key.length === 1 && !e.metaKey && !e.altKey) {
          sendLiteral(e.key);
          e.preventDefault();
        }
      };

      var handleSessionExited = function () {
        if (props.onClose) {
          props.onClose();
        }
        window.dispatchEvent(new CustomEvent("dsh:close-terminal-tab", { detail: { id: sessionName, session: sessionName } }));
      };

      React.useEffect(function () {
        var consecutiveErrors = 0;
        var load = function () {
          fetch(QUOTAS_API + "/tmux/sessions/capture?ansi=1&name=" + encodeURIComponent(sessionName))
            .then(function (r) {
              if (r.status === 404 || r.status === 410) {
                handleSessionExited();
                return null;
              }
              return r.json();
            })
            .then(function (res) {
              if (!res) return;
              if (res.error && (res.error.indexOf("not found") !== -1 || res.error.indexOf("failed") !== -1 || res.error.indexOf("no server") !== -1 || res.error.indexOf("exited") !== -1)) {
                consecutiveErrors++;
                if (consecutiveErrors >= 2) {
                  handleSessionExited();
                }
                return;
              }
              consecutiveErrors = 0;
              if (res && res.buffer !== undefined) setBuffer(res.buffer || "(empty)");
            })
            .catch(function () {
              consecutiveErrors++;
              if (consecutiveErrors >= 3) {
                handleSessionExited();
              }
            });
        };
        load();
        var timer = setInterval(load, 500);
        return function () { clearInterval(timer); };
      }, [sessionName]);

      React.useEffect(function () {
        if (preRef.current) preRef.current.scrollTop = preRef.current.scrollHeight;
      }, [buffer]);

      return h(
        "div",
        {
          ref: containerRef,
          tabIndex: 0,
          onKeyDown: handleKeyDown,
          onFocus: function () { setIsFocused(true); },
          onBlur: function () { setIsFocused(false); },
          onClick: function () { if (containerRef.current) containerRef.current.focus(); },
          style: Object.assign({
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: "var(--dsw-alias-bg-layer-0, #000000)",
            outline: isFocused ? "1px solid var(--dsw-alias-primary, #6366f1)" : "none",
            outlineOffset: "-1px",
            cursor: "text",
            position: "relative",
            minHeight: 0,
            overflow: "hidden",
          }, style),
        },
        h("pre", {
          ref: preRef,
          dangerouslySetInnerHTML: { __html: ansiToHtml(buffer) + '<span style="display:inline-block;width:7px;height:14px;background:#7ee787;margin-left:2px;vertical-align:middle;animation:blink 1s step-start infinite;"></span>' },
          style: {
            flex: 1,
            margin: 0,
            padding: "12px 16px",
            color: "var(--dsw-alias-label-primary, #c9d1d9)",
            fontFamily: "var(--ds-font-mono, 'JetBrains Mono', 'Fira Code', 'Menlo', monospace)",
            fontSize: "12.5px",
            lineHeight: "1.48",
            overflowY: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            background: "transparent",
          },
        })
      );
    }

    // Empty Area New Tab Fallback Picker
    function EmptyAreaNewTabPicker(props) {
      var areaName = props.areaName || "Area";
      return h(
        "div",
        {
          style: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "32px",
            background: "var(--dsw-alias-bg-layer-0, #000000)",
            color: "var(--dsw-alias-label-primary, #fff)",
            fontFamily: "var(--ds-font-family, sans-serif)",
          }
        },
        h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" } },
          h("div", { style: { fontSize: "16px", fontWeight: 600 } }, "Empty " + areaName),
          h("div", { style: { fontSize: "12.5px", color: "var(--dsw-alias-label-secondary, #888)" } }, "Open a new tab or drag an existing tab here")
        ),
        h("div", { style: { display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" } },
          h("button", {
            type: "button",
            onClick: function () {
              window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-top", { detail: { id: "chat-main", type: "chat", title: "Conversation" } }));
            },
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.12))",
              background: "var(--dsw-alias-surface-l1, rgba(255,255,255,0.04))",
              color: "inherit",
              fontSize: "12.5px",
              fontWeight: 500,
              cursor: "pointer",
            }
          }, h(ChatGlyph, { size: 14 }), "+ New Conversation"),
          h("button", {
            type: "button",
            onClick: function () {
              var termId = "term-" + Date.now().toString(36);
              window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-top", { detail: { id: termId, type: "terminal", title: termId, session: "0" } }));
            },
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.12))",
              background: "var(--dsw-alias-surface-l1, rgba(255,255,255,0.04))",
              color: "inherit",
              fontSize: "12.5px",
              fontWeight: 500,
              cursor: "pointer",
            }
          }, h(TerminalsGlyph, { size: 14 }), "+ New Terminal"),
          h("button", {
            type: "button",
            onClick: function () {
              window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-top", { detail: { id: "container-sandboxes", type: "container", title: "Containers" } }));
            },
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              border: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.12))",
              background: "var(--dsw-alias-surface-l1, rgba(255,255,255,0.04))",
              color: "inherit",
              fontSize: "12.5px",
              fontWeight: 500,
              cursor: "pointer",
            }
          }, h(ContainersGlyph, { size: 14 }), "+ New Container")
        )
      );
    }

    // Secondary Sidebar Dock Component
    function RightSidebarDock(props) {
      var isOpenState = React.useState(false);
      var isOpen = isOpenState[0], setIsOpen = isOpenState[1];
      var widthState = React.useState(300);
      var width = widthState[0], setWidth = widthState[1];
      var tabsState = React.useState([]);
      var tabs = tabsState[0], setTabs = tabsState[1];
      var activeTabState = React.useState(null);
      var activeTab = activeTabState[0], setActiveTab = activeTabState[1];
      var isResizingState = React.useState(false);
      var isResizing = isResizingState[0], setIsResizing = isResizingState[1];
      var menuOpenState = React.useState(false);
      var isMenuOpen = menuOpenState[0], setMenuOpen = menuOpenState[1];
      var menuBtnRef = React.useRef(null);

      // Broadcast secondary sidebar width and adjust centerCol layout bounds
      React.useEffect(function () {
        var currentRightWidth = isOpen ? width : (tabs.length > 0 ? 36 : 0);
        if (typeof window !== "undefined") {
          window.__dsh_right_sidebar_width__ = currentRightWidth;
          window.dispatchEvent(new CustomEvent("dsh:right-sidebar-changed", { detail: { open: isOpen, width: currentRightWidth } }));
        }
        var centerCol = document.querySelector('div[class*="centerCol"], [class*="centerCol"]');
        var isSwapped = typeof document !== "undefined" && document.body.classList.contains("dsh-sidebars-swapped");
        if (centerCol) {
          if (isSwapped) {
            centerCol.style.marginLeft = currentRightWidth + "px";
            centerCol.style.marginRight = "0px";
          } else {
            centerCol.style.marginRight = currentRightWidth + "px";
            centerCol.style.marginLeft = "0px";
          }
          centerCol.style.transition = isResizing ? "none" : "margin 150ms ease";
        }
        return function () {
          var col = document.querySelector('div[class*="centerCol"], [class*="centerCol"]');
          if (col) {
            col.style.marginRight = "0px";
            col.style.marginLeft = "0px";
          }
        };
      }, [isOpen, width, tabs.length, isResizing]);

      React.useEffect(function () {
        var onToggle = function () { setIsOpen(function (v) { return !v; }); };
        var onMoveToRight = function (e) {
          var tab = e.detail;
          if (!tab) return;
          setTabs(function (prev) {
            if (prev.some(function (t) { return t.id === tab.id; })) return prev;
            return prev.concat([tab]);
          });
          setActiveTab(tab.id);
          setIsOpen(true);
        };
        var onMoveToTop = function (e) {
          var tab = e.detail;
          if (!tab) return;
          setTabs(function (prev) { return prev.filter(function (t) { return t.id !== tab.id; }); });
        };
        var onMoveToBottom = function (e) {
          var tab = e.detail;
          if (!tab) return;
          setTabs(function (prev) { return prev.filter(function (t) { return t.id !== tab.id; }); });
        };
        window.addEventListener("dsh:toggle-right-sidebar", onToggle);
        window.addEventListener("dsh:tab-moved-to-right", onMoveToRight);
        window.addEventListener("dsh:tab-moved-to-top", onMoveToTop);
        window.addEventListener("dsh:tab-moved-to-bottom", onMoveToBottom);
        return function () {
          window.removeEventListener("dsh:toggle-right-sidebar", onToggle);
          window.removeEventListener("dsh:tab-moved-to-right", onMoveToRight);
          window.removeEventListener("dsh:tab-moved-to-top", onMoveToTop);
          window.removeEventListener("dsh:tab-moved-to-bottom", onMoveToBottom);
        };
      }, []);

      var handleResizeStart = function (e) {
        e.preventDefault();
        setIsResizing(true);
        var startX = e.clientX;
        var startW = width;
        var isSwapped = typeof document !== "undefined" && document.body.classList.contains("dsh-sidebars-swapped");
        var onMove = function (moveEv) {
          var delta = isSwapped ? (moveEv.clientX - startX) : (startX - moveEv.clientX);
          var nextW = Math.max(180, Math.min(600, startW + delta));
          setWidth(nextW);
        };
        var onUp = function () {
          setIsResizing(false);
          document.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerup", onUp);
        };
        document.addEventListener("pointermove", onMove);
        document.addEventListener("pointerup", onUp);
      };

      if (!isOpen && tabs.length === 0) return null;

      var activeTabObj = tabs.find(function (t) { return t.id === activeTab; });

      return h(
        "div",
        {
          className: "dsh-right-sidebar-dock",
          style: {
            position: "fixed",
            top: "48px",
            right: 0,
            bottom: 0,
            width: isOpen ? width + "px" : "36px",
            background: "var(--dsw-alias-bg-layer-0, #000000)",
            borderLeft: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.12))",
            zIndex: 85,
            display: "flex",
            flexDirection: "column",
            transition: isResizing ? "none" : "width 150ms ease",
          },
          onDragOver: function (e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; },
          onDrop: function (e) {
            e.preventDefault();
            try {
              var raw = e.dataTransfer.getData("text/dsh-tab");
              if (raw) {
                var tabData = JSON.parse(raw);
                window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-right", { detail: tabData }));
              }
            } catch (err) {}
          },
        },
        // Resize handle on edge
        isOpen ? h("div", {
          onPointerDown: handleResizeStart,
          style: {
            position: "absolute",
            top: 0,
            bottom: 0,
            left: "-4px",
            width: "8px",
            cursor: "col-resize",
            zIndex: 10,
          }
        }) : null,
        // Header Tab Strip
        h(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "38px",
              padding: "0 6px",
              background: "var(--dsw-alias-bg-layer-0, #000000)",
              borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(255,255,255,0.12))",
            }
          },
          isOpen ? h(
            "div",
            {
              className: "dsh-top-tab-bar",
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                overflowX: "auto",
                scrollbarWidth: "none",
              }
            },
            tabs.map(function (t) {
              var isSel = activeTab === t.id;
              var icon = t.type === "terminal" ? h(TerminalsGlyph, { size: 12 }) : (t.type === "container" ? h(ContainersGlyph, { size: 12 }) : h(ChatGlyph, { size: 12 }));
              return h(
                "div",
                {
                  key: t.id,
                  draggable: true,
                  onClick: function () { setActiveTab(t.id); },
                  style: {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: isSel ? "var(--dsw-alias-interactive-bg-active, rgba(99, 102, 241, 0.2))" : "transparent",
                    border: isSel ? "1px solid var(--dsw-alias-primary, #6366f1)" : "1px solid transparent",
                    color: isSel ? "#fff" : "var(--dsw-alias-label-secondary, #888)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }
                },
                icon,
                h("span", null, t.title || t.id),
                h("button", {
                  type: "button",
                  onClick: function (e) {
                    e.stopPropagation();
                    setTabs(function (prev) { return prev.filter(function (x) { return x.id !== t.id; }); });
                  },
                  style: { border: "none", background: "transparent", color: "inherit", cursor: "pointer", padding: "0 2px" }
                }, "×")
              );
            })
          ) : null,
          h("div", { style: { display: "flex", alignItems: "center", gap: "2px" } },
            isOpen ? h("div", { style: { position: "relative", display: "inline-flex", alignItems: "center" } },
              h("button", {
                ref: menuBtnRef,
                type: "button",
                onClick: function () { setMenuOpen(!isMenuOpen); },
                title: "Secondary Sidebar Actions (…)",
                style: {
                  border: "none",
                  background: "transparent",
                  color: "var(--dsw-alias-label-secondary)",
                  cursor: "pointer",
                  padding: "4px",
                  display: "inline-flex",
                  alignItems: "center",
                }
              }, h(EllipsisGlyph, { size: 14 })),
              h(SelectDropdownMenu, {
                open: isMenuOpen,
                anchorRef: menuBtnRef,
                onClose: function () { setMenuOpen(false); },
                items: [
                  activeTabObj ? { id: "move-top", label: "Move Tab to Main Area", icon: h(EyeGlyph, { size: 13 }) } : null,
                  activeTabObj ? { id: "move-bottom", label: "Move Tab to Bottom Panel", icon: h(DockToggleGlyph, { size: 13 }) } : null,
                  activeTabObj ? { id: "close-tab", label: "Close Active Tab", icon: h(TrashGlyph, { size: 13 }) } : null,
                  { id: "collapse", label: "Collapse Secondary Sidebar", icon: h(DockToggleGlyph, { size: 13 }) },
                ].filter(Boolean),
                onSelect: function (act) {
                  setMenuOpen(false);
                  if (act === "move-top" && activeTabObj) {
                    var tab = activeTabObj;
                    setTabs(function (prev) { return prev.filter(function (t) { return t.id !== tab.id; }); });
                    window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-top", { detail: tab }));
                  } else if (act === "move-bottom" && activeTabObj) {
                    var tabB = activeTabObj;
                    setTabs(function (prev) { return prev.filter(function (t) { return t.id !== tabB.id; }); });
                    window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-bottom", { detail: tabB }));
                  } else if (act === "close-tab" && activeTabObj) {
                    setTabs(function (prev) { return prev.filter(function (t) { return t.id !== activeTabObj.id; }); });
                  } else if (act === "collapse") {
                    setIsOpen(false);
                  }
                }
              })
            ) : null,
            h("button", {
              type: "button",
              onClick: function () { setIsOpen(!isOpen); },
              title: isOpen ? "Collapse Secondary Sidebar" : "Expand Secondary Sidebar",
              style: {
                border: "none",
                background: "transparent",
                color: "var(--dsw-alias-label-secondary)",
                cursor: "pointer",
                padding: "4px",
              }
            }, h(DockToggleGlyph, { size: 14, style: { transform: isOpen ? "rotate(180deg)" : "none" } }))
          )
        ),
        // Body Content
        isOpen ? (
          activeTabObj && activeTabObj.type === "terminal" ? h(InteractiveTmuxTerminal, { sessionName: activeTabObj.session || activeTabObj.id })
          : activeTabObj && activeTabObj.type === "container" ? h(FullPageContainersWorkspace, {})
          : h(EmptyAreaNewTabPicker, { areaName: "Secondary Sidebar" })
        ) : null
      );
    }

    function getCenterBounds() {
      if (typeof document === "undefined") return { left: 240, right: 0, top: 0 };
      var isSwapped = document.body.classList.contains("dsh-sidebars-swapped");
      var customSecondary = (typeof window !== "undefined" && window.__dsh_right_sidebar_width__) ? window.__dsh_right_sidebar_width__ : 0;
      var detailsEl = document.querySelector('div[class*="detailsCol"], div[class*="details"], div[data-details]');
      var detailsW = (detailsEl && detailsEl.getBoundingClientRect) ? detailsEl.getBoundingClientRect().width : 0;
      var secondaryW = Math.max(customSecondary, detailsW);

      var sidebarEl = document.querySelector('div[class*="sidebarCol"]');
      var primaryW = (sidebarEl && sidebarEl.getBoundingClientRect && sidebarEl.getBoundingClientRect().width > 0) ? sidebarEl.getBoundingClientRect().width : 240;

      var centerEl = document.querySelector('div[class*="centerCol"], div[data-slot="conversation"], main');
      var top = 0;
      if (centerEl && centerEl.getBoundingClientRect) {
        top = Math.max(0, centerEl.getBoundingClientRect().top);
      }

      if (isSwapped) {
        return {
          left: secondaryW,
          right: primaryW,
          top: top
        };
      }

      return {
        left: primaryW,
        right: secondaryW,
        top: top,
      };
    }

    function useCenterBounds() {
      var boundsState = React.useState(getCenterBounds);
      var bounds = boundsState[0], setBounds = boundsState[1];

      React.useEffect(function () {
        var update = function () {
          var next = getCenterBounds();
          setBounds(function (prev) {
            if (prev.left !== next.left || prev.right !== next.right || prev.top !== next.top) {
              return next;
            }
            return prev;
          });
        };
        window.addEventListener("dsh:right-sidebar-changed", update);
        window.addEventListener("resize", update);
        window.addEventListener("pointermove", update);
        var timer = setInterval(update, 100);
        return function () {
          window.removeEventListener("dsh:right-sidebar-changed", update);
          window.removeEventListener("resize", update);
          window.removeEventListener("pointermove", update);
          clearInterval(timer);
        };
      }, []);

      return bounds;
    }

    function MainViewTerminalOccupant(props) {
      var sessionName = props.sessionName || "0";
      var bounds = useCenterBounds();
      var panelHeightState = React.useState(function () {
        if (typeof window !== "undefined" && window.__dsh_panel_height__) {
          return window.__dsh_panel_height__;
        }
        return "38px";
      });
      var panelHeight = panelHeightState[0], setPanelHeight = panelHeightState[1];

      React.useEffect(function () {
        var onGeom = function (e) {
          if (e && e.detail && e.detail.height) {
            setPanelHeight(e.detail.height);
          }
        };
        window.addEventListener("dsh:panel-geometry-changed", onGeom);
        return function () { window.removeEventListener("dsh:panel-geometry-changed", onGeom); };
      }, []);

      return h("div", {
        className: "dsh-mainview-terminal",
        style: {
          position: "fixed",
          top: (bounds.top + 38) + "px",
          left: bounds.left + "px",
          right: bounds.right + "px",
          bottom: panelHeight,
          background: "var(--dsw-alias-bg-layer-0, #000000)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--ds-font-mono, monospace)",
        }
      },
        h(InteractiveTmuxTerminal, { sessionName: sessionName })
      );
    }

    function MainViewContainerOccupant(props) {
      var bounds = useCenterBounds();
      var panelHeightState = React.useState(function () {
        if (typeof window !== "undefined" && window.__dsh_panel_height__) {
          return window.__dsh_panel_height__;
        }
        return "38px";
      });
      var panelHeight = panelHeightState[0], setPanelHeight = panelHeightState[1];

      React.useEffect(function () {
        var onGeom = function (e) {
          if (e && e.detail && e.detail.height) {
            setPanelHeight(e.detail.height);
          }
        };
        window.addEventListener("dsh:panel-geometry-changed", onGeom);
        return function () { window.removeEventListener("dsh:panel-geometry-changed", onGeom); };
      }, []);

      return h("div", {
        className: "dsh-mainview-container",
        style: {
          position: "fixed",
          top: (bounds.top + 36) + "px",
          left: bounds.left + "px",
          right: bounds.right + "px",
          bottom: panelHeight,
          background: "var(--dsw-alias-bg-layer-0, #000000)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
        }
      },
        h(FullPageContainersWorkspace, { onClose: props.onClose })
      );
    }

    function MainViewFileEditorOccupant(props) {
      var filePath = props.filePath || "";
      var fileName = props.fileName || (filePath ? filePath.split("/").pop() : "File");
      var onClose = props.onClose;
      var bounds = useCenterBounds();

      var contentState = React.useState("");
      var content = contentState[0], setContent = contentState[1];
      var originalContentState = React.useState("");
      var originalContent = originalContentState[0], setOriginalContent = originalContentState[1];
      var loadingState = React.useState(true);
      var loading = loadingState[0], setLoading = loadingState[1];
      var savingState = React.useState(false);
      var saving = savingState[0], setSaving = savingState[1];
      var errorState = React.useState(null);
      var error = errorState[0], setError = errorState[1];
      var statusMsgState = React.useState("");
      var statusMsg = statusMsgState[0], setStatusMsg = statusMsgState[1];

      var isDirty = content !== originalContent;

      React.useEffect(function () {
        setLoading(true);
        setError(null);
        fetch(QUOTAS_API + "/fs/read?path=" + encodeURIComponent(filePath))
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.error) {
              setError(res.error);
            } else {
              setContent(res.content || "");
              setOriginalContent(res.content || "");
            }
          })
          .catch(function (err) { setError(err.message); })
          .finally(function () { setLoading(false); });
      }, [filePath]);

      var handleSave = function () {
        if (saving) return;
        setSaving(true);
        setStatusMsg("Saving…");
        fetch(QUOTAS_API + "/fs/write", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path: filePath, content: content }),
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.error) {
              setStatusMsg("Error: " + res.error);
            } else {
              setOriginalContent(content);
              setStatusMsg("Saved!");
              setTimeout(function () { setStatusMsg(""); }, 2000);
            }
          })
          .catch(function (err) { setStatusMsg("Save failed: " + err.message); })
          .finally(function () { setSaving(false); });
      };

      React.useEffect(function () {
        var onKeyDown = function (e) {
          if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
            e.preventDefault();
            handleSave();
          }
        };
        window.addEventListener("keydown", onKeyDown);
        return function () { window.removeEventListener("keydown", onKeyDown); };
      }, [content, filePath]);

      var lineCount = (content.match(/\n/g) || []).length + 1;
      var lineNumbers = [];
      for (var li = 1; li <= Math.min(lineCount, 5000); li++) {
        lineNumbers.push(li);
      }

      return h("div", {
        className: "dsh-mainview-monaco",
        style: {
          position: "fixed",
          top: (bounds.top + 36) + "px",
          left: bounds.left + "px",
          right: bounds.right + "px",
          bottom: (typeof window !== "undefined" && window.__dsh_panel_height__) ? window.__dsh_panel_height__ : "38px",
          background: "var(--dsw-alias-surface-l0, #13141f)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--ds-font-sans, system-ui, sans-serif)",
        }
      },
        h("div", {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px",
            background: "var(--dsw-alias-surface-l1, #181926)",
            borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))",
            userSelect: "none",
          }
        },
          h("div", { style: { display: "flex", alignItems: "center", gap: "10px", minWidth: 0 } },
            h("span", { style: { color: "var(--dsw-alias-primary, #6366f1)", display: "inline-flex" } }, h(FileGlyph, { size: 16 })),
            h("strong", { style: { color: "var(--dsw-alias-label-primary)", fontSize: "13px", fontWeight: 600 } }, fileName),
            isDirty ? h("span", { title: "Unsaved changes", style: { color: "#eab308", fontSize: "14px", lineHeight: 1 } }, "●") : null,
            h("span", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, filePath)
          ),
          h("div", { style: { display: "flex", alignItems: "center", gap: "10px" } },
            statusMsg ? h("span", { style: { fontSize: "12px", color: statusMsg.startsWith("Error") ? "var(--dsw-alias-state-error-primary, #f85149)" : "var(--dsw-alias-primary, #6366f1)" } }, statusMsg) : null,
            h("button", {
              type: "button",
              onClick: handleSave,
              disabled: saving || !isDirty,
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                height: "26px",
                padding: "0 12px",
                borderRadius: "6px",
                border: "1px solid var(--dsw-alias-border-l1)",
                background: isDirty ? "var(--dsw-alias-primary, #6366f1)" : "transparent",
                color: isDirty ? "#fff" : "var(--dsw-alias-label-secondary)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: (saving || !isDirty) ? "default" : "pointer",
                opacity: (saving || !isDirty) ? 0.6 : 1,
                transition: "all 120ms ease",
              }
            }, saving ? "Saving…" : "Save (⌘S)"),
            h("button", {
              type: "button",
              onClick: onClose,
              title: "Close Editor Tab",
              style: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                background: "transparent",
                border: "none",
                color: "var(--dsw-alias-label-secondary)",
                cursor: "pointer",
                fontSize: "14px",
                transition: "background 100ms, color 100ms",
              },
              onMouseEnter: function (e) { e.currentTarget.style.background = "var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.15))"; },
              onMouseLeave: function (e) { e.currentTarget.style.background = "transparent"; },
            }, "✕")
          )
        ),
        h("div", {
          style: {
            flex: 1,
            position: "relative",
            display: "flex",
            overflow: "hidden",
            background: "var(--dsw-alias-surface-l0, #13141f)",
          }
        },
          loading ? h("div", { style: { padding: "24px", color: "var(--dsw-alias-label-secondary)" } }, "Loading file…") :
          error ? h("div", { style: { padding: "24px", color: "var(--dsw-alias-state-error-primary, #f85149)" } }, "Error: " + error) :
          h("div", { style: { display: "flex", width: "100%", height: "100%", overflow: "hidden" } },
            h("div", {
              style: {
                width: "44px",
                padding: "16px 8px 16px 0",
                boxSizing: "border-box",
                textAlign: "right",
                userSelect: "none",
                color: "var(--dsw-alias-label-tertiary, #6e7681)",
                fontFamily: "var(--ds-font-mono, monospace)",
                fontSize: "12px",
                lineHeight: "1.6",
                borderRight: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.1))",
                background: "var(--dsw-alias-surface-l0, #13141f)",
                opacity: 0.6,
              }
            }, lineNumbers.map(function (num) { return h("div", { key: num }, num); })),
            h("textarea", {
              value: content,
              onChange: function (e) { setContent(e.target.value); },
              spellCheck: false,
              style: {
                flex: 1,
                height: "100%",
                border: "none",
                outline: "none",
                resize: "none",
                padding: "16px 20px",
                boxSizing: "border-box",
                fontFamily: "var(--ds-font-mono, monospace)",
                fontSize: "13px",
                lineHeight: "1.6",
                background: "transparent",
                color: "var(--dsw-alias-label-primary)",
                tabSize: 2,
              }
            })
          )
        )
      );
    }

    function MainViewRepoOccupant(props) {
      var repoPath = props.repoPath || "";
      var repoName = props.repoName || (repoPath ? repoPath.split("/").pop() : "Repository");
      var onClose = props.onClose;

      var tabState = React.useState("code"); // "code" | "changes" | "history" | "branches"
      var activeTab = tabState[0], setActiveTab = tabState[1];

      var overviewState = React.useState(null);
      var overview = overviewState[0], setOverview = overviewState[1];

      var subPathState = React.useState("");
      var subPath = subPathState[0], setSubPath = subPathState[1];

      var statusState = React.useState({ branch: "main", ahead: 0, behind: 0, files: [] });
      var status = statusState[0], setStatus = statusState[1];

      var logState = React.useState([]);
      var log = logState[0], setLog = logState[1];

      var branchesState = React.useState([]);
      var branches = branchesState[0], setBranches = branchesState[1];

      var diffState = React.useState("");
      var diffText = diffState[0], setDiffText = diffState[1];

      var selectedDiffFileState = React.useState(null);
      var selectedDiffFile = selectedDiffFileState[0], setSelectedDiffFile = selectedDiffFileState[1];

      var loadingState = React.useState(false);
      var loading = loadingState[0], setLoading = loadingState[1];

      var commitMsgState = React.useState("");
      var commitMsg = commitMsgState[0], setCommitMsg = commitMsgState[1];

      var actionStatusState = React.useState("");
      var actionStatus = actionStatusState[0], setActionStatus = actionStatusState[1];

      var cloneOpenState = React.useState(false);
      var isCloneOpen = cloneOpenState[0], setCloneOpen = cloneOpenState[1];

      var branchPickerOpenState = React.useState(false);
      var isBranchPickerOpen = branchPickerOpenState[0], setBranchPickerOpen = branchPickerOpenState[1];
      var branchSearchState = React.useState("");
      var branchSearch = branchSearchState[0], setBranchSearch = branchSearchState[1];

      var fetchOverview = React.useCallback(function (curSubPath) {
        var sp = curSubPath !== undefined ? curSubPath : subPath;
        fetch(QUOTAS_API + "/git/overview?path=" + encodeURIComponent(repoPath) + "&subpath=" + encodeURIComponent(sp || ""))
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data && !data.error) setOverview(data);
          })
          .catch(function () {});
      }, [repoPath, subPath]);

      var fetchDiff = React.useCallback(function (file) {
        var url = QUOTAS_API + "/git/diff?path=" + encodeURIComponent(repoPath);
        if (file) url += "&file=" + encodeURIComponent(file);
        fetch(url)
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data && data.diff !== undefined) setDiffText(data.diff);
          })
          .catch(function () {});
      }, [repoPath]);

      var fetchRepoData = React.useCallback(function () {
        setLoading(true);
        Promise.all([
          fetch(QUOTAS_API + "/git/overview?path=" + encodeURIComponent(repoPath) + "&subpath=" + encodeURIComponent(subPath || "")).then(function (r) { return r.json(); }),
          fetch(QUOTAS_API + "/git/status?path=" + encodeURIComponent(repoPath)).then(function (r) { return r.json(); }),
          fetch(QUOTAS_API + "/git/log?path=" + encodeURIComponent(repoPath)).then(function (r) { return r.json(); }),
          fetch(QUOTAS_API + "/git/branches?path=" + encodeURIComponent(repoPath)).then(function (r) { return r.json(); })
        ]).then(function (results) {
          if (results[0] && !results[0].error) setOverview(results[0]);
          if (results[1] && !results[1].error) setStatus(results[1]);
          if (results[2] && results[2].commits) setLog(results[2].commits);
          if (results[3] && results[3].branches) setBranches(results[3].branches);
        }).catch(function () {}).finally(function () { setLoading(false); });
      }, [repoPath, subPath]);

      React.useEffect(function () {
        fetchRepoData();
      }, [fetchRepoData]);

      React.useEffect(function () {
        if (activeTab === "changes") {
          fetchDiff(selectedDiffFile);
        }
      }, [activeTab, selectedDiffFile, fetchDiff]);

      var handleNavigateSubPath = function (newSp) {
        setSubPath(newSp);
        fetchOverview(newSp);
      };

      var handleCommitAndPush = function () {
        if (!commitMsg.trim()) return;
        setActionStatus("Committing changes…");
        fetch(QUOTAS_API + "/git/commit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path: repoPath, message: commitMsg }),
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.error) {
              setActionStatus("Commit failed: " + res.error);
            } else {
              setActionStatus("Pushing to remote…");
              return fetch(QUOTAS_API + "/git/push", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ path: repoPath }),
              });
            }
          })
          .then(function (r) { return r ? r.json() : null; })
          .then(function (res) {
            if (res && res.error) setActionStatus("Push info: " + res.error);
            else setActionStatus("Committed & pushed!");
            setCommitMsg("");
            fetchRepoData();
            if (activeTab === "changes") fetchDiff(selectedDiffFile);
            setTimeout(function () { setActionStatus(""); }, 3000);
          })
          .catch(function (err) { setActionStatus("Action failed: " + err.message); });
      };

      var handleDiscardChanges = function (file) {
        if (!confirm(file ? ("Discard all changes in " + file + "?") : "Discard all unstaged changes and untracked files?")) return;
        setActionStatus("Discarding changes…");
        fetch(QUOTAS_API + "/git/discard", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path: repoPath, file: file }),
        }).then(function () {
          fetchRepoData();
          fetchDiff(null);
          setSelectedDiffFile(null);
          setActionStatus("Changes discarded.");
          setTimeout(function () { setActionStatus(""); }, 2500);
        });
      };

      var handleStashChanges = function () {
        setActionStatus("Stashing changes…");
        fetch(QUOTAS_API + "/git/stash", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path: repoPath }),
        }).then(function () {
          fetchRepoData();
          fetchDiff(null);
          setActionStatus("Changes stashed.");
          setTimeout(function () { setActionStatus(""); }, 2500);
        });
      };

      var handleSwitchBranch = function (bName, createNew) {
        setActionStatus("Switching branch to " + bName + "…");
        fetch(QUOTAS_API + "/git/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path: repoPath, branch: bName, create: Boolean(createNew) }),
        }).then(function (r) { return r.json(); }).then(function (res) {
          if (res.error) {
            alert("Checkout failed: " + res.error);
          } else {
            setBranchPickerOpen(false);
            fetchRepoData();
            setActionStatus("Switched to " + bName);
            setTimeout(function () { setActionStatus(""); }, 2500);
          }
        });
      };

      var handleCreateNewBranch = function () {
        var name = prompt("New branch name:");
        if (name && name.trim()) {
          handleSwitchBranch(name.trim(), true);
        }
      };

      var curBranch = (overview && overview.branch) || status.branch || "main";
      var remoteUrl = (overview && overview.remoteUrl) || "";
      var repoDisplayName = (overview && overview.owner && overview.repoName)
        ? (overview.owner + " / " + overview.repoName)
        : repoName;
      var bounds = useCenterBounds();

      return h("div", {
        className: "dsh-mainview-repo",
        style: {
          position: "fixed",
          top: (bounds.top + 36) + "px",
          left: bounds.left + "px",
          right: bounds.right + "px",
          bottom: (typeof window !== "undefined" && window.__dsh_panel_height__) ? window.__dsh_panel_height__ : "38px",
          background: "var(--dsw-alias-surface-l0, #13141f)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          fontFamily: "var(--ds-font-sans, system-ui, -apple-system, sans-serif)",
          color: "var(--dsw-alias-label-primary)",
        }
      },
        // 1. TOP HEADER & GITHUB ACTIONS
        h("div", {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 18px",
            background: "var(--dsw-alias-surface-l1, #181926)",
            borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))",
            userSelect: "none",
          }
        },
          h("div", { style: { display: "flex", alignItems: "center", gap: "10px", minWidth: 0 } },
            h("span", { style: { color: "var(--dsw-alias-primary, #6366f1)", display: "inline-flex" } }, h(RepoGlyph, { size: 18 })),
            h("strong", { style: { color: "var(--dsw-alias-label-primary)", fontSize: "14px", fontWeight: 600 } }, repoDisplayName),
            h("span", {
              style: {
                fontSize: "11px",
                padding: "2px 7px",
                borderRadius: "12px",
                border: "1px solid var(--dsw-alias-border-l1)",
                color: "var(--dsw-alias-label-secondary)",
                fontWeight: 500,
              }
            }, "Public"),
            h("span", {
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "2px 8px",
                borderRadius: "12px",
                background: "rgba(99, 102, 241, 0.15)",
                color: "var(--dsw-alias-primary, #6366f1)",
                fontSize: "12px",
                fontWeight: 600,
              }
            }, "⎇ " + curBranch),
            (status.ahead > 0 || status.behind > 0) ? h("span", { style: { fontSize: "11px", color: "var(--dsw-alias-label-secondary)" } },
              (status.ahead > 0 ? "↑" + status.ahead + " " : "") + (status.behind > 0 ? "↓" + status.behind : "")
            ) : null
          ),
          h("div", { style: { display: "flex", alignItems: "center", gap: "8px", position: "relative" } },
            remoteUrl ? h("button", {
              type: "button",
              onClick: function () { window.open(remoteUrl.replace(/\.git$/, ""), "_blank"); },
              title: "Open on GitHub",
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                height: "26px",
                padding: "0 10px",
                borderRadius: "6px",
                border: "1px solid var(--dsw-alias-border-l1)",
                background: "transparent",
                color: "var(--dsw-alias-label-secondary)",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500,
              }
            }, "Open on GitHub ↗") : null,
            h("div", { style: { position: "relative" } },
              h("button", {
                type: "button",
                onClick: function () { setCloneOpen(!isCloneOpen); },
                style: {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  height: "26px",
                  padding: "0 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--dsw-alias-primary, #238636)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }
              }, "<> Code ▾"),
              isCloneOpen ? h("div", {
                style: {
                  position: "absolute",
                  top: "32px",
                  right: 0,
                  width: "320px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "var(--dsw-alias-surface-l1, #181926)",
                  border: "1px solid var(--dsw-alias-border-l1)",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                  zIndex: 100,
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }
              },
                h("span", { style: { fontSize: "12px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, "Clone repository:"),
                h("div", { style: { display: "flex", alignItems: "center", gap: "6px" } },
                  h("input", {
                    type: "text",
                    readOnly: true,
                    value: remoteUrl || ("file://" + repoPath),
                    style: {
                      flex: 1,
                      padding: "5px 8px",
                      borderRadius: "5px",
                      border: "1px solid var(--dsw-alias-border-l1)",
                      background: "var(--dsw-alias-surface-l0)",
                      color: "var(--dsw-alias-label-primary)",
                      fontFamily: "var(--ds-font-mono, monospace)",
                      fontSize: "11px",
                      outline: "none",
                    }
                  }),
                  h("button", {
                    type: "button",
                    onClick: function () {
                      if (navigator.clipboard) navigator.clipboard.writeText(remoteUrl || repoPath);
                      alert("Copied clone URL to clipboard!");
                      setCloneOpen(false);
                    },
                    style: {
                      height: "26px",
                      padding: "0 8px",
                      borderRadius: "5px",
                      border: "1px solid var(--dsw-alias-border-l1)",
                      background: "var(--dsw-alias-primary, #6366f1)",
                      color: "#fff",
                      fontSize: "11px",
                      cursor: "pointer",
                    }
                  }, "Copy")
                )
              ) : null
            ),
            h("button", {
              type: "button",
              onClick: fetchRepoData,
              disabled: loading,
              title: "Refresh Git Status",
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                height: "26px",
                padding: "0 10px",
                borderRadius: "6px",
                border: "1px solid var(--dsw-alias-border-l1)",
                background: "transparent",
                color: "var(--dsw-alias-label-secondary)",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: 500,
                transition: "all 120ms ease",
              }
            }, loading ? "Refreshing…" : "↻ Refresh"),
            h("button", {
              type: "button",
              onClick: onClose,
              title: "Close Repo Tab",
              style: {
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                background: "transparent",
                border: "none",
                color: "var(--dsw-alias-label-secondary)",
                cursor: "pointer",
                fontSize: "14px",
                transition: "background 100ms, color 100ms",
              },
              onMouseEnter: function (e) { e.currentTarget.style.background = "var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.15))"; },
              onMouseLeave: function (e) { e.currentTarget.style.background = "transparent"; },
            }, "✕")
          )
        ),

        // 2. GITHUB TAB NAVIGATION
        h("div", {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 18px",
            background: "var(--dsw-alias-surface-l0, #13141f)",
            borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.1))",
          }
        },
          [
            { id: "code", label: "<> Code", count: overview ? overview.totalCommits : null },
            { id: "changes", label: "+/- Changes", count: status.files ? status.files.length : 0 },
            { id: "history", label: "◷ Commits", count: log.length },
            { id: "branches", label: "⎇ Branches", count: branches.length },
          ].map(function (subTab) {
            var isSel = activeTab === subTab.id;
            return h("button", {
              key: subTab.id,
              type: "button",
              onClick: function () { setActiveTab(subTab.id); },
              style: {
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid " + (isSel ? "var(--dsw-alias-primary, #6366f1)" : "transparent"),
                background: isSel ? "var(--dsw-alias-interactive-bg-active, rgba(99, 102, 241, 0.15))" : "transparent",
                color: isSel ? "var(--dsw-alias-primary, #6366f1)" : "var(--dsw-alias-label-secondary)",
                fontSize: "12.5px",
                fontWeight: isSel ? 600 : 500,
                cursor: "pointer",
                transition: "all 120ms ease",
              }
            },
              h("span", null, subTab.label),
              subTab.count !== null ? h("span", {
                style: {
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontSize: "10px",
                  fontWeight: 700,
                  background: isSel ? "rgba(99, 102, 241, 0.25)" : "var(--dsw-alias-surface-l1, rgba(128,128,128,0.15))",
                  color: isSel ? "var(--dsw-alias-primary, #6366f1)" : "var(--dsw-alias-label-tertiary)",
                }
              }, subTab.count) : null
            );
          })
        ),

        // 3. MAIN TAB BODIES
        h("div", { style: { flex: 1, overflowY: "auto", padding: "16px 20px" } },

          // === TAB: CODE (GITHUB OVERVIEW, FILE TREE, README, STATS) ===
          activeTab === "code" ? h("div", { style: { display: "flex", gap: "24px", width: "100%", maxWidth: "1200px" } },
            // Left main section (File Tree & README)
            h("div", { style: { flex: 1, display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 } },
              // Branch picker & Breadcrumb bar
              h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" } },
                h("div", { style: { display: "flex", alignItems: "center", gap: "10px" } },
                  h("div", { style: { position: "relative" } },
                    h("button", {
                      type: "button",
                      onClick: function () { setBranchPickerOpen(!isBranchPickerOpen); },
                      style: {
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        height: "28px",
                        padding: "0 10px",
                        borderRadius: "6px",
                        border: "1px solid var(--dsw-alias-border-l1)",
                        background: "var(--dsw-alias-surface-l1)",
                        color: "var(--dsw-alias-label-primary)",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }
                    }, "⎇ " + curBranch + " ▾"),
                    isBranchPickerOpen ? h("div", {
                      style: {
                        position: "absolute",
                        top: "34px",
                        left: 0,
                        width: "240px",
                        borderRadius: "8px",
                        background: "var(--dsw-alias-surface-l1, #181926)",
                        border: "1px solid var(--dsw-alias-border-l1)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        zIndex: 100,
                        padding: "8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }
                    },
                      h("input", {
                        type: "text",
                        placeholder: "Filter branches…",
                        value: branchSearch,
                        onChange: function (e) { setBranchSearch(e.target.value); },
                        style: {
                          width: "100%",
                          boxSizing: "border-box",
                          padding: "5px 8px",
                          borderRadius: "5px",
                          border: "1px solid var(--dsw-alias-border-l1)",
                          background: "var(--dsw-alias-surface-l0)",
                          color: "var(--dsw-alias-label-primary)",
                          fontSize: "12px",
                          outline: "none",
                        }
                      }),
                      h("div", { style: { maxHeight: "200px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" } },
                        branches.filter(function (b) { return !branchSearch || b.name.toLowerCase().indexOf(branchSearch.toLowerCase()) !== -1; }).map(function (b) {
                          return h("button", {
                            key: b.name,
                            type: "button",
                            onClick: function () { handleSwitchBranch(b.name, false); },
                            style: {
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "6px 8px",
                              borderRadius: "4px",
                              border: "none",
                              background: b.isCurrent ? "rgba(99, 102, 241, 0.15)" : "transparent",
                              color: b.isCurrent ? "var(--dsw-alias-primary, #6366f1)" : "var(--dsw-alias-label-primary)",
                              fontSize: "12px",
                              fontWeight: b.isCurrent ? 600 : 400,
                              cursor: "pointer",
                              textAlign: "left",
                            }
                          },
                            h("span", null, b.name),
                            b.isCurrent ? h("span", { style: { fontSize: "10px" } }, "✓") : null
                          );
                        })
                      ),
                      h("button", {
                        type: "button",
                        onClick: handleCreateNewBranch,
                        style: {
                          marginTop: "4px",
                          padding: "5px 8px",
                          borderRadius: "5px",
                          border: "1px dashed var(--dsw-alias-border-l1)",
                          background: "transparent",
                          color: "var(--dsw-alias-primary, #6366f1)",
                          fontSize: "11.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }
                      }, "+ New branch")
                    ) : null
                  ),
                  // Breadcrumb directory navigation
                  h("div", { style: { display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" } },
                    h("span", {
                      style: { color: "var(--dsw-alias-primary, #6366f1)", cursor: "pointer", fontWeight: 600 },
                      onClick: function () { handleNavigateSubPath(""); }
                    }, repoName),
                    subPath ? subPath.split("/").map(function (segment, sIdx, sArr) {
                      var accPath = sArr.slice(0, sIdx + 1).join("/");
                      return h(React.Fragment, { key: accPath },
                        h("span", { style: { color: "var(--dsw-alias-label-tertiary)" } }, "/"),
                        h("span", {
                          style: { color: (sIdx === sArr.length - 1) ? "var(--dsw-alias-label-primary)" : "var(--dsw-alias-primary, #6366f1)", cursor: "pointer", fontWeight: (sIdx === sArr.length - 1) ? 600 : 400 },
                          onClick: function () { handleNavigateSubPath(accPath); }
                        }, segment)
                      );
                    }) : null
                  )
                ),
                h("div", { style: { display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } },
                  overview ? h("span", {
                    style: { cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" },
                    onClick: function () { setActiveTab("history"); }
                  }, h("strong", { style: { color: "var(--dsw-alias-label-primary)" } }, overview.totalCommits), " commits") : null,
                  overview ? h("span", {
                    style: { cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" },
                    onClick: function () { setActiveTab("branches"); }
                  }, h("strong", { style: { color: "var(--dsw-alias-label-primary)" } }, overview.branchesCount), " branches") : null
                )
              ),

              // Latest Commit Banner (GitHub style)
              (overview && overview.latestCommit && overview.latestCommit.sha) ? h("div", {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "8px 8px 0 0",
                  background: "var(--dsw-alias-surface-l1, #181926)",
                  border: "1px solid var(--dsw-alias-border-l1)",
                  borderBottom: "none",
                  fontSize: "12.5px",
                }
              },
                h("div", { style: { display: "flex", alignItems: "center", gap: "8px", minWidth: 0 } },
                  h("div", {
                    style: {
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: "var(--dsw-alias-primary, #6366f1)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }
                  }, (overview.latestCommit.author ? overview.latestCommit.author[0].toUpperCase() : "G")),
                  h("strong", { style: { color: "var(--dsw-alias-label-primary)", flexShrink: 0 } }, overview.latestCommit.author),
                  h("span", { style: { color: "var(--dsw-alias-label-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }, title: overview.latestCommit.message }, overview.latestCommit.message)
                ),
                h("div", { style: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 } },
                  h("span", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: "11px" } }, overview.latestCommit.date),
                  h("button", {
                    type: "button",
                    onClick: function () {
                      if (navigator.clipboard) navigator.clipboard.writeText(overview.latestCommit.sha);
                      alert("Copied commit SHA: " + overview.latestCommit.sha);
                    },
                    style: {
                      padding: "2px 7px",
                      borderRadius: "5px",
                      border: "1px solid var(--dsw-alias-border-l1)",
                      background: "rgba(99, 102, 241, 0.1)",
                      color: "var(--dsw-alias-primary, #6366f1)",
                      fontFamily: "var(--ds-font-mono, monospace)",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }
                  }, overview.latestCommit.shortSha || overview.latestCommit.sha.slice(0, 7))
                )
              ) : null,

              // File Tree Table (GitHub style)
              h("div", {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: (overview && overview.latestCommit && overview.latestCommit.sha) ? "0 0 8px 8px" : "8px",
                  border: "1px solid var(--dsw-alias-border-l1)",
                  overflow: "hidden",
                  background: "var(--dsw-alias-surface-l0, #13141f)",
                }
              },
                // Go to parent directory if in subpath
                subPath ? h("div", {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 14px",
                    borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.1))",
                    cursor: "pointer",
                    background: "var(--dsw-alias-surface-l1, #181926)",
                    fontSize: "12.5px",
                    color: "var(--dsw-alias-primary, #6366f1)",
                    fontWeight: 600,
                  },
                  onClick: function () {
                    var parts = subPath.split("/");
                    parts.pop();
                    handleNavigateSubPath(parts.join("/"));
                  }
                }, "📁 .. (parent directory)") : null,
                // Tree rows
                (overview && overview.tree && overview.tree.length > 0) ? overview.tree.map(function (item) {
                  var isDir = item.type === "tree";
                  return h("div", {
                    key: item.path,
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 14px",
                      borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.08))",
                      fontSize: "12.5px",
                      transition: "background 100ms",
                    },
                    onMouseEnter: function (e) { e.currentTarget.style.background = "var(--dsw-alias-surface-l1, rgba(128,128,128,0.06))"; },
                    onMouseLeave: function (e) { e.currentTarget.style.background = "transparent"; },
                  },
                    // Name & icon
                    h("div", {
                      style: { display: "flex", alignItems: "center", gap: "8px", width: "35%", minWidth: 0, cursor: "pointer" },
                      onClick: function () {
                        if (isDir) {
                          handleNavigateSubPath(item.relPath);
                        } else {
                          window.dispatchEvent(new CustomEvent("dsh:open-file-tab", {
                            detail: { id: "file::" + item.path, type: "file", title: item.name, path: item.path }
                          }));
                        }
                      }
                    },
                      h("span", { style: { color: isDir ? "var(--dsw-alias-primary, #6366f1)" : "var(--dsw-alias-label-tertiary)", display: "inline-flex" } },
                        isDir ? h(FolderOpenGlyph, { size: 15 }) : h(FileGlyph, { size: 15 })
                      ),
                      h("span", {
                        style: {
                          color: isDir ? "var(--dsw-alias-label-primary)" : "var(--dsw-alias-label-primary)",
                          fontWeight: isDir ? 500 : 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }
                      }, item.name)
                    ),
                    // Last commit message
                    h("span", {
                      style: {
                        flex: 1,
                        padding: "0 12px",
                        color: "var(--dsw-alias-label-tertiary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: "12px",
                      },
                      title: item.lastCommitMsg
                    }, item.lastCommitMsg),
                    // Last commit time
                    h("span", {
                      style: {
                        width: "90px",
                        textAlign: "right",
                        color: "var(--dsw-alias-label-tertiary)",
                        fontSize: "11px",
                        flexShrink: 0,
                      }
                    }, item.lastCommitDate)
                  );
                }) : h("div", { style: { padding: "16px", color: "var(--dsw-alias-label-tertiary)", fontSize: "12px" } }, "Loading file tree…")
              ),

              // README.md Rendered Markdown Section
              (overview && overview.readme) ? h("div", {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "8px",
                  border: "1px solid var(--dsw-alias-border-l1)",
                  overflow: "hidden",
                  background: "var(--dsw-alias-surface-l0, #13141f)",
                  marginTop: "8px",
                }
              },
                h("div", {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    background: "var(--dsw-alias-surface-l1, #181926)",
                    borderBottom: "1px solid var(--dsw-alias-border-l1)",
                    fontSize: "13px",
                    fontWeight: 600,
                  }
                },
                  h("span", { style: { color: "var(--dsw-alias-primary, #6366f1)" } }, "📖"),
                  h("span", null, overview.readme.name)
                ),
                h("div", {
                  style: {
                    padding: "20px 24px",
                    fontSize: "13.5px",
                    lineHeight: "1.7",
                    color: "var(--dsw-alias-label-primary)",
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--ds-font-sans, system-ui, sans-serif)",
                    maxHeight: "450px",
                    overflowY: "auto",
                  }
                }, overview.readme.content)
              ) : null
            ),

            // Right Sidebar (About, Releases, Languages)
            h("div", { style: { width: "280px", display: "flex", flexDirection: "column", gap: "20px", flexShrink: 0 } },
              // About Box
              h("div", { style: { display: "flex", flexDirection: "column", gap: "10px" } },
                h("h4", { style: { margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, "About"),
                h("p", { style: { margin: 0, fontSize: "12.5px", color: "var(--dsw-alias-label-secondary)", lineHeight: "1.5" } },
                  repoDisplayName + " — personal agent stack plugin workspace."
                ),
                remoteUrl ? h("a", {
                  href: remoteUrl,
                  target: "_blank",
                  rel: "noreferrer",
                  style: { fontSize: "12px", color: "var(--dsw-alias-primary, #6366f1)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }
                }, "🔗 " + remoteUrl.replace(/^https?:\/\//, "")) : null
              ),

              // Releases Box
              h("div", { style: { display: "flex", flexDirection: "column", gap: "6px", borderTop: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))", paddingTop: "14px" } },
                h("h4", { style: { margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, "Releases"),
                h("span", { style: { fontSize: "12px", color: "var(--dsw-alias-label-tertiary)" } }, (overview && overview.tagsCount > 0) ? (overview.tagsCount + " tags published") : "No releases published")
              ),

              // Languages Box
              (overview && overview.languages && overview.languages.length > 0) ? h("div", {
                style: { display: "flex", flexDirection: "column", gap: "10px", borderTop: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))", paddingTop: "14px" }
              },
                h("h4", { style: { margin: 0, fontSize: "14px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, "Languages"),
                // Multi-colored progress bar
                h("div", {
                  style: {
                    display: "flex",
                    height: "8px",
                    borderRadius: "4px",
                    overflow: "hidden",
                    width: "100%",
                    background: "var(--dsw-alias-surface-l1)",
                  }
                },
                  overview.languages.map(function (lang) {
                    return h("div", {
                      key: lang.name,
                      style: {
                        width: lang.percent + "%",
                        background: lang.color,
                        height: "100%",
                      },
                      title: lang.name + " " + lang.percent + "%"
                    });
                  })
                ),
                // Language badges list
                h("div", { style: { display: "flex", flexWrap: "wrap", gap: "10px" } },
                  overview.languages.map(function (lang) {
                    return h("div", { key: lang.name, style: { display: "flex", alignItems: "center", gap: "5px", fontSize: "12px" } },
                      h("span", { style: { width: "8px", height: "8px", borderRadius: "50%", background: lang.color } }),
                      h("strong", { style: { color: "var(--dsw-alias-label-primary)" } }, lang.name),
                      h("span", { style: { color: "var(--dsw-alias-label-tertiary)" } }, lang.percent + "%")
                    );
                  })
                )
              ) : null
            )
          ) : null,

          // === TAB: CHANGES / PULL REQUESTS & UNIFIED DIFF VIEWER ===
          activeTab === "changes" ? h("div", { style: { display: "flex", gap: "20px", width: "100%", maxWidth: "1200px" } },
            // Left column: commit form & changed files list
            h("div", { style: { width: "340px", display: "flex", flexDirection: "column", gap: "14px", flexShrink: 0 } },
              // Commit box
              h("div", {
                style: {
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  padding: "14px",
                  borderRadius: "8px",
                  background: "var(--dsw-alias-surface-l1, #181926)",
                  border: "1px solid var(--dsw-alias-border-l1)",
                }
              },
                h("strong", { style: { fontSize: "13px", color: "var(--dsw-alias-label-primary)" } }, "Commit changes"),
                h("textarea", {
                  placeholder: "Commit message (e.g. feat: implement repository overview)",
                  value: commitMsg,
                  rows: 3,
                  onChange: function (e) { setCommitMsg(e.target.value); },
                  onKeyDown: function (e) { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCommitAndPush(); },
                  style: {
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--dsw-alias-border-l1)",
                    background: "var(--dsw-alias-surface-l0, #13141f)",
                    color: "var(--dsw-alias-label-primary)",
                    fontSize: "12.5px",
                    outline: "none",
                    resize: "none",
                  }
                }),
                h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
                  actionStatus ? h("span", { style: { fontSize: "11.5px", color: "var(--dsw-alias-primary, #6366f1)" } }, actionStatus) : h("span", null),
                  h("button", {
                    type: "button",
                    onClick: handleCommitAndPush,
                    disabled: !commitMsg.trim(),
                    style: {
                      height: "28px",
                      padding: "0 14px",
                      borderRadius: "6px",
                      border: "none",
                      background: "var(--dsw-alias-primary, #6366f1)",
                      color: "#fff",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: commitMsg.trim() ? "pointer" : "default",
                      opacity: commitMsg.trim() ? 1 : 0.5,
                    }
                  }, "Commit & Push (⌘Enter)")
                )
              ),

              // Actions: Stash & Discard
              h("div", { style: { display: "flex", gap: "8px" } },
                h("button", {
                  type: "button",
                  onClick: handleStashChanges,
                  style: {
                    flex: 1,
                    height: "26px",
                    borderRadius: "6px",
                    border: "1px solid var(--dsw-alias-border-l1)",
                    background: "transparent",
                    color: "var(--dsw-alias-label-secondary)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }
                }, "Stash All"),
                h("button", {
                  type: "button",
                  onClick: function () { handleDiscardChanges(); },
                  style: {
                    flex: 1,
                    height: "26px",
                    borderRadius: "6px",
                    border: "1px solid var(--dsw-alias-border-l1)",
                    background: "transparent",
                    color: "var(--dsw-alias-state-error-primary, #f85149)",
                    fontSize: "12px",
                    cursor: "pointer",
                  }
                }, "Discard All")
              ),

              // Changed files list
              h("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } },
                h("span", { style: { fontSize: "13px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } },
                  "Changed Files (" + (status.files ? status.files.length : 0) + "):"
                ),
                (!status.files || status.files.length === 0) ? h("div", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: "12px", padding: "8px 0" } }, "Working tree clean — no unstaged changes.") :
                status.files.map(function (f) {
                  var isSel = selectedDiffFile === f.path;
                  return h("div", {
                    key: f.path,
                    onClick: function () {
                      setSelectedDiffFile(isSel ? null : f.path);
                    },
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      background: isSel ? "rgba(99, 102, 241, 0.15)" : "var(--dsw-alias-surface-l1, #181926)",
                      border: "1px solid " + (isSel ? "var(--dsw-alias-primary, #6366f1)" : "var(--dsw-alias-border-l1, rgba(128,128,128,0.1))"),
                      fontSize: "12px",
                      cursor: "pointer",
                    }
                  },
                    h("span", { style: { color: isSel ? "var(--dsw-alias-primary, #6366f1)" : "var(--dsw-alias-label-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--ds-font-mono, monospace)" } }, f.path),
                    h("span", {
                      style: {
                        fontSize: "10.5px",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: f.status === "added" ? "rgba(34, 197, 94, 0.2)" : (f.status === "untracked" ? "rgba(59, 130, 246, 0.2)" : "rgba(234, 179, 8, 0.2)"),
                        color: f.status === "added" ? "#22c55e" : (f.status === "untracked" ? "#3b82f6" : "#eab308"),
                        fontWeight: 600,
                        marginLeft: "6px",
                        flexShrink: 0,
                      }
                    }, f.status)
                  );
                })
              )
            ),

            // Right column: Full Unified Diff Viewer
            h("div", { style: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0, border: "1px solid var(--dsw-alias-border-l1)", borderRadius: "8px", overflow: "hidden", background: "var(--dsw-alias-surface-l0)" } },
              h("div", {
                style: {
                  padding: "8px 14px",
                  background: "var(--dsw-alias-surface-l1, #181926)",
                  borderBottom: "1px solid var(--dsw-alias-border-l1)",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }
              },
                h("span", null, selectedDiffFile ? ("Diff: " + selectedDiffFile) : "Working Tree Diff"),
                selectedDiffFile ? h("button", {
                  type: "button",
                  onClick: function () { setSelectedDiffFile(null); },
                  style: { background: "transparent", border: "none", color: "var(--dsw-alias-primary, #6366f1)", fontSize: "11.5px", cursor: "pointer" }
                }, "Show all diffs") : null
              ),
              h("div", {
                style: {
                  flex: 1,
                  padding: "12px",
                  fontFamily: "var(--ds-font-mono, monospace)",
                  fontSize: "12px",
                  lineHeight: "1.6",
                  overflowY: "auto",
                  maxHeight: "650px",
                }
              },
                !diffText ? h("div", { style: { color: "var(--dsw-alias-label-tertiary)", padding: "16px" } }, "No diffs to display.") :
                diffText.split("\n").map(function (line, lIdx) {
                  var isAdd = line.startsWith("+") && !line.startsWith("+++");
                  var isDel = line.startsWith("-") && !line.startsWith("---");
                  var isHunk = line.startsWith("@@");
                  return h("div", {
                    key: lIdx,
                    style: {
                      padding: "1px 6px",
                      background: isAdd ? "rgba(34, 197, 94, 0.15)" : (isDel ? "rgba(239, 68, 68, 0.15)" : (isHunk ? "rgba(99, 102, 241, 0.12)" : "transparent")),
                      color: isAdd ? "#4ade80" : (isDel ? "#f87171" : (isHunk ? "var(--dsw-alias-primary, #6366f1)" : "var(--dsw-alias-label-primary)")),
                      whiteSpace: "pre",
                    }
                  }, line);
                })
              )
            )
          ) : null,

          // === TAB: COMMITS (DATE-GROUPED COMMIT HISTORY) ===
          activeTab === "history" ? h("div", { style: { display: "flex", flexDirection: "column", gap: "10px", maxWidth: "900px" } },
            h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" } },
              h("strong", { style: { fontSize: "14px", color: "var(--dsw-alias-label-primary)" } }, "Commit History (" + log.length + ")"),
              h("span", { style: { fontSize: "12px", color: "var(--dsw-alias-label-tertiary)" } }, "branch: " + curBranch)
            ),
            log.map(function (c) {
              return h("div", {
                key: c.fullSha || c.sha,
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: "var(--dsw-alias-surface-l1, #181926)",
                  border: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.12))",
                }
              },
                h("div", { style: { display: "flex", alignItems: "center", gap: "10px", minWidth: 0 } },
                  h("div", {
                    style: {
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "rgba(99, 102, 241, 0.2)",
                      color: "var(--dsw-alias-primary, #6366f1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: 700,
                      flexShrink: 0,
                    }
                  }, (c.author ? c.author[0].toUpperCase() : "C")),
                  h("div", { style: { display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 } },
                    h("span", { style: { fontSize: "13px", fontWeight: 500, color: "var(--dsw-alias-label-primary)" } }, c.message),
                    h("span", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary)" } }, c.author + " committed " + c.date)
                  )
                ),
                h("div", { style: { display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 } },
                  h("button", {
                    type: "button",
                    onClick: function () {
                      if (navigator.clipboard) navigator.clipboard.writeText(c.fullSha || c.sha);
                      alert("Copied SHA: " + (c.fullSha || c.sha));
                    },
                    style: {
                      fontFamily: "var(--ds-font-mono, monospace)",
                      fontSize: "11.5px",
                      color: "var(--dsw-alias-primary, #6366f1)",
                      fontWeight: 600,
                      background: "rgba(99, 102, 241, 0.1)",
                      border: "1px solid var(--dsw-alias-border-l1)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }
                  }, c.sha)
                )
              );
            })
          ) : null,

          // === TAB: BRANCHES ===
          activeTab === "branches" ? h("div", { style: { display: "flex", flexDirection: "column", gap: "12px", maxWidth: "700px" } },
            h("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
              h("strong", { style: { fontSize: "14px", color: "var(--dsw-alias-label-primary)" } }, "Branches (" + branches.length + ")"),
              h("button", {
                type: "button",
                onClick: handleCreateNewBranch,
                style: {
                  height: "26px",
                  padding: "0 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--dsw-alias-primary, #6366f1)",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }
              }, "+ New Branch")
            ),
            branches.map(function (b) {
              return h("div", {
                key: b.name,
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: b.isCurrent ? "rgba(99, 102, 241, 0.12)" : "var(--dsw-alias-surface-l1, #181926)",
                  border: b.isCurrent ? "1px solid var(--dsw-alias-primary, #6366f1)" : "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.1))",
                }
              },
                h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                  h("span", { style: { fontSize: "13px", fontWeight: b.isCurrent ? 600 : 400, color: b.isCurrent ? "var(--dsw-alias-primary, #6366f1)" : "var(--dsw-alias-label-primary)" } },
                    (b.isCurrent ? "● " : "  ") + b.name
                  ),
                  b.isCurrent ? h("span", { style: { fontSize: "11px", color: "var(--dsw-alias-primary, #6366f1)", fontWeight: 600, background: "rgba(99, 102, 241, 0.2)", padding: "2px 6px", borderRadius: "4px" } }, "Default / Active") : null
                ),
                !b.isCurrent ? h("button", {
                  type: "button",
                  onClick: function () { handleSwitchBranch(b.name, false); },
                  style: {
                    height: "24px",
                    padding: "0 10px",
                    borderRadius: "4px",
                    border: "1px solid var(--dsw-alias-border-l1)",
                    background: "transparent",
                    color: "var(--dsw-alias-label-secondary)",
                    fontSize: "11.5px",
                    cursor: "pointer",
                  }
                }, "Checkout") : null
              );
            })
          ) : null
        )
      );
    }

    function TopConversationTabBar(props) {
      var topPlusBtnRef = React.useRef(null);
      var plusOpenState = React.useState(false);
      var plusOpen = plusOpenState[0], setPlusOpen = plusOpenState[1];

      var topEllipsisBtnRef = React.useRef(null);
      var topMenuOpenState = React.useState(false);
      var isTopMenuOpen = topMenuOpenState[0], setTopMenuOpen = topMenuOpenState[1];

      var tabsState = React.useState([
        { id: "chat-main", type: "chat", title: (typeof window !== "undefined" && window.__dsh_current_session_title__) ? window.__dsh_current_session_title__ : "Conversation" }
      ]);
      var tabs = tabsState[0], setTabs = tabsState[1];
      var activeTabState = React.useState("chat-main");
      var activeTab = activeTabState[0], setActiveTab = activeTabState[1];

      var contextMenuState = React.useState(null); // { tabId, anchorEl }
      var contextMenu = contextMenuState[0], setContextMenu = contextMenuState[1];

      // Sync active top tab IDs to window global for cross-panel deduplication
      React.useEffect(function () {
        if (typeof window !== "undefined") {
          var map = {};
          tabs.forEach(function (t) {
            map[t.id] = true;
            if (t.session) map[t.session] = true;
          });
          window.__dsh_top_tab_ids__ = map;
          window.dispatchEvent(new CustomEvent("dsh:tabs-changed"));
        }
      }, [tabs]);

      // Sync live chat title from active session or document
      React.useEffect(function () {
        var updateTitle = function () {
          var title = (typeof window !== "undefined" && window.__dsh_current_session_title__) ? window.__dsh_current_session_title__ : null;
          if (!title && typeof document !== "undefined") {
            var activeSessionRow = document.querySelector('.dsh-tree-sessionRowActive .dsh-tree-sessionTitle, .dsh-tree-sessionRowActive .dsh-tree-title');
            if (activeSessionRow && activeSessionRow.textContent) {
              title = activeSessionRow.textContent.trim();
            }
          }
          if (title) {
            setTabs(function (prev) {
              return prev.map(function (t) {
                if (t.id === "chat-main" || t.type === "chat") {
                  if (t.title !== title) return Object.assign({}, t, { title: title });
                }
                return t;
              });
            });
          }
        };
        updateTitle();
        var timer = setInterval(updateTitle, 500);
        return function () { clearInterval(timer); };
      }, []);

      React.useEffect(function () {
        var onTabMovedToTop = function (e) {
          var tab = e.detail;
          if (!tab) return;
          setTabs(function (prev) {
            if (prev.some(function (t) { return t.id === tab.id; })) return prev;
            return prev.concat([tab]);
          });
          setActiveTab(tab.id);
        };
        var onTabMovedToBottom = function (e) {
          var tab = e.detail;
          if (!tab) return;
          setTabs(function (prev) {
            var remaining = prev.filter(function (t) { return t.id !== tab.id; });
            return remaining;
          });
          setActiveTab(function (curr) {
            if (curr === tab.id) return null;
            return curr;
          });
        };
        var onTabMovedToRight = function (e) {
          var tab = e.detail;
          if (!tab) return;
          setTabs(function (prev) {
            return prev.filter(function (t) { return t.id !== tab.id; });
          });
          setActiveTab(function (curr) {
            if (curr === tab.id) return null;
            return curr;
          });
        };
        var onOpenFileTab = function (e) {
          var tab = e.detail;
          if (!tab) return;
          setTabs(function (prev) {
            if (prev.some(function (t) { return t.id === tab.id; })) return prev;
            return prev.concat([tab]);
          });
          setActiveTab(tab.id);
        };
        var onOpenRepoTab = function (e) {
          var tab = e.detail;
          if (!tab) return;
          setTabs(function (prev) {
            if (prev.some(function (t) { return t.id === tab.id; })) return prev;
            return prev.concat([tab]);
          });
          setActiveTab(tab.id);
        };

        var onOpenTerminal = function (e) {
          var sess = (e && e.detail && e.detail.session) || "0";
          var termTab = { id: sess, type: "terminal", title: "Terminal: " + sess, session: sess };
          setTabs(function (prev) {
            if (prev.some(function (t) { return t.id === termTab.id; })) return prev;
            return prev.concat([termTab]);
          });
          setActiveTab(termTab.id);
        };

        var onOpenContainer = function (e) {
          var cId = (e && e.detail && e.detail.id) || "container-sandboxes";
          var contTab = { id: cId, type: "container", title: (e && e.detail && e.detail.title) || (cId === "container-sandboxes" ? "Docker Sandboxes" : "Container: " + cId.slice(0, 8)) };
          setTabs(function (prev) {
            if (prev.some(function (t) { return t.id === contTab.id; })) return prev;
            return prev.concat([contTab]);
          });
          setActiveTab(contTab.id);
        };

        var onFocusChat = function (e) {
          var tTitle = (e && e.detail && e.detail.title) || (typeof window !== "undefined" && window.__dsh_current_session_title__) || "Conversation";
          var chatTab = { id: "chat-main", type: "chat", title: tTitle };
          setTabs(function (prev) {
            var exists = prev.find(function (t) { return t.id === "chat-main" || t.type === "chat"; });
            if (exists) {
              return prev.map(function (t) {
                if (t.id === "chat-main" || t.type === "chat") {
                  return Object.assign({}, t, { title: tTitle });
                }
                return t;
              });
            }
            return [chatTab].concat(prev);
          });
          setActiveTab("chat-main");
        };

        var onCloseTerminalTab = function (e) {
          var sess = (e && e.detail) ? (e.detail.session || e.detail.id) : null;
          if (!sess) return;
          setTabs(function (prev) {
            var tabToRemove = prev.find(function (t) { return t.type === "terminal" && (t.session === sess || t.id === sess); });
            if (tabToRemove) {
              var idx = prev.findIndex(function (t) { return t.id === tabToRemove.id; });
              var remaining = prev.filter(function (t) { return t.id !== tabToRemove.id; });
              setActiveTab(function (cur) {
                if (cur === tabToRemove.id) {
                  return remaining.length > 0 ? remaining[Math.min(idx, remaining.length - 1)].id : "chat-main";
                }
                return cur;
              });
              return remaining;
            }
            return prev;
          });
        };

        window.addEventListener("dsh:tab-moved-to-top", onTabMovedToTop);
        window.addEventListener("dsh:tab-moved-to-bottom", onTabMovedToBottom);
        window.addEventListener("dsh:tab-moved-to-right", onTabMovedToRight);
        window.addEventListener("dsh:open-file-tab", onOpenFileTab);
        window.addEventListener("dsh:open-repo-tab", onOpenRepoTab);
        window.addEventListener("dsh:open-terminal", onOpenTerminal);
        window.addEventListener("dsh:open-container", onOpenContainer);
        window.addEventListener("dsh:focus-chat", onFocusChat);
        window.addEventListener("dsh:close-terminal-tab", onCloseTerminalTab);
        return function () {
          window.removeEventListener("dsh:tab-moved-to-top", onTabMovedToTop);
          window.removeEventListener("dsh:tab-moved-to-bottom", onTabMovedToBottom);
          window.removeEventListener("dsh:tab-moved-to-right", onTabMovedToRight);
          window.removeEventListener("dsh:open-file-tab", onOpenFileTab);
          window.removeEventListener("dsh:open-repo-tab", onOpenRepoTab);
          window.removeEventListener("dsh:open-terminal", onOpenTerminal);
          window.removeEventListener("dsh:open-container", onOpenContainer);
          window.removeEventListener("dsh:focus-chat", onFocusChat);
          window.removeEventListener("dsh:close-terminal-tab", onCloseTerminalTab);
        };
      }, []);

      var handleDropOnTop = function (e) {
        e.preventDefault();
        try {
          var raw = e.dataTransfer.getData("text/dsh-tab");
          if (raw) {
            var tabData = JSON.parse(raw);
            window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-top", { detail: tabData }));
          }
        } catch (err) {}
      };

      var removeTab = function (tabId, e) {
        if (e) e.stopPropagation();
        setTabs(function (prev) {
          var idx = prev.findIndex(function (t) { return t.id === tabId; });
          var remaining = prev.filter(function (t) { return t.id !== tabId; });
          if (activeTab === tabId) {
            if (remaining.length > 0) {
              var nextIdx = Math.min(idx, remaining.length - 1);
              setActiveTab(remaining[nextIdx].id);
            } else {
              setActiveTab(null);
            }
          }
          return remaining;
        });
      };

      var checkIsTrajectory = function () {
        var activeTabEl = document.querySelector('[role="tab"][aria-selected="true"]');
        if (activeTabEl) {
          var txt = (activeTabEl.textContent || '').trim().toLowerCase();
          return txt === 'trajectory' || txt.includes('trajectory') || txt === '轨迹' || txt.includes('轨迹');
        }
        return Boolean(document.querySelector('[class*="TrajectoryView"], [class*="trajectoryView"], [aria-label*="Trajectory"]'));
      };

      var handleToggleView = function () {
        var onTrajectoryNow = checkIsTrajectory();
        var targetName = onTrajectoryNow ? 'chat' : 'trajectory';
        var allTabs = Array.from(document.querySelectorAll('[role="tab"], [role="tablist"] button'));
        var targetBtn = allTabs.find(function (b) {
          var t = (b.textContent || '').trim().toLowerCase();
          return (targetName === 'chat' && (t === 'chat' || t.includes('chat') || t === '对话' || t.includes('对话'))) ||
                 (targetName === 'trajectory' && (t === 'trajectory' || t.includes('trajectory') || t === '轨迹' || t.includes('轨迹')));
        });
        if (targetBtn) {
          targetBtn.click();
        } else {
          var inactiveBtn = allTabs.find(function (b) { return b.getAttribute('aria-selected') !== 'true'; });
          if (inactiveBtn) inactiveBtn.click();
        }
      };

      var handleDownloadSessionLog = function () {
        try {
          var activeSessId = (typeof window !== "undefined" && window.__dsh_current_session_id__) ? window.__dsh_current_session_id__ : "";
          var exportUrl = '/api/session.export?id=' + encodeURIComponent(activeSessId || '');
          var a = document.createElement('a');
          a.href = exportUrl;
          a.download = (activeSessId || 'session') + '.jsonl';
          document.body.appendChild(a);
          a.click();
          setTimeout(function () {
            if (a.parentNode) a.parentNode.removeChild(a);
          }, 1000);
        } catch (e) {}
      };

      var bounds = useCenterBounds();
      var activeTabObj = tabs.find(function (t) { return t.id === activeTab; });
      var isMainTermActive = activeTabObj && activeTabObj.type === "terminal";
      var isMainContActive = activeTabObj && activeTabObj.type === "container";
      var isMainFileActive = activeTabObj && activeTabObj.type === "file";
      var isMainRepoActive = activeTabObj && activeTabObj.type === "repo";
      var isMainEmpty = tabs.length === 0;

      return h(
        Fragment,
        null,
        h(
          "div",
          {
            className: "dsh-top-tab-bar",
            style: {
              position: "fixed",
              top: bounds.top + "px",
              left: bounds.left + "px",
              right: bounds.right + "px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--dsw-alias-surface-l0, #13141f)",
              padding: "0 10px",
              borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))",
              zIndex: 55,
              userSelect: "none",
            },
            onDragOver: function (e) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; },
            onDrop: handleDropOnTop,
          },
          // Left Tabs List & New Tab Plus
          h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "4px", overflowX: "auto", scrollbarWidth: "none" } },
            tabs.map(function (t) {
              var isSel = activeTab === t.id;
              var icon = t.type === "terminal" ? h(TerminalsGlyph, { size: 12 }) :
                (t.type === "container" ? h(ContainersGlyph, { size: 12 }) :
                (t.type === "file" ? h(FileGlyph, { size: 12 }) :
                (t.type === "repo" ? h(RepoGlyph, { size: 12 }) : h(ChatGlyph, { size: 12 }))));
              return h(
                "div",
                {
                  key: t.id,
                  draggable: true,
                  onDragStart: function (e) {
                    e.dataTransfer.setData("text/dsh-tab", JSON.stringify({ id: t.id, type: t.type, title: t.title, session: t.session, path: t.path, from: "top" }));
                  },
                  onClick: function () {
                    setActiveTab(t.id);
                    if (t.type === "chat") {
                      window.dispatchEvent(new CustomEvent("dsh:focus-chat"));
                    }
                  },
                  onContextMenu: function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    setContextMenu({ tab: t, pos: { x: e.clientX, y: e.clientY } });
                  },
                  style: {
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "3px 8px",
                    borderRadius: "5px",
                    background: isSel ? "var(--dsw-alias-interactive-bg-active, rgba(99, 102, 241, 0.18))" : "transparent",
                    border: isSel ? "1px solid var(--dsw-alias-primary, #6366f1)" : "1px solid transparent",
                    color: isSel ? "var(--dsw-alias-label-primary, #fff)" : "var(--dsw-alias-label-secondary, #8b949e)",
                    fontSize: "12px",
                    fontWeight: isSel ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 120ms ease",
                    maxWidth: "200px",
                  },
                },
                icon,
                h("span", { style: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, t.title || "Tab"),
                (t.type !== "chat" && t.id !== "chat-main") ? h(
                  "button",
                  {
                    type: "button",
                    title: "Close Tab",
                    onClick: function (e) { removeTab(t.id, e); },
                    style: {
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "14px",
                      height: "14px",
                      marginLeft: "2px",
                      border: "none",
                      borderRadius: "3px",
                      background: "transparent",
                      color: "inherit",
                      opacity: 0.6,
                      cursor: "pointer",
                      fontSize: "12px",
                    },
                    onMouseEnter: function (e) { e.currentTarget.style.opacity = "1"; e.currentTarget.style.color = "#f85149"; },
                    onMouseLeave: function (e) { e.currentTarget.style.opacity = "0.6"; e.currentTarget.style.color = "inherit"; },
                  },
                  "×"
                ) : null
              );
            }),
            h(
              "div",
              { style: { position: "relative", display: "inline-flex", alignItems: "center" } },
              h(
                "button",
                {
                  ref: topPlusBtnRef,
                  type: "button",
                  title: "New Session / Terminal / Container",
                  onClick: function (e) {
                    e.stopPropagation();
                    setPlusOpen(function (v) { return !v; });
                  },
                  style: {
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "22px",
                    height: "22px",
                    borderRadius: "4px",
                    border: "none",
                    background: "transparent",
                    color: "var(--dsw-alias-label-secondary)",
                    cursor: "pointer",
                  },
                  onMouseEnter: function (e) { e.currentTarget.style.background = "var(--dsw-alias-interactive-bg-hover)"; },
                  onMouseLeave: function (e) { e.currentTarget.style.background = "transparent"; },
                },
                h(PlusGlyph, { size: 13 })
              ),
              h(SelectDropdownMenu, {
                open: plusOpen,
                anchorRef: topPlusBtnRef,
                onClose: function () { setPlusOpen(false); },
                items: [
                  { id: "chat", label: "Conversation", icon: h(ChatGlyph, { size: 13 }) },
                  { id: "terminal", label: "Terminal (Main View)", icon: h(TerminalsGlyph, { size: 13 }) },
                  { id: "container", label: "Container Sandboxes (Main View)", icon: h(ContainersGlyph, { size: 13 }) },
                ],
                onSelect: function (actionId) {
                  setPlusOpen(false);
                  if (actionId === "chat") {
                    window.dispatchEvent(new CustomEvent("dsh:new-session"));
                    var chatTab = { id: "chat-main", type: "chat", title: (typeof window !== "undefined" && window.__dsh_current_session_title__) || "Conversation" };
                    setTabs(function (prev) {
                      if (prev.some(function (t) { return t.id === chatTab.id; })) return prev;
                      return prev.concat([chatTab]);
                    });
                    setActiveTab("chat-main");
                  } else if (actionId === "terminal") {
                    var termName = "term-" + Math.floor(Math.random() * 1000);
                    var newTab = { id: termName, type: "terminal", title: "Terminal " + termName, session: termName };
                    fetch(QUOTAS_API + "/tmux/sessions/new", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ name: termName }),
                    });
                    setTabs(function (prev) { return prev.concat([newTab]); });
                    setActiveTab(newTab.id);
                    window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-top", { detail: newTab }));
                  } else if (actionId === "container") {
                    var contTab = { id: "container-sandboxes", type: "container", title: "Docker Sandboxes" };
                    setTabs(function (prev) {
                      if (prev.some(function (t) { return t.id === contTab.id; })) return prev;
                      return prev.concat([contTab]);
                    });
                    setActiveTab(contTab.id);
                    window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-top", { detail: contTab }));
                  }
                },
              })
            )
          ),
          // Right Controls: 3-dots Session / Area Options Menu
          h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "2px" } },
            h(
              "div",
              { style: { position: "relative", display: "inline-flex", alignItems: "center" } },
              h(
                "button",
                {
                  ref: topEllipsisBtnRef,
                  type: "button",
                  title: "Main Area Options (…)",
                  onClick: function (e) {
                    e.stopPropagation();
                    setTopMenuOpen(!isTopMenuOpen);
                  },
                  style: {
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "26px",
                    height: "26px",
                    borderRadius: "6px",
                    border: "none",
                    background: "transparent",
                    color: "var(--dsw-alias-label-secondary)",
                    cursor: "pointer",
                  },
                  onMouseEnter: function (e) { e.currentTarget.style.background = "var(--dsw-alias-interactive-bg-hover)"; },
                  onMouseLeave: function (e) { e.currentTarget.style.background = "transparent"; },
                },
                h(EllipsisGlyph, { size: 14 })
              ),
              h(SelectDropdownMenu, {
                open: isTopMenuOpen,
                anchorRef: topEllipsisBtnRef,
                onClose: function () { setTopMenuOpen(false); },
                items: [
                  { id: "toggle-view", label: checkIsTrajectory() ? "Switch to Chat View" : "Switch to Trajectory View", icon: h(ChatGlyph, { size: 13 }) },
                  { id: "download-log", label: "Download Session Log", icon: h(FolderOpenGlyph, { size: 13 }) },
                  activeTabObj ? { id: "move-bottom", label: "Move Tab to Bottom Panel", icon: h(DockToggleGlyph, { size: 13 }) } : null,
                  activeTabObj ? { id: "move-right", label: "Move Tab to Secondary Sidebar", icon: h(DockToggleGlyph, { size: 13 }) } : null,
                  (activeTabObj && activeTabObj.type !== "chat") ? { id: "close-tab", label: "Close Active Tab", icon: h(TrashGlyph, { size: 13 }), danger: true } : null,
                ].filter(Boolean),
                onSelect: function (act) {
                  setTopMenuOpen(false);
                  if (act === "toggle-view") {
                    handleToggleView();
                  } else if (act === "download-log") {
                    handleDownloadSessionLog();
                  } else if (act === "move-bottom" && activeTabObj) {
                    var tab = activeTabObj;
                    removeTab(tab.id);
                    window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-bottom", { detail: tab }));
                  } else if (act === "move-right" && activeTabObj) {
                    var tabR = activeTabObj;
                    removeTab(tabR.id);
                    window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-right", { detail: tabR }));
                  } else if (act === "close-tab" && activeTabObj) {
                    removeTab(activeTabObj.id);
                  }
                }
              })
            )
          ),
          contextMenu ? h(SelectDropdownMenu, {
            open: true,
            position: contextMenu.pos,
            onClose: function () { setContextMenu(null); },
            items: [
              { id: "move-bottom", label: "Move to Bottom Panel", icon: h(DockToggleGlyph, { size: 13 }) },
              { id: "move-right", label: "Move to Secondary Sidebar", icon: h(DockToggleGlyph, { size: 13 }) },
              contextMenu.tab && contextMenu.tab.type !== "chat" ? { id: "close", label: "Close Tab", icon: h(TrashGlyph, { size: 13 }), danger: true } : null,
            ].filter(Boolean),
            onSelect: function (act) {
              var tab = contextMenu.tab;
              setContextMenu(null);
              if (act === "move-bottom") {
                removeTab(tab.id);
                window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-bottom", { detail: tab }));
              } else if (act === "move-right") {
                removeTab(tab.id);
                window.dispatchEvent(new CustomEvent("dsh:tab-moved-to-right", { detail: tab }));
              } else if (act === "close") {
                removeTab(tab.id);
              }
            }
          }) : null
        ),
        isMainEmpty ? h("div", {
          style: {
            position: "fixed",
            top: (bounds.top + 36) + "px",
            left: bounds.left + "px",
            right: bounds.right + "px",
            bottom: (typeof window !== "undefined" && window.__dsh_panel_height__) ? window.__dsh_panel_height__ : "38px",
            zIndex: 40,
            display: "flex",
          }
        }, h(EmptyAreaNewTabPicker, { areaName: "Main Area" })) : null,
        isMainTermActive ? h(MainViewTerminalOccupant, { sessionName: activeTabObj.session || activeTabObj.id, onClose: function () { removeTab(activeTabObj.id); } }) : null,
        isMainContActive ? h(MainViewContainerOccupant, { onClose: function () { removeTab(activeTabObj.id); } }) : null,
        isMainFileActive ? h(MainViewFileEditorOccupant, { filePath: activeTabObj.path, fileName: activeTabObj.title, onClose: function () { removeTab(activeTabObj.id); } }) : null,
        isMainRepoActive ? h(MainViewRepoOccupant, { repoPath: activeTabObj.path, repoName: activeTabObj.title, onClose: function () { removeTab(activeTabObj.id); } }) : null
      );
    }

    function RenameTerminalModal(props) {
      var oldName = props.oldName, onClose = props.onClose, onRenamed = props.onRenamed;
      var nameState = React.useState(oldName);
      var name = nameState[0], setName = nameState[1];
      var savingState = React.useState(false);
      var saving = savingState[0], setSaving = savingState[1];

      var handleRename = function () {
        if (!name.trim()) return;
        setSaving(true);
        fetch(QUOTAS_API + "/tmux/sessions/rename", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ oldName: oldName, newName: name.trim() }),
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.ok) onRenamed();
            else alert("Failed to rename session: " + (res.error || "Unknown error"));
          })
          .catch(function (e) { alert("Error: " + e.message); })
          .finally(function () { setSaving(false); onClose(); });
      };

      return h(
        "div",
        { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999 } },
        h(
          "div",
          { style: { width: "360px", padding: "20px", borderRadius: "10px", background: "var(--dsw-alias-bg-layer-2, #1c2128)", border: "1px solid var(--dsw-alias-border-l1)", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" } },
          h("h3", { style: { margin: 0, fontSize: "15px", fontWeight: 600 } }, "Rename Terminal Session"),
          h("input", {
            type: "text",
            value: name,
            onChange: function (e) { setName(e.target.value); },
            onKeyDown: function (e) { if (e.key === "Enter") handleRename(); },
            autoFocus: true,
            style: { padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l1)", color: "inherit", fontSize: "13px" }
          }),
          h("div", { style: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" } },
            h("button", { onClick: onClose, style: { padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", color: "inherit", cursor: "pointer" } }, "Cancel"),
            h("button", { onClick: handleRename, disabled: saving, style: { padding: "6px 14px", borderRadius: "6px", border: "none", background: "var(--dsw-alias-primary, #6366f1)", color: "#fff", fontWeight: 600, cursor: "pointer" } }, saving ? "Saving…" : "Save")
          )
        )
      );
    }

    function RepoGlyph(props) {
      var size = props && props.size ? props.size : 15;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
          color: "var(--dsw-alias-primary, #6366f1)"
        }
      },
        h("line", { x1: "6", x2: "6", y1: "3", y2: "15" }),
        h("circle", { cx: "18", cy: "6", r: "3" }),
        h("circle", { cx: "6", cy: "18", r: "3" }),
        h("path", { d: "M18 9a9 9 0 0 1-9 9" })
      );
    }

    function WorkspaceGlyph(props) {
      var size = props && props.size ? props.size : 15;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-workspace';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
          color: "var(--dsw-alias-info, #38bdf8)"
        }
      },
        h("rect", { x: "2", y: "7", width: "20", height: "14", rx: "2", ry: "2" }),
        h("path", { d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" })
      );
    }

    function renderAppIcon(appName, size, filePath) {
      var s = size || 15;
      var raw = (appName || "").trim();
      var cleanName = raw.replace(/\.app$/i, "").trim();

      if (filePath) {
        return h("img", {
          src: "/quotas/api/fs/icon?path=" + encodeURIComponent(filePath),
          width: s,
          height: s,
          alt: appName,
          className: "dsh-icon-animated",
          style: {
            width: s + "px",
            height: s + "px",
            objectFit: "contain",
            display: "inline-flex",
            verticalAlign: "middle",
            flexShrink: 0,
            borderRadius: "3px",
          },
          onError: function (e) {
            e.target.style.display = "none";
          }
        });
      }

      if (raw.startsWith("/") && raw.includes(".app")) {
        return h("img", {
          src: "/quotas/api/fs/icon?path=" + encodeURIComponent(raw),
          width: s,
          height: s,
          alt: appName,
          className: "dsh-icon-animated",
          style: {
            width: s + "px",
            height: s + "px",
            objectFit: "contain",
            display: "inline-flex",
            verticalAlign: "middle",
            flexShrink: 0,
            borderRadius: "3px",
          },
          onError: function (e) {
            e.target.style.display = "none";
          }
        });
      }

      if (cleanName) {
        var resolvedPath = "/Applications/" + cleanName + ".app";
        return h("img", {
          src: "/quotas/api/fs/icon?path=" + encodeURIComponent(resolvedPath),
          width: s,
          height: s,
          alt: appName,
          className: "dsh-icon-animated",
          style: {
            width: s + "px",
            height: s + "px",
            objectFit: "contain",
            display: "inline-flex",
            verticalAlign: "middle",
            flexShrink: 0,
            borderRadius: "3px",
          },
          onError: function (e) {
            e.target.style.display = "none";
          }
        });
      }

      return null;
    }

    function AppGlyph(props) {
      return renderAppIcon(props && props.appName ? props.appName : "app", props && props.size ? props.size : 14);
    }

    function LibraryGlyph(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-library';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
          color: "var(--dsw-alias-label-tertiary)"
        }
      },
        h("path", { d: "m16 6 4 14" }),
        h("path", { d: "M12 6v14" }),
        h("path", { d: "M8 8v12" }),
        h("path", { d: "M4 4v16" })
      );
    }

    function SystemGlyph(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-system';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
          color: "var(--dsw-alias-label-tertiary)"
        }
      },
        h("rect", { width: "16", height: "16", x: "4", y: "4", rx: "2" }),
        h("rect", { width: "6", height: "6", x: "9", y: "9", rx: "1" }),
        h("path", { d: "M15 2v2" }),
        h("path", { d: "M15 20v2" }),
        h("path", { d: "M2 15h2" }),
        h("path", { d: "M2 9h2" }),
        h("path", { d: "M20 15h2" }),
        h("path", { d: "M20 9h2" }),
        h("path", { d: "M9 2v2" }),
        h("path", { d: "M9 20v2" })
      );
    }

    function UsersGlyph(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-users';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
          color: "var(--dsw-alias-label-tertiary)"
        }
      },
        h("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
        h("circle", { cx: "9", cy: "7", r: "4" }),
        h("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
        h("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
      );
    }

    function ArchiveBoxGlyph(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-archive';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
          color: "var(--dsw-alias-primary, #6366f1)"
        }
      },
        h("rect", { width: "20", height: "5", x: "2", y: "3", rx: "1" }),
        h("path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }),
        h("path", { d: "M10 12h4" })
      );
    }

    function RestoreGlyph(props) {
      var size = props && props.size ? props.size : 13;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-refresh';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
        }
      },
        h("polyline", { points: "1 4 1 10 7 10" }),
        h("path", { d: "M3.51 15a9 9 0 1 0 2.13-9.36L1 10" })
      );
    }

    function BlueFolderGlyph(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-folder';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
          color: "var(--dsw-alias-primary, #6366f1)"
        }
      },
        h("path", { d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" })
      );
    }

    function FolderPlusGlyph(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-folder-plus';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: Object.assign({
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
        }, (props && props.style) || {})
      },
        h("path", { d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" }),
        h("line", { x1: "12", y1: "10", x2: "12", y2: "16" }),
        h("line", { x1: "9", y1: "13", x2: "15", y2: "13" })
      );
    }

    function SlidersGlyph(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-sliders';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: Object.assign({
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
        }, (props && props.style) || {})
      },
        h("line", { x1: "4", y1: "21", x2: "4", y2: "14" }),
        h("line", { x1: "4", y1: "10", x2: "4", y2: "3" }),
        h("line", { x1: "12", y1: "21", x2: "12", y2: "12" }),
        h("line", { x1: "12", y1: "8", x2: "12", y2: "3" }),
        h("line", { x1: "20", y1: "21", x2: "20", y2: "16" }),
        h("line", { x1: "20", y1: "12", x2: "20", y2: "3" }),
        h("line", { x1: "1", y1: "14", x2: "7", y2: "14" }),
        h("line", { x1: "9", y1: "8", x2: "15", y2: "8" }),
        h("line", { x1: "17", y1: "16", x2: "23", y2: "16" })
      );
    }

    function PinGlyph(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-pin';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
          color: "var(--dsw-alias-primary, #6366f1)"
        }
      },
        h("line", { x1: "12", x2: "12", y1: "17", y2: "22" }),
        h("path", { d: "M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" })
      );
    }

    function ActiveGlyph(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-active';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
          color: "var(--dsw-alias-primary, #6366f1)"
        }
      },
        h("path", { d: "M22 12h-4l-3 9L9 3l-3 9H2" })
      );
    }

    function HostMachineGlyph(props) {
      var size = props && props.size ? props.size : 15;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-system';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
          color: "var(--dsw-alias-primary, #6366f1)"
        }
      },
        h("rect", { width: "20", height: "14", x: "2", y: "3", rx: "2" }),
        h("line", { x1: "8", x2: "16", y1: "21", y2: "21" }),
        h("line", { x1: "12", x2: "12", y1: "17", y2: "21" })
      );
    }

    function HardDriveGlyph(props) {
      var size = props && props.size ? props.size : 15;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          verticalAlign: "middle",
          flexShrink: 0,
          color: "var(--dsw-alias-label-secondary, #94a3b8)"
        }
      },
        h("line", { x1: "22", x2: "2", y1: "12", y2: "12" }),
        h("path", { d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" }),
        h("line", { x1: "6", x2: "6.01", y1: "16", y2: "16" }),
        h("line", { x1: "10", x2: "10.01", y1: "16", y2: "16" })
      );
    }

    function SparklesGlyph(props) {
      var size = props.size || 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        style: {
          display: "inline-block",
          verticalAlign: "middle",
          flexShrink: 0,
          color: "var(--dsw-alias-primary, #6366f1)"
        }
      },
        h("path", { d: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" })
      );
    }

    function AccountsGlyph(props) {
      var size = props.size || 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h("svg", { width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
        h("circle", { cx: "12", cy: "7", r: "4" })
      );
    }

    function ModelsGlyph(props) {
      var size = props.size || 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h("svg", { width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" })
      );
    }

    function AppsGlyph(props) {
      var size = props.size || 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h("svg", { width: size, height: size, className: className, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("rect", { x: "3", y: "3", width: "7", height: "7" }),
        h("rect", { x: "14", y: "3", width: "7", height: "7" }),
        h("rect", { x: "14", y: "14", width: "7", height: "7" }),
        h("rect", { x: "3", y: "14", width: "7", height: "7" })
      );
    }

    function IconsGlyph(props) {
      var size = props.size || 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h("svg", {
        width: size,
        height: size,
        className: className,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round"
      },
        h("path", { d: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" })
      );
    }

    var LUCIDE_ICONS_CATALOG = {
      // System & OS
      "Folder": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" })); } },
      "FolderGit2": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" }), h("circle", { cx: "12", cy: "13", r: "2" })); } },
      "HardDrive": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("line", { x1: "22", x2: "2", y1: "12", y2: "12" }), h("path", { d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" }), h("line", { x1: "6", x2: "6.01", y1: "16", y2: "16" }), h("line", { x1: "10", x2: "10.01", y1: "16", y2: "16" })); } },
      "Server": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("rect", { width: "20", height: "8", x: "2", y: "2", rx: "2", ry: "2" }), h("rect", { width: "20", height: "8", x: "2", y: "14", rx: "2", ry: "2" }), h("line", { x1: "6", x2: "6.01", y1: "6", y2: "6" }), h("line", { x1: "6", x2: "6.01", y1: "18", y2: "18" })); } },
      "Cpu": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("rect", { width: "16", height: "16", x: "4", y: "4", rx: "2" }), h("rect", { width: "6", height: "6", x: "9", y: "9", rx: "1" }), h("path", { d: "M15 2v2" }), h("path", { d: "M15 20v2" }), h("path", { d: "M2 15h2" }), h("path", { d: "M2 9h2" }), h("path", { d: "M20 15h2" }), h("path", { d: "M20 9h2" }), h("path", { d: "M9 2v2" }), h("path", { d: "M9 20v2" })); } },
      "AppWindow": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("rect", { x: "2", y: "4", width: "20", height: "16", rx: "2" }), h("path", { d: "M10 4v4" }), h("path", { d: "M2 8h20" }), h("path", { d: "M6 4v4" })); } },
      "Library": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "m16 6 4 14" }), h("path", { d: "M12 6v14" }), h("path", { d: "M8 8v12" }), h("path", { d: "M4 4v16" })); } },
      "Users": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }), h("circle", { cx: "9", cy: "7", r: "4" }), h("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }), h("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })); } },
      "Archive": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("rect", { width: "20", height: "5", x: "2", y: "3", rx: "1" }), h("path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" }), h("path", { d: "M10 12h4" })); } },
      "RotateCcw": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }), h("path", { d: "M3 3v5h5" })); } },
      "Pin": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("line", { x1: "12", x2: "12", y1: "17", y2: "22" }), h("path", { d: "M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" })); } },
      "Activity": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M22 12h-4l-3 9L9 3l-3 9H2" })); } },
      "ShieldCheck": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" }), h("path", { d: "m9 12 2 2 4-4" })); } },
      "KeyRound": { category: "System & OS", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" }), h("circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor" })); } },

      // Development & Files
      "Terminal": { category: "Development", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("polyline", { points: "4 17 10 11 4 5" }), h("line", { x1: "12", x2: "20", y1: "19", y2: "19" })); } },
      "FileCode": { category: "Development", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }), h("polyline", { points: "14 2 14 8 20 8" }), h("path", { d: "m10 13-2 2 2 2" }), h("path", { d: "m14 17 2-2-2-2" })); } },
      "Code": { category: "Development", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("polyline", { points: "16 18 22 12 16 6" }), h("polyline", { points: "8 6 2 12 8 18" })); } },
      "FileText": { category: "Development", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" }), h("polyline", { points: "14 2 14 8 20 8" }), h("line", { x1: "16", x2: "8", y1: "13", y2: "13" }), h("line", { x1: "16", x2: "8", y1: "17", y2: "17" }), h("line", { x1: "10", x2: "8", y1: "9", y2: "9" })); } },
      "Database": { category: "Development", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("ellipse", { cx: "12", cy: "5", rx: "9", ry: "3" }), h("path", { d: "M3 5V19A9 3 0 0 0 21 19V5" }), h("path", { d: "M3 12A9 3 0 0 0 21 12" })); } },
      "Braces": { category: "Development", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" }), h("path", { d: "M16 21h1a2 2 0 0 0 2-2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" })); } },
      "Boxes": { category: "Development", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" }), h("path", { d: "M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" }), h("path", { d: "M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" })); } },
      "GitFork": { category: "Development", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("circle", { cx: "12", cy: "18", r: "3" }), h("circle", { cx: "6", cy: "6", r: "3" }), h("circle", { cx: "18", cy: "6", r: "3" }), h("path", { d: "M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" }), h("path", { d: "M12 12v3" })); } },
      "GitBranch": { category: "Development", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("line", { x1: "6", x2: "6", y1: "3", y2: "15" }), h("circle", { cx: "18", cy: "6", r: "3" }), h("circle", { cx: "6", cy: "18", r: "3" }), h("path", { d: "M18 9a9 9 0 0 1-9 9" })); } },
      "Hammer": { category: "Development", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "m15 12-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L12 9" }), h("path", { d: "M17.64 15 22 10.64" }), h("path", { d: "m20.91 3.26-1.57-1.57a2.12 2.12 0 0 0-3 0l-5.63 5.63 4.57 4.57 5.63-5.63a2.12 2.12 0 0 0 0-3z" })); } },

      // Agents & Modes
      "Bot": { category: "Agents & Roles", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M12 8V4H8" }), h("rect", { width: "16", height: "12", x: "4", y: "8", rx: "2" }), h("path", { d: "M2 14h2" }), h("path", { d: "M20 14h2" }), h("path", { d: "M15 13v2" }), h("path", { d: "M9 13v2" })); } },
      "Brain": { category: "Agents & Roles", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04Z" }), h("path", { d: "M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04Z" })); } },
      "Sparkles": { category: "Agents & Roles", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" })); } },
      "Calendar": { category: "Agents & Roles", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("rect", { width: "18", height: "18", x: "3", y: "4", rx: "2", ry: "2" }), h("line", { x1: "16", x2: "16", y1: "2", y2: "6" }), h("line", { x1: "8", x2: "8", y1: "2", y2: "6" }), h("line", { x1: "3", x2: "21", y1: "10", y2: "10" })); } },
      "PlayCircle": { category: "Agents & Roles", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("circle", { cx: "12", cy: "12", r: "10" }), h("polygon", { points: "10 8 16 12 10 16 10 8" })); } },
      "Network": { category: "Agents & Roles", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("rect", { x: "16", y: "16", width: "6", height: "6", rx: "1" }), h("rect", { x: "2", y: "16", width: "6", height: "6", rx: "1" }), h("rect", { x: "9", y: "2", width: "6", height: "6", rx: "1" }), h("path", { d: "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" }), h("path", { d: "M12 12V8" })); } },
      "CheckSquare": { category: "Agents & Roles", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("polyline", { points: "9 11 12 14 22 4" }), h("path", { d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" })); } },
      "RefreshCw": { category: "Agents & Roles", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }), h("path", { d: "M21 3v5h-5" }), h("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }), h("path", { d: "M8 16H3v5" })); } },
      "Wrench": { category: "Agents & Roles", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })); } },

      // UI & Media
      "SlidersHorizontal": { category: "UI & Media", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("line", { x1: "21", x2: "14", y1: "4", y2: "4" }), h("line", { x1: "10", x2: "3", y1: "4", y2: "4" }), h("line", { x1: "21", x2: "12", y1: "12", y2: "12" }), h("line", { x1: "8", x2: "3", y1: "12", y2: "12" }), h("line", { x1: "21", x2: "16", y1: "20", y2: "20" }), h("line", { x1: "12", x2: "3", y1: "20", y2: "20" }), h("line", { x1: "14", x2: "14", y1: "2", y2: "6" }), h("line", { x1: "8", x2: "8", y1: "10", y2: "14" }), h("line", { x1: "16", x2: "16", y1: "18", y2: "22" })); } },
      "Palette": { category: "UI & Media", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("circle", { cx: "13.5", cy: "6.5", r: ".5", fill: "currentColor" }), h("circle", { cx: "17.5", cy: "10.5", r: ".5", fill: "currentColor" }), h("circle", { cx: "8.5", cy: "7.5", r: ".5", fill: "currentColor" }), h("circle", { cx: "6.5", cy: "12.5", r: ".5", fill: "currentColor" }), h("path", { d: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" })); } },
      "MessageSquare": { category: "UI & Media", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })); } },
      "Image": { category: "UI & Media", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }), h("circle", { cx: "9", cy: "9", r: "2" }), h("path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" })); } },
      "Globe": { category: "UI & Media", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("circle", { cx: "12", cy: "12", r: "10" }), h("line", { x1: "2", x2: "22", y1: "12", y2: "12" }), h("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" })); } },
      "Compass": { category: "UI & Media", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("circle", { cx: "12", cy: "12", r: "10" }), h("polygon", { points: "16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" })); } },
      "Music": { category: "UI & Media", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M9 18V5l12-2v13" }), h("circle", { cx: "6", cy: "18", r: "3" }), h("circle", { cx: "18", cy: "16", r: "3" })); } },
      "Trash2": { category: "UI & Media", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M3 6h18" }), h("path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }), h("path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }), h("line", { x1: "10", x2: "10", y1: "11", y2: "17" }), h("line", { x1: "14", x2: "14", y1: "11", y2: "17" })); } },
      "Pencil": { category: "UI & Media", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("path", { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" }), h("path", { d: "m15 5 4 4" })); } },
      "Copy": { category: "UI & Media", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }), h("path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })); } },
      "Scissors": { category: "UI & Media", render: function (s, c) { return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, h("circle", { cx: "6", cy: "6", r: "3" }), h("circle", { cx: "6", cy: "18", r: "3" }), h("line", { x1: "20", x2: "8.12", y1: "4", y2: "15.88" }), h("line", { x1: "14.47", x2: "20", y1: "14.48", y2: "20" }), h("line", { x1: "8.12", x2: "12", y1: "8.12", y2: "12" })); } }
    };

    function renderCatalogIcon(iconName, size, className) {
      var s = size || 16;
      var c = (className ? className + " " : "") + "dsh-icon-animated";
      if (LUCIDE_ICONS_CATALOG[iconName] && typeof LUCIDE_ICONS_CATALOG[iconName].render === "function") {
        return LUCIDE_ICONS_CATALOG[iconName].render(s, c);
      }
      return h("svg", { width: s, height: s, className: c, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" },
        h("path", { d: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" })
      );
    }

    var DEFAULT_ICON_MAPPINGS = {
      extensions: {
        ".ts": "FileCode",
        ".tsx": "FileCode",
        ".js": "FileCode",
        ".jsx": "FileCode",
        ".py": "Code",
        ".json": "Braces",
        ".md": "FileText",
        ".rs": "Cpu",
        ".go": "Cpu",
        ".sh": "Terminal",
        ".sql": "Database",
        ".env": "KeyRound",
        ".yaml": "FileText",
        ".yml": "FileText",
        ".png": "Image",
        ".jpg": "Image",
        ".svg": "Sparkles"
      },
      folders: {
        "Applications": "AppWindow",
        "Library": "Library",
        "System": "Cpu",
        "Users": "Users",
        "Projects": "GitFork",
        "Archive": "Archive",
        "Hosts": "Server",
        "Drives": "HardDrive",
        "Pinned": "Pin",
        "Active": "Activity",
        "Ungrouped": "Folder"
      },
      apps: {
        "Terminal": "Terminal",
        "Finder": "AppWindow",
        "Docker": "Boxes",
        "VSCode": "Code",
        "Xcode": "Hammer",
        "Chrome": "Globe",
        "Safari": "Compass",
        "Slack": "MessageSquare",
        "Discord": "MessageSquare",
        "Music": "Music",
        "Spotify": "Music",
        "Notes": "FileText",
        "Settings": "SlidersHorizontal",
        "GitHub": "GitFork"
      },
      agents: {
        "Code": "Code",
        "Planning": "Calendar",
        "Reasoning": "Brain",
        "Execution": "PlayCircle",
        "Orchestration": "Network",
        "Review": "CheckSquare",
        "Reflection": "Sparkles",
        "DarkFactory": "Bot"
      }
    };

    function loadCustomIconMappings() {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          var raw = window.localStorage.getItem("dsh_custom_icon_mappings");
          if (raw) {
            var parsed = JSON.parse(raw);
            return Object.assign({}, DEFAULT_ICON_MAPPINGS, parsed);
          }
        }
      } catch (e) {}
      return JSON.parse(JSON.stringify(DEFAULT_ICON_MAPPINGS));
    }

    function saveCustomIconMappings(mappings) {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem("dsh_custom_icon_mappings", JSON.stringify(mappings));
          window.dispatchEvent(new CustomEvent("dsh:icon-mappings-changed", { detail: mappings }));
        }
      } catch (e) {}
    }

    // Global resolver
    if (typeof window !== "undefined") {
      window.__dsh_get_icon_for__ = function (type, key) {
        var mappings = loadCustomIconMappings();
        var category = mappings && mappings[type];
        if (category && category[key]) return category[key];
        return null;
      };
    }

    function IconsSection() {
      var mappingsState = React.useState(loadCustomIconMappings);
      var mappings = mappingsState[0], setMappings = mappingsState[1];

      var activeTabState = React.useState("catalog");
      var activeTab = activeTabState[0], setActiveTab = activeTabState[1];

      var activeMappingCategoryState = React.useState("extensions");
      var activeMappingCategory = activeMappingCategoryState[0], setActiveMappingCategory = activeMappingCategoryState[1];

      var searchState = React.useState("");
      var search = searchState[0], setSearch = searchState[1];

      var catalogCategoryState = React.useState("All");
      var catalogCategory = catalogCategoryState[0], setCatalogCategory = catalogCategoryState[1];

      var newTargetState = React.useState("");
      var newTarget = newTargetState[0], setNewTarget = newTargetState[1];

      var newIconState = React.useState("Sparkles");
      var newIcon = newIconState[0], setNewIcon = newIconState[1];

      var iconKeys = Object.keys(LUCIDE_ICONS_CATALOG);
      var filteredIcons = iconKeys.filter(function (k) {
        var matchCat = catalogCategory === "All" || LUCIDE_ICONS_CATALOG[k].category.toLowerCase().includes(catalogCategory.toLowerCase());
        var matchSearch = !search || k.toLowerCase().includes(search.toLowerCase()) || LUCIDE_ICONS_CATALOG[k].category.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
      });

      var handleAddMapping = function () {
        if (!newTarget.trim()) return;
        var next = JSON.parse(JSON.stringify(mappings));
        if (!next[activeMappingCategory]) next[activeMappingCategory] = {};
        next[activeMappingCategory][newTarget.trim()] = newIcon;
        setMappings(next);
        saveCustomIconMappings(next);
        setNewTarget("");
      };

      var handleRemoveMapping = function (key) {
        var next = JSON.parse(JSON.stringify(mappings));
        if (next[activeMappingCategory] && next[activeMappingCategory][key]) {
          delete next[activeMappingCategory][key];
          setMappings(next);
          saveCustomIconMappings(next);
        }
      };

      var handleResetCategory = function () {
        var next = JSON.parse(JSON.stringify(mappings));
        next[activeMappingCategory] = Object.assign({}, DEFAULT_ICON_MAPPINGS[activeMappingCategory]);
        setMappings(next);
        saveCustomIconMappings(next);
      };

      var handleResetAll = function () {
        var next = JSON.parse(JSON.stringify(DEFAULT_ICON_MAPPINGS));
        setMappings(next);
        saveCustomIconMappings(next);
      };

      var currentCategoryMappings = (mappings && mappings[activeMappingCategory]) || {};
      var mappingKeys = Object.keys(currentCategoryMappings);

      return h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "20px", padding: "4px 0", maxWidth: "900px" } },
        // Header
        h(
          "div",
          { style: { borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))", paddingBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" } },
          h("div", null,
            h("h2", { style: { margin: "0 0 4px 0", fontSize: "18px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, "Icon Catalog & Custom Mappings"),
            h("div", { style: { fontSize: "13px", color: "var(--dsw-alias-label-secondary)" } }, "Explore the library of animated Lucide icons and configure dynamic mappings for extensions, directories, applications, and agent roles.")
          ),
          h("div", { style: { display: "flex", gap: "6px", background: "var(--dsw-alias-surface-l1, rgba(128,128,128,0.08))", padding: "3px", borderRadius: "8px", border: "1px solid var(--dsw-alias-border-l1)" } },
            h("button", {
              type: "button",
              onClick: function () { setActiveTab("catalog"); },
              style: { padding: "6px 14px", borderRadius: "6px", border: "none", background: activeTab === "catalog" ? "var(--dsw-alias-surface-l2, #333)" : "transparent", color: activeTab === "catalog" ? "var(--dsw-alias-label-primary)" : "var(--dsw-alias-label-secondary)", fontWeight: activeTab === "catalog" ? 600 : 400, fontSize: "12px", cursor: "pointer" }
            }, "Icon Catalog (" + iconKeys.length + ")"),
            h("button", {
              type: "button",
              onClick: function () { setActiveTab("mappings"); },
              style: { padding: "6px 14px", borderRadius: "6px", border: "none", background: activeTab === "mappings" ? "var(--dsw-alias-surface-l2, #333)" : "transparent", color: activeTab === "mappings" ? "var(--dsw-alias-label-primary)" : "var(--dsw-alias-label-secondary)", fontWeight: activeTab === "mappings" ? 600 : 400, fontSize: "12px", cursor: "pointer" }
            }, "Custom Mappings")
          )
        ),

        // Tab 1: Catalog
        activeTab === "catalog" ? h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: "16px" } },
          // Controls
          h(
            "div",
            { style: { display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" } },
            h("input", {
              type: "text",
              placeholder: "Search icons by name or tag (e.g. folder, brain, docker)...",
              value: search,
              onChange: function (e) { setSearch(e.target.value); },
              style: { flex: "1 1 240px", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l1)", color: "inherit", fontSize: "13px" }
            }),
            h("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" } },
              ["All", "System", "Development", "Agents", "UI"].map(function (cat) {
                return h("button", {
                  key: cat,
                  type: "button",
                  onClick: function () { setCatalogCategory(cat); },
                  style: {
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid " + (catalogCategory === cat ? "var(--dsw-alias-primary, #6366f1)" : "var(--dsw-alias-border-l1)"),
                    background: catalogCategory === cat ? "rgba(99, 102, 241, 0.15)" : "var(--dsw-alias-surface-l1)",
                    color: catalogCategory === cat ? "var(--dsw-alias-primary, #6366f1)" : "var(--dsw-alias-label-secondary)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer"
                  }
                }, cat);
              })
            )
          ),
          // Grid
          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "10px" } },
            filteredIcons.map(function (k) {
              return h(
                "div",
                {
                  key: k,
                  onClick: function () {
                    setNewIcon(k);
                    setActiveTab("mappings");
                  },
                  title: "Click to map " + k,
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    padding: "16px 10px",
                    borderRadius: "10px",
                    border: "1px solid var(--dsw-alias-border-l1)",
                    background: "var(--dsw-alias-surface-l1)",
                    cursor: "pointer",
                    transition: "all 120ms ease",
                    userSelect: "none"
                  },
                  onMouseEnter: function (e) {
                    e.currentTarget.style.borderColor = "var(--dsw-alias-primary, #6366f1)";
                    e.currentTarget.style.background = "var(--dsw-alias-surface-l2)";
                  },
                  onMouseLeave: function (e) {
                    e.currentTarget.style.borderColor = "var(--dsw-alias-border-l1)";
                    e.currentTarget.style.background = "var(--dsw-alias-surface-l1)";
                  }
                },
                renderCatalogIcon(k, 28, "dsh-icon-animated"),
                h("div", { style: { fontSize: "12px", fontWeight: 600, color: "var(--dsw-alias-label-primary)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", width: "100%" } }, k),
                h("div", { style: { fontSize: "10px", color: "var(--dsw-alias-label-tertiary)" } }, LUCIDE_ICONS_CATALOG[k].category)
              );
            })
          )
        ) : null,

        // Tab 2: Custom Mappings
        activeTab === "mappings" ? h(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: "16px" } },
          // Category Selector
          h(
            "div",
            { style: { display: "flex", gap: "8px", borderBottom: "1px solid var(--dsw-alias-border-l1)", paddingBottom: "10px", overflowX: "auto" } },
            [
              { id: "extensions", label: "File Extensions (.ts, .py)" },
              { id: "folders", label: "Folders & Categories" },
              { id: "apps", label: "Applications (Terminal, Docker)" },
              { id: "agents", label: "Agent Roles (Code, Planning)" }
            ].map(function (tab) {
              var isSel = activeMappingCategory === tab.id;
              return h("button", {
                key: tab.id,
                type: "button",
                onClick: function () { setActiveMappingCategory(tab.id); },
                style: {
                  padding: "6px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: isSel ? "var(--dsw-alias-primary, #6366f1)" : "transparent",
                  color: isSel ? "#ffffff" : "var(--dsw-alias-label-secondary)",
                  fontWeight: isSel ? 600 : 400,
                  fontSize: "12px",
                  cursor: "pointer"
                }
              }, tab.label);
            })
          ),

          // Add New Mapping Card
          h(
            "div",
            { style: { borderRadius: "10px", border: "1px solid var(--dsw-alias-border-l1)", background: "var(--dsw-alias-surface-l1)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "12px" } },
            h("div", { style: { fontSize: "13px", fontWeight: 600 } }, "Add / Override Mapping for " + activeMappingCategory),
            h("div", { style: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" } },
              h("input", {
                type: "text",
                placeholder: activeMappingCategory === "extensions" ? "e.g. .vue, .graphql, .swift" : (activeMappingCategory === "apps" ? "e.g. Spotify, Notion" : "e.g. Documentation, Architect"),
                value: newTarget,
                onChange: function (e) { setNewTarget(e.target.value); },
                style: { flex: "1 1 200px", padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l2)", color: "inherit", fontSize: "13px" }
              }),
              h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
                renderCatalogIcon(newIcon, 22),
                h("select", {
                  value: newIcon,
                  onChange: function (e) { setNewIcon(e.target.value); },
                  style: { padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l2)", color: "inherit", fontSize: "13px", cursor: "pointer" }
                },
                  iconKeys.map(function (k) {
                    return h("option", { key: k, value: k }, k + " (" + LUCIDE_ICONS_CATALOG[k].category + ")");
                  })
                )
              ),
              h("button", {
                type: "button",
                onClick: handleAddMapping,
                style: { padding: "8px 16px", borderRadius: "6px", border: "none", background: "var(--dsw-alias-primary, #6366f1)", color: "#ffffff", fontWeight: 600, fontSize: "13px", cursor: "pointer" }
              }, "Save Mapping")
            )
          ),

          // Active Mappings Table
          h(
            "div",
            { style: { borderRadius: "10px", border: "1px solid var(--dsw-alias-border-l1)", background: "var(--dsw-alias-surface-l1)", overflow: "hidden" } },
            h("div", { style: { padding: "10px 16px", background: "var(--dsw-alias-surface-l2)", borderBottom: "1px solid var(--dsw-alias-border-l1)", display: "flex", justifyContent: "space-between", alignItems: "center" } },
              h("span", { style: { fontSize: "12px", fontWeight: 600 } }, "Configured Rules (" + mappingKeys.length + ")"),
              h("button", {
                type: "button",
                onClick: handleResetCategory,
                style: { padding: "3px 8px", borderRadius: "4px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", color: "var(--dsw-alias-label-secondary)", fontSize: "11px", cursor: "pointer" }
              }, "Reset Category to Defaults")
            ),
            h(
              "div",
              { style: { display: "flex", flexDirection: "column", maxHeight: "380px", overflowY: "auto" } },
              mappingKeys.length === 0
                ? h("div", { style: { padding: "24px", textAlign: "center", color: "var(--dsw-alias-label-tertiary)", fontSize: "13px" } }, "No mappings configured for this category.")
                : mappingKeys.map(function (targetKey) {
                    var assignedIcon = currentCategoryMappings[targetKey];
                    return h(
                      "div",
                      {
                        key: targetKey,
                        style: {
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 16px",
                          borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.1))"
                        }
                      },
                      h("div", { style: { display: "flex", alignItems: "center", gap: "12px" } },
                        renderCatalogIcon(assignedIcon, 20),
                        h("div", null,
                          h("span", { style: { fontSize: "13px", fontWeight: 600, color: "var(--dsw-alias-label-primary)" } }, targetKey),
                          h("span", { style: { marginLeft: "8px", fontSize: "11px", color: "var(--dsw-alias-label-tertiary)" } }, "→ " + assignedIcon)
                        )
                      ),
                      h("button", {
                        type: "button",
                        onClick: function () { handleRemoveMapping(targetKey); },
                        style: { padding: "4px 8px", borderRadius: "4px", border: "none", background: "transparent", color: "var(--dsw-alias-state-error-primary, #ef4444)", fontSize: "12px", cursor: "pointer" }
                      }, "Delete")
                    );
                  })
            )
          ),

          // Footer Actions
          h(
            "div",
            { style: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" } },
            h("button", {
              type: "button",
              onClick: handleResetAll,
              style: { padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", color: "var(--dsw-alias-label-secondary)", fontSize: "12px", cursor: "pointer" }
            }, "Reset All Mappings to Factory Defaults")
          )
        ) : null
      );
    }

    // Helper Modals
    function NewSessionModal(props) {
      var onClose = props.onClose, onCreated = props.onCreated;
      var nameState = React.useState("");
      var name = nameState[0], setName = nameState[1];
      var creatingState = React.useState(false);
      var creating = creatingState[0], setCreating = creatingState[1];

      var handleCreate = function () {
        setCreating(true);
        fetch(QUOTAS_API + "/tmux/sessions/new", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: name }),
        })
          .then(function () { onCreated(); onClose(); })
          .finally(function () { setCreating(false); });
      };

      return h(
        "div",
        { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999 } },
        h(
          "div",
          { style: { width: "440px", padding: "24px", borderRadius: "12px", background: "var(--dsw-alias-surface-l0, #1e1e2e)", border: "1px solid var(--dsw-alias-border-l2)", display: "flex", flexDirection: "column", gap: "14px" } },
          h("h3", { style: { margin: 0, fontSize: "16px", fontWeight: 600 } }, "Create New Terminal Session"),
          h("label", { style: { fontSize: "12px", fontWeight: 500 } }, "Session Name:"),
          h("input", { value: name, onChange: function (e) { setName(e.target.value); }, placeholder: "e.g. runner-1, worker-bg", style: { padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l1)", color: "inherit" } }),
          h("div", { style: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" } },
            h("button", { onClick: onClose, style: { padding: "7px 14px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", color: "inherit", cursor: "pointer" } }, "Cancel"),
            h("button", { onClick: handleCreate, disabled: creating, style: { padding: "7px 14px", borderRadius: "6px", border: "none", background: "var(--dsw-alias-primary, #6366f1)", color: "#fff", fontWeight: 600, cursor: "pointer" } }, creating ? "Creating…" : "Create Session")
          )
        )
      );
    }

    function EditValueModal(props) {
      var target = props.target, onClose = props.onClose, onSaved = props.onSaved;
      var valueState = React.useState("");
      var value = valueState[0], setValue = valueState[1];
      var savingState = React.useState(false);
      var saving = savingState[0], setSaving = savingState[1];

      var handleSave = function () {
        setSaving(true);
        fetch(VAULT_API + "/accounts/" + encodeURIComponent(target.ref) + "?account=" + encodeURIComponent(target.account), {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ value: value }),
        })
          .then(function () { onSaved(); onClose(); })
          .finally(function () { setSaving(false); });
      };

      return h(
        "div",
        { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 } },
        h(
          "div",
          { style: { width: "440px", padding: "24px", borderRadius: "12px", background: "var(--dsw-alias-surface-l0, #1e1e2e)", border: "1px solid var(--dsw-alias-border-l2)", display: "flex", flexDirection: "column", gap: "16px" } },
          h("h3", { style: { margin: 0, fontSize: "16px", fontWeight: 600 } }, "Edit Credential Value"),
          h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "Updating " + target.ref + " for @" + target.account),
          h("input", { type: "password", placeholder: "Enter new secret / API key…", value: value, onChange: function (e) { setValue(e.target.value); }, style: { padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l1)", color: "inherit", width: "100%", boxSizing: "border-box" } }),
          h("div", { style: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" } },
            h("button", { onClick: onClose, style: { padding: "7px 14px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", color: "inherit", cursor: "pointer" } }, "Cancel"),
            h("button", { onClick: handleSave, disabled: saving, style: { padding: "7px 14px", borderRadius: "6px", border: "none", background: "var(--dsw-alias-primary, #6366f1)", color: "#fff", fontWeight: 600, cursor: "pointer" } }, saving ? "Saving…" : "Save Secret")
          )
        )
      );
    }

    function AddKeyModal(props) {
      var target = props.target, onClose = props.onClose, onSaved = props.onSaved;
      var prov = target.prov;
      var refState = React.useState(prov.defaultKeys[0] || (prov.prefixes[0] + "API_KEY"));
      var ref = refState[0], setRef = refState[1];
      var accountState = React.useState("default");
      var account = accountState[0], setAccount = accountState[1];
      var valueState = React.useState("");
      var value = valueState[0], setValue = valueState[1];
      var savingState = React.useState(false);
      var saving = savingState[0], setSaving = savingState[1];

      var handleSave = function () {
        setSaving(true);
        fetch(VAULT_API + "/accounts/" + encodeURIComponent(ref) + "?account=" + encodeURIComponent(account), {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ value: value }),
        })
          .then(function () { onSaved(); onClose(); })
          .finally(function () { setSaving(false); });
      };

      return h(
        "div",
        { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 } },
        h(
          "div",
          { style: { width: "460px", padding: "24px", borderRadius: "12px", background: "var(--dsw-alias-surface-l0, #1e1e2e)", border: "1px solid var(--dsw-alias-border-l2)", display: "flex", flexDirection: "column", gap: "14px" } },
          h("h3", { style: { margin: 0, fontSize: "16px", fontWeight: 600 } }, "Add Key for " + prov.name),
          h("label", { style: { fontSize: "12px", fontWeight: 500 } }, "Credential Reference:"),
          h("input", { value: ref, onChange: function (e) { setRef(e.target.value); }, style: { padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l1)", color: "inherit" } }),
          h("label", { style: { fontSize: "12px", fontWeight: 500 } }, "Account Profile:"),
          h("input", { value: account, onChange: function (e) { setAccount(e.target.value); }, style: { padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l1)", color: "inherit" } }),
          h("label", { style: { fontSize: "12px", fontWeight: 500 } }, "Secret / Key Value:"),
          h("input", { type: "password", value: value, onChange: function (e) { setValue(e.target.value); }, placeholder: "Paste key here…", style: { padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l1)", color: "inherit" } }),
          h("div", { style: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" } },
            h("button", { onClick: onClose, style: { padding: "7px 14px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", color: "inherit", cursor: "pointer" } }, "Cancel"),
            h("button", { onClick: handleSave, disabled: saving || !ref || !value, style: { padding: "7px 14px", borderRadius: "6px", border: "none", background: "var(--dsw-alias-primary, #6366f1)", color: "#fff", fontWeight: 600, cursor: "pointer" } }, saving ? "Adding…" : "Add Key")
          )
        )
      );
    }

    function AddModelModal(props) {
      var target = props.target, onClose = props.onClose, onSaved = props.onSaved;
      var prov = target.prov;
      var idState = React.useState("");
      var id = idState[0], setId = idState[1];
      var nameState = React.useState("");
      var name = nameState[0], setName = nameState[1];
      var contextState = React.useState("128k");
      var context = contextState[0], setContext = contextState[1];

      var handleSave = function () {
        prov.models.push({ id: id, name: name || id, context: context, tags: ["Custom"] });
        onSaved(); onClose();
      };

      return h(
        "div",
        { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 } },
        h(
          "div",
          { style: { width: "440px", padding: "24px", borderRadius: "12px", background: "var(--dsw-alias-surface-l0, #1e1e2e)", border: "1px solid var(--dsw-alias-border-l2)", display: "flex", flexDirection: "column", gap: "14px" } },
          h("h3", { style: { margin: 0, fontSize: "16px", fontWeight: 600 } }, "Add Custom Model to " + prov.name),
          h("label", { style: { fontSize: "12px", fontWeight: 500 } }, "Model ID:"),
          h("input", { value: id, onChange: function (e) { setId(e.target.value); }, placeholder: "e.g. claude-3-7-sonnet-20250219", style: { padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l1)", color: "inherit" } }),
          h("label", { style: { fontSize: "12px", fontWeight: 500 } }, "Display Name:"),
          h("input", { value: name, onChange: function (e) { setName(e.target.value); }, placeholder: "e.g. Claude 3.7 Sonnet (Latest)", style: { padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l1)", color: "inherit" } }),
          h("label", { style: { fontSize: "12px", fontWeight: 500 } }, "Context Window:"),
          h("input", { value: context, onChange: function (e) { setContext(e.target.value); }, placeholder: "e.g. 200k, 1M", style: { padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "var(--dsw-alias-surface-l1)", color: "inherit" } }),
          h("div", { style: { display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" } },
            h("button", { onClick: onClose, style: { padding: "7px 14px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", color: "inherit", cursor: "pointer" } }, "Cancel"),
            h("button", { onClick: handleSave, disabled: !id, style: { padding: "7px 14px", borderRadius: "6px", border: "none", background: "var(--dsw-alias-primary, #6366f1)", color: "#fff", fontWeight: 600, cursor: "pointer" } }, "Add Model")
          )
        )
      );
    }

    function OAuthFlowModal(props) {
      var target = props.target, onClose = props.onClose;
      var flowState = React.useState(null);
      var flow = flowState[0], setFlow = flowState[1];

      React.useEffect(function () {
        fetch(VAULT_API + "/login/device/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ provider: target.providerId }),
        })
          .then(function (r) { return r.json(); })
          .then(function (res) { setFlow(res); });
      }, [target.providerId]);

      return h(
        "div",
        { style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 } },
        h(
          "div",
          { style: { width: "460px", padding: "24px", borderRadius: "12px", background: "var(--dsw-alias-surface-l0, #1e1e2e)", border: "1px solid var(--dsw-alias-border-l2)", display: "flex", flexDirection: "column", gap: "16px", textAlign: "center" } },
          h("h3", { style: { margin: 0, fontSize: "16px", fontWeight: 600 } }, "Sign In to " + target.label),
          flow
            ? h(
                "div",
                { style: { display: "flex", flexDirection: "column", gap: "12px" } },
                h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)" } }, "1. Copy device code:"),
                h("code", { style: { fontSize: "22px", fontWeight: 700, letterSpacing: "3px", color: "var(--dsw-alias-primary, #6366f1)" } }, flow.userCode),
                h("div", { style: { fontSize: "12px", color: "var(--dsw-alias-label-secondary)", marginTop: "4px" } }, "2. Authorize in browser:"),
                h("a", { href: flow.verificationUri, target: "_blank", rel: "noopener noreferrer", style: { display: "inline-block", padding: "8px 16px", borderRadius: "6px", background: "var(--dsw-alias-primary, #6366f1)", color: "#fff", textDecoration: "none", fontSize: "13px", fontWeight: 600 } }, "Authorize in Browser ↗")
              )
            : h("div", { style: { fontSize: "13px", color: "var(--dsw-alias-label-tertiary)" } }, "Starting OAuth session…"),
          h("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: "8px" } }, h("button", { onClick: onClose, style: { padding: "7px 14px", borderRadius: "6px", border: "1px solid var(--dsw-alias-border-l2)", background: "transparent", color: "inherit", cursor: "pointer" } }, "Done"))
        )
      );
    }

    // 9. UNIFIED FILESYSTEM & WORKSPACES BROWSER
    function FileViewerModal(props) {
      var file = props.file, onClose = props.onClose;
      var loadingState = React.useState(!file.content && !file.error);
      var loading = loadingState[0], setLoading = loadingState[1];
      var contentState = React.useState(file.content || "");
      var content = contentState[0], setContent = contentState[1];
      var errorState = React.useState(file.error || null);
      var error = errorState[0], setError = errorState[1];

      React.useEffect(function () {
        if (!file.content && !file.error) {
          setLoading(true);
          fetch(QUOTAS_API + "/fs/read?path=" + encodeURIComponent(file.path))
            .then(function (r) { return r.json(); })
            .then(function (res) {
              if (res.error) setError(res.error);
              else setContent(res.content || "");
            })
            .catch(function (err) { setError(err.message); })
            .finally(function () { setLoading(false); });
        }
      }, [file]);

      return h(
        "div",
        {
          style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999999, backdropFilter: "blur(2px)" },
          onClick: onClose,
        },
        h(
          "div",
          {
            style: { width: "min(800px, 90vw)", maxHeight: "85vh", display: "flex", flexDirection: "column", borderRadius: "12px", background: "var(--dsw-alias-bg-layer-2, #161b22)", border: "1px solid var(--dsw-alias-border-l2)", boxShadow: "0 12px 36px rgba(0,0,0,0.4)" },
            onClick: function (e) { e.stopPropagation(); },
          },
          // Modal Header
          h(
            "div",
            { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--dsw-alias-border-l1)" } },
            h("div", { style: { display: "flex", alignItems: "center", gap: "8px", minWidth: 0 } },
              h(FileGlyph, { size: 16 }),
              h("span", { style: { fontWeight: 600, fontSize: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, file.name),
              h("span", { style: { fontSize: "11px", color: "var(--dsw-alias-label-tertiary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, file.path)
            ),
            h("div", { style: { display: "flex", alignItems: "center", gap: "8px" } },
              h("button", {
                onClick: function () { navigator.clipboard && navigator.clipboard.writeText(content); alert("Copied to clipboard!"); },
                style: { padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--dsw-alias-border-l1)", background: "transparent", color: "inherit", fontSize: "11px", cursor: "pointer" }
              }, "Copy"),
              h("button", {
                onClick: onClose,
                style: { padding: "4px 8px", borderRadius: "4px", border: "none", background: "transparent", color: "inherit", fontSize: "14px", cursor: "pointer" }
              }, "✕")
            )
          ),
          // Modal Body
          h(
            "pre",
            {
              style: {
                flex: 1,
                margin: 0,
                padding: "16px",
                overflowY: "auto",
                maxHeight: "calc(85vh - 70px)",
                fontFamily: "var(--ds-font-mono, monospace)",
                fontSize: "12px",
                lineHeight: "1.5",
                color: "var(--dsw-alias-label-primary, #e6edf3)",
                background: "var(--dsw-alias-bg-layer-1, #0d1117)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }
            },
            loading ? "Loading file content…" : error ? ("Error: " + error) : content
          )
        )
      );
    }

    function formatTimeAgo(timestamp) {
      if (!timestamp) return "";
      var seconds = Math.floor((Date.now() - timestamp) / 1000);
      if (seconds < 60) return "now";
      var minutes = Math.floor(seconds / 60);
      if (minutes < 60) return minutes + "m";
      var hours = Math.floor(minutes / 60);
      if (hours < 24) return hours + "h";
      var days = Math.floor(hours / 24);
      return days + "d";
    }

    function UnifiedWorkspacesBrowser(props) {
      ensureTreeStyles();
      ensureModelPickerDecoration();
      var wide = Boolean(props && props.wide);
      var expandSidebar = props && props.expandSidebar;

      var useSessions = props && props.useSessions;
      var useWorkspaces = props && props.useWorkspaces;
      var openSession = props && props.open;
      var startSession = props && props.startSession;
      var renameSession = props && props.renameSession;
      var archiveSession = props && props.archiveSession;
      var forkSession = props && props.forkSession;
      var createWorkspace = props && props.createWorkspace;

      var sessionList = (typeof useSessions === "function") ? (function () { try { return useSessions(function (s) { return s; }) || { ids: [], byId: {} }; } catch (e) { return { ids: [], byId: {} }; } })() : { ids: [], byId: {} };
      var workspaceList = (typeof useWorkspaces === "function") ? (function () { try { return useWorkspaces(function (s) { return s; }) || { items: [] }; } catch (e) { return { items: [] }; } })() : { items: [] };

      var currentRootState = React.useState("/");
      var currentRoot = currentRootState[0], setCurrentRoot = currentRootState[1];

      var isPinnedOpenState = React.useState(true);
      var isPinnedOpen = isPinnedOpenState[0], setIsPinnedOpen = isPinnedOpenState[1];

      var isActiveOpenState = React.useState(true);
      var isActiveOpen = isActiveOpenState[0], setIsActiveOpen = isActiveOpenState[1];

      var isHostOpenState = React.useState(true);
      var isHostOpen = isHostOpenState[0], setIsHostOpen = isHostOpenState[1];

      var isDriveOpenState = React.useState(true);
      var isDriveOpen = isDriveOpenState[0], setIsDriveOpen = isDriveOpenState[1];

      var expandedPathsState = React.useState({ "/": true, "/Users": true, "/Users/user": true, "/Users/user/Projects": true });
      var expandedPaths = expandedPathsState[0], setExpandedPaths = expandedPathsState[1];

      var isUngroupedOpenState = React.useState(true);
      var isUngroupedOpen = isUngroupedOpenState[0], setIsUngroupedOpen = isUngroupedOpenState[1];

      var searchQueryState = React.useState("");
      var searchQuery = searchQueryState[0], setSearchQuery = searchQueryState[1];
      var showSearchState = React.useState(function () {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage.getItem("dsh_show_sidebar_search") !== "false";
        }
        return true;
      });
      var showSearch = showSearchState[0], setShowSearch = showSearchState[1];

      React.useEffect(function () {
        var onToggle = function (e) {
          if (e && e.detail && e.detail.enabled !== undefined) {
            setShowSearch(e.detail.enabled);
          }
        };
        window.addEventListener("dsh:sidebar-search-toggle", onToggle);
        return function () { window.removeEventListener("dsh:sidebar-search-toggle", onToggle); };
      }, []);

      var dirCacheState = React.useState({});
      var dirCache = dirCacheState[0], setDirCache = dirCacheState[1];

      var loadingPathsState = React.useState({});
      var loadingPaths = loadingPathsState[0], setLoadingPaths = loadingPathsState[1];

      var sessionsState = React.useState([]);
      var sessions = sessionsState[0], setSessions = sessionsState[1];

      var containersState = React.useState([]);
      var containers = containersState[0], setContainers = containersState[1];

      var plusMenuState = React.useState(null);
      var plusMenu = plusMenuState[0], setPlusMenu = plusMenuState[1];

      var ellipsisOpenState = React.useState(null);
      var ellipsisOpen = ellipsisOpenState[0], setEllipsisOpen = ellipsisOpenState[1];

      var expandedSubagentsState = React.useState({});
      var expandedSubagents = expandedSubagentsState[0], setExpandedSubagents = expandedSubagentsState[1];

      var fileViewerState = React.useState(null);
      var fileViewer = fileViewerState[0], setFileViewer = fileViewerState[1];

      var showSearchButtonState = React.useState(function () {
        if (typeof window === 'undefined' || !window.localStorage) return true;
        return window.localStorage.getItem('dsh_show_sidebar_search') !== 'false';
      });
      var showSearchButton = showSearchButtonState[0], setShowSearchButton = showSearchButtonState[1];

      React.useEffect(function () {
        var onSearchToggle = function (e) {
          var enabled = (e && e.detail && e.detail.enabled !== undefined) ? e.detail.enabled : (localStorage.getItem('dsh_show_sidebar_search') !== 'false');
          setShowSearchButton(enabled);
        };
        window.addEventListener('dsh:sidebar-search-toggle', onSearchToggle);
        return function () { window.removeEventListener('dsh:sidebar-search-toggle', onSearchToggle); };
      }, []);

      var renameModalState = React.useState(null);
      var renameModal = renameModalState[0], setRenameModal = renameModalState[1];

      var searchExpandedState = React.useState(false);
      var searchExpanded = searchExpandedState[0], setSearchExpanded = searchExpandedState[1];
      var searchInputRef = React.useRef(null);

      var viewOptionsOpenState = React.useState(false);
      var viewOptionsOpen = viewOptionsOpenState[0], setViewOptionsOpen = viewOptionsOpenState[1];
      var viewOptionsBtnRef = React.useRef(null);

      var addWsMenuOpenState = React.useState(false);
      var addWsMenuOpen = addWsMenuOpenState[0], setAddWsMenuOpen = addWsMenuOpenState[1];
      var addWsBtnRef = React.useRef(null);

      var ungroupedMenuState = React.useState(false);
      var isUngroupedMenuOpen = ungroupedMenuState[0], setUngroupedMenuOpen = ungroupedMenuState[1];

      var toggleSubagentExpand = function (sessionId) {
        setExpandedSubagents(function (prev) {
          var n = Object.assign({}, prev);
          if (n[sessionId]) delete n[sessionId];
          else n[sessionId] = true;
          return n;
        });
      };

      var fetchDir = React.useCallback(function (dirPath) {
        if (!dirPath) return;
        setLoadingPaths(function (prev) { var n = Object.assign({}, prev); n[dirPath] = true; return n; });
        fetch(QUOTAS_API + "/fs?path=" + encodeURIComponent(dirPath))
          .then(function (r) { return r.json(); })
          .then(function (res) {
            setDirCache(function (prev) {
              var n = Object.assign({}, prev);
              n[dirPath] = res.entries || [];
              return n;
            });
          })
          .catch(function () {})
          .finally(function () {
            setLoadingPaths(function (prev) { var n = Object.assign({}, prev); delete n[dirPath]; return n; });
          });
      }, []);

      var loadAll = React.useCallback(function () {
        fetch(QUOTAS_API + "/tmux/sessions")
          .then(function (r) { return r.json(); })
          .then(function (res) { setSessions(res.sessions || []); })
          .catch(function () {});

        fetch(QUOTAS_API + "/docker/containers")
          .then(function (r) { return r.json(); })
          .then(function (res) { setContainers(res.containers || []); })
          .catch(function () {});
      }, []);

      // Initial root loading and auto-expanded paths
      React.useEffect(function () {
        fetchDir("/");
        fetchDir("/Users");
        fetchDir("/Users/user");
        fetchDir("/Users/user/Projects");
        loadAll();
        var timer = setInterval(loadAll, 5000);
        return function () { clearInterval(timer); };
      }, [fetchDir, loadAll]);

      // Calculate sessions per directory path and ungrouped sessions
      var workspaces = (workspaceList && workspaceList.items) ? workspaceList.items : [];
      var sessionsById = (sessionList && sessionList.byId) ? sessionList.byId : {};
      var sessionIds = (sessionList && sessionList.ids && sessionList.ids.length > 0)
        ? sessionList.ids
        : (sessionList && sessionList.order && sessionList.order.length > 0)
          ? sessionList.order
          : Object.keys(sessionsById);
      var currentSessionId = sessionList ? sessionList.current : undefined;

      var getParentId = function (s) {
        if (!s) return null;
        return s.parentId || s.parentSessionId || s.parentSession || s.parent || null;
      };

      var isSubagentChild = function (s) {
        var pId = getParentId(s);
        return Boolean(pId && (sessionsById[pId] || sessionIds.indexOf(pId) !== -1));
      };

      var getSubagents = function (parentId) {
        if (!parentId) return [];
        return sessionIds
          .map(function (id) { return sessionsById[id]; })
          .filter(function (s) { return s && getParentId(s) === parentId; })
          .sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
      };

      var archivedSet = new Set();
      if (workspaceList && workspaceList.archivedSessionIds) {
        workspaceList.archivedSessionIds.forEach(function (id) { archivedSet.add(id); });
      }
      if (workspaceList && workspaceList.global && workspaceList.global.archivedSessionIds) {
        workspaceList.global.archivedSessionIds.forEach(function (id) { archivedSet.add(id); });
      }
      try {
        var localArchived = JSON.parse(localStorage.getItem('dsh_archived_sessions') || '[]');
        localArchived.forEach(function (id) { archivedSet.add(id); });
      } catch (e) {}

      var isArchivedSession = function (s, sId) {
        if (!s && !sId) return false;
        var id = sId || (s && s.id);
        if (id && archivedSet.has(id)) return true;
        if (s && (s.isArchived || s.archived || s.status === 'archived')) return true;
        return false;
      };

      var pinnedSet = new Set();
      try {
        var localPinned = JSON.parse(localStorage.getItem('dsh_pinned_sessions') || '[]');
        localPinned.forEach(function (id) { pinnedSet.add(id); });
      } catch (e) {}

      var isPinnedSession = function (s, sId) {
        if (!s && !sId) return false;
        var id = sId || (s && s.id);
        if (id && pinnedSet.has(id)) return true;
        if (s && (s.isPinned || s.pinned || s.favorite)) return true;
        return false;
      };

      var togglePinSession = function (sessionId) {
        if (pinnedSet.has(sessionId)) {
          pinnedSet.delete(sessionId);
        } else {
          pinnedSet.add(sessionId);
        }
        try {
          localStorage.setItem('dsh_pinned_sessions', JSON.stringify(Array.from(pinnedSet)));
        } catch (e) {}
        loadAll();
      };

      var pinnedSessions = sessionIds
        .map(function (sId) { return sessionsById[sId]; })
        .filter(function (s) { return s && !isSubagentChild(s) && !isArchivedSession(s, s.id) && isPinnedSession(s, s.id); })
        .sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });

      var liveSessions = sessions.filter(function (s) { return Boolean(s.attached); });
      var liveContainers = containers.filter(function (c) { return Boolean(c.isRunning); });
      var activeChatSessions = sessionIds
        .map(function (sId) { return sessionsById[sId]; })
        .filter(function (s) {
          if (!s || isSubagentChild(s) || isArchivedSession(s, s.id)) return false;
          return s.busy === true || s.running === true || s.status === 'busy' || s.status === 'running' || s.phase === 'running';
        })
        .sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
      var totalActiveCount = activeChatSessions.length + liveSessions.length + liveContainers.length;

      var folderSessions = {};
      var accountedSessionIds = {};

      workspaces.forEach(function (w) {
        var wPath = w.cwd || w.path;
        if (!wPath) return;
        if (wPath.length > 1 && wPath.endsWith("/")) wPath = wPath.slice(0, -1);
        if (!folderSessions[wPath]) folderSessions[wPath] = [];
        (w.sessionIds || []).forEach(function (sId) {
          var s = sessionsById[sId];
          if (s) {
            accountedSessionIds[sId] = true;
            if (!isSubagentChild(s) && !isArchivedSession(s, sId)) {
              folderSessions[wPath].push(s);
            }
          }
        });
      });

      sessionIds.forEach(function (sId) {
        var s = sessionsById[sId];
        if (!s) return;
        if (!accountedSessionIds[sId] && s.workspaceId) {
          var matchedWs = workspaces.find(function (w) { return w.workspaceId === s.workspaceId; });
          if (matchedWs) {
            var wPath = matchedWs.cwd || matchedWs.path;
            if (wPath) {
              if (wPath.length > 1 && wPath.endsWith("/")) wPath = wPath.slice(0, -1);
              if (!folderSessions[wPath]) folderSessions[wPath] = [];
              accountedSessionIds[sId] = true;
              if (!isSubagentChild(s) && !isArchivedSession(s, sId)) {
                folderSessions[wPath].push(s);
              }
            }
          }
        }
      });

      var ungroupedSessions = sessionIds
        .filter(function (sId) {
          var s = sessionsById[sId];
          return !accountedSessionIds[sId] && s && !isSubagentChild(s) && !isArchivedSession(s, sId) && !isPinnedSession(s, sId);
        })
        .map(function (sId) { return sessionsById[sId]; });

      var archivedSessions = sessionIds
        .map(function (sId) { return sessionsById[sId]; })
        .filter(function (s) { return s && !isSubagentChild(s) && isArchivedSession(s, s.id); })
        .sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });

      var isArchivedOpenState = React.useState(false);
      var isArchivedOpen = isArchivedOpenState[0], setIsArchivedOpen = isArchivedOpenState[1];

      var handleArchiveChat = function (sessionId) {
        if (archiveSession) archiveSession(sessionId);
        archivedSet.add(sessionId);
        try {
          localStorage.setItem('dsh_archived_sessions', JSON.stringify(Array.from(archivedSet)));
        } catch (e) {}
        loadAll();
      };

      var unarchiveSession = function (sessionId) {
        archivedSet.delete(sessionId);
        try {
          localStorage.setItem('dsh_archived_sessions', JSON.stringify(Array.from(archivedSet)));
        } catch (e) {}
        fetch(QUOTAS_API + "/sessions/unarchive", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: sessionId }),
        }).catch(function () {});
        loadAll();
      };

      var handleOpenChat = function (sessionId, sessionTitle) {
        if (!sessionId) return;
        if (typeof window !== "undefined") {
          window.__dsh_current_session_id__ = sessionId;
          if (sessionTitle) window.__dsh_current_session_title__ = sessionTitle;
        }
        if (openSession) {
          try { openSession(sessionId); } catch (e) {}
        }
        if (typeof window !== "undefined" && window.__dsh_ctx__ && window.__dsh_ctx__.sessions) {
          try { window.__dsh_ctx__.sessions.open(sessionId); } catch (e) {}
        }
        window.dispatchEvent(new CustomEvent("dsh:focus-chat", { detail: { id: sessionId, title: sessionTitle || "Conversation" } }));
      };

      var deletePermanentSession = function (sessionId) {
        archivedSet.delete(sessionId);
        try {
          localStorage.setItem('dsh_archived_sessions', JSON.stringify(Array.from(archivedSet)));
        } catch (e) {}
        fetch(QUOTAS_API + "/sessions/delete", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: sessionId }),
        }).catch(function () {});
        loadAll();
      };

      var handleArchivePongSessions = function () {
        sessionIds.forEach(function (id) {
          var s = sessionsById[id];
          var title = (s && (s.displayTitle || s.title || s.name || '')) || '';
          if (title.trim().toLowerCase() === 'pong' || title.trim().toLowerCase() === 'ping') {
            archivedSet.add(id);
            if (archiveSession) archiveSession(id);
          }
        });
        try {
          localStorage.setItem('dsh_archived_sessions', JSON.stringify(Array.from(archivedSet)));
        } catch (e) {}
        fetch(QUOTAS_API + "/sessions/archive-pong", { method: "POST" })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            alert("Archived " + (res.archivedCount || 0) + " empty / pong sessions.");
            loadAll();
          })
          .catch(function () { loadAll(); });
      };

      var toggleExpand = function (dirPath) {
        setExpandedPaths(function (prev) {
          var n = Object.assign({}, prev);
          if (n[dirPath]) {
            delete n[dirPath];
          } else {
            n[dirPath] = true;
            if (!dirCache[dirPath]) {
              fetchDir(dirPath);
            }
          }
          return n;
        });
      };

      var handleNewTerminalInDir = function (dirPath) {
        var baseName = dirPath.split("/").pop() || "term";
        var name = prompt("Terminal session name:", baseName + "-" + Math.floor(Math.random() * 1000));
        if (!name) return;
        fetch(QUOTAS_API + "/tmux/sessions/new", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: name, cwd: dirPath }),
        }).then(function () {
          loadAll();
          window.dispatchEvent(new CustomEvent("dsh:open-terminal", { detail: { session: name } }));
        });
      };

      var handleStartSessionInDir = function (dirPath) {
        var existing = workspaces.find(function (w) { return w.path === dirPath; });
        if (existing) {
          if (startSession) startSession(existing.workspaceId);
        } else if (createWorkspace) {
          createWorkspace({ path: dirPath }).then(function (newW) {
            if (startSession) startSession(newW ? newW.workspaceId : undefined);
          }).catch(function () {
            if (startSession) startSession();
          });
        } else if (startSession) {
          startSession();
        }
      };

      if (!wide) {
        var isRailPlusOpen = plusMenu === "rail";
        var liveSessions = sessions.filter(function (s) { return Boolean(s.attached); });
        var liveContainers = containers.filter(function (c) { return Boolean(c.isRunning); });
        var totalLive = liveSessions.length + liveContainers.length;

        var handleExpand = function (e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          if (typeof expandSidebar === "function") {
            expandSidebar();
          } else if (props && typeof props.expandSidebar === "function") {
            props.expandSidebar();
          } else {
            var toggleBtn = document.querySelector('button[class*="toggle"], button[aria-label*="sidebar"], button[aria-label*="Sidebar"]');
            if (toggleBtn) toggleBtn.click();
          }
        };

        return h(
          "div",
          {
            className: "dsh-collapsed-rail",
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              width: "100%",
              height: "100%",
              paddingTop: "6px",
              position: "relative"
            }
          },
          // 1. Dedicated Expand Rail Toggle
          h("button", {
            type: "button",
            className: "dsh-tree-actionBtn dsh-rail-btn",
            title: "Expand Sidebar",
            "aria-label": "Expand Sidebar",
            style: {
              width: "32px",
              height: "32px",
              borderRadius: "7px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--dsw-alias-surface-l1, rgba(255,255,255,0.06))",
              color: "var(--dsw-alias-label-primary)",
              cursor: "pointer"
            },
            onClick: handleExpand
          }, h(DockToggleGlyph, { size: 18 })),

          // 2. Search Button
          showSearchButton ? h("button", {
            type: "button",
            className: "dsh-tree-actionBtn dsh-rail-btn",
            title: "Search Workspaces & Chats",
            "aria-label": "Search",
            style: {
              width: "32px",
              height: "32px",
              borderRadius: "7px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--dsw-alias-label-secondary)",
              cursor: "pointer"
            },
            onClick: function (e) {
              handleExpand(e);
              setTimeout(function () {
                setSearchExpanded(true);
                if (searchInputRef.current) searchInputRef.current.focus();
              }, 150);
            }
          }, h(SearchGlyph, { size: 18 })) : null,

          // 3. New Item Plus Button
          h("div", { style: { position: "relative" } },
            h("button", {
              type: "button",
              className: "dsh-tree-actionBtn dsh-rail-btn",
              title: "New Item",
              "aria-label": "New Item",
              style: {
                width: "32px",
                height: "32px",
                borderRadius: "7px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--dsw-alias-primary, #6366f1)",
                cursor: "pointer"
              },
              onClick: function (e) {
                e.stopPropagation();
                setPlusMenu(isRailPlusOpen ? null : "rail");
              }
            }, h(PlusGlyph, { size: 18 })),
            h(SelectDropdownMenu, {
              open: isRailPlusOpen,
              onClose: function () { setPlusMenu(null); },
              items: [
                { id: "chat", label: "Conversation", icon: h(ChatGlyph, { size: 13 }) },
                { id: "terminal", label: "Terminal", icon: h(TerminalsGlyph, { size: 13 }) },
                { id: "container", label: "Container", icon: h(ContainersGlyph, { size: 13 }) },
              ],
              onSelect: function (actionId) {
                setPlusMenu(null);
                if (actionId === "chat") {
                  if (startSession) startSession();
                  else window.dispatchEvent(new CustomEvent("dsh:new-session"));
                } else if (actionId === "terminal") {
                  window.dispatchEvent(new CustomEvent("dsh:open-terminal", { detail: { session: "0" } }));
                } else if (actionId === "container") {
                  window.dispatchEvent(new CustomEvent("dsh:open-container", { detail: { id: null } }));
                }
              }
            })
          ),

          // 4. Terminals / Sandboxes Processes
          h("button", {
            type: "button",
            className: "dsh-tree-actionBtn dsh-rail-btn",
            title: totalLive > 0 ? ("Active processes (" + totalLive + ")") : "Terminals & Sandboxes",
            "aria-label": "Terminals & Sandboxes",
            style: {
              width: "32px",
              height: "32px",
              borderRadius: "7px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              color: "var(--dsw-alias-label-secondary)",
              cursor: "pointer"
            },
            onClick: function () {
              window.dispatchEvent(new CustomEvent("dsh:open-terminal", { detail: { session: sessions[0] ? sessions[0].name : "0" } }));
            }
          },
            h(TerminalsGlyph, { size: 18 }),
            totalLive > 0 ? h("span", {
              style: {
                position: "absolute",
                top: "4px",
                right: "4px",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#6366f1",
                boxShadow: "0 0 6px rgba(99, 102, 241, 0.6)"
              }
            }) : null
          )
        );
      }

      var liveSessions = sessions.filter(function (s) { return Boolean(s.attached); });
      var liveContainers = containers.filter(function (c) { return Boolean(c.isRunning); });
      var totalLive = liveSessions.length + liveContainers.length;

      var renderUnifiedPlusButton = function (targetDir, anchorKey) {
        var isMenuOpen = plusMenu === anchorKey;
        var path = targetDir || currentRoot || "/Users/user/Projects";

        return h("div", { style: { position: "relative", display: "inline-flex", alignItems: "center" } },
          h("button", {
            type: "button",
            className: "dsh-tree-actionBtn",
            title: "New Item (+)",
            "aria-label": "New Item",
            onClick: function (e) {
              e.stopPropagation();
              setPlusMenu(isMenuOpen ? null : anchorKey);
            }
          }, h(PlusGlyph, { size: 13 })),
          h(SelectDropdownMenu, {
            open: isMenuOpen,
            onClose: function () { setPlusMenu(null); },
            items: [
              { id: "chat", label: "Conversation", icon: h(ChatGlyph, { size: 13 }) },
              { id: "terminal", label: "Terminal Session", icon: h(TerminalsGlyph, { size: 13 }) },
              { id: "container", label: "Sandbox Container", icon: h(ContainersGlyph, { size: 13 }) },
              { id: "new-folder", label: "New Directory…", icon: h(FolderPlusGlyph, { size: 13 }) },
              { id: "open-workspace", label: "Open Folder as Workspace…", icon: h(BlueFolderGlyph, { size: 13 }) },
              { id: "archive-empty", label: "Archive Empty Chats", icon: h(TrashGlyph, { size: 13 }), danger: true }
            ],
            onSelect: function (actionId) {
              setPlusMenu(null);
              if (actionId === "chat") {
                handleStartSessionInDir(path);
              } else if (actionId === "terminal") {
                handleNewTerminalInDir(path);
              } else if (actionId === "container") {
                window.dispatchEvent(new CustomEvent("dsh:open-container", { detail: { cwd: path } }));
              } else if (actionId === "new-folder") {
                var dirName = prompt("New directory name in " + path + ":");
                if (dirName && dirName.trim()) {
                  fetch(QUOTAS_API + "/fs/mkdir", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ path: path + "/" + dirName.trim() })
                  }).then(function () { loadAll(); });
                }
              } else if (actionId === "open-workspace") {
                var defaultPath = path || "/Users/user/Projects";
                var p = prompt("Enter directory path for new Workspace:", defaultPath);
                if (p && p.trim()) {
                  var cleanP = p.trim();
                  if (createWorkspace) {
                    createWorkspace({ path: cleanP }).then(function (w) {
                      if (startSession) startSession(w ? w.workspaceId : undefined);
                      loadAll();
                    });
                  } else {
                    handleStartSessionInDir(cleanP);
                  }
                }
              } else if (actionId === "archive-empty") {
                handleArchivePongSessions();
              }
            }
          })
        );
      };

      var renderChatRow = function (chat, padLeft) {
        var isChatActive = chat.id === currentSessionId;
        var isMenuOpen = Boolean(ellipsisOpen && ellipsisOpen.id === ("chat::" + chat.id));
        var subagents = getSubagents(chat.id);
        var hasSubagents = subagents.length > 0;
        var isSubExp = Boolean(expandedSubagents[chat.id]);

        return h(
          "div",
          { key: "chat-wrapper::" + chat.id, style: { display: "flex", flexDirection: "column", width: "100%" } },
          h(
            "div",
            {
              key: "chat::" + chat.id,
              className: "dsh-tree-sessionRow" + (hasSubagents ? " dsh-has-children" : "") + (isChatActive ? " dsh-tree-sessionRowActive" : ""),
              role: "treeitem",
              "data-session-id": chat.id,
              "aria-expanded": hasSubagents ? isSubExp : undefined,
              style: {
                paddingLeft: padLeft + "px",
                height: "30px",
                color: isChatActive ? "var(--dsw-alias-primary, #6366f1)" : "inherit",
                fontWeight: isChatActive ? 600 : 400,
                cursor: "pointer",
                position: "relative",
              },
              onClick: function () { handleOpenChat(chat.id, chat.title); },
              onContextMenu: function (e) {
                e.preventDefault();
                e.stopPropagation();
                setEllipsisOpen({ id: "chat::" + chat.id, pos: { x: e.clientX, y: e.clientY } });
              },
            },
            (function () {
              var isPinned = isPinnedSession(chat, chat.id);
              if (isPinned) {
                return h("span", { className: "dsh-tree-slot dsh-tree-icon", style: { color: "var(--dsw-alias-primary, #6366f1)" } },
                  h(PinGlyph, { size: 13 })
                );
              }
              return h("span", { className: "dsh-tree-slot dsh-tree-icon" },
                h(ChatGlyph, { size: 14 })
              );
            })(),
            hasSubagents ? h("span", {
              className: "dsh-tree-slot dsh-tree-chevron",
              title: isSubExp ? "Collapse subagents" : "Expand subagents",
              onClick: function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleSubagentExpand(chat.id);
              }
            },
              h(TriangleRightFill14, {
                className: "dsh-tree-arrow" + (isSubExp ? " dsh-tree-arrowOpen" : ""),
                size: 11
              })
            ) : null,
            h("span", {
              className: "dsh-tree-title",
              title: chat.title || "Chat Session"
            }, chat.title || "Untitled Chat"),
            hasSubagents ? h("span", {
              style: { padding: "1px 5px", borderRadius: "8px", fontSize: "9.5px", background: "rgba(99, 102, 241, 0.15)", color: "var(--dsw-alias-primary, #6366f1)", fontWeight: 700, marginLeft: "4px", cursor: "pointer" },
              title: subagents.length + " subagents (click to toggle)",
              onClick: function (e) {
                e.preventDefault();
                e.stopPropagation();
                toggleSubagentExpand(chat.id);
              }
            }, subagents.length) : null,
            h("span", { style: { fontSize: "10.5px", color: "var(--dsw-alias-label-tertiary)", marginLeft: "auto", marginRight: "4px", flexShrink: 0 } }, formatTimeAgo(chat.updatedAt)),
            h("span", { className: "dsh-tree-actions" },
              h("button", {
                type: "button",
                className: "dsh-tree-actionBtn",
                title: "Chat Actions (…)",
                onClick: function (e) { e.stopPropagation(); setEllipsisOpen(isMenuOpen ? null : { id: "chat::" + chat.id }); }
              }, h(EllipsisGlyph, { size: 13 })),
              h(SelectDropdownMenu, {
                open: isMenuOpen,
                position: (ellipsisOpen && ellipsisOpen.pos) ? ellipsisOpen.pos : null,
                onClose: function () { setEllipsisOpen(null); },
                items: [
                  { id: isPinnedSession(chat, chat.id) ? "unpin" : "pin", label: isPinnedSession(chat, chat.id) ? "Unpin Chat" : "Pin Chat", icon: h(PinGlyph, { size: 13 }) },
                  { id: "rename", label: "Rename Chat", icon: h(EditGlyph, { size: 13 }) },
                  { id: "fork", label: "Fork Chat", icon: h(BranchGlyph, { size: 13 }) },
                  { id: "archive", label: "Archive Chat", icon: h(TrashGlyph, { size: 13 }), danger: true },
                ],
                onSelect: function (actionId) {
                  if (actionId === "pin" || actionId === "unpin") {
                    togglePinSession(chat.id);
                  } else if (actionId === "rename") {
                    var newTitle = prompt("Rename chat:", chat.title || "");
                    if (newTitle && renameSession) renameSession(chat.id, newTitle);
                  } else if (actionId === "fork") {
                    if (forkSession) forkSession(chat.id);
                  } else if (actionId === "archive") {
                    handleArchiveChat(chat.id);
                  }
                }
              })
            )
          ),
          (hasSubagents && isSubExp) ? h(
            "div",
            { style: { display: "flex", flexDirection: "column", width: "100%" } },
            subagents.map(function (sub) {
              var isSubActive = sub.id === currentSessionId;
              var isSubMenuOpen = Boolean(ellipsisOpen && ellipsisOpen.id === ("chat::" + sub.id));
              return h(
                "div",
                {
                  key: "sub::" + sub.id,
                  className: "dsh-tree-sessionRow dsh-tree-subagentRow" + (isSubActive ? " dsh-tree-sessionRowActive" : ""),
                  role: "treeitem",
                  "data-session-id": sub.id,
                  style: {
                    paddingLeft: (padLeft + 16) + "px",
                    height: "28px",
                    color: isSubActive ? "var(--dsw-alias-primary, #6366f1)" : "inherit",
                    cursor: "pointer",
                  },
                  onClick: function () { handleOpenChat(sub.id, sub.title); },
                  onContextMenu: function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    setEllipsisOpen({ id: "chat::" + sub.id, pos: { x: e.clientX, y: e.clientY } });
                  },
                },
                h("span", { className: "dsh-tree-slot dsh-tree-icon" },
                  h(SubagentGlyph, { size: 12 })
                ),
                h("span", {
                  className: "dsh-tree-title",
                  style: { fontSize: "11.5px" },
                  title: sub.title || "Subagent Session"
                }, sub.title || "Subagent"),
                h("span", { style: { fontSize: "10px", color: "var(--dsw-alias-label-tertiary)", marginLeft: "auto", marginRight: "4px", flexShrink: 0 } }, formatTimeAgo(sub.updatedAt)),
                h("span", { className: "dsh-tree-actions" },
                  h("button", {
                    type: "button",
                    className: "dsh-tree-actionBtn",
                    title: "Subagent Actions",
                    onClick: function (e) { e.stopPropagation(); setEllipsisOpen(isSubMenuOpen ? null : { id: "chat::" + sub.id }); }
                  }, h(EllipsisGlyph, { size: 12 })),
                  h(SelectDropdownMenu, {
                    open: isSubMenuOpen,
                    position: (ellipsisOpen && ellipsisOpen.pos) ? ellipsisOpen.pos : null,
                    onClose: function () { setEllipsisOpen(null); },
                    items: [
                      { id: "rename", label: "Rename Subagent", icon: h(EditGlyph, { size: 13 }) },
                      { id: "archive", label: "Archive Subagent", icon: h(TrashGlyph, { size: 13 }), danger: true },
                    ],
                    onSelect: function (actionId) {
                      if (actionId === "rename") {
                        var newTitle = prompt("Rename subagent:", sub.title || "");
                        if (newTitle && renameSession) renameSession(sub.id, newTitle);
                      } else if (actionId === "archive") {
                        handleArchiveChat(sub.id);
                      }
                    }
                  })
                )
              );
            })
          ) : null
        );
      };

      var renderArchivedChatRow = function (chat, padLeft) {
        var isChatActive = chat.id === currentSessionId;
        var isMenuOpen = Boolean(ellipsisOpen && ellipsisOpen.id === ("archived-chat::" + chat.id));
        return h(
          "div",
          {
            key: "archived-chat::" + chat.id,
            className: "dsh-tree-sessionRow" + (isChatActive ? " dsh-tree-sessionRowActive" : ""),
            role: "treeitem",
            "data-session-id": chat.id,
            style: {
              paddingLeft: padLeft + "px",
              height: "28px",
              opacity: 0.75,
              cursor: "pointer",
              position: "relative",
            },
            onClick: function () { handleOpenChat(chat.id, chat.title); },
            onContextMenu: function (e) {
              e.preventDefault();
              e.stopPropagation();
              setEllipsisOpen({ id: "archived-chat::" + chat.id, pos: { x: e.clientX, y: e.clientY } });
            },
          },
          h("span", { className: "dsh-tree-slot dsh-tree-icon", style: { color: "var(--dsw-alias-label-tertiary)" } },
            h(ChatGlyph, { size: 14 })
          ),
          h("span", {
            className: "dsh-tree-title",
            title: chat.title || "Archived Chat"
          }, chat.title || "Untitled Chat"),
          h("span", { style: { fontSize: "10px", color: "var(--dsw-alias-label-tertiary)", marginLeft: "auto", marginRight: "4px", flexShrink: 0 } }, formatTimeAgo(chat.updatedAt)),
          h("span", { className: "dsh-tree-actions" },
            h("button", {
              type: "button",
              className: "dsh-tree-actionBtn",
              title: "Restore / Unarchive",
              onClick: function (e) { e.stopPropagation(); unarchiveSession(chat.id); }
            }, h(RestoreGlyph, { size: 13 })),
            h("button", {
              type: "button",
              className: "dsh-tree-actionBtn",
              title: "Archived Actions (…)",
              onClick: function (e) { e.stopPropagation(); setEllipsisOpen(isMenuOpen ? null : { id: "archived-chat::" + chat.id }); }
            }, h(EllipsisGlyph, { size: 13 })),
            h(SelectDropdownMenu, {
              open: isMenuOpen,
              position: (ellipsisOpen && ellipsisOpen.pos) ? ellipsisOpen.pos : null,
              onClose: function () { setEllipsisOpen(null); },
              items: [
                { id: "restore", label: "Restore to Active", icon: h(RestoreGlyph, { size: 13 }) },
                { id: "rename", label: "Rename Chat", icon: h(EditGlyph, { size: 13 }) },
                { id: "delete", label: "Delete Permanently", icon: h(TrashGlyph, { size: 13 }), danger: true },
              ],
              onSelect: function (actionId) {
                if (actionId === "restore") {
                  unarchiveSession(chat.id);
                } else if (actionId === "rename") {
                  var newTitle = prompt("Rename chat:", chat.title || "");
                  if (newTitle && renameSession) renameSession(chat.id, newTitle);
                } else if (actionId === "delete") {
                  if (confirm("Permanently delete this archived session?")) {
                    deletePermanentSession(chat.id);
                  }
                }
              }
            })
          )
        );
      };

      var renderDirEntries = function (dirPath, depth) {
        var entries = dirCache[dirPath];
        var itemLeftPad = 8 + depth * 16;

        if (loadingPaths[dirPath]) {
          return h("div", { key: "loading-" + dirPath, style: { padding: "4px 8px 4px " + (itemLeftPad + 16) + "px", fontSize: "11px", color: "var(--dsw-alias-label-tertiary)" } }, "Loading…");
        }
        if (!entries || entries.length === 0) {
          return h("div", { key: "empty-" + dirPath, style: { padding: "4px 8px 4px " + (itemLeftPad + 16) + "px", fontSize: "11px", color: "var(--dsw-alias-label-tertiary)" } }, "(empty)");
        }

        var visibleEntries = entries.filter(function (entry) {
          if (!searchQuery || !searchQuery.trim()) return true;
          var q = searchQuery.trim().toLowerCase();
          return (entry.name || "").toLowerCase().indexOf(q) !== -1;
        });

        if (visibleEntries.length === 0 && searchQuery && searchQuery.trim()) {
          return null;
        }

        return visibleEntries.map(function (entry) {
          var isDir = Boolean(entry.isDirectory);
          var isExp = Boolean(expandedPaths[entry.path]);
          var isPlusOpen = plusMenu === entry.path;

          if (isDir) {
            var chatsInDir = folderSessions[entry.path] || [];
            var isFolderEllipsisOpen = Boolean(ellipsisOpen && ellipsisOpen.id === ("folder::" + entry.path));
            var isAppBundle = Boolean(entry.name && (entry.name.endsWith('.app') || entry.name.endsWith('.dmg') || entry.name.endsWith('.pkg')));
            var isApplications = (entry.name === 'Applications');
            var isLibrary = (entry.name === 'Library');
            var isSystem = (entry.name === 'System' || entry.name.toLowerCase() === 'system');
            var isUsers = (entry.name === 'Users' || entry.name.toLowerCase() === 'users');
            var isVendorOrInternal = Boolean(isApplications || isLibrary || isSystem || isUsers || entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'lib' || entry.name === '.turbo');
            var isWorkspace = !isVendorOrInternal && Boolean(workspaces && workspaces.some(function (w) {
              var wPath = w.path || w.cwd;
              if (!wPath) return false;
              if (wPath.length > 1 && wPath.endsWith("/")) wPath = wPath.slice(0, -1);
              var ePath = entry.path;
              if (ePath && ePath.length > 1 && ePath.endsWith("/")) ePath = ePath.slice(0, -1);
              return wPath === ePath && ePath !== "/Users/user";
            }));
            var isRepo = !isVendorOrInternal && Boolean(entry.isRepo || entry.name === 'dsh-stack' || isWorkspace);

            return h(
              "div",
              { key: entry.path, style: { display: "flex", flexDirection: "column", width: "100%" } },
              h(
                "div",
                {
                  className: "dsh-tree-projectRow",
                  role: "treeitem",
                  style: { position: "relative", paddingLeft: itemLeftPad + "px", height: "28px" },
                  "aria-expanded": isExp,
                  onClick: function () { toggleExpand(entry.path); },
                  onDoubleClick: isRepo ? function (e) {
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent("dsh:open-repo-tab", { detail: { id: "repo::" + entry.path, type: "repo", title: entry.name, path: entry.path } }));
                  } : undefined,
                  onContextMenu: function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    setEllipsisOpen({ id: "folder::" + entry.path, pos: { x: e.clientX, y: e.clientY } });
                  },
                },
                h("span", { className: "dsh-tree-slot dsh-tree-icon" },
                  isAppBundle
                    ? renderAppIcon(entry.name, 16, entry.path)
                    : (isApplications
                      ? h(AppGlyph, { size: 15 })
                      : (isLibrary
                        ? h(LibraryGlyph, { size: 15 })
                        : (isSystem
                          ? h(SystemGlyph, { size: 15 })
                          : (isUsers
                            ? h(UsersGlyph, { size: 15 })
                            : (isRepo
                              ? h(RepoGlyph, { size: 15 })
                              : (isWorkspace
                                ? h(WorkspaceGlyph, { size: 15 })
                                : (isExp ? h(FolderOpenGlyph, { size: 15 }) : h(FolderOpenGlyph, { size: 15 }))))))))
                ),
                h("span", { className: "dsh-tree-slot dsh-tree-chevron" },
                  h(TriangleRightFill14, { className: "dsh-tree-arrow" + (isExp ? " dsh-tree-arrowOpen" : ""), size: 11 })
                ),
                h("span", { className: "dsh-tree-title", title: entry.path }, entry.name),
                chatsInDir.length > 0 ? h("span", { style: { padding: "1px 5px", borderRadius: "8px", fontSize: "9.5px", background: "rgba(99, 102, 241, 0.15)", color: "var(--dsw-alias-primary, #6366f1)", fontWeight: 700, marginLeft: "4px" } }, chatsInDir.length) : null,
                h("span", { className: "dsh-tree-actions" },
                  renderUnifiedPlusButton(entry.path, "folder-plus::" + entry.path)
                )
              ),
              isExp ? h(
                "div",
                { style: { display: "flex", flexDirection: "column", width: "100%" } },
                // Render chat sessions under this folder (aligned at depth + 1)
                chatsInDir.map(function (c) { return renderChatRow(c, 8 + (depth + 1) * 16); }),
                // Render subdirectories and files (aligned at depth + 1)
                renderDirEntries(entry.path, depth + 1)
              ) : null
            );
          }

          // File Row (aligned at itemLeftPad)
          var isAppFile = entry.name.endsWith('.app') || entry.name.endsWith('.exe') || entry.name.endsWith('.dmg') || entry.name.endsWith('.pkg');
          return h(
            "div",
            {
              key: entry.path,
              className: "dsh-tree-sessionRow",
              role: "treeitem",
              style: { paddingLeft: itemLeftPad + "px", height: "28px" },
              onClick: function () {
                window.dispatchEvent(new CustomEvent("dsh:open-file-tab", {
                  detail: { id: "file::" + entry.path, type: "file", title: entry.name, path: entry.path }
                }));
              },
            },
            h("span", { className: "dsh-tree-slot", style: { width: "16px", color: isAppFile ? "var(--dsw-alias-primary)" : "var(--dsw-alias-label-tertiary)" } },
              isAppFile ? renderAppIcon(entry.name, 15, entry.path) : h(FileGlyph, { size: 13 })
            ),
            h("span", { className: "dsh-tree-sessionTitle", style: { fontSize: "12px", marginLeft: "4px" }, title: entry.path }, entry.name)
          );
        });
      };

      var filterBySearch = function (chat) {
        if (!searchQuery || !searchQuery.trim()) return true;
        var q = searchQuery.trim().toLowerCase();
        return ((chat.title || "") + " " + (chat.id || "")).toLowerCase().indexOf(q) !== -1;
      };

      var filteredPinnedSessions = pinnedSessions.filter(filterBySearch);
      var filteredActiveChatSessions = activeChatSessions.filter(filterBySearch);
      var filteredUngroupedSessions = ungroupedSessions.filter(filterBySearch);

      return h(
        "div",
        {
          className: "dsh-sidebar-tree-container",
          style: {
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "stretch",
            width: "100%",
            height: "100%",
            overflowY: "auto",
            gap: "2px",
            padding: "0 0 8px 0"
          }
        },

        // 0. NATIVE SIDEBAR HEADER: Title, Search, View Options, Add Workspace
        h(
          "div",
          {
            className: "dsh-sidebar-section-header",
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 8px 8px 10px",
              minHeight: "36px",
              flex: "0 0 auto",
              borderBottom: "1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))",
              userSelect: "none",
            }
          },
          // Left: Section Title or Search Input
          searchExpanded ? h(
            "div",
            { style: { display: "flex", alignItems: "center", flex: 1, gap: "6px", background: "var(--dsw-alias-surface-l1, rgba(255,255,255,0.06))", padding: "2px 8px", borderRadius: "6px", border: "1px solid var(--dsw-alias-primary, #6366f1)" } },
            h(SearchGlyph, { size: 13, style: { color: "var(--dsw-alias-label-secondary)" } }),
            h("input", {
              ref: searchInputRef,
              type: "text",
              placeholder: "Search chats, files…",
              value: searchQuery,
              onChange: function (e) { setSearchQuery(e.target.value); },
              onKeyDown: function (e) { if (e.key === "Escape") { setSearchQuery(""); setSearchExpanded(false); } },
              style: {
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--dsw-alias-label-primary)",
                fontSize: "12px",
                width: "100%",
              }
            }),
            h("button", {
              type: "button",
              onClick: function () { setSearchQuery(""); setSearchExpanded(false); },
              style: { background: "transparent", border: "none", color: "var(--dsw-alias-label-tertiary)", cursor: "pointer", fontSize: "12px", padding: 0 }
            }, "✕")
          ) : h(
            "span",
            { style: { fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--dsw-alias-label-secondary)" } },
            "Workspaces"
          ),
          // Right: Action Buttons (Search, View Options, Add Workspace)
          !searchExpanded ? h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "2px" } },
            // Search Trigger Button
            showSearchButton ? h("button", {
              type: "button",
              className: "dsh-tree-actionBtn",
              title: "Search workspaces & chats",
              "aria-label": "Search",
              style: { width: "26px", height: "26px", borderRadius: "5px", display: "inline-flex", alignItems: "center", justifyContent: "center" },
              onClick: function () {
                setSearchExpanded(true);
                setTimeout(function () { if (searchInputRef.current) searchInputRef.current.focus(); }, 50);
              }
            }, h(SearchGlyph, { size: 14 })) : null,
            // View Options Menu
            h("button", {
              ref: viewOptionsBtnRef,
              type: "button",
              className: "dsh-tree-actionBtn",
              title: "View Options",
              "aria-label": "View Options",
              style: { width: "26px", height: "26px", borderRadius: "5px", display: "inline-flex", alignItems: "center", justifyContent: "center" },
              onClick: function () { setViewOptionsOpen(!viewOptionsOpen); }
            }, h(SlidersGlyph, { size: 14 })),
            viewOptionsOpen ? h(SelectDropdownMenu, {
              open: viewOptionsOpen,
              anchorRef: viewOptionsBtnRef,
              onClose: function () { setViewOptionsOpen(false); },
              items: [
                { id: "archive-empty", label: "Archive Empty & Pong Sessions", icon: h(TrashGlyph, { size: 13 }), danger: true },
              ],
              onSelect: function (act) {
                setViewOptionsOpen(false);
                if (act === "archive-empty") {
                  handleArchivePongSessions();
                }
              }
            }) : null,
            // Add Workspace Button (unified plus dropdown)
            renderUnifiedPlusButton("/Users/user/Projects", "root-ws")
          ) : null
        ),

        // 1. PINNED SESSIONS SECTION (TOP) - ONLY RENDER IF PINNED ITEMS EXIST
        filteredPinnedSessions.length > 0 ? h(
          "div",
          { style: { display: "flex", flexDirection: "column", width: "100%", flex: "0 0 auto", margin: "2px 0 4px 0", paddingBottom: "4px", borderBottom: "1px solid var(--dsw-alias-border-l1)" } },
          h(
            "div",
            {
              className: "dsh-tree-projectRow",
              role: "treeitem",
              style: { position: "relative", paddingLeft: "8px", fontWeight: 600, height: "28px" },
              "aria-expanded": isPinnedOpen,
              onClick: function () { setIsPinnedOpen(!isPinnedOpen); },
            },
            h("span", { className: "dsh-tree-slot dsh-tree-icon" }, h(PinGlyph, { size: 14 })),
            h("span", { className: "dsh-tree-slot dsh-tree-chevron" },
              h(TriangleRightFill14, { className: "dsh-tree-arrow" + (isPinnedOpen ? " dsh-tree-arrowOpen" : ""), size: 11 })
            ),
            h("span", { className: "dsh-tree-title" }, "Pinned"),
            h("span", { style: { padding: "1px 5px", borderRadius: "8px", fontSize: "9.5px", background: "rgba(99, 102, 241, 0.15)", color: "var(--dsw-alias-primary, #6366f1)", fontWeight: 700, marginLeft: "4px" } }, filteredPinnedSessions.length),
            h("span", { className: "dsh-tree-actions" },
              renderUnifiedPlusButton(null, "pinned-plus")
            )
          ),
          isPinnedOpen ? h(
            "div",
            { style: { display: "flex", flexDirection: "column", width: "100%" } },
            filteredPinnedSessions.map(function (chat) { return renderChatRow(chat, 16); })
          ) : null
        ) : null,

        // 2. ACTIVE / LIVE SECTION
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", width: "100%", flex: "0 0 auto", margin: "2px 0 4px 0", paddingBottom: "4px", borderBottom: "1px solid var(--dsw-alias-border-l1)" } },
          h(
            "div",
            {
              className: "dsh-tree-projectRow",
              role: "treeitem",
              style: { position: "relative", paddingLeft: "8px", fontWeight: 600, height: "28px" },
              "aria-expanded": isActiveOpen,
              onClick: function () { setIsActiveOpen(!isActiveOpen); },
            },
            h("span", { className: "dsh-tree-slot dsh-tree-icon" }, h(ActiveGlyph, { size: 14 })),
            h("span", { className: "dsh-tree-slot dsh-tree-chevron" },
              h(TriangleRightFill14, { className: "dsh-tree-arrow" + (isActiveOpen ? " dsh-tree-arrowOpen" : ""), size: 11 })
            ),
            h("span", { className: "dsh-tree-title" }, "Active"),
            h("span", { style: { padding: "1px 6px", borderRadius: "8px", fontSize: "9.5px", background: "rgba(63, 185, 80, 0.18)", color: "#3fb950", fontWeight: 700, marginLeft: "4px" } }, totalActiveCount),
            h("span", { className: "dsh-tree-actions" },
              renderUnifiedPlusButton(null, "active-plus")
            )
          ),
          isActiveOpen ? h(
            "div",
            { style: { display: "flex", flexDirection: "column", width: "100%" } },
            (filteredActiveChatSessions.length > 0 || liveSessions.length > 0 || liveContainers.length > 0)
              ? h(
                  React.Fragment,
                  null,
                  filteredActiveChatSessions.map(function (chat) { return renderChatRow(chat, 16); }),
                  liveSessions.map(function (sess) {
                    return h(
                      "div",
                      {
                        key: "live-term::" + sess.name,
                        className: "dsh-tree-sessionRow",
                        role: "treeitem",
                        style: { paddingLeft: "16px", height: "28px", cursor: "pointer" },
                        onClick: function () {
                          window.dispatchEvent(new CustomEvent("dsh:open-terminal", { detail: { session: sess.name } }));
                        }
                      },
                      h("span", { className: "dsh-tree-slot dsh-tree-icon", style: { color: "var(--dsw-alias-primary, #6366f1)" } }, h(TerminalsGlyph, { size: 13 })),
                      h("span", { className: "dsh-tree-title", style: { fontSize: "12px" } }, "Terminal: " + sess.name),
                      h("span", { style: { width: "6px", height: "6px", borderRadius: "50%", background: "#3fb950", marginLeft: "auto", flexShrink: 0, boxShadow: "0 0 5px rgba(63, 185, 80, 0.5)" } })
                    );
                  }),
                  liveContainers.map(function (cont) {
                    return h(
                      "div",
                      {
                        key: "live-cont::" + cont.id,
                        className: "dsh-tree-sessionRow",
                        role: "treeitem",
                        style: { paddingLeft: "16px", height: "28px", cursor: "pointer" },
                        onClick: function () {
                          window.dispatchEvent(new CustomEvent("dsh:open-container", { detail: { id: cont.id } }));
                        }
                      },
                      h("span", { className: "dsh-tree-slot dsh-tree-icon", style: { color: "var(--dsw-alias-primary, #6366f1)" } }, h(ContainersGlyph, { size: 13 })),
                      h("span", { className: "dsh-tree-title", style: { fontSize: "12px" } }, "Container: " + (cont.name || cont.image || cont.id.slice(0, 12))),
                      h("span", { style: { width: "6px", height: "6px", borderRadius: "50%", background: "#3fb950", marginLeft: "auto", flexShrink: 0, boxShadow: "0 0 5px rgba(63, 185, 80, 0.5)" } })
                    );
                  })
                )
              : h("div", { style: { padding: "4px 8px 4px 24px", fontSize: "11px", color: "var(--dsw-alias-label-tertiary)" } }, "(no active processes)")
          ) : null
        ),

        // 3. HOSTS SECTION (Host Machine -> Macintosh HD -> Filesystem Directory Hierarchy)
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", width: "100%", flex: "0 0 auto", margin: "2px 0 4px 0", paddingBottom: "4px", borderBottom: "1px solid var(--dsw-alias-border-l1)" } },
          // Top Level: Host Machine
          h(
            "div",
            {
              className: "dsh-tree-projectRow",
              role: "treeitem",
              style: { position: "relative", paddingLeft: "8px", fontWeight: 600, height: "28px" },
              "aria-expanded": isHostOpen,
              onClick: function () { setIsHostOpen(!isHostOpen); },
            },
            h("span", { className: "dsh-tree-slot dsh-tree-icon" }, h(HostMachineGlyph, { size: 15 })),
            h("span", { className: "dsh-tree-slot dsh-tree-chevron" },
              h(TriangleRightFill14, { className: "dsh-tree-arrow" + (isHostOpen ? " dsh-tree-arrowOpen" : ""), size: 11 })
            ),
            h("span", { className: "dsh-tree-title" }, "Host Machine"),
            h("span", { className: "dsh-tree-actions" },
              renderUnifiedPlusButton("/", "host-plus")
            )
          ),
          isHostOpen ? h(
            "div",
            { style: { display: "flex", flexDirection: "column", width: "100%" } },
            // Level 2: Drive (Macintosh HD)
            h(
              "div",
              {
                className: "dsh-tree-projectRow",
                role: "treeitem",
                style: { position: "relative", paddingLeft: "24px", fontWeight: 500, height: "28px" },
                "aria-expanded": isDriveOpen,
                onClick: function () { setIsDriveOpen(!isDriveOpen); },
              },
              h("span", { className: "dsh-tree-slot dsh-tree-icon" }, h(HardDriveGlyph, { size: 15 })),
              h("span", { className: "dsh-tree-slot dsh-tree-chevron" },
                h(TriangleRightFill14, { className: "dsh-tree-arrow" + (isDriveOpen ? " dsh-tree-arrowOpen" : ""), size: 11 })
              ),
              h("span", { className: "dsh-tree-title" }, "Macintosh HD"),
              h("span", { className: "dsh-tree-actions" },
                renderUnifiedPlusButton("/", "drive-plus")
              )
            ),
            isDriveOpen ? h(
              "div",
              { style: { display: "flex", flexDirection: "column", width: "100%" } },
              // Render chats belonging to root
              (function () {
                var cRootClean = currentRoot.length > 1 && currentRoot.endsWith("/") ? currentRoot.slice(0, -1) : currentRoot;
                var rootChats = folderSessions[cRootClean] || folderSessions[currentRoot] || [];
                if (rootChats.length === 0) return null;
                return h(
                  "div",
                  { style: { display: "flex", flexDirection: "column", width: "100%", marginBottom: "4px", paddingBottom: "4px", borderBottom: "1px dashed var(--dsw-alias-border-l1)" } },
                  rootChats.map(function (c) { return renderChatRow(c, 40); })
                );
              })(),
              // Render directory entries starting from depth 2 (paddingLeft = 8 + 2 * 16 = 40px)
              renderDirEntries(currentRoot, 2)
            ) : null
          ) : null
        ),

        // 4. UNGROUPED SESSIONS SECTION
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", width: "100%", flex: "0 0 auto", margin: "2px 0 4px 0", paddingBottom: "4px" } },
          h(
            "div",
            {
              className: "dsh-tree-projectRow",
              role: "treeitem",
              style: { position: "relative", paddingLeft: "8px", fontWeight: 600, height: "28px" },
              "aria-expanded": isUngroupedOpen,
              onClick: function () { setIsUngroupedOpen(!isUngroupedOpen); },
            },
            h("span", { className: "dsh-tree-slot dsh-tree-icon" }, h(BlueFolderGlyph, { size: 14 })),
            h("span", { className: "dsh-tree-slot dsh-tree-chevron" },
              h(TriangleRightFill14, { className: "dsh-tree-arrow" + (isUngroupedOpen ? " dsh-tree-arrowOpen" : ""), size: 11 })
            ),
            h("span", { className: "dsh-tree-title" }, "Ungrouped"),
            h("span", { style: { padding: "1px 5px", borderRadius: "8px", fontSize: "9.5px", background: "rgba(128,128,128,0.15)", color: "var(--dsw-alias-label-secondary)", fontWeight: 700, marginLeft: "4px" } }, filteredUngroupedSessions.length),
            h("span", { className: "dsh-tree-actions" },
              renderUnifiedPlusButton(null, "ungrouped-plus")
            )
          ),
          isUngroupedOpen ? h(
            "div",
            { style: { display: "flex", flexDirection: "column", width: "100%" } },
            filteredUngroupedSessions.length > 0
              ? filteredUngroupedSessions.map(function (chat) { return renderChatRow(chat, 16); })
              : h("div", { style: { padding: "4px 8px 4px 24px", fontSize: "11px", color: "var(--dsw-alias-label-tertiary)" } }, "(no ungrouped sessions)")
          ) : null
        ),

        // 5. ARCHIVED SESSIONS SECTION (SEPARATE SECTION AT BOTTOM)
        archivedSessions.length > 0 ? h(
          "div",
          { style: { display: "flex", flexDirection: "column", width: "100%", marginTop: "12px", paddingTop: "6px", borderTop: "1px solid var(--dsw-alias-border-l1)" } },
          h(
            "div",
            {
              className: "dsh-tree-projectRow",
              role: "treeitem",
              style: { position: "relative", paddingLeft: "8px", fontWeight: 600, height: "28px" },
              "aria-expanded": isArchivedOpen,
              onClick: function () { setIsArchivedOpen(!isArchivedOpen); },
            },
            h("span", { className: "dsh-tree-slot dsh-tree-icon" }, h(ArchiveBoxGlyph, { size: 14 })),
            h("span", { className: "dsh-tree-slot dsh-tree-chevron" },
              h(TriangleRightFill14, { className: "dsh-tree-arrow" + (isArchivedOpen ? " dsh-tree-arrowOpen" : ""), size: 11 })
            ),
            h("span", { className: "dsh-tree-title" }, "Archived"),
            h("span", { style: { padding: "1px 5px", borderRadius: "8px", fontSize: "9.5px", background: "rgba(99, 102, 241, 0.15)", color: "var(--dsw-alias-primary, #6366f1)", fontWeight: 700, marginLeft: "4px" } }, archivedSessions.length),
            h("span", { className: "dsh-tree-actions" },
              h("button", {
                type: "button",
                className: "dsh-tree-actionBtn",
                title: "Archive All Pong Sessions",
                onClick: function (e) { e.stopPropagation(); handleArchivePongSessions(); }
              }, h(TrashGlyph, { size: 13 }))
            )
          ),
          isArchivedOpen ? h(
            "div",
            { style: { display: "flex", flexDirection: "column", width: "100%" } },
            archivedSessions.map(function (chat) {
              return renderArchivedChatRow(chat, 16);
            })
          ) : null
        ) : null,

        renameModal ? h(RenameTerminalModal, { oldName: renameModal, onClose: function () { setRenameModal(null); }, onRenamed: function () { loadAll(); } }) : null
      );
    }

    function GlobalTerminalAndContainerManager() {
      var panelState = React.useState(null); // { type: "terminal", session: "..." } | { type: "container", id: "..." }
      var panel = panelState[0], setPanel = panelState[1];

      React.useEffect(function () {
        var onMoveToBottom = function (e) {
          var tab = e.detail;
          if (tab) {
            setPanel({ type: tab.type, session: tab.session || tab.id, id: tab.id });
          }
        };

        window.addEventListener("dsh:tab-moved-to-bottom", onMoveToBottom);
        return function () {
          window.removeEventListener("dsh:tab-moved-to-bottom", onMoveToBottom);
        };
      }, []);

      return h(
        React.Fragment,
        null,
        h(TopConversationTabBar, {}),
        h(RightSidebarDock, {}),
        panel ? h(BottomTerminalPanel, {
          initialSession: panel && panel.type === "terminal" ? panel.session : undefined,
          initialContainerId: panel && panel.type === "container" ? panel.id : undefined,
          onClose: function () { setPanel(null); }
        }) : null
      );
    }

    if (typeof window !== "undefined") {
      window.__dsh_UnifiedWorkspacesBrowser = UnifiedWorkspacesBrowser;
    }

    function apply(ctx) {
      if (typeof window !== "undefined") {
        window.__dsh_ctx__ = ctx;
        window.__dsh_UnifiedWorkspacesBrowser = UnifiedWorkspacesBrowser;
      }
      ensureModelPickerDecoration();
      // Injected helper methods for dynamic workspaces and sessions
      var browserInjected = function () {
        return {
          startSession: function (workspaceId) { ctx.workspaces && ctx.workspaces.startSession(workspaceId); },
          open: function (sessionId) { ctx.sessions && ctx.sessions.open(sessionId); },
          createWorkspace: function (input) {
            return ctx.workspaces && ctx.workspaces.create ? ctx.workspaces.create(input) : Promise.resolve();
          },
          renameSession: function (sessionId, title) {
            var session = ctx.sessions && ctx.sessions.binding(sessionId)?.session;
            return session ? session.rename(title) : Promise.resolve();
          },
          archiveSession: function (sessionId) {
            return ctx.workspaces ? ctx.workspaces.archiveSession(sessionId) : Promise.resolve();
          },
          forkSession: function (sessionId) {
            if (ctx.sessions && ctx.sessions.fork) {
              ctx.sessions.fork({ sessionId: sessionId, increaseTitle: true }).then(function (childId) { ctx.sessions.open(childId); });
            }
          },
        };
      };

      // 0. Dynamic Filesystem & Workspaces Browser
      ctx.slots.inject("sidebar.workspaces", function () {
        return ctx.slots.register({
          name: "sidebar.workspaces",
          priority: -100,
          order: 0,
          locale: "sidebar",
          inject: browserInjected,
        }, UnifiedWorkspacesBrowser);
      }, "dsh-providers: dynamic filesystem and workspaces browser");

      // 0b. Global Terminals & Containers Manager + Top Tab Bar
      ctx.slots.inject("sidebar.footer.action", function () {
        return ctx.slots.register({
          name: "sidebar.footer.action",
          id: "dsh-terminals-manager",
          order: 999,
        }, GlobalTerminalAndContainerManager);
      }, "dsh-providers: global terminals manager and top tab bar");

      // 1. Accounts Settings Section (Order 8)
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({
          name: "settings.section",
          id: "accounts",
          priority: -10,
          order: 8,
          locale: NS,
          label: function () { return "Accounts"; },
          inject: function () { return {}; },
        }, AccountsSection);
      }, "dsh-providers: accounts section");

      ctx.slots.inject("settings.section.icon", function () {
        return ctx.slots.register({
          name: "settings.section.icon",
          id: "accounts",
          priority: -10,
          order: 0,
        }, AccountsGlyph);
      }, "dsh-providers: accounts nav glyph");

      // 2. Models Settings Section (Order 9)
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({
          name: "settings.section",
          id: "models",
          priority: -10,
          order: 9,
          locale: NS,
          label: function () { return "Models"; },
          inject: function () { return {}; },
        }, ModelsSection);
      }, "dsh-providers: models section");

      ctx.slots.inject("settings.section.icon", function () {
        return ctx.slots.register({
          name: "settings.section.icon",
          id: "models",
          priority: -10,
          order: 0,
        }, ModelsGlyph);
      }, "dsh-providers: models nav glyph");

      // 3. Apps Settings Section (Order 10)
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({
          name: "settings.section",
          id: "apps",
          priority: -10,
          order: 10,
          locale: NS,
          label: function () { return "Apps"; },
          inject: function () { return {}; },
        }, AppsSection);
      }, "dsh-providers: apps section");

      ctx.slots.inject("settings.section.icon", function () {
        return ctx.slots.register({
          name: "settings.section.icon",
          id: "apps",
          priority: -10,
          order: 0,
        }, AppsGlyph);
      }, "dsh-providers: apps nav glyph");

      // 2. Terminals Settings Section (Order 11)
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({
          name: "settings.section",
          id: "terminals",
          priority: -10,
          order: 11,
          locale: NS,
          label: function () { return "Terminals"; },
          inject: function () { return {}; },
        }, TmuxSettingsSection);
      }, "dsh-providers: terminals configuration section");

      ctx.slots.inject("settings.section.icon", function () {
        return ctx.slots.register({
          name: "settings.section.icon",
          id: "terminals",
          priority: -10,
          order: 0,
        }, TerminalsGlyph);
      }, "dsh-providers: terminals nav glyph");

      // 3. Containers Settings Section (Order 12)
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({
          name: "settings.section",
          id: "containers",
          priority: -10,
          order: 12,
          locale: NS,
          label: function () { return "Containers"; },
          inject: function () { return {}; },
        }, DockerSettingsSection);
      }, "dsh-providers: containers configuration section");

      ctx.slots.inject("settings.section.icon", function () {
        return ctx.slots.register({
          name: "settings.section.icon",
          id: "containers",
          priority: -10,
          order: 0,
        }, ContainersGlyph);
      }, "dsh-providers: containers nav glyph");

      // 4. Tools Settings Section (Order 25)
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({
          name: "settings.section",
          id: "tools",
          priority: -10,
          order: 25,
          locale: NS,
          label: function () { return "Tools"; },
          inject: function () { return {}; },
        }, ToolsSection);
      }, "dsh-providers: tools section");

      ctx.slots.inject("settings.section.icon", function () {
        return ctx.slots.register({
          name: "settings.section.icon",
          id: "tools",
          priority: -10,
          order: 0,
        }, ToolsGlyph);
      }, "dsh-providers: tools nav glyph");

      // 5. Loops Settings Section (Order 26)
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({
          name: "settings.section",
          id: "loops",
          priority: -10,
          order: 26,
          locale: NS,
          label: function () { return "Loops"; },
          inject: function () { return {}; },
        }, LoopsSection);
      }, "dsh-providers: loops section");

      ctx.slots.inject("settings.section.icon", function () {
        return ctx.slots.register({
          name: "settings.section.icon",
          id: "loops",
          priority: -10,
          order: 0,
        }, LoopsGlyph);
      }, "dsh-providers: loops nav glyph");

      // 6. Icons Settings Section (Order 7)
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({
          name: "settings.section",
          id: "icons",
          priority: -10,
          order: 7,
          locale: NS,
          label: function () { return "Icons"; },
          inject: function () { return {}; },
        }, IconsSection);
      }, "dsh-providers: icons section");

      ctx.slots.inject("settings.section.icon", function () {
        return ctx.slots.register({
          name: "settings.section.icon",
          id: "icons",
          priority: -10,
          order: 0,
        }, IconsGlyph);
      }, "dsh-providers: icons nav glyph");

    }

    exports.apply = apply;
    exports.inject = ["slots", "locale", "sessions", "workspaces"];
    return module.exports;
  },
});
