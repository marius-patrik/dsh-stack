// dsh-tweaks client half (hand-authored bundle, no build step): owns the
// two replaced web-profile shells.
//
//   sidebar occupant (TweaksSidebarRoot)  — replaces ui-sidebar. Column
//     geometry, fold state machine, brand row, and the two new seats
//     sidebar.newSession (the New Session button, extracted) and
//     sidebar.history (empty until the sidebar batch phase). Everything
//     between the brand and the foot stays a slot: sidebar.workspaces,
//     sidebar.footer.action, sidebar.settings.
//   sidebar.settings occupant (TweaksSettingsRoot) — replaces
//     ui-settings-general. Trigger row + modal panel (1080x700 figma),
//     section nav rail, onboarding coordinator, and the new
//     settings.section.icon seat (glyphs registered by section id, with the
//     shell's gear fallback while a section owns no glyph). Every section
//     receives an extra `openSection` owner prop (harness sections ignore it)
//     so later phases can navigate across sections.
//   ownerless Settings copy — re-registers the trigger/header/close chrome,
//     the General section, the loopback-only open-document action, and the
//     `sidebar` + `settings` dictionaries, since ui-sidebar and
//     ui-settings-general are disabled in the web profile patch.
//
// The shell CSS ships as a claimed <style> block (prefixed class names); the
// module system's claimStyles machinery owns untagged <style> tags injected
// during materialization. Only platform seed words are required (react,
// ui-primitives, ui-slots, web-react) — no cross-package value imports, no
// dsh-client-runtime/client, so the document action re-implements its state
// as a hand-rolled observable over the connection api.
//
// Re-running the bundle (HMR / entry refresh) is idempotent through the slot
// ledger and the style-tag guard.

const SHELL_CSS = `
.dsh-tw-root {
  --dsh-sidebar-inline-padding: 12px;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 6px var(--dsh-sidebar-inline-padding);
  box-sizing: border-box;
  background: var(--dsw-specific-sidebar-fill);
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);
  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);
}
.dsh-tw-root.dsh-tw-collapsed { padding: 18px 10px 6px; }
.dsh-tw-root.dsh-tw-quietBars { --dsh-scrollbar-thumb: transparent; --dsh-scrollbar-thumb-hover: transparent; }
.dsh-tw-fading > * { opacity: 0; transition: opacity 150ms var(--ds-ease-in-out); }
.dsh-tw-wide { animation: dsh-tw-wide-in 200ms var(--ds-ease-in-out); }
@keyframes dsh-tw-wide-in { from { opacity: 0; } }
.dsh-tw-railIn .dsh-tw-iconButton,
.dsh-tw-railIn .dsh-tw-newSession,
.dsh-tw-railIn .dsh-tw-regionArea { animation: dsh-tw-rail-in 150ms var(--ds-ease-in-out) backwards; }
.dsh-tw-railIn .dsh-tw-footArea { animation: dsh-tw-rail-fade-in 150ms var(--ds-ease-in-out) backwards; }
@keyframes dsh-tw-rail-in { from { opacity: 0; transform: translateX(49px); } }
@keyframes dsh-tw-rail-fade-in { from { opacity: 0; } }
.dsh-tw-logoRow { flex: none; display: flex; align-items: center; justify-content: flex-end; gap: 8px; height: 60px; padding: 8px 0 8px 4px; margin-bottom: 8px; box-sizing: border-box; overflow: hidden; }
.dsh-tw-collapsed .dsh-tw-logoRow { height: 36px; padding: 0; margin-bottom: 12px; justify-content: flex-start; }
.dsh-tw-brand { flex: 1; min-width: 0; display: inline-flex; align-items: center; overflow: hidden; padding: 0; border: none; background: transparent; color: inherit; cursor: pointer; }
.dsh-tw-iconButton { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 50%; padding: 0; background: transparent; cursor: pointer; color: var(--dsw-alias-label-secondary); }
.dsh-tw-iconButton:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-tw-collapsed .dsh-tw-iconButton { width: 36px; height: 36px; }
.dsh-tw-collapsed .dsh-tw-toggle .dsh-tw-panelIcon { display: none; }
.dsh-tw-collapsed .dsh-tw-toggle:hover .dsh-tw-panelIcon { display: inline; }
.dsh-tw-collapsed .dsh-tw-toggle:hover .dsh-tw-railFish { display: none; }
.dsh-tw-collapsed .dsh-tw-iconButton { color: var(--dsw-alias-label-primary); }
.dsh-tw-newSession { flex: none; display: flex; align-items: center; justify-content: center; gap: 6px; height: 38px; padding: 8px 16px; margin: 0 2px 8px; box-sizing: border-box; border: 1px solid var(--dsw-alias-border-l2); border-radius: 12px; background: var(--dsw-alias-button-elevated-fill); color: var(--dsw-alias-label-primary); font-size: 14px; font-weight: 500; line-height: 22px; cursor: pointer; overflow: hidden; }
.dsh-tw-newSession:hover { background: var(--dsw-alias-button-floating-hover); }
.dsh-tw-collapsed .dsh-tw-newSession { align-self: flex-start; width: 36px; height: 36px; padding: 0; margin: 0 0 12px; gap: 0; border-color: transparent; background: transparent; }
.dsh-tw-collapsed .dsh-tw-newSession:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-tw-newSessionLabel { max-width: 200px; overflow: hidden; white-space: nowrap; }
.dsh-tw-collapsed .dsh-tw-newSessionLabel { max-width: 0; }
.dsh-tw-regionArea { flex: 1; min-height: 0; display: flex; flex-direction: column; margin-left: -4px; margin-right: calc(-1 * var(--dsh-sidebar-inline-padding)); padding-left: 4px; overflow: hidden; }
.dsh-tw-collapsed .dsh-tw-regionArea { margin-left: 0; margin-right: 0; padding-left: 0; }
.dsh-tw-historyArea { flex: none; min-width: 0; width: 100%; }
.dsh-tw-historySection { padding: 0 4px 8px; }
.dsh-tw-historyHeader { height: 28px; padding: 0 8px; display: flex; align-items: center; }
.dsh-tw-historyLabel { font-size: 11px; color: var(--dsw-alias-label-tertiary); text-transform: uppercase; letter-spacing: 0.5px; }
.dsh-tw-historyList { display: flex; flex-direction: column; gap: 1px; }
.dsh-tw-historyRow { display: flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 6px; cursor: pointer; min-height: 28px; }
.dsh-tw-historyRow:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-tw-historyTitle { flex: 1; font-size: 13px; color: var(--dsw-alias-label-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsh-tw-historyTime { flex: none; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.dsh-tw-footArea { flex: none; display: flex; flex-direction: column; gap: 2px; }
.dsh-tw-settingsArea { flex: none; display: flex; align-items: center; justify-content: flex-start; padding: 2px 4px; }
.dsh-tw-footerActions { flex: none; min-width: 0; width: 100%; display: flex; flex-direction: column; gap: 2px; }
.dsh-tw-collapsed .dsh-tw-footArea { align-items: center; gap: 4px; }
.dsh-tw-collapsed .dsh-tw-settingsArea,
.dsh-tw-collapsed .dsh-tw-footerActions { display: flex; flex-direction: column; align-items: center; justify-content: center; width: auto; gap: 4px; padding: 0; }
.dsh-tw-trigger { flex: none; display: flex; align-items: center; gap: 8px; width: 100%; height: 34px; margin: 2px 0; padding: 6px 10px; box-sizing: border-box; border: none; border-radius: 10px; background: transparent; cursor: pointer; overflow: hidden; color: var(--dsw-alias-label-primary); font-family: inherit; font-size: 13.5px; line-height: 20px; font-weight: 500; user-select: none; transition: background 120ms ease; }
.dsh-tw-trigger:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-tw-trigger.dsh-tw-rail { width: 36px; height: 36px; margin: 4px 0; justify-content: center; gap: 0; padding: 0; border-radius: 50%; }
.dsh-tw-overlay { position: fixed; inset: 0; z-index: 1000000; display: flex; align-items: center; justify-content: center; pointer-events: none; }
.dsh-tw-mask { position: absolute; inset: 0; background: transparent !important; backdrop-filter: none !important; pointer-events: auto; }
.dsh-tw-panel { position: relative; z-index: 1; pointer-events: auto; display: flex; flex-direction: row; min-width: 480px; min-height: 340px; border-radius: 24px; overflow: hidden; background: var(--dsw-alias-bg-layer-2); box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.14) !important; border: 1.5px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.22)) !important; --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2); --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2); }
:root[data-theme="oled"] .dsh-tw-panel, body[data-theme="oled"] .dsh-tw-panel { background: #050505 !important; border: 1.5px solid #333333 !important; box-shadow: 0 24px 64px rgba(0, 0, 0, 0.95), 0 0 0 1px #222222 !important; }
.dsh-tw-nav { position: relative; flex: none; display: flex; flex-direction: column; gap: 14px; width: 192px; min-width: 56px; max-width: 380px; height: 100%; padding: 18px 10px 0; box-sizing: border-box; border-right: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.12)); transition: width 80ms ease; user-select: none; overflow: hidden; }
.dsh-tw-nav.dsh-tw-navCollapsed { width: 56px !important; padding: 18px 6px 0; }
.dsh-tw-nav.dsh-tw-navCollapsed .dsh-tw-navLabel { display: none; }
.dsh-tw-nav.dsh-tw-navCollapsed .dsh-tw-navGroupHeader { display: none; }
.dsh-tw-nav.dsh-tw-navCollapsed .dsh-tw-navTitle { display: none; }
.dsh-tw-navResizer { position: absolute; top: 0; right: -4px; bottom: 0; width: 8px; cursor: col-resize; z-index: 10; }
.dsh-tw-navResizer:hover, .dsh-tw-navResizer.dsh-tw-resizing { background: var(--dsw-alias-primary, #6366f1); opacity: 0.4; }
.dsh-tw-draggableHeader { cursor: grab; user-select: none; }
.dsh-tw-draggableHeader:active { cursor: grabbing; }
.dsh-tw-navTitleRow { display: flex; align-items: center; justify-content: space-between; padding: 0 4px 0 8px; }
.dsh-tw-navTitle { font-size: 16px; line-height: 24px; font-weight: 500; color: var(--dsw-alias-label-primary); }
.dsh-tw-navCollapseBtn { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: none; border-radius: 6px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; }
.dsh-tw-navCollapseBtn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.dsh-tw-navList { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; padding-bottom: 12px; }
.dsh-tw-navCell { display: flex; align-items: center; gap: 8px; height: 38px; padding: 8px 12px; box-sizing: border-box; border: none; border-radius: 10px; background: transparent; cursor: pointer; font-family: inherit; font-size: 14px; line-height: 22px; font-weight: 400; color: var(--dsw-alias-label-primary); text-align: left; transition: background 100ms; }
.dsh-tw-navCell:hover { background: var(--dsw-specific-sidebar-nav-item-hover); }
.dsh-tw-navCell.dsh-tw-active { background: var(--dsw-specific-sidebar-nav-item-active); }
.dsh-tw-navIcon { flex: none; display: inline-flex; align-items: center; justify-content: center; }
.dsh-tw-navLabel { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.dsh-tw-content { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.dsh-tw-header { flex: none; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; height: 54px; padding: 20px 14px 8px 10px; box-sizing: border-box; }
.dsh-tw-actions { min-width: 0; display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-left: auto; }
.dsh-tw-close { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0; border: none; border-radius: 28px; background: transparent; cursor: pointer; color: var(--dsw-alias-label-primary); }
.dsh-tw-close:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsh-tw-options { flex: 1; min-height: 0; height: 100%; padding: 0 24px 24px; overflow-y: auto; }
.dsh-tw-hiddenLabel { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.dsh-tw-section { display: flex; flex-direction: column; width: 100%; }
.dsh-tw-section > [data-slot='settings.general.item'] > :last-child { border-bottom: none; }
.dsh-tw-action { display: flex; min-width: 0; align-items: center; gap: 8px; }
.dsh-tw-error { max-width: 180px; overflow: hidden; color: var(--dsw-alias-state-error-primary); font-size: 12px; line-height: 18px; text-overflow: ellipsis; white-space: nowrap; }
.dsh-icon-animated, svg:not([class*="badge"]) { transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), stroke 180ms ease, fill 180ms ease; will-change: transform; }
button:hover svg, a:hover svg, .dsh-tree-sessionRow:hover svg, .dsh-tree-projectRow:hover svg, .dsh-tw-navCell:hover svg, .dsh-tw-trigger:hover svg, [role="button"]:hover svg, [role="tab"]:hover svg { transform: scale(1.18); }
.dsh-icon-settings:hover, button:hover .dsh-icon-settings, .dsh-tw-trigger:hover .dsh-icon-settings, button:hover [data-icon="settings"], button:hover svg[class*="gear"], button:hover svg[class*="settings"] { transform: scale(1.22) rotate(45deg) !important; }
.dsh-icon-refresh:hover, button:hover .dsh-icon-refresh, button:hover [data-icon="refresh"], button:hover svg[class*="refresh"], button:hover svg[class*="reload"] { transform: scale(1.22) rotate(180deg) !important; }
button:hover .dsh-icon-rocket, button:hover [data-icon="rocket"] { transform: scale(1.25) translateY(-2px) rotate(-12deg) !important; }
.dsh-tree-sessionRow:hover svg[class*="notepad"], .dsh-tree-sessionRow:hover .dsh-icon-notepad { transform: scale(1.2) rotate(-8deg) !important; }
[class*="inputRow"] {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  min-height: 40px !important;
  height: auto !important;
  padding: 0 4px !important;
}
[class*="inputRow"] > button[class*="add"] {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 34px !important;
  height: 34px !important;
  min-height: 34px !important;
  max-height: 34px !important;
  align-self: center !important;
  margin: 0 !important;
  padding: 0 !important;
  flex: none !important;
}
[class*="sendGroup"] {
  display: flex !important;
  align-items: center !important;
  align-self: center !important;
  margin: 0 !important;
  padding: 0 !important;
  flex: none !important;
}
[class*="sendGroup"] button[class*="primary"],
[class*="sendGroup"] button {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 34px !important;
  height: 34px !important;
  min-height: 34px !important;
  max-height: 34px !important;
  margin: 0 !important;
  padding: 0 !important;
}
[class*="inputRow"] [class*="scroll"] {
  display: flex !important;
  align-items: center !important;
  min-height: 34px !important;
  flex: 1 !important;
  margin: 0 !important;
  padding: 0 !important;
}
[class*="inputRow"] [class*="grow"] {
  width: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  min-height: 24px !important;
  margin: 0 !important;
  padding: 0 !important;
}
[class*="inputRow"] textarea[class*="input"],
[class*="inputRow"] [class*="backdrop"],
[class*="inputRow"] [class*="mirror"] {
  padding: 2px 10px !important;
  font-size: 14px !important;
  line-height: 20px !important;
  min-height: 24px !important;
  box-sizing: border-box !important;
  margin: 0 !important;
}
[data-slot="conversation.session.header.actions"] [data-slot-id="agent-preset"],
[data-slot="conversation.session.header.actions"] > div:has([class*="agentPreset"]),
[data-slot="conversation.session.header.actions"] > div:has([class*="preset"]),
[data-slot="conversation.session.header.actions"] > [class*="agentPreset"],
[data-slot="conversation.session.header.actions"] > [class*="preset"],
[class*="headerActions"] [class*="preset"],
[class*="headerActions"] [class*="AgentPreset"],
[class*="headerActions"] [class*="agentPreset"],
[class*="conversationSessionHeader"] [class*="preset"],
[class*="conversationSessionHeader"] [class*="AgentPreset"],
[class*="conversationSessionHeader"] [class*="agentPreset"],
div[class*="AgentPresetLabel"],
button[class*="AgentPresetLabel"] {
  display: none !important;
}
/* Hide header subagent catalog from session header actions */
[data-slot="conversation.session.header.actions"] [data-slot-entry="subagent-catalog"],
[data-slot="conversation.session.header.actions"] [data-slot-id="subagent-catalog"],
[class*="headerActions"] [class*="SubagentCatalog"],
[class*="headerActions"] [class*="subagent"] {
  display: none !important;
}

/* Hide default conversation header view tabs (Chat / Trajectory tablist) */
[class*="tabs"][role="tablist"],
[class*="tabs"][class*="header"],
div[data-slot="conversation.session.header.tabs"],
div[data-slot-entry="tabs"],
div[data-slot-id="tabs"],
[class*="conversationSessionHeader"] [role="tablist"],
[class*="headerActions"] [role="tablist"] {
  display: none !important;
}

/* Agent / Assistant Message Bubbles: Distinct Blurple Surface & Border */
div[data-slot="conversation.message.turn"]:has([data-message-role="assistant"]),
div[class*="messageTurn"]:has([data-message-role="assistant"]),
div[class*="MessageTurn"]:has([data-message-role="assistant"]),
div[class*="messageWrapper"][data-role="assistant"],
div[data-slot="conversation.message.assistant"] {
  align-self: flex-start !important;
  max-width: 90% !important;
}

[data-message-role="assistant"] > div[class*="content"],
[data-message-role="assistant"] [class*="Message_bubble"],
[data-message-role="assistant"] [class*="bubble"],
[data-slot="conversation.message.assistant"] [class*="content"],
[class*="AssistantMarkdown_root"],
[class*="AssistantNodeView"] {
  background: rgba(99, 102, 241, 0.14) !important;
  border: 1.5px solid rgba(99, 102, 241, 0.38) !important;
  border-radius: 20px !important;
  padding: 14px 18px !important;
  box-shadow: 0 2px 12px rgba(99, 102, 241, 0.08) !important;
  color: var(--dsw-alias-label-primary) !important;
  align-self: flex-start !important;
  max-width: 88% !important;
}

[data-message-role="user"] > div[class*="content"],
[data-message-role="user"] [class*="Message_bubble"],
[data-message-role="user"] [class*="bubble"],
[data-slot="conversation.message.user"] [class*="content"],
[class*="MessageItem_userRow"] [class*="bubble"],
[class*="userRow"] [class*="bubble"],
[class*="userStack"] [class*="bubble"] {
  background: var(--dsw-specific-user-bubble, var(--dsw-alias-interactive-bg-active, rgba(255, 255, 255, 0.08))) !important;
  border: 1px solid var(--dsw-alias-border-l1, rgba(128, 128, 128, 0.18)) !important;
  border-radius: 20px !important;
  padding: 12px 18px !important;
  color: var(--dsw-alias-label-primary) !important;
  align-self: flex-end !important;
  max-width: 82% !important;
}

/* Floating Input Bar Capsule Bubble */
[class*="InputBar_card"],
[class*="inputBar_card"],
[class*="InputBar_root"] [class*="card"],
div[data-conversation-composer-card],
div[class*="composerCard"] {
  border-radius: 22px !important;
  background: var(--dsw-specific-input-major, var(--dsw-alias-surface-l1, #181825)) !important;
  border: 1.5px solid var(--dsw-alias-border-l2, rgba(255, 255, 255, 0.14)) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25) !important;
}

/* OLED theme rules for message bubbles, user bubbles, and goal display */
:root[data-theme="oled"],
body[data-theme="oled"],
[data-theme="oled"] {
  --dsw-specific-input-major: #080808 !important;
  --dsw-specific-tip: #000000 !important;
  --dsw-alias-surface-l0: #000000 !important;
  --dsw-alias-surface-l1: #050505 !important;
  --dsw-alias-surface-l2: #0a0a0a !important;
  --dsw-alias-bg-base: #000000 !important;
  --dsw-alias-bg-layer-1: #000000 !important;
  --dsw-alias-bg-layer-2: #050505 !important;
  --dsw-alias-border-l1: #161616 !important;
  --dsw-alias-border-l2: #1e1e1e !important;
  --dsw-alias-border-l2-darkmode-thin: #1a1a1a !important;
  --dsw-specific-bubble: rgba(99, 102, 241, 0.12) !important;
  --dsw-specific-user-bubble: #0f0f0f !important;
  --dsw-specific-bubble-highlight: #141414 !important;
}

:root[data-theme="oled"] [data-message-role="assistant"] > div[class*="content"],
:root[data-theme="oled"] [data-message-role="assistant"] [class*="Message_bubble"],
:root[data-theme="oled"] [data-message-role="assistant"] [class*="bubble"],
:root[data-theme="oled"] [data-slot="conversation.message.assistant"] [class*="content"],
:root[data-theme="oled"] [class*="AssistantMarkdown_root"],
:root[data-theme="oled"] [class*="AssistantNodeView"],
body[data-theme="oled"] [data-message-role="assistant"] > div[class*="content"],
body[data-theme="oled"] [data-message-role="assistant"] [class*="Message_bubble"],
body[data-theme="oled"] [data-message-role="assistant"] [class*="bubble"],
body[data-theme="oled"] [data-slot="conversation.message.assistant"] [class*="content"],
body[data-theme="oled"] [class*="AssistantMarkdown_root"],
body[data-theme="oled"] [class*="AssistantNodeView"] {
  background: rgba(99, 102, 241, 0.12) !important;
  border: 1.5px solid rgba(99, 102, 241, 0.32) !important;
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.06) !important;
}

:root[data-theme="oled"] [data-message-role="user"] > div[class*="content"],
:root[data-theme="oled"] [data-message-role="user"] [class*="Message_bubble"],
:root[data-theme="oled"] [data-message-role="user"] [class*="bubble"],
:root[data-theme="oled"] [data-slot="conversation.message.user"] [class*="content"],
:root[data-theme="oled"] [class*="MessageItem_userRow"] [class*="bubble"],
:root[data-theme="oled"] [class*="userRow"] [class*="bubble"],
:root[data-theme="oled"] [class*="userStack"] [class*="bubble"],
body[data-theme="oled"] [data-message-role="user"] > div[class*="content"],
body[data-theme="oled"] [data-message-role="user"] [class*="Message_bubble"],
body[data-theme="oled"] [data-message-role="user"] [class*="bubble"],
body[data-theme="oled"] [data-slot="conversation.message.user"] [class*="content"],
body[data-theme="oled"] [class*="MessageItem_userRow"] [class*="bubble"],
body[data-theme="oled"] [class*="userRow"] [class*="bubble"],
body[data-theme="oled"] [class*="userStack"] [class*="bubble"] {
  background: #0f0f0f !important;
  border-color: #222222 !important;
  box-shadow: none !important;
}

:root[data-theme="oled"] [class*="InputBar_card"],
:root[data-theme="oled"] [class*="inputBar_card"],
:root[data-theme="oled"] [class*="InputBar_root"] [class*="card"],
body[data-theme="oled"] [class*="InputBar_card"],
body[data-theme="oled"] [class*="inputBar_card"],
body[data-theme="oled"] [class*="InputBar_root"] [class*="card"] {
  background: #080808 !important;
  border: 1.5px solid #222222 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6) !important;
}

:root[data-theme="oled"] [data-goal-bar],
:root[data-theme="oled"] [data-goal-bar] > div,
:root[data-theme="oled"] [class*="GoalBar"],
:root[data-theme="oled"] [class*="goal-bar"],
:root[data-theme="oled"] [class*="goalDisplay"],
:root[data-theme="oled"] [class*="GoalDisplay"],
:root[data-theme="oled"] [class*="AgentGoal"],
:root[data-theme="oled"] [class*="agentGoal"],
body[data-theme="oled"] [data-goal-bar],
body[data-theme="oled"] [data-goal-bar] > div,
body[data-theme="oled"] [class*="GoalBar"],
body[data-theme="oled"] [class*="goal-bar"],
body[data-theme="oled"] [class*="goalDisplay"],
body[data-theme="oled"] [class*="GoalDisplay"],
body[data-theme="oled"] [class*="AgentGoal"],
body[data-theme="oled"] [class*="agentGoal"] {
  background: #000000 !important;
  border-color: #1a1a1a !important;
  box-shadow: none !important;
}

.dsh-subagent-dock-row:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08)) !important;
}
.dsh-header-ellipsis-btn:hover {
  background: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.08)) !important;
  color: var(--dsw-alias-label-primary) !important;
}
body.dsh-sidebars-swapped .dsh-tw-root {
  left: auto !important;
  right: 0 !important;
  border-right: none !important;
  border-left: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.12)) !important;
}
body.dsh-sidebars-swapped .dsh-right-sidebar-dock {
  right: auto !important;
  left: 0 !important;
  border-left: none !important;
  border-right: 1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.12)) !important;
}
body.dsh-sidebars-swapped .dsh-mainview-terminal,
body.dsh-sidebars-swapped .dsh-mainview-container {
  left: var(--dsh-secondary-sidebar-width, 0px) !important;
  right: var(--dsh-sidebar-width, 240px) !important;
}
button[class*="sessionLogButton"],
[data-slot="conversation.session.header.utilities"] > button[class*="sessionLogButton"] {
  display: none !important;
}
[data-slot="conversation.session.header.utilities"] [class*="ellipsisButton"] {
  display: inline-flex !important;
}
@media (max-width: 768px) {
  .dsh-tw-root.dsh-tw-wide {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    max-width: 100vw !important;
    height: 100vh !important;
    z-index: 9999 !important;
    box-shadow: 0 0 40px rgba(0,0,0,0.8) !important;
  }
  .dsh-tw-panel {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: 100vw !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
    transform: none !important;
  }
}
@media (prefers-reduced-motion: reduce) {
  .dsh-tw-wide,
  .dsh-tw-fading > *,
  .dsh-tw-railIn .dsh-tw-iconButton,
  .dsh-tw-railIn .dsh-tw-newSession,
  .dsh-tw-railIn .dsh-tw-footArea,
  .dsh-tw-railIn .dsh-tw-regionArea { transition: none; animation: none; }
}
`;

const SIDEBAR_ZH = {
  'session.new': '新会话',
  'session.new.label': '新建会话',
  'toggle.open': '打开侧边栏',
  'toggle.collapse': '收起侧边栏',
};

const SIDEBAR_EN = {
  'session.new': 'New Session',
  'session.new.label': 'New session',
  'toggle.open': 'Open sidebar',
  'toggle.collapse': 'Collapse sidebar',
};

const SETTINGS_ZH = {
  'trigger': '设置',
  'title': '设置',
  'close': '关闭',
  'openDocument': '打开配置文件',
  'openDocument.error': '无法打开配置文件',
  'general.nav': '通用设置',
};

const SETTINGS_EN = {
  'trigger': 'Settings',
  'title': 'Settings',
  'close': 'Close',
  'openDocument': 'Open configuration file',
  'openDocument.error': 'Could not open configuration file',
  'general.nav': 'General',
};

const COLLAPSE_SETTLE_MS = 150;
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
  id: 'dsh-tweaks',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    //#region lib/client.js
    if (typeof document !== 'undefined') {
      var style = document.querySelector('style[data-plugin-css="dsh-tweaks-shells"]');
      if (style === null) {
        style = document.createElement('style');
        style.setAttribute('data-plugin-css', 'dsh-tweaks-shells');
        style.textContent = SHELL_CSS;
        document.head.appendChild(style);
      }
    }
    var React = require('react');
    var ReactDOM = (typeof window !== 'undefined' && window.ReactDOM) ? window.ReactDOM : null;
    try { if (!ReactDOM) ReactDOM = require('react-dom'); } catch (e) {}
    var P = require('@deepseek-ai/dsh-client-ui-primitives');
    if (typeof window !== 'undefined') window.__dsh_P = P;
    var slotsModule = require('@deepseek-ai/dsh-client-ui-slots');
    var resolveSlotLabel = slotsModule.resolveSlotLabel;
    var webReact = require('@deepseek-ai/dsh-client-web-react');
    var bindSnapshotSelector = webReact.bindSnapshotSelector;
    var h = React.createElement;
    var Fragment = React.Fragment;

    function KeychainNavIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' }),
        h('path', { d: 'm9 12 2 2 4-4' })
      );
    }

    function ProvidersNavIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('line', { x1: '22', x2: '2', y1: '12', y2: '12' }),
        h('path', { d: 'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z' }),
        h('line', { x1: '6', x2: '6.01', y1: '16', y2: '16' }),
        h('line', { x1: '10', x2: '10.01', y1: '16', y2: '16' })
      );
    }

    function GeneralNavIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('line', { x1: '21', x2: '14', y1: '4', y2: '4' }),
        h('line', { x1: '10', x2: '3', y1: '4', y2: '4' }),
        h('line', { x1: '21', x2: '12', y1: '12', y2: '12' }),
        h('line', { x1: '8', x2: '3', y1: '12', y2: '12' }),
        h('line', { x1: '21', x2: '16', y1: '20', y2: '20' }),
        h('line', { x1: '12', x2: '3', y1: '20', y2: '20' }),
        h('line', { x1: '14', x2: '14', y1: '2', y2: '6' }),
        h('line', { x1: '8', x2: '8', y1: '10', y2: '14' }),
        h('line', { x1: '16', x2: '16', y1: '18', y2: '22' })
      );
    }

    function TerminalsNavIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('polyline', { points: '4 17 10 11 4 5' }),
        h('line', { x1: '12', x2: '20', y1: '19', y2: '19' })
      );
    }

    function ContainersNavIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('path', { d: 'M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z' }),
        h('path', { d: 'm7 16.5-4.74-2.85' }),
        h('path', { d: 'm7 16.5 5-3' }),
        h('path', { d: 'M7 16.5v5.17' }),
        h('path', { d: 'M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z' }),
        h('path', { d: 'm17 16.5-5-3' }),
        h('path', { d: 'm17 16.5 4.74-2.85' }),
        h('path', { d: 'M17 16.5v5.17' }),
        h('path', { d: 'M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z' }),
        h('path', { d: 'M12 8 7.26 5.15' }),
        h('path', { d: 'm12 8 4.74-2.85' }),
        h('path', { d: 'M12 13.5V8' })
      );
    }

    function PlugNavIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('rect', { width: '7', height: '7', x: '14', y: '3', rx: '1' }),
        h('path', { d: 'M10 21V8a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1H3' })
      );
    }

    function ToolsNavIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('path', { d: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z' })
      );
    }

    function LoopsNavIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-refresh';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }),
        h('path', { d: 'M21 3v5h-5' }),
        h('path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }),
        h('path', { d: 'M8 16H3v5' })
      );
    }

    function TriangleRightFill14(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      var style = props && props.style ? props.style : undefined;
      return h('svg', {
        width: size, height: size, className: className, style: style, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('polyline', { points: '9 18 15 12 9 6' })
      );
    }

    function RobotHeadNavIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('path', { d: 'M12 8V4H8' }),
        h('rect', { width: '16', height: '12', x: '4', y: '8', rx: '2' }),
        h('path', { d: 'M2 14h2' }),
        h('path', { d: 'M20 14h2' }),
        h('path', { d: 'M15 13v2' }),
        h('path', { d: 'M9 13v2' })
      );
    }

    function KeyboardNavIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('rect', { width: '20', height: '16', x: '2', y: '4', rx: '2' }),
        h('path', { d: 'M6 8h.01' }),
        h('path', { d: 'M10 8h.01' }),
        h('path', { d: 'M14 8h.01' }),
        h('path', { d: 'M18 8h.01' }),
        h('path', { d: 'M8 12h.01' }),
        h('path', { d: 'M12 12h.01' }),
        h('path', { d: 'M16 12h.01' }),
        h('path', { d: 'M7 16h10' })
      );
    }

    function DataGlyph(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('polygon', { points: '12 2 2 7 12 12 22 7 12 2' }),
        h('polyline', { points: '2 17 12 22 22 17' }),
        h('polyline', { points: '2 12 12 17 22 12' })
      );
    }

    function SettingsIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated dsh-icon-settings';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('path', { d: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' }),
        h('circle', { cx: '12', cy: '12', r: '3' })
      );
    }

    function SidebarCollapseIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('rect', { width: '18', height: '18', x: '3', y: '3', rx: '2' }),
        h('path', { d: 'M9 3v18' })
      );
    }

    function CloseIcon(props) {
      var size = props && props.size ? props.size : 14;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('path', { d: 'M18 6 6 18' }),
        h('path', { d: 'm6 6 12 12' })
      );
    }

    function CommandsIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('path', { d: 'm18 16 4-4-4-4' }),
        h('path', { d: 'm6 8-4 4 4 4' }),
        h('path', { d: 'm14.5 4-5 16' })
      );
    }

    function PaletteIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('circle', { cx: '13.5', cy: '6.5', r: '.5', fill: 'currentColor' }),
        h('circle', { cx: '17.5', cy: '10.5', r: '.5', fill: 'currentColor' }),
        h('circle', { cx: '8.5', cy: '7.5', r: '.5', fill: 'currentColor' }),
        h('circle', { cx: '6.5', cy: '12.5', r: '.5', fill: 'currentColor' }),
        h('path', { d: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z' })
      );
    }

    function AgentPresetIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('path', { d: 'M12 8V4H8' }),
        h('rect', { width: '16', height: '12', x: '4', y: '8', rx: '2' }),
        h('path', { d: 'M2 14h2' }),
        h('path', { d: 'M20 14h2' }),
        h('path', { d: 'M15 13v2' }),
        h('path', { d: 'M9 13v2' })
      );
    }

    function EllipsisIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('circle', { cx: '12', cy: '12', r: '1' }),
        h('circle', { cx: '19', cy: '12', r: '1' }),
        h('circle', { cx: '5', cy: '12', r: '1' })
      );
    }

    function DownloadIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
        h('polyline', { points: '7 10 12 15 17 10' }),
        h('line', { x1: '12', x2: '12', y1: '15', y2: '3' })
      );
    }

    function BranchIcon(props) {
      var size = props && props.size ? props.size : 16;
      var className = (props && props.className ? props.className + ' ' : '') + 'dsh-icon-animated';
      return h('svg', {
        width: size, height: size, className: className, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      },
        h('line', { x1: '6', x2: '6', y1: '3', y2: '15' }),
        h('circle', { cx: '18', cy: '6', r: '3' }),
        h('circle', { cx: '6', cy: '18', r: '3' }),
        h('path', { d: 'M18 9a9 9 0 0 1-9 9' })
      );
    }

    function navIcon(id) {
      if (id === 'general') return h(GeneralNavIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'integrations' || id === 'providers') return h(ProvidersNavIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'accounts') return h(ProvidersNavIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'terminals') return h(TerminalsNavIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'containers') return h(ContainersNavIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'models') return h(DataGlyph, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'apps') return h(CommandsIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'provider-usage') return h(DataGlyph, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'keychain') return h(KeychainNavIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'session-modes' || id === 'actions' || id === 'commands') return h(CommandsIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'agents') return h(RobotHeadNavIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'themes' || id === 'appearance') return h(PaletteIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'icons') return h(PaletteIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'agent-presets' || id === 'modes') return h(AgentPresetIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'tools') return h(ToolsNavIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'loops') return h(LoopsNavIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'plugins') return h(PlugNavIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'keybinds' || id === 'keybindings' || id === 'shortcuts') return h(KeyboardNavIcon, { className: 'dsh-tw-navIcon', size: 16 });
      if (id === 'hosts') return h(DataGlyph, { className: 'dsh-tw-navIcon', size: 16 });
      return h(SettingsIcon, { className: 'dsh-tw-navIcon', size: 16 });
    }

    // Glyph seat: a registrant's glyph wins; an id with no glyph falls back to
    // the static map so every nav cell keeps a mark.
    function navGlyph(renderSlot, row) {
      try {
        if (typeof renderSlot === 'function') {
          var content = renderSlot('settings.section.icon', {}, { only: row.id });
          if (content !== null && content !== undefined) return content;
        }
      } catch (err) {}
      return navIcon(row.id);
    }

    function NotepadPencilGlyph(props) {
      var size = props && props.size ? props.size : 16;
      return h("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "dsh-icon-animated dsh-icon-notepad",
        style: { display: "inline-flex", verticalAlign: "middle", flexShrink: 0 }
      },
        h("path", { d: "M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" }),
        h("path", { d: "M2 6h4" }),
        h("path", { d: "M2 10h4" }),
        h("path", { d: "M2 14h4" }),
        h("path", { d: "M2 18h4" }),
        h("path", { d: "M18.4 2.6a2.12 2.12 0 0 1 3 3L11 16l-4 1 1-4Z" })
      );
    }

    function ChatGlyph(props) {
      var size = props && props.size ? props.size : 16;
      return h("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "dsh-icon-animated",
        style: { display: "inline-flex", verticalAlign: "middle", flexShrink: 0 }
      },
        h("path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" })
      );
    }

    function TerminalsGlyph(props) {
      var size = props && props.size ? props.size : 16;
      return h("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "dsh-icon-animated",
        style: { display: "inline-flex", verticalAlign: "middle", flexShrink: 0 }
      },
        h("polyline", { points: "4 17 10 11 4 5" }),
        h("line", { x1: "12", y1: "19", x2: "20", y2: "19" })
      );
    }

    function ContainersGlyph(props) {
      var size = props && props.size ? props.size : 16;
      return h("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "dsh-icon-animated",
        style: { display: "inline-flex", verticalAlign: "middle", flexShrink: 0 }
      },
        h("rect", { x: "2", y: "3", width: "20", height: "14", rx: "2", ry: "2" }),
        h("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
        h("line", { x1: "12", y1: "17", x2: "12", y2: "21" })
      );
    }

    var SettingsPanelErrorBoundary = (function (_super) {
      function SettingsPanelErrorBoundary(props) {
        if (_super && typeof _super === 'function') {
          try { _super.call(this, props); } catch (e) {}
        }
        this.props = props;
        this.state = { hasError: false, error: null };
        return this;
      }
      if (_super && _super.prototype) {
        try {
          Object.setPrototypeOf(SettingsPanelErrorBoundary, _super);
          SettingsPanelErrorBoundary.prototype = Object.create(_super.prototype);
          SettingsPanelErrorBoundary.prototype.constructor = SettingsPanelErrorBoundary;
        } catch (e) {}
      } else {
        SettingsPanelErrorBoundary.prototype = {};
        SettingsPanelErrorBoundary.prototype.setState = function (partial) {
          if (typeof partial === 'function') {
            this.state = Object.assign({}, this.state, partial(this.state));
          } else {
            this.state = Object.assign({}, this.state, partial);
          }
        };
      }
      SettingsPanelErrorBoundary.getDerivedStateFromError = function (error) {
        return { hasError: true, error: error };
      };
      SettingsPanelErrorBoundary.prototype.componentDidCatch = function (error, errorInfo) {
        console.error('SettingsPanel error caught by boundary:', error, errorInfo);
      };
      SettingsPanelErrorBoundary.prototype.render = function () {
        if (this.state && this.state.hasError) {
          var _this = this;
          return h('div', {
            className: 'dsh-tw-panel',
            style: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--dsw-alias-label-primary)' }
          },
            h('h2', { style: { margin: 0, fontSize: '18px', fontWeight: 600 } }, 'Settings (Recovered)'),
            h('p', { style: { color: 'var(--dsw-alias-state-error-primary)', margin: 0 } }, 'A non-fatal error occurred while rendering settings.'),
            h('pre', { style: { fontSize: '12px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', overflow: 'auto' } }, String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)),
            h('div', { style: { display: 'flex', gap: '8px' } },
              h('button', {
                type: 'button',
                style: { padding: '6px 14px', borderRadius: '6px', border: 'none', background: 'var(--dsw-alias-primary, #6366f1)', color: '#fff', cursor: 'pointer' },
                onClick: function () { _this.setState({ hasError: false, error: null }); }
              }, 'Retry'),
              h('button', {
                type: 'button',
                style: { padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--dsw-alias-border-l2)', background: 'transparent', color: 'inherit', cursor: 'pointer' },
                onClick: this.props && this.props.onClose
              }, 'Close')
            )
          );
        }
        return this.props && this.props.children;
      };
      return SettingsPanelErrorBoundary;
    }(React ? React.Component : undefined));

    function SelectDropdownMenu(props) {
      var open = props.open, onClose = props.onClose, items = props.items, onSelect = props.onSelect;
      var menuRef = React.useRef(null);

      React.useEffect(function () {
        if (!open) return;
        var handlePointerDown = function (e) {
          if (menuRef.current && !menuRef.current.contains(e.target)) {
            onClose();
          }
        };
        document.addEventListener("pointerdown", handlePointerDown);
        return function () { document.removeEventListener("pointerdown", handlePointerDown); };
      }, [open, onClose]);

      if (!open) return null;

      var alignRight = Boolean(props && props.align === 'right');
      return h(
        "div",
        {
          ref: menuRef,
          style: {
            position: "absolute",
            top: "100%",
            left: alignRight ? "auto" : "0",
            right: alignRight ? "0" : "auto",
            marginTop: "6px",
            zIndex: 99999,
            minWidth: "190px",
            background: "var(--dsw-alias-surface-l0, #1e1e2e)",
            border: "1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25))",
            borderRadius: "8px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            padding: "4px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          },
          onClick: function (e) { e.stopPropagation(); }
        },
        items.map(function (item) {
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
                padding: "8px 10px",
                borderRadius: "6px",
                border: "none",
                background: "transparent",
                color: item.danger ? "#f85149" : "var(--dsw-alias-label-primary)",
                fontSize: "13px",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "inherit",
              },
              onMouseEnter: function (e) { e.currentTarget.style.background = "var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.15))"; },
              onMouseLeave: function (e) { e.currentTarget.style.background = "transparent"; },
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

    function NewSessionButton(props) {
      var wide = props.wide, startSession = props.startSession, t = props.t;
      var menuState = React.useState(false);
      var menuOpen = menuState[0], setMenuOpen = menuState[1];

      var handleSelect = function (id) {
        if (id === "chat") {
          startSession();
        } else if (id === "terminal") {
          window.dispatchEvent(new CustomEvent("dsh:open-terminal", { detail: { session: "0" } }));
        } else if (id === "container") {
          window.dispatchEvent(new CustomEvent("dsh:open-container", { detail: { id: null } }));
        }
      };

      return h("div", { style: { position: "relative", width: "100%" } },
        h(P.Tooltip, { label: "New", delayMs: 500, disabled: wide },
          h("button", {
            type: "button",
            className: "dsh-tw-newSession",
            "aria-label": "New",
            onClick: function (e) {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            },
          },
            h(NotepadPencilGlyph, { size: wide ? 16 : 18 }),
            wide ? h("span", { className: "dsh-tw-newSessionLabel dsh-tw-wide" }, "New") : null,
            wide ? h("svg", { width: 12, height: 12, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "dsh-icon-animated", style: { marginLeft: "auto", opacity: 0.6 } }, h("polyline", { points: "6 9 12 15 18 9" })) : null
          )
        ),
        h(SelectDropdownMenu, {
          open: menuOpen,
          onClose: function () { setMenuOpen(false); },
          items: [
            { id: "chat", label: "New Chat Session", icon: h(ChatGlyph, { size: 14 }) },
            { id: "terminal", label: "New Terminal Session", icon: h(TerminalsGlyph, { size: 14 }) },
            { id: "container", label: "New Sandbox Container", icon: h(ContainersGlyph, { size: 14 }) },
          ],
          onSelect: handleSelect,
        })
      );
    }

    function TweaksSidebarRoot(props) {
      var collapsed = props.collapsed, width = props.width, startSession = props.startSession;
      var toggleSidebar = props.toggleSidebar, t = props.t, renderSlot = props.renderSlot;
      var useSessions = props.useSessions;

      var currentWidth = width || 240;

      React.useEffect(function () {
        if (typeof document !== 'undefined') {
          document.documentElement.style.setProperty('--dsh-sidebar-width', (collapsed ? 56 : currentWidth) + 'px');
        }
      }, [currentWidth, collapsed]);

      React.useEffect(function () {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('dsh_sidebar_collapsed', collapsed ? 'true' : 'false');
        }
      }, [collapsed]);

      var settledState = React.useState(collapsed);
      var settled = settledState[0], setSettled = settledState[1];
      React.useEffect(function () {
        if (!collapsed) { setSettled(false); return; }
        var timer = window.setTimeout(function () { setSettled(true); }, COLLAPSE_SETTLE_MS);
        return function () { window.clearTimeout(timer); };
      }, [collapsed]);
      var wide = !collapsed || !settled;

      var lastWideWidth = React.useRef(currentWidth);
      if (!collapsed) lastWideWidth.current = currentWidth;

      var everWide = React.useRef(!collapsed);
      if (!collapsed) everWide.current = true;

      var column = React.useRef(null);
      var pointerState = React.useState(false);
      var pointerInside = pointerState[0], setPointerInside = pointerState[1];
      var lingerTimer = React.useRef(undefined);
      var armLinger = function () {
        if (lingerTimer.current !== undefined) return;
        lingerTimer.current = window.setTimeout(function () {
          lingerTimer.current = undefined;
          setPointerInside(false);
        }, SCROLLBAR_LINGER_MS);
      };
      var cancelLinger = function () {
        window.clearTimeout(lingerTimer.current);
        lingerTimer.current = undefined;
      };
      React.useEffect(function () {
        if (!pointerInside) return;
        var onMove = function (event) {
          var rect = column.current && column.current.getBoundingClientRect();
          if (rect === undefined) return;
          var inside = event.clientX >= rect.left && event.clientX < rect.right
            && event.clientY >= rect.top && event.clientY < rect.bottom;
          if (inside) cancelLinger();
          else armLinger();
        };
        document.addEventListener('pointermove', onMove);
        return function () {
          document.removeEventListener('pointermove', onMove);
          cancelLinger();
        };
      }, [pointerInside]);

      React.useEffect(function () {
        var onKeyDown = function (e) {
          var target = e.target;
          var isEditable = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

          var customKeybind = null;
          try {
            var raw = localStorage.getItem('dsh_keybind_toggle_sidebar');
            if (raw) customKeybind = JSON.parse(raw);
          } catch (err) {}

          var matched = false;
          if (customKeybind) {
            var ctrlMatch = customKeybind.ctrl ? (e.ctrlKey || e.metaKey) : (!e.ctrlKey && !e.metaKey);
            var altMatch = customKeybind.alt ? e.altKey : !e.altKey;
            var shiftMatch = customKeybind.shift ? e.shiftKey : !e.shiftKey;
            var keyMatch = customKeybind.key && customKeybind.key.toLowerCase() === e.key.toLowerCase();
            if (ctrlMatch && altMatch && shiftMatch && keyMatch) matched = true;
          } else {
            // Default Ctrl+B / Cmd+B
            if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'b' || e.key === 'B')) {
              matched = true;
            }
          }

          if (matched) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
          }
        };

        window.addEventListener('keydown', onKeyDown, { capture: true });
        return function () { window.removeEventListener('keydown', onKeyDown, { capture: true }); };
      }, [toggleSidebar]);

      var className = 'dsh-tw-root';
      if (!wide) className += ' dsh-tw-collapsed';
      if (!wide && everWide.current) className += ' dsh-tw-railIn';
      if (collapsed && wide) className += ' dsh-tw-fading';
      if (!pointerInside) className += ' dsh-tw-quietBars';
      var style = wide ? { width: collapsed ? lastWideWidth.current : currentWidth } : undefined;

      return h('div', {
        ref: column,
        className: className,
        style: style,
        onPointerEnter: function () { cancelLinger(); setPointerInside(true); },
        onPointerLeave: function () { armLinger(); },
      },
        h('div', { className: 'dsh-tw-logoRow' },
          wide
            ? h('button', { type: 'button', className: 'dsh-tw-brand dsh-tw-wide', 'aria-label': t('session.new.label'), onClick: function () { startSession(); } }, h(P.BrandWordmark))
            : null,
          h(P.Tooltip, { label: collapsed ? t('toggle.open') : t('toggle.collapse'), delayMs: 500 },
            h('button', { type: 'button', className: 'dsh-tw-iconButton dsh-tw-toggle', 'aria-label': collapsed ? t('toggle.open') : t('toggle.collapse'), onClick: function () { toggleSidebar(); } },
              !wide ? h(P.FishLogo, { className: 'dsh-tw-railFish', size: 24 }) : null,
              h("svg", {
                width: wide ? 16 : 18,
                height: wide ? 16 : 18,
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: "dsh-tw-panelIcon dsh-icon-animated"
              },
                h("rect", { width: "18", height: "18", x: "3", y: "3", rx: "2" }),
                h("path", { d: "M9 3v18" })
              )))),
        h(P.Tooltip, { label: 'New', delayMs: 500, disabled: wide },
          h('button', {
            type: 'button',
            className: 'dsh-tw-newSession' + (!wide ? ' dsh-tw-collapsed' : ''),
            'aria-label': 'New',
            onClick: function () { startSession(); }
          },
            h(NotepadPencilGlyph, { size: wide ? 16 : 18 }),
            wide ? h('span', { className: 'dsh-tw-newSessionLabel dsh-tw-wide' }, 'New') : null
          )
        ),
        h('div', { className: 'dsh-tw-regionArea' },
          (typeof window !== "undefined" && window.__dsh_UnifiedWorkspacesBrowser)
            ? h(window.__dsh_UnifiedWorkspacesBrowser, {
                wide: wide,
                expandSidebar: function () { if (collapsed) toggleSidebar(); },
                useSessions: props.useSessions,
                useWorkspaces: props.useWorkspaces,
                startSession: props.startSession,
                open: props.open,
                renameSession: props.renameSession,
                archiveSession: props.archiveSession,
                forkSession: props.forkSession,
                createWorkspace: props.createWorkspace,
              })
            : renderSlot('sidebar.workspaces', {
                wide: wide,
                expandSidebar: function () { if (collapsed) toggleSidebar(); },
              })),
        h('div', { className: 'dsh-tw-footArea' },
          h('div', { className: 'dsh-tw-footerActions' }, renderSlot('sidebar.footer.action', { wide: wide })),
          h('div', { className: 'dsh-tw-settingsArea' }, renderSlot('sidebar.settings', { wide: wide }))));
    }

    function TriggerContent(props) {
      var wide = Boolean(props && props.wide);
      var t = props && props.t;
      var label = (typeof t === 'function') ? t('trigger') : 'Settings';
      return h(Fragment, null,
        h("svg", {
          width: wide ? 16 : 18,
          height: wide ? 16 : 18,
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          className: "dsh-icon-animated dsh-icon-spinOnHover",
          style: { display: "inline-flex", verticalAlign: "middle", flexShrink: 0 }
        },
          h("path", { d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }),
          h("circle", { cx: "12", cy: "12", r: "3" })
        ),
        wide ? h('span', { className: 'dsh-tw-triggerLabel', style: { marginLeft: '8px' } }, label || 'Settings') : null
      );
    }

    function HeaderContent(props) {
      var t = props.t;
      return h(Fragment, null, (typeof t === 'function') ? t('title') : 'Settings');
    }

    function CloseLabel(props) {
      var t = props.t;
      return h(Fragment, null, (typeof t === 'function') ? t('close') : 'Close');
    }

    function GeneralSection(props) {
      var noticeState = React.useState(function () {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        return window.localStorage.getItem('dsh_suppress_welcome_notice') === 'false';
      });
      var noticeEnabled = noticeState[0], setNoticeEnabled = noticeState[1];

      var searchState = React.useState(function () {
        if (typeof window === 'undefined' || !window.localStorage) return true;
        return window.localStorage.getItem('dsh_show_sidebar_search') !== 'false';
      });
      var searchEnabled = searchState[0], setSearchEnabled = searchState[1];

      var swapSidebarsState = React.useState(function () {
        if (typeof window === 'undefined' || !window.localStorage) return false;
        return window.localStorage.getItem('dsh_swap_sidebars') === 'true';
      });
      var swapSidebars = swapSidebarsState[0], setSwapSidebars = swapSidebarsState[1];

      var defaultModeState = React.useState(function () {
        try { return localStorage.getItem('dsh_default_preset') || 'code'; } catch (e) { return 'code'; }
      });
      var defaultMode = defaultModeState[0], setDefaultMode = defaultModeState[1];

      var permissionState = React.useState(function () {
        try { return localStorage.getItem('dsh_permission_preset') || 'danger-full-access'; } catch (e) { return 'danger-full-access'; }
      });
      var permissionPreset = permissionState[0], setPermissionPreset = permissionState[1];

      var enterBehaviorState = React.useState(function () {
        try { return localStorage.getItem('dsh_send_on_enter') !== 'false'; } catch (e) { return true; }
      });
      var sendOnEnter = enterBehaviorState[0], setSendOnEnter = enterBehaviorState[1];

      var showThinkingState = React.useState(function () {
        try { return localStorage.getItem('dsh_show_reasoning_trace') !== 'false'; } catch (e) { return true; }
      });
      var showThinking = showThinkingState[0], setShowThinking = showThinkingState[1];

      var autoScrollState = React.useState(function () {
        try { return localStorage.getItem('dsh_auto_scroll_stream') !== 'false'; } catch (e) { return true; }
      });
      var autoScroll = autoScrollState[0], setAutoScroll = autoScrollState[1];

      var handleToggleNotice = function (e) {
        var checked = e.target.checked;
        setNoticeEnabled(checked);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('dsh_suppress_welcome_notice', checked ? 'false' : 'true');
        }
      };

      var handleToggleSearch = function (e) {
        var checked = e.target.checked;
        setSearchEnabled(checked);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('dsh_show_sidebar_search', checked ? 'true' : 'false');
          window.dispatchEvent(new CustomEvent('dsh:sidebar-search-toggle', { detail: { enabled: checked } }));
        }
      };

      var handleToggleSwapSidebars = function (e) {
        var checked = e.target.checked;
        setSwapSidebars(checked);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('dsh_swap_sidebars', checked ? 'true' : 'false');
          window.dispatchEvent(new CustomEvent('dsh:sidebars-swapped', { detail: { swapped: checked } }));
          if (document.body) {
            if (checked) document.body.classList.add('dsh-sidebars-swapped');
            else document.body.classList.remove('dsh-sidebars-swapped');
          }
        }
      };

      return h('div', { className: 'dsh-tw-section', style: { display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '780px' } },
        h('div', null,
          h('h2', { style: { margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, 'General Preferences'),
          h('p', { style: { margin: 0, fontSize: '13px', color: 'var(--dsw-alias-label-secondary)' } }, 'Configure default modes, execution permissions, chat composer behavior, and window layout.')
        ),
        // 1. Default Mode Picker
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', background: 'var(--dsw-alias-surface-l1, rgba(128,128,128,0.04))', border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))' } },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } },
            h('div', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, 'Default Agent Preset / Mode'),
            h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, 'Preset applied when creating new conversation sessions')
          ),
          h('select', {
            value: defaultMode,
            onChange: function (e) {
              setDefaultMode(e.target.value);
              try { localStorage.setItem('dsh_default_preset', e.target.value); } catch (err) {}
            },
            style: { padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--dsw-alias-border-l1)', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)', fontSize: '13px', cursor: 'pointer' }
          },
            h('option', { value: 'code' }, 'Code (Pair Programmer)'),
            h('option', { value: 'architect' }, 'Architect (Design & Plan)'),
            h('option', { value: 'ask' }, 'Ask (Quick Q&A)'),
            h('option', { value: 'standard' }, 'Standard (Full Harness)')
          )
        ),
        // 2. Permission Preset
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', background: 'var(--dsw-alias-surface-l1, rgba(128,128,128,0.04))', border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))' } },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } },
            h('div', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, 'Execution Permission Level'),
            h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, 'Control tool invocation and shell command execution permissions')
          ),
          h('select', {
            value: permissionPreset,
            onChange: function (e) {
              setPermissionPreset(e.target.value);
              try { localStorage.setItem('dsh_permission_preset', e.target.value); } catch (err) {}
            },
            style: { padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--dsw-alias-border-l1)', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)', fontSize: '13px', cursor: 'pointer' }
          },
            h('option', { value: 'danger-full-access' }, 'Full Access (Autonomous Execution)'),
            h('option', { value: 'confirm-destructive' }, 'Confirm Destructive Actions'),
            h('option', { value: 'read-only' }, 'Read-Only (Ask for edits)')
          )
        ),
        // 3. Enter Key Behavior
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', background: 'var(--dsw-alias-surface-l1, rgba(128,128,128,0.04))', border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))' } },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } },
            h('div', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, 'Send Message on Enter'),
            h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, 'When disabled, Cmd+Enter sends and Enter adds a new line')
          ),
          h('input', {
            type: 'checkbox',
            checked: sendOnEnter,
            onChange: function (e) {
              setSendOnEnter(e.target.checked);
              try { localStorage.setItem('dsh_send_on_enter', e.target.checked ? 'true' : 'false'); } catch (err) {}
            },
            style: { width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--dsw-alias-primary, #6366f1)' },
          })
        ),
        // 4. Stream Reasoning Trace
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', background: 'var(--dsw-alias-surface-l1, rgba(128,128,128,0.04))', border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))' } },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } },
            h('div', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, 'Show Thinking & Reasoning Trace'),
            h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, 'Display collapsible model internal thinking trace during agent responses')
          ),
          h('input', {
            type: 'checkbox',
            checked: showThinking,
            onChange: function (e) {
              setShowThinking(e.target.checked);
              try { localStorage.setItem('dsh_show_reasoning_trace', e.target.checked ? 'true' : 'false'); } catch (err) {}
            },
            style: { width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--dsw-alias-primary, #6366f1)' },
          })
        ),
        // 5. Auto Scroll
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', background: 'var(--dsw-alias-surface-l1, rgba(128,128,128,0.04))', border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))' } },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } },
            h('div', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, 'Auto-Scroll During Stream'),
            h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, 'Automatically follow new message tokens to bottom of chat')
          ),
          h('input', {
            type: 'checkbox',
            checked: autoScroll,
            onChange: function (e) {
              setAutoScroll(e.target.checked);
              try { localStorage.setItem('dsh_auto_scroll_stream', e.target.checked ? 'true' : 'false'); } catch (err) {}
            },
            style: { width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--dsw-alias-primary, #6366f1)' },
          })
        ),
        // 6. Sidebar Search
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', background: 'var(--dsw-alias-surface-l1, rgba(128,128,128,0.04))', border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))' } },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } },
            h('div', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, 'Sidebar Search Bar'),
            h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, 'Display quick search bar at the top of the sidebar explorer')
          ),
          h('input', {
            type: 'checkbox',
            checked: searchEnabled,
            onChange: handleToggleSearch,
            style: { width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--dsw-alias-primary, #6366f1)' },
          })
        ),
        // 7. Swap Sidebars
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', background: 'var(--dsw-alias-surface-l1, rgba(128,128,128,0.04))', border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))' } },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } },
            h('div', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, 'Swap Main & Secondary Sidebars'),
            h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, 'Position the Main Sidebar on the right and the Secondary Sidebar dock on the left')
          ),
          h('input', {
            type: 'checkbox',
            checked: swapSidebars,
            onChange: handleToggleSwapSidebars,
            style: { width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--dsw-alias-primary, #6366f1)' },
          })
        ),
        // 8. Internal Testing Notice
        h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', background: 'var(--dsw-alias-surface-l1, rgba(128,128,128,0.04))', border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))' } },
          h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px' } },
            h('div', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, 'Internal Testing Notice'),
            h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, 'Show the internal testing notice modal dialog on startup')
          ),
          h('input', {
            type: 'checkbox',
            checked: noticeEnabled,
            onChange: handleToggleNotice,
            style: { width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--dsw-alias-primary, #6366f1)' },
          })
        )
      );
    }

    function PluginsSettingsSection() {
      var pluginList = [
        { id: 'dsh-actions', name: 'Actions & Shortcuts', desc: 'Session modes, slash commands, hotkey actions', version: '0.1.0' },
        { id: 'dsh-agents', name: 'Agents & Personas', desc: 'Custom agent personas, system prompts, role rosters', version: '0.1.0' },
        { id: 'dsh-credentials', name: 'Credentials Vault', desc: 'Encrypted API key vault with biometric & hardware lock', version: '0.1.0' },
        { id: 'dsh-dialects', name: 'Dialect Transforms', desc: 'Multi-dialect prompt templates and model translation', version: '0.1.0' },
        { id: 'dsh-formatters', name: 'Code Formatters', desc: 'Multi-language code formatting on file edit', version: '0.1.0' },
        { id: 'dsh-hosts', name: 'Deploy & Cluster', desc: 'Multi-machine cluster nodes, remote deploy, mesh ingress', version: '0.1.0' },
        { id: 'dsh-loops', name: 'Autonomous Work Loops', desc: 'Background agent loops, continuous build, DarkFactory', version: '0.1.0' },
        { id: 'dsh-lsp', name: 'Language Server Protocol', desc: 'Real-time typechecking, diagnostics, symbol outline', version: '0.1.0' },
        { id: 'dsh-providers', name: 'Providers & Workspaces', desc: 'Filesystem explorer, monorepo hierarchy, tabs & models', version: '0.1.0' },
        { id: 'dsh-repos', name: 'Repository Parity', desc: 'Full GitHub repository parity: code, diffs, commits, branches', version: '0.1.0' },
        { id: 'dsh-themes', name: 'Themes & Appearance', desc: 'OLED pitch black, accent colors, theme switching', version: '0.1.0' },
        { id: 'dsh-tools', name: 'Tools & MCP Engine', desc: 'Tool registry, Model Context Protocol server connectors', version: '0.1.0' },
        { id: 'dsh-translator', name: 'Real-time Translator', desc: 'Cross-language translation for assistant dialogues', version: '0.1.0' },
        { id: 'dsh-tui', name: 'Terminal UI (TUI)', desc: 'Terminal user interface with split panes and interactive controls', version: '0.1.0' },
        { id: 'dsh-tweaks', name: 'UI & Layout Tweaks', desc: 'Layout customizer, keybind recorder, settings manager', version: '0.1.0' },
        { id: 'dsh-voice', name: 'Voice & Speech Engine', desc: 'Voice input speech-to-text and audio response playback', version: '0.1.0' },
      ];

      var reloadingState = React.useState(null);
      var reloadingId = reloadingState[0], setReloadingId = reloadingState[1];

      var handleReloadPlugin = function (pId) {
        setReloadingId(pId);
        setTimeout(function () {
          setReloadingId(null);
        }, 600);
      };

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px' } },
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
          h('div', null,
            h('h2', { style: { margin: '0 0 4px', fontSize: '18px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, 'Harness Plugins (' + pluginList.length + ')'),
            h('p', { style: { margin: 0, fontSize: '13px', color: 'var(--dsw-alias-label-secondary)' } }, 'Monorepo plugins extending the DeepSeek Harness platform.')
          ),
          h('span', { style: { padding: '3px 10px', borderRadius: '12px', background: 'rgba(63, 185, 80, 0.15)', color: '#3fb950', fontSize: '12px', fontWeight: 700 } }, '16/16 Active')
        ),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '12px' } },
          pluginList.map(function (p) {
            var isReloading = reloadingId === p.id;
            return h('div', {
              key: p.id,
              style: {
                padding: '14px 16px',
                borderRadius: '10px',
                border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))',
                background: 'var(--dsw-alias-surface-l1, rgba(128,128,128,0.03))',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }
            },
              h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
                h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                  h('span', { style: { width: '8px', height: '8px', borderRadius: '50%', background: '#3fb950', boxShadow: '0 0 6px rgba(63,185,80,0.5)' } }),
                  h('strong', { style: { fontSize: '14px', color: 'var(--dsw-alias-label-primary)' } }, p.name)
                ),
                h('span', { style: { fontSize: '11px', padding: '1px 6px', borderRadius: '4px', background: 'rgba(128,128,128,0.15)', color: 'var(--dsw-alias-label-secondary)', fontFamily: 'var(--ds-font-mono, monospace)' } }, 'v' + p.version)
              ),
              h('div', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)', lineHeight: '18px' } }, p.desc),
              h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.1))' } },
                h('code', { style: { fontSize: '11px', color: 'var(--dsw-alias-primary, #6366f1)' } }, p.id),
                h('button', {
                  type: 'button',
                  onClick: function () { handleReloadPlugin(p.id); },
                  disabled: isReloading,
                  style: {
                    padding: '3px 8px',
                    borderRadius: '5px',
                    border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.2))',
                    background: 'transparent',
                    color: 'var(--dsw-alias-label-secondary)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }
                }, isReloading ? 'Reloaded ✔' : 'Reload')
              )
            );
          })
        )
      );
    }

    function createObservable(initial) {
      var snapshot = initial;
      var listeners = new Set();
      return {
        getSnapshot: function () { return snapshot; },
        subscribe: function (listener) {
          listeners.add(listener);
          return function () { listeners.delete(listener); };
        },
        update: function (fn) {
          var next = fn(snapshot);
          if (next === snapshot) return;
          snapshot = next;
          listeners.forEach(function (listener) { listener(); });
        },
      };
    }

    function messageOf(error) {
      return error instanceof Error ? error.message : String(error);
    }

    // Local re-implementation of the harness SettingsDocumentStore: the
    // snapshot-store engine (dsh-client-runtime/client) is not a platform seed
    // word, so the state rides a hand-rolled observable bound through the
    // framework-made bindSnapshotSelector.
    function SettingsDocumentStore(api) {
      this.api = api;
      this.observable = createObservable({ status: 'idle', opening: false, error: null });
      this.generation = 0;
    }

    SettingsDocumentStore.prototype.load = function () {
      var self = this;
      var generation = ++this.generation;
      this.observable.update(function (state) { return { status: 'loading', opening: state.opening, error: null }; });
      return this.api.settings.describe({}).then(function (response) {
        if (generation !== self.generation) return;
        var result = response.result;
        if (!result.ok) {
          self.observable.update(function (state) { return { status: 'unavailable', opening: state.opening, error: result.error.message }; });
          return;
        }
        self.observable.update(function (state) { return { status: result.value.hasDocument ? 'ready' : 'unavailable', opening: state.opening, error: null }; });
      }, function (error) {
        if (generation !== self.generation) return;
        self.observable.update(function (state) { return { status: 'unavailable', opening: state.opening, error: messageOf(error) }; });
      });
    };

    SettingsDocumentStore.prototype.open = function () {
      var self = this;
      var current = this.observable.getSnapshot();
      if (current.status !== 'ready' || current.opening) return;
      this.observable.update(function (state) { return { status: state.status, opening: true, error: null }; });
      return this.api.settings.openDocument({}).then(function (response) {
        if (!response.result.ok) throw new Error(response.result.error.message);
      }, function (error) {
        throw messageOf(error);
      }).catch(function (error) {
        self.observable.update(function (state) { return { status: state.status, opening: state.opening, error: messageOf(error) }; });
      }).then(function () {
        self.observable.update(function (state) { return { status: state.status, opening: false, error: state.error }; });
      });
    };

    function refreshDocumentIfLoaded(controller) {
      if (controller === undefined || controller.observable.getSnapshot().status === 'idle') return;
      controller.load();
    }

    function SettingsDocumentAction(props) {
      var controller = props.controller, useSnapshot = props.useSnapshot, t = props.t;
      var state = useSnapshot(function (s) { return s; });
      React.useEffect(function () { controller.load(); }, [controller]);
      if (state.status !== 'ready') return null;
      return h('div', { className: 'dsh-tw-action' },
        state.error === null ? null : h('span', { className: 'dsh-tw-error', role: 'alert' }, t('openDocument.error')),
        h(P.Button, { variant: 'outline', size: 'sm', disabled: state.opening, onClick: function () { controller.open(); } }, t('openDocument')));
    }

    function KeybindsSettingsSection() {
      var isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      var defaultSidebarKey = isMac ? '⌘B' : 'Ctrl+B';

      var customKeybindState = React.useState(function () {
        try {
          return localStorage.getItem('dsh_keybind_toggle_sidebar_label') || defaultSidebarKey;
        } catch (e) {
          return defaultSidebarKey;
        }
      });
      var sidebarKeyLabel = customKeybindState[0], setSidebarKeyLabel = customKeybindState[1];

      var recordingState = React.useState(false);
      var isRecording = recordingState[0], setIsRecording = recordingState[1];

      var handleRecordKey = React.useCallback(function (e) {
        if (!isRecording) return;
        e.preventDefault();
        e.stopPropagation();

        if (e.key === 'Escape') {
          setIsRecording(false);
          return;
        }

        var parts = [];
        if (e.ctrlKey || e.metaKey) parts.push(isMac ? '⌘' : 'Ctrl');
        if (e.altKey) parts.push(isMac ? '⌥' : 'Alt');
        if (e.shiftKey) parts.push(isMac ? '⇧' : 'Shift');

        var keyName = e.key.toUpperCase();
        if (['CONTROL', 'META', 'ALT', 'SHIFT'].indexOf(keyName) !== -1) return;
        parts.push(keyName);

        var label = parts.join(isMac ? '' : '+');
        var spec = {
          ctrl: Boolean(e.ctrlKey || e.metaKey),
          alt: Boolean(e.altKey),
          shift: Boolean(e.shiftKey),
          key: e.key.toLowerCase(),
        };

        try {
          localStorage.setItem('dsh_keybind_toggle_sidebar', JSON.stringify(spec));
          localStorage.setItem('dsh_keybind_toggle_sidebar_label', label);
        } catch (err) {}

        setSidebarKeyLabel(label);
        setIsRecording(false);
      }, [isRecording, isMac]);

      React.useEffect(function () {
        if (isRecording) {
          window.addEventListener('keydown', handleRecordKey, { capture: true });
          return function () { window.removeEventListener('keydown', handleRecordKey, { capture: true }); };
        }
      }, [isRecording, handleRecordKey]);

      var handleReset = function () {
        try {
          localStorage.removeItem('dsh_keybind_toggle_sidebar');
          localStorage.removeItem('dsh_keybind_toggle_sidebar_label');
        } catch (e) {}
        setSidebarKeyLabel(defaultSidebarKey);
        setIsRecording(false);
      };

      var shortcuts = [
        {
          id: 'toggle-sidebar',
          title: 'Toggle Sidebar',
          description: 'Collapse or expand the navigation sidebar rail (Ctrl + B)',
          keyLabel: isRecording ? 'Press keys (or Esc)…' : sidebarKeyLabel,
          isConfigurable: true,
        },
        {
          id: 'new-session',
          title: 'New Chat Session',
          description: 'Start a new conversation in current workspace',
          keyLabel: isMac ? '⌘N' : 'Ctrl+N',
        },
        {
          id: 'quick-search',
          title: 'Search Workspaces & Sessions',
          description: 'Focus workspace search or command query',
          keyLabel: isMac ? '⌘K' : 'Ctrl+K',
        },
        {
          id: 'settings',
          title: 'Open Settings',
          description: 'Open the preferences and customization modal',
          keyLabel: isMac ? '⌘,' : 'Ctrl+,',
        },
        {
          id: 'terminal-toggle',
          title: 'Toggle Terminal Overlay',
          description: 'Quickly open or close full-screen terminal',
          keyLabel: isMac ? '⌘`' : 'Ctrl+`',
        },
      ];

      return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '760px' } },
        h('div', null,
          h('h2', { style: { margin: '0 0 6px', fontSize: '18px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, 'Keyboard Shortcuts'),
          h('p', { style: { margin: 0, fontSize: '13px', color: 'var(--dsw-alias-label-secondary)' } }, 'Configure workspace navigation hotkeys and global panel triggers.')
        ),
        h('div', { style: { display: 'flex', flexDirection: 'column', gap: '10px' } },
          shortcuts.map(function (s) {
            return h('div', {
              key: s.id,
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))',
                background: 'var(--dsw-alias-surface-l1, rgba(128,128,128,0.04))',
              },
            },
              h('div', { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
                h('span', { style: { fontSize: '14px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, s.title),
                h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)' } }, s.description)
              ),
              h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                s.isConfigurable
                  ? h('button', {
                      type: 'button',
                      onClick: function () { setIsRecording(!isRecording); },
                      style: {
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: isRecording ? '1px solid #6366f1' : '1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25))',
                        background: isRecording ? 'rgba(99, 102, 241, 0.15)' : 'var(--dsw-alias-surface-l2, rgba(128,128,128,0.08))',
                        color: isRecording ? '#6366f1' : 'var(--dsw-alias-label-primary)',
                        cursor: 'pointer',
                        minWidth: '70px',
                        textAlign: 'center',
                        fontFamily: 'var(--ds-font-mono, monospace)',
                      },
                    }, s.keyLabel)
                  : h('kbd', {
                      style: {
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: '1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25))',
                        background: 'var(--dsw-alias-surface-l2, rgba(128,128,128,0.08))',
                        color: 'var(--dsw-alias-label-primary)',
                        fontFamily: 'var(--ds-font-mono, monospace)',
                      },
                    }, s.keyLabel),
                s.isConfigurable && sidebarKeyLabel !== defaultSidebarKey
                  ? h('button', {
                      type: 'button',
                      onClick: handleReset,
                      title: 'Reset to default',
                      style: {
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        border: '1px solid var(--dsw-alias-border-l2)',
                        background: 'transparent',
                        color: 'var(--dsw-alias-label-secondary)',
                        cursor: 'pointer',
                      },
                    }, 'Reset')
                  : null
              )
            );
          })
        )
      );
    }

    function SettingsPanel(props) {
      var rows = props.rows, renderSlot = props.renderSlot, activeId = props.activeId;
      var onSelect = props.onSelect, onClose = props.onClose, openSection = props.openSection;
      var active;
      var found = false;
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].id === activeId) { active = rows[i].id; found = true; break; }
      }
      if (!found) active = rows.length > 0 ? rows[0].id : undefined;
      var titleId = React.useId();

      React.useEffect(function () {
        var onKeyDown = function (e) { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKeyDown);
        return function () { document.removeEventListener('keydown', onKeyDown); };
      }, [onClose]);

      var closeButton = React.useRef(null);
      React.useEffect(function () { if (closeButton.current) closeButton.current.focus(); }, []);

      var PERSONALIZATION_IDS = new Set(['general', 'themes', 'appearance', 'icons', 'keybinds', 'keybindings']);
      var CUSTOMIZATION_IDS = new Set(['agents', 'actions', 'session-modes', 'commands', 'agent-presets', 'modes', 'tools', 'loops', 'plugins']);
      var INTEGRATION_IDS = new Set(['providers', 'accounts', 'models', 'apps', 'hosts', 'terminals', 'containers']);

      var personalRows = [];
      var customRows = [];
      var integRows = [];
      var otherRows = [];

      for (var rIdx = 0; rIdx < rows.length; rIdx++) {
        var r = rows[rIdx];
        if (r.id === 'themes') r = Object.assign({}, r, { label: 'Appearance' });
        if (r.id === 'icons') r = Object.assign({}, r, { label: 'Icons' });
        if (r.id === 'providers') r = Object.assign({}, r, { label: 'Providers' });
        if (r.id === 'agent-presets') r = Object.assign({}, r, { label: 'Modes' });
        if (r.id === 'actions' || r.id === 'session-modes') r = Object.assign({}, r, { label: 'Commands' });
        if (r.id === 'keybinds') r = Object.assign({}, r, { label: 'Keybinds' });

        if (PERSONALIZATION_IDS.has(r.id)) {
          personalRows.push(r);
        } else if (CUSTOMIZATION_IDS.has(r.id)) {
          customRows.push(r);
        } else if (INTEGRATION_IDS.has(r.id)) {
          integRows.push(r);
        } else {
          otherRows.push(r);
        }
      }

      var navWidthState = React.useState(function () {
        if (typeof window !== 'undefined' && window.localStorage) {
          var saved = parseInt(window.localStorage.getItem('dsh_settings_nav_width'), 10);
          if (!isNaN(saved) && saved >= 120 && saved <= 400) return saved;
        }
        return 192;
      });
      var navWidth = navWidthState[0], setNavWidth = navWidthState[1];

      var navCollapsedState = React.useState(function () {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem('dsh_settings_nav_collapsed') === 'true';
        }
        return false;
      });
      var isNavCollapsed = navCollapsedState[0], setIsNavCollapsed = navCollapsedState[1];

      var windowSizeState = React.useState(function () {
        var w = 860;
        var h = Math.min(800, (typeof window !== 'undefined' ? window.innerHeight - 60 : 760));
        if (typeof window !== 'undefined' && window.localStorage) {
          var savedW = parseInt(window.localStorage.getItem('dsh_settings_window_width'), 10);
          var savedH = parseInt(window.localStorage.getItem('dsh_settings_window_height'), 10);
          if (!isNaN(savedW) && savedW >= 480 && savedW <= (window.innerWidth - 16)) w = savedW;
          if (!isNaN(savedH) && savedH >= 340 && savedH <= (window.innerHeight - 16)) h = savedH;
        }
        return { w: w, h: h };
      });
      var windowSize = windowSizeState[0], setWindowSize = windowSizeState[1];
      var isWindowResizingState = React.useState(false);
      var isWindowResizing = isWindowResizingState[0], setIsWindowResizing = isWindowResizingState[1];

      var isResizingState = React.useState(false);
      var isResizing = isResizingState[0], setIsResizing = isResizingState[1];

      var dialogPosState = React.useState({ x: 0, y: 0 });
      var dialogPos = dialogPosState[0], setDialogPos = dialogPosState[1];

      // Drag modal window handler
      var handleHeaderPointerDown = function (e) {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('a')) return;
        e.preventDefault();
        var startX = e.clientX - dialogPos.x;
        var startY = e.clientY - dialogPos.y;

        var onMove = function (moveEv) {
          setDialogPos({
            x: moveEv.clientX - startX,
            y: moveEv.clientY - startY,
          });
        };
        var onUp = function () {
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
      };

      // Resize settings window handler (direction: 'se', 'e', 's')
      var handleWindowResizePointerDown = function (e, direction) {
        e.preventDefault();
        e.stopPropagation();
        setIsWindowResizing(true);
        var startX = e.clientX;
        var startY = e.clientY;
        var startW = windowSize.w;
        var startH = windowSize.h;

        var onMove = function (moveEv) {
          var deltaX = moveEv.clientX - startX;
          var deltaY = moveEv.clientY - startY;
          var nextW = startW;
          var nextH = startH;

          if (direction.indexOf('e') !== -1) {
            nextW = Math.max(480, Math.min(window.innerWidth - 16, startW + deltaX));
          }
          if (direction.indexOf('s') !== -1) {
            nextH = Math.max(340, Math.min(window.innerHeight - 16, startH + deltaY));
          }

          setWindowSize({ w: nextW, h: nextH });
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('dsh_settings_window_width', String(nextW));
            window.localStorage.setItem('dsh_settings_window_height', String(nextH));
          }
        };

        var onUp = function () {
          setIsWindowResizing(false);
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
      };

      // Resize nav width handler
      var handleResizePointerDown = function (e) {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        var startX = e.clientX;
        var startW = isNavCollapsed ? 56 : navWidth;

        var onMove = function (moveEv) {
          var delta = moveEv.clientX - startX;
          var nextW = Math.max(130, Math.min(380, startW + delta));
          setNavWidth(nextW);
          if (isNavCollapsed && nextW > 90) {
            setIsNavCollapsed(false);
            if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.setItem('dsh_settings_nav_collapsed', 'false');
            }
          }
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('dsh_settings_nav_width', String(nextW));
          }
        };
        var onUp = function () {
          setIsResizing(false);
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
      };

      var toggleNavCollapse = function (e) {
        e.stopPropagation();
        setIsNavCollapsed(function (prev) {
          var next = !prev;
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('dsh_settings_nav_collapsed', next ? 'true' : 'false');
          }
          return next;
        });
      };

      var collapsedGroupsState = React.useState({});
      var collapsedGroups = collapsedGroupsState[0], setCollapsedGroups = collapsedGroupsState[1];

      function toggleGroup(groupName) {
        setCollapsedGroups(function (s) {
          var n = Object.assign({}, s);
          n[groupName] = !n[groupName];
          return n;
        });
      }

      function renderNavRow(row) {
        return h('button', {
          key: row.id,
          type: 'button',
          title: isNavCollapsed ? row.label : undefined,
          className: 'dsh-tw-navCell' + (row.id === active ? ' dsh-tw-active' : ''),
          'aria-current': row.id === active ? 'true' : undefined,
          onClick: function () { onSelect(row.id); },
        },
          navGlyph(renderSlot, row),
          !isNavCollapsed ? h('span', { className: 'dsh-tw-navLabel' }, row.label) : null);
      }

      function renderGroupHeader(label, count) {
        if (isNavCollapsed) return null;
        var isCollapsed = Boolean(collapsedGroups[label]);
        return h('button', {
          key: 'header-' + label,
          type: 'button',
          className: 'dsh-tw-navGroupHeader',
          onClick: function () { toggleGroup(label); },
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.6px',
            color: 'var(--dsw-alias-label-tertiary, #888)',
            textTransform: 'uppercase',
            padding: '10px 10px 4px 10px',
            cursor: 'pointer',
            textAlign: 'left',
            userSelect: 'none',
            marginTop: '4px',
            transition: 'color 120ms ease',
          },
          onMouseEnter: function (e) { e.currentTarget.style.color = 'var(--dsw-alias-label-primary)'; },
          onMouseLeave: function (e) { e.currentTarget.style.color = 'var(--dsw-alias-label-tertiary, #888)'; },
        },
          h('span', {
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '14px',
              height: '14px',
              transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
              color: 'inherit',
            },
          }, h(TriangleRightFill14, { size: 10 })),
          h('span', { style: { flex: 1 } }, label),
          count ? h('span', { style: { fontSize: '10px', opacity: 0.6, fontWeight: 600 } }, count) : null
        );
      }

      var currentNavWidth = isNavCollapsed ? 56 : navWidth;

      return h('div', {
        className: 'dsh-tw-panel',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': titleId,
        style: {
          width: windowSize.w + 'px',
          height: windowSize.h + 'px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 32px)',
          transform: 'translate(' + dialogPos.x + 'px, ' + dialogPos.y + 'px)',
          userSelect: (isResizing || isWindowResizing) ? 'none' : 'auto',
        },
      },
        h('nav', {
          className: 'dsh-tw-nav' + (isNavCollapsed ? ' dsh-tw-navCollapsed' : ''),
          style: { width: currentNavWidth + 'px' },
        },
          h('div', {
            className: 'dsh-tw-navTitleRow dsh-tw-draggableHeader',
            onPointerDown: handleHeaderPointerDown,
          },
            !isNavCollapsed ? h('div', { className: 'dsh-tw-navTitle', id: titleId }, (typeof renderSlot === 'function' ? renderSlot('settings.header', {}) : 'Settings')) : null,
            h('button', {
              type: 'button',
              className: 'dsh-tw-navCollapseBtn',
              title: isNavCollapsed ? 'Expand sidebar' : 'Collapse sidebar',
              onClick: toggleNavCollapse,
            }, h(SidebarCollapseIcon, { size: 16 }))
          ),
          h('div', { className: 'dsh-tw-navList' },
            personalRows.length > 0 ? renderGroupHeader('Personalization', personalRows.length) : null,
            !collapsedGroups['Personalization'] ? personalRows.map(renderNavRow) : null,
            customRows.length > 0 ? renderGroupHeader('Customization', customRows.length) : null,
            !collapsedGroups['Customization'] ? customRows.map(renderNavRow) : null,
            integRows.length > 0 ? renderGroupHeader('Integrations', integRows.length) : null,
            !collapsedGroups['Integrations'] ? integRows.map(renderNavRow) : null,
            otherRows.length > 0 ? renderGroupHeader('Other', otherRows.length) : null,
            !collapsedGroups['Other'] ? otherRows.map(renderNavRow) : null
          ),
          h('div', {
            className: 'dsh-tw-navResizer' + (isResizing ? ' dsh-tw-resizing' : ''),
            onPointerDown: handleResizePointerDown,
            title: 'Drag to resize settings sidebar',
          })
        ),
        h('div', { className: 'dsh-tw-content' },
          h('div', {
            className: 'dsh-tw-header dsh-tw-draggableHeader',
            onPointerDown: handleHeaderPointerDown,
          },
            h('div', { className: 'dsh-tw-actions' }, (typeof renderSlot === 'function' ? renderSlot('settings.action', {}) : null)),
            h('button', { ref: closeButton, type: 'button', className: 'dsh-tw-close', onClick: onClose },
              h(CloseIcon, { size: 14 }),
              h('span', { className: 'dsh-tw-hiddenLabel' }, (typeof renderSlot === 'function' ? renderSlot('settings.close', {}) : 'Close')))),
          h('div', { className: 'dsh-tw-options' },
            active !== undefined && typeof renderSlot === 'function'
              ? (function () {
                  try {
                    return renderSlot('settings.section', { close: onClose, openSection: openSection }, { only: active });
                  } catch (e) {
                    console.warn('Failed rendering settings section ' + active, e);
                    return h('div', { style: { padding: '20px', color: 'var(--dsw-alias-state-error-primary)' } }, 'Section ' + active + ' unavailable');
                  }
                })()
              : null)),
        // Bottom-Right Corner Resize Handle
        h('div', {
          className: 'dsh-tw-window-resize-handle dsh-tw-resize-corner',
          onPointerDown: function (e) { handleWindowResizePointerDown(e, 'se'); },
          title: 'Drag corner to resize settings window',
          style: {
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: '32px',
            height: '32px',
            cursor: 'nwse-resize',
            zIndex: 40,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            padding: '6px',
            boxSizing: 'border-box',
            userSelect: 'none',
          },
        },
          h('svg', { width: 14, height: 14, viewBox: '0 0 14 14', fill: 'none', 'aria-hidden': 'true', style: { opacity: 0.55, color: 'var(--dsw-alias-label-secondary)' } },
            h('path', { d: 'M12 2L2 12M12 6L6 12M12 10L10 12', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round' })
          )
        ),
        // Right Edge Resize Handle
        h('div', {
          className: 'dsh-tw-window-resize-handle dsh-tw-resize-e',
          onPointerDown: function (e) { handleWindowResizePointerDown(e, 'e'); },
          title: 'Drag right edge to resize width',
          style: {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: '32px',
            width: '12px',
            cursor: 'ew-resize',
            zIndex: 30,
          },
        }),
        // Bottom Edge Resize Handle
        h('div', {
          className: 'dsh-tw-window-resize-handle dsh-tw-resize-s',
          onPointerDown: function (e) { handleWindowResizePointerDown(e, 's'); },
          title: 'Drag bottom edge to resize height',
          style: {
            position: 'absolute',
            left: 0,
            bottom: 0,
            right: '32px',
            height: '12px',
            cursor: 'ns-resize',
            zIndex: 30,
          },
        })
      );
    }

    function TweaksSettingsRoot(props) {
      var wide = Boolean(props && props.wide);
      var useSections = props && props.useSections;
      var useOnboardingSteps = props && props.useOnboardingSteps;
      var useSessions = props && props.useSessions;
      var renderSlot = props && props.renderSlot;

      var openState = React.useState(false);
      var open = openState[0], setOpen = openState[1];
      var activeState = React.useState(undefined);
      var activeId = activeState[0], setActiveId = activeState[1];
      var completedState = React.useState(function () { return new Set(); });
      var completedOnboarding = completedState[0], setCompletedOnboarding = completedState[1];

      var close = React.useCallback(function () {
        setOpen(false);
        setActiveId(undefined);
      }, []);
      var openSection = React.useCallback(function (id) {
        setActiveId(id);
        setOpen(true);
      }, []);

      React.useEffect(function () {
        var onOpenSettings = function (e) {
          var sec = (e && e.detail && e.detail.section) ? e.detail.section : undefined;
          if (sec) setActiveId(sec);
          setOpen(true);
        };
        window.addEventListener('dsh:open-settings', onOpenSettings);
        return function () {
          window.removeEventListener('dsh:open-settings', onOpenSettings);
        };
      }, []);

      var rawRows = [];
      if (typeof useSections === 'function') {
        try { rawRows = useSections(function (s) { return s; }) || []; } catch (err) {}
      } else if (props && Array.isArray(props.sections)) {
        rawRows = props.sections;
      }
      if (!rawRows || rawRows.length === 0) {
        rawRows = [
          { id: 'general', label: 'General', order: 0 },
          { id: 'models', label: 'Models', order: 10 },
          { id: 'providers', label: 'Providers & Quotas', order: 20 },
          { id: 'keybinds', label: 'Keybinds', order: 35 },
          { id: 'themes', label: 'Themes', order: 40 },
          { id: 'formatters', label: 'Formatters', order: 50 },
          { id: 'lsp', label: 'Language Servers', order: 60 },
          { id: 'tools', label: 'Tools', order: 70 },
          { id: 'agents', label: 'Agents', order: 80 },
          { id: 'repos', label: 'Repositories', order: 90 },
          { id: 'actions', label: 'Actions', order: 100 },
          { id: 'voice', label: 'Voice', order: 110 },
        ];
      }
      var SUPPRESSED_SECTIONS = new Set(['provider-status', 'provider-usage', 'keychain', 'integrations']);
      var seenIds = new Set();
      var rows = [];
      for (var k = 0; k < rawRows.length; k++) {
        var r = rawRows[k];
        if (!r || !r.id || SUPPRESSED_SECTIONS.has(r.id) || seenIds.has(r.id)) continue;
        seenIds.add(r.id);
        rows.push(r);
      }

      var onboardingSteps = [];
      if (typeof useOnboardingSteps === 'function') {
        try { onboardingSteps = useOnboardingSteps(function (s) { return s; }) || []; } catch (err) {}
      }

      var onboardingActive = false;
      if (typeof useSessions === 'function') {
        try {
          onboardingActive = useSessions(function (state) {
            return state && state.phase === 'ready'
              && (state.current === undefined || (state.byId && state.byId[state.current] && state.byId[state.current].blank === true));
          });
        } catch (err) {}
      }

      var onboardingStep;
      if (onboardingActive) {
        for (var i = 0; i < onboardingSteps.length; i++) {
          if (!completedOnboarding.has(onboardingSteps[i].id)) { onboardingStep = onboardingSteps[i]; break; }
        }
      }

      React.useEffect(function () {
        if (onboardingActive) return;
        setCompletedOnboarding(new Set());
      }, [onboardingActive]);

      var completeOnboardingStep = React.useCallback(function (id) {
        setCompletedOnboarding(function (previous) {
          if (previous.has(id)) return previous;
          var next = new Set(previous);
          next.add(id);
          return next;
        });
      }, []);

      return h(Fragment, null,
        wide
          ? h('button', {
            type: 'button',
            className: 'dsh-tw-trigger',
            'aria-haspopup': 'dialog',
            'aria-expanded': open,
            'data-action': 'open-settings',
            title: 'Settings',
            onClick: function (e) {
              if (e) { e.preventDefault(); e.stopPropagation(); }
              setOpen(true);
            },
          },
            (renderSlot && typeof renderSlot === 'function')
              ? renderSlot('settings.trigger', { wide: true })
              : h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '8px' } },
                  h(SettingsIcon, { size: 16 }),
                  h('span', { className: 'dsh-tw-triggerLabel' }, 'Settings')
                )
          )
          : h(P.Tooltip, { label: 'Settings', delayMs: 500 },
              h('button', {
                type: 'button',
                className: 'dsh-tw-trigger dsh-tw-rail',
                'aria-haspopup': 'dialog',
                'aria-expanded': open,
                'data-action': 'open-settings',
                'aria-label': 'Settings',
                onClick: function (e) {
                  if (e) { e.preventDefault(); e.stopPropagation(); }
                  setOpen(true);
                },
              },
                h(SettingsIcon, { size: 18 })
              )
            ),
        open
          ? (ReactDOM && typeof ReactDOM.createPortal === 'function' && typeof document !== 'undefined'
              ? ReactDOM.createPortal(
                  h('div', { className: 'dsh-tw-overlay', role: 'presentation' },
                    h('div', { className: 'dsh-tw-mask', 'aria-hidden': 'true', onClick: close }),
                    h(SettingsPanelErrorBoundary, { onClose: close },
                      h(SettingsPanel, {
                        rows: rows,
                        renderSlot: renderSlot,
                        activeId: activeId,
                        onSelect: setActiveId,
                        onClose: close,
                        openSection: openSection,
                      })
                    )
                  ),
                  document.body
                )
              : h(SettingsPanelErrorBoundary, { onClose: close },
                  h(SettingsPanel, {
                    rows: rows,
                    renderSlot: renderSlot,
                    activeId: activeId,
                    onSelect: setActiveId,
                    onClose: close,
                    openSection: openSection,
                  })
                ))
          : null,
        (onboardingStep !== undefined && renderSlot && typeof renderSlot === 'function')
          ? renderSlot('settings.onboarding', {
            stepId: onboardingStep.id,
            complete: function () { completeOnboardingStep(onboardingStep.id); },
            openSection: openSection,
          }, { only: onboardingStep.id })
          : null);
    }

    // Ledger -> nav-row / coordinator projections as observable sources (uSES
    // contract: getSnapshot returns the cached rows until the ledger or the
    // locale revision moves). Ported from ui-settings-general's apply.
    function makeShellInjected(ctx) {
      var rowsVersion = -1;
      var rowsRevision = -1;
      var rows = [];
      var onboardingVersion = -1;
      var onboardingSteps = [];
      return function () {
        return {
          hooks: {
            sections: {
              getSnapshot: function () {
                var version = ctx.slots.getVersion('settings.section');
                var revision = ctx.locale.getSnapshot().revision;
                if (version !== rowsVersion || revision !== rowsRevision) {
                  rowsVersion = version;
                  rowsRevision = revision;
                  rows = ctx.slots.entries('settings.section')
                    .map(function (e) {
                      var lbl = '';
                      try {
                        if (typeof e.options.label === 'function') lbl = e.options.label();
                        else if (typeof e.options.label === 'string') lbl = e.options.label;
                        else if (resolveSlotLabel) lbl = resolveSlotLabel(e.options.label);
                      } catch (err) {
                        lbl = e.options.id || '';
                      }
                      return {
                        id: e.options.id !== undefined ? e.options.id : '',
                        order: e.options.order !== undefined ? e.options.order : 0,
                        label: lbl || e.options.id || '',
                      };
                    })
                    .sort(function (a, b) { return a.order - b.order; });
                }
                return rows;
              },
              subscribe: function (listener) {
                var offLedger = ctx.slots.subscribe('settings.section', listener);
                var offLocale = ctx.locale.subscribe(listener);
                return function () { offLedger(); offLocale(); };
              },
            },
            onboardingSteps: {
              getSnapshot: function () {
                var version = ctx.slots.getVersion('settings.onboarding');
                if (version !== onboardingVersion) {
                  onboardingVersion = version;
                  onboardingSteps = ctx.slots.entries('settings.onboarding')
                    .map(function (e) {
                      return {
                        id: e.options.id !== undefined ? e.options.id : '',
                        order: e.options.order !== undefined ? e.options.order : 0,
                      };
                    })
                    .sort(function (a, b) { return a.order - b.order; });
                }
                return onboardingSteps;
              },
              subscribe: function (listener) {
                return ctx.slots.subscribe('settings.onboarding', listener);
              },
            },
          },
        };
      };
    }

    function apply(ctx) {
      ctx.effect(function () { ctx.locale.register('sidebar', { zh: SIDEBAR_ZH, en: SIDEBAR_EN }); }, 'dsh-tweaks: sidebar dictionaries');
      ctx.effect(function () { ctx.locale.register('settings', { zh: SETTINGS_ZH, en: SETTINGS_EN }); }, 'dsh-tweaks: settings dictionaries');

      var tSettings = ctx.locale.bind('settings');
      var connection = ctx.get('connection');
      var documentController = connection && connection.api ? new SettingsDocumentStore(connection.api) : undefined;
      var documentInjected = documentController === undefined
        ? undefined
        : (function () {
          var useSnapshot = bindSnapshotSelector(documentController.observable);
          return function () { return { controller: documentController, useSnapshot: useSnapshot }; };
        })();
      ctx.effect(function () {
        ctx.on('connection/reset', function () { refreshDocumentIfLoaded(documentController); });
      }, 'dsh-tweaks: metadata invalidations');

      var startSession = function (workspaceId) { ctx.workspaces.startSession(workspaceId); };
      var sidebarInjected = function () {
        return {
          startSession: startSession,
          toggleSidebar: function () { ctx.layout.toggleSidebar(); },
        };
      };
      ctx.slots.inject('sidebar', function () {
        return ctx.slots.register({
          name: 'sidebar',
          priority: -10,
          locale: 'sidebar',
          children: {
            'sidebar.workspaces': { kind: 'single', scope: 'root' },
            'sidebar.settings': { kind: 'single', scope: 'root' },
            'sidebar.footer.action': { kind: 'list', scope: 'root' },
            'sidebar.newSession': { kind: 'single', scope: 'root' },
            'sidebar.history': { kind: 'single', scope: 'root' },
          },
          inject: sidebarInjected,
        }, TweaksSidebarRoot);
      }, 'dsh-tweaks: sidebar registration');

      ctx.slots.inject('sidebar.newSession', function () {
        return ctx.slots.register({
          name: 'sidebar.newSession',
          locale: 'sidebar',
          inject: function () { return { startSession: startSession }; },
        }, NewSessionButton);
      }, 'dsh-tweaks: new session content');

      ctx.slots.inject('sidebar.settings', function () {
        return ctx.slots.register({
          name: 'sidebar.settings',
          priority: -10,
          children: {
            'settings.trigger': { kind: 'single', scope: 'root' },
            'settings.header': { kind: 'single', scope: 'root' },
            'settings.action': { kind: 'list', scope: 'root' },
            'settings.close': { kind: 'single', scope: 'root' },
            'settings.section': { kind: 'list', scope: 'root' },
            'settings.onboarding': { kind: 'list', scope: 'root' },
            'settings.section.icon': { kind: 'list', scope: 'root' },
          },
          inject: makeShellInjected(ctx),
        }, TweaksSettingsRoot);
      }, 'dsh-tweaks: settings shell');

      ctx.slots.inject('settings.trigger', function () {
        return ctx.slots.register({ name: 'settings.trigger', locale: 'settings' }, TriggerContent);
      }, 'dsh-tweaks: trigger content');
      ctx.slots.inject('settings.header', function () {
        return ctx.slots.register({ name: 'settings.header', locale: 'settings' }, HeaderContent);
      }, 'dsh-tweaks: header content');
      ctx.slots.inject('settings.close', function () {
        return ctx.slots.register({ name: 'settings.close', locale: 'settings' }, CloseLabel);
      }, 'dsh-tweaks: close label');
      if (documentInjected !== undefined) {
        ctx.slots.inject('settings.action', function () {
          return ctx.slots.register({
            name: 'settings.action',
            id: 'open-document',
            order: 0,
            locale: 'settings',
            inject: documentInjected,
          }, SettingsDocumentAction);
        }, 'dsh-tweaks: open-document action');
      }
      ctx.slots.inject('settings.section', function () {
        return ctx.slots.register({
          name: 'settings.section',
          id: 'general',
          priority: -10,
          order: 0,
          label: function () { return tSettings('general.nav'); },
          locale: 'settings',
          children: { 'settings.general.item': { kind: 'list', scope: 'root' } },
        }, GeneralSection);
      }, 'dsh-tweaks: general section');

      ctx.slots.inject('settings.section', function () {
        return ctx.slots.register({
          name: 'settings.section',
          id: 'keybinds',
          priority: -10,
          order: 35,
          label: function () { return 'Keybinds'; },
          inject: function () { return {}; },
        }, KeybindsSettingsSection);
      }, 'dsh-tweaks: keybinds section');

      ctx.slots.inject('settings.section', function () {
        return ctx.slots.register({
          name: 'settings.section',
          id: 'plugins',
          priority: -10,
          order: 30,
          label: function () { return 'Plugins'; },
          inject: function () { return {}; },
        }, PluginsSettingsSection);
      }, 'dsh-tweaks: plugins section');

      // Harness-owned sections cannot register a glyph from their own bundles
      // (the harness checkout is kept pristine), so dsh-tweaks owns the three
      // mark seats — models, plugins, agent-presets — under the shared
      // settings.section.icon seat keyed by section id.
      function GeneralGlyph() { return navIcon('general'); }
      function ModelsGlyph() { return navIcon('models'); }
      function PluginsGlyph() { return navIcon('plugins'); }
      function AgentPresetsGlyph() { return navIcon('agent-presets'); }
      function KeybindsGlyph() { return navIcon('keybinds'); }
      function harnessGlyph(id, component) {
        return function () {
          return ctx.slots.register({
            name: 'settings.section.icon',
            id: id,
            priority: -10,
            order: 0,
          }, component);
        };
      }
      ctx.slots.inject('settings.section.icon', harnessGlyph('general', GeneralGlyph), 'dsh-tweaks: general nav glyph');
      ctx.slots.inject('settings.section.icon', harnessGlyph('keybinds', KeybindsGlyph), 'dsh-tweaks: keybinds nav glyph');
      ctx.slots.inject('settings.section.icon', harnessGlyph('plugins', PluginsGlyph), 'dsh-tweaks: plugins nav glyph');
      ctx.slots.inject('settings.section.icon', harnessGlyph('agent-presets', AgentPresetsGlyph), 'dsh-tweaks: agent presets nav glyph');

      // 1. Session header utilities: 3-dots with View Switcher and Download Log
      function SessionHeaderUtilities(props) {
        var sessionId = props.sessionId;
        var menuState = React.useState(false);
        var menuOpen = menuState[0], setMenuOpen = menuState[1];
        var busyState = React.useState(false);
        var busy = busyState[0], setBusy = busyState[1];
        var trajState = React.useState(false);
        var isTrajectory = trajState[0], setIsTrajectory = trajState[1];

        var checkIsTrajectory = function () {
          var activeTab = document.querySelector('[role="tab"][aria-selected="true"]');
          if (activeTab) {
            var txt = (activeTab.textContent || '').trim().toLowerCase();
            return txt === 'trajectory' || txt.includes('trajectory') || txt === '轨迹' || txt.includes('轨迹');
          }
          return Boolean(document.querySelector('[class*="TrajectoryView"], [class*="trajectoryView"], [aria-label*="Trajectory"]'));
        };

        React.useEffect(function () {
          var update = function () { setIsTrajectory(checkIsTrajectory()); };
          update();
          var timer = setInterval(update, 400);
          return function () { clearInterval(timer); };
        }, []);

        var handleToggleView = function () {
          setMenuOpen(false);
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

          setTimeout(function () {
            setIsTrajectory(checkIsTrajectory());
          }, 80);
        };

        var handleDownloadLog = function () {
          setMenuOpen(false);
          setBusy(true);
          try {
            var exportUrl = '/api/session.export?id=' + encodeURIComponent(sessionId || '');
            var a = document.createElement('a');
            a.href = exportUrl;
            a.download = (sessionId || 'session') + '.jsonl';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
              if (a.parentNode) a.parentNode.removeChild(a);
              setBusy(false);
            }, 1000);
          } catch (e) {
            setBusy(false);
          }
        };

        var items = [
          {
            id: 'toggle-view',
            label: isTrajectory ? 'Switch to Chat View' : 'Switch to Trajectory View',
            icon: h(isTrajectory ? ChatGlyph : BranchIcon, { size: 14 }),
          },
          {
            id: 'download-log',
            label: busy ? 'Exporting log…' : 'Download Session Log',
            icon: h(DownloadIcon, { size: 14 }),
            disabled: busy,
          },
        ];

        return h('div', { style: { position: 'relative', display: 'inline-flex', alignItems: 'center' } },
          h('button', {
            type: 'button',
            className: 'dsh-header-ellipsis-btn',
            title: 'Session Options (…)',
            'aria-label': 'Session Options',
            style: {
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: 'none',
              background: menuOpen ? 'var(--dsw-alias-interactive-bg-hover, rgba(255,255,255,0.08))' : 'transparent',
              color: 'var(--dsw-alias-label-secondary)',
              cursor: 'pointer',
              transition: 'background 100ms, color 100ms',
            },
            onClick: function (e) {
              e.stopPropagation();
              setIsTrajectory(checkIsTrajectory());
              setMenuOpen(!menuOpen);
            },
          }, h(EllipsisIcon, { size: 16 })),
          menuOpen ? h(SelectDropdownMenu, {
            open: true,
            align: 'right',
            onClose: function () { setMenuOpen(false); },
            items: items,
            onSelect: function (id) {
              if (id === 'toggle-view') handleToggleView();
              else if (id === 'download-log') handleDownloadLog();
            },
          }) : null
        );
      }

      ctx.slots.inject('conversation.session.header.utilities', function () {
        return ctx.slots.register({
          name: 'conversation.session.header.utilities',
          id: 'dsh-session-utilities',
          priority: -10,
          order: 0,
        }, SessionHeaderUtilities);
      }, 'dsh-tweaks: 3-dots session header utilities');

      // 2. Subagents Dock above input bar
      function SubagentsDock(props) {
        var sessionId = props.sessionId;
        var useSessions = props.useSessions;
        var openChild = props.openChild;
        var sessionsState = (typeof useSessions === 'function') ? useSessions(function (s) { return s; }) : null;
        var subagentsMap = sessionsState && sessionsState.subagentsByParent ? sessionsState.subagentsByParent : {};
        var rawSubagents = (sessionId && subagentsMap[sessionId]) ? subagentsMap[sessionId].entries || [] : [];
        var summaries = sessionsState && sessionsState.summaries ? sessionsState.summaries : {};
        
        var collapsedState = React.useState(true);
        var collapsed = collapsedState[0], setCollapsed = collapsedState[1];

        if (!rawSubagents || rawSubagents.length === 0) return null;

        var runningCount = 0;
        var completedCount = 0;
        var childList = rawSubagents.map(function (entry) {
          var cId = entry.childSessionId || entry.id;
          var summary = summaries[cId] || {};
          var title = summary.displayTitle || summary.title || entry.name || entry.role || ('Subagent ' + (cId ? cId.slice(0, 6) : ''));
          var role = (entry.role || entry.mode || summary.role || summary.mode || 'subagent').toLowerCase();
          var isRunning = entry.activity === 'running' || summary.status === 'running';
          var tokens = summary.usage ? (summary.usage.totalTokens || summary.usage.outputTokens) : null;
          var tokenStr = tokens ? (tokens > 1000 ? (tokens / 1000).toFixed(1) + 'k tokens' : tokens + ' tokens') : '';

          if (isRunning) runningCount++;
          else completedCount++;
          return {
            id: cId,
            title: title,
            role: role,
            isRunning: isRunning,
            tokenStr: tokenStr,
            address: entry.address || { parentSessionId: sessionId, childSessionId: cId },
          };
        });

        var progressParts = [];
        if (runningCount > 0) progressParts.push(runningCount + ' active');
        if (completedCount > 0) progressParts.push(completedCount + ' completed');
        var progressStr = progressParts.join(' · ') || (childList.length + ' subagents');

        var getRoleBadgeStyle = function (role) {
          if (role.indexOf('plan') !== -1 || role.indexOf('reason') !== -1) {
            return { bg: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' };
          } else if (role.indexOf('exec') !== -1) {
            return { bg: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' };
          } else if (role.indexOf('research') !== -1) {
            return { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' };
          } else if (role.indexOf('orch') !== -1) {
            return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' };
          }
          return { bg: 'rgba(128, 128, 128, 0.15)', color: 'var(--dsw-alias-label-secondary)' };
        };

        return h('section', {
          className: 'dsh-subagents-dock',
          style: {
            boxSizing: 'border-box',
            flex: 'none',
            overflow: 'hidden',
            margin: '0 auto 6px auto',
            width: '100%',
            maxWidth: '776px',
            border: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.15))',
            borderRadius: '12px',
            background: 'var(--dsw-specific-tip, rgba(30,30,30,0.85))',
          },
        },
          h('div', {
            className: 'dsh-subagents-dock-header',
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              height: '36px',
              padding: '4px 5px 4px 12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              userSelect: 'none',
              boxSizing: 'border-box',
            },
            onClick: function () { setCollapsed(!collapsed); },
          },
            h(GoalIcon, { size: 14, style: { color: 'var(--dsw-alias-label-secondary)' } }),
            h('span', { style: { fontSize: '13px', fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, 'Subagents'),
            h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-secondary)', marginLeft: '4px' } }, progressStr),
            h('span', {
              style: {
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '16px',
                height: '16px',
                transition: 'transform 150ms ease',
                transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                color: 'var(--dsw-alias-label-tertiary)',
              },
            }, h(TriangleRightFill14, { size: 10 }))
          ),
          !collapsed ? h('div', {
            className: 'dsh-subagents-dock-body',
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: '4px 12px 10px 12px',
              borderTop: '1px solid var(--dsw-alias-border-l1, rgba(128,128,128,0.1))',
            },
          },
            childList.map(function (sub) {
              var badge = getRoleBadgeStyle(sub.role);
              return h('div', {
                key: sub.id,
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  color: 'var(--dsw-alias-label-primary)',
                  transition: 'background 100ms',
                },
                className: 'dsh-subagent-dock-row',
                onClick: function (e) {
                  e.stopPropagation();
                  if (openChild) openChild(sub.address);
                  else window.dispatchEvent(new CustomEvent('dsh:open-session', { detail: { sessionId: sub.id } }));
                },
              },
                h('span', {
                  style: {
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: sub.isRunning ? 'var(--dsw-alias-state-success-primary, #22c55e)' : 'var(--dsw-alias-label-tertiary, #888)',
                    boxShadow: sub.isRunning ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
                    flexShrink: 0,
                  },
                }),
                h('span', {
                  style: {
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: badge.bg,
                    color: badge.color,
                    flexShrink: 0,
                  }
                }, sub.role),
                h('span', { style: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, sub.title),
                sub.tokenStr ? h('span', { style: { fontSize: '11px', color: 'var(--dsw-alias-label-tertiary)', flexShrink: 0 } }, sub.tokenStr) : null,
                h('span', { style: { fontSize: '11px', color: sub.isRunning ? '#4ade80' : 'var(--dsw-alias-label-tertiary)', flexShrink: 0 } }, sub.isRunning ? 'running' : 'done')
              );
            })
          ) : null
        );
      }

      ctx.slots.inject('conversation.input.dock', function () {
        return ctx.slots.register({
          name: 'conversation.input.dock',
          id: 'dsh-subagents-dock',
          order: 5,
          inject: function () {
            return {
              openChild: function (address) {
                if (ctx.sessions && typeof ctx.sessions.openSubagent === 'function') {
                  ctx.sessions.openSubagent(address);
                } else if (address && address.childSessionId) {
                  window.dispatchEvent(new CustomEvent('dsh:open-session', { detail: { sessionId: address.childSessionId } }));
                }
              },
            };
          },
        }, SubagentsDock);
      }, 'dsh-tweaks: subagents dock above input bar');

      // 3. Shadow header subagent catalog and agent-preset
      ctx.slots.inject('conversation.session.header.actions', function () {
        return ctx.slots.register({
          name: 'conversation.session.header.actions',
          id: 'subagent-catalog',
          priority: -20,
          order: 10,
        }, function () { return null; });
      }, 'dsh-tweaks: hide header subagent catalog');

      ctx.slots.inject('conversation.session.header.actions', function () {
        return ctx.slots.register({
          name: 'conversation.session.header.actions',
          id: 'agent-preset',
          priority: -20,
          order: -10,
        }, function () { return null; });
      }, 'dsh-tweaks: hide header agent-preset');

      // APP-WIDE CUSTOM RIGHT-CLICK CONTEXT MENU ABSTRACTION
      if (typeof document !== 'undefined') {
        var oldContainer = document.getElementById('dsh-global-context-menu');
        if (oldContainer && oldContainer.parentNode) {
          oldContainer.parentNode.removeChild(oldContainer);
        }
        if (window.__dsh_cleanup_context_menu__) {
          try { window.__dsh_cleanup_context_menu__(); } catch (e) {}
        }

        var menuContainer = document.createElement('div');
        menuContainer.id = 'dsh-global-context-menu';
        menuContainer.style.position = 'fixed';
        menuContainer.style.zIndex = '9999999';
        menuContainer.style.display = 'none';
        document.body.appendChild(menuContainer);

        var closeMenu = function () {
          menuContainer.style.display = 'none';
          menuContainer.innerHTML = '';
        };

        var onKeyDown = function (e) { if (e.key === 'Escape') closeMenu(); };
        var onContextMenu = function (e) {
          e.preventDefault();
          e.stopPropagation();

          var icons = {
            chat: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
            terminal: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>',
            container: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
            cut: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
            copy: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
            paste: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>',
            rename: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
            close: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
            appearance: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 10 10 0 0 0 0-20"/></svg>',
            settings: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
            reload: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
          };

          var x = e.clientX;
          var y = e.clientY;
          var selectedText = window.getSelection ? window.getSelection().toString() : '';
          var targetEl = e.target;
          var isEditable = targetEl && (targetEl.tagName === 'INPUT' || targetEl.tagName === 'TEXTAREA' || targetEl.isContentEditable);
          var sessionEl = targetEl ? targetEl.closest('[data-session-id], [class*="historyRow"], [class*="chatTab"]') : null;
          var workspaceEl = targetEl ? targetEl.closest('[data-workspace-id], [class*="workspaceRow"]') : null;
          var targetSessionId = sessionEl ? (sessionEl.getAttribute('data-session-id') || sessionEl.getAttribute('data-id')) : null;
          var targetWorkspaceId = workspaceEl ? (workspaceEl.getAttribute('data-workspace-id') || workspaceEl.getAttribute('data-id')) : null;

          var items = [];

          // 1. Contextual Items (Rename / Close / Delete)
          if (sessionEl) {
            items.push({
              id: 'rename-session',
              label: 'Rename Conversation',
              icon: icons.rename,
              action: function () {
                window.dispatchEvent(new CustomEvent('dsh:rename-session', { detail: { id: targetSessionId } }));
              }
            });
            items.push({
              id: 'close-session',
              label: 'Close / Archive Session',
              icon: icons.close,
              action: function () {
                window.dispatchEvent(new CustomEvent('dsh:close-session', { detail: { id: targetSessionId } }));
              }
            });
            items.push({ type: 'divider' });
          } else if (workspaceEl) {
            items.push({
              id: 'rename-workspace',
              label: 'Rename Workspace',
              icon: icons.rename,
              action: function () {
                window.dispatchEvent(new CustomEvent('dsh:rename-workspace', { detail: { id: targetWorkspaceId } }));
              }
            });
            items.push({
              id: 'close-workspace',
              label: 'Close Workspace',
              icon: icons.close,
              action: function () {
                window.dispatchEvent(new CustomEvent('dsh:delete-workspace', { detail: { id: targetWorkspaceId } }));
              }
            });
            items.push({ type: 'divider' });
          }

          // 2. Clipboard actions
          if (selectedText) {
            if (isEditable) {
              items.push({
                id: 'cut',
                label: 'Cut',
                icon: icons.cut,
                action: function () {
                  navigator.clipboard.writeText(selectedText).then(function () {
                    try { document.execCommand('delete'); } catch (err) {}
                  });
                }
              });
            }
            items.push({
              id: 'copy',
              label: 'Copy ("' + (selectedText.length > 20 ? selectedText.slice(0, 18) + '…' : selectedText) + '")',
              icon: icons.copy,
              action: function () { navigator.clipboard.writeText(selectedText); }
            });
          }

          items.push({
            id: 'paste',
            label: 'Paste',
            icon: icons.paste,
            action: function () {
              navigator.clipboard.readText().then(function (text) {
                if (!text) return;
                try {
                  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.isContentEditable)) {
                    document.execCommand('insertText', false, text);
                  } else {
                    var activeInput = document.querySelector('textarea, input:focus');
                    if (activeInput) {
                      activeInput.value = (activeInput.value || '') + text;
                      activeInput.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  }
                } catch (err) {}
              });
            }
          });

          items.push({ type: 'divider' });

          // 3. Main actions
          items.push({ id: 'chat', label: 'New Conversation', icon: icons.chat, action: function () { startSession(); } });
          items.push({ id: 'terminal', label: 'New Terminal', icon: icons.terminal, action: function () { window.dispatchEvent(new CustomEvent('dsh:open-terminal', { detail: { session: '0' } })); } });
          items.push({ id: 'container', label: 'New Container', icon: icons.container, action: function () { window.dispatchEvent(new CustomEvent('dsh:open-container', { detail: { id: null } })); } });
          items.push({ type: 'divider' });

          items.push({ id: 'appearance', label: 'Appearance & Themes', icon: icons.appearance, action: function () { window.dispatchEvent(new CustomEvent('dsh:open-settings', { detail: { section: 'themes' } })); } });
          items.push({ id: 'settings', label: 'Settings & Preferences', icon: icons.settings, action: function () { window.dispatchEvent(new CustomEvent('dsh:open-settings', { detail: { section: 'general' } })); } });
          items.push({ type: 'divider' });
          items.push({ id: 'reload', label: 'Reload Window', icon: icons.reload, action: function () { window.location.reload(); } });

          menuContainer.innerHTML = '';
          var menuEl = document.createElement('div');
          menuEl.style.minWidth = '220px';
          menuEl.style.background = 'var(--dsw-alias-surface-l0, #181825)';
          menuEl.style.border = '1px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.25))';
          menuEl.style.borderRadius = '10px';
          menuEl.style.boxShadow = '0 12px 36px rgba(0,0,0,0.6)';
          menuEl.style.padding = '5px';
          menuEl.style.display = 'flex';
          menuEl.style.flexDirection = 'column';
          menuEl.style.gap = '2px';
          menuEl.style.fontFamily = 'inherit';

          items.forEach(function (item) {
            if (item.type === 'divider') {
              var div = document.createElement('div');
              div.style.height = '1px';
              div.style.background = 'var(--dsw-alias-border-l1, rgba(128,128,128,0.15))';
              div.style.margin = '4px 0';
              menuEl.appendChild(div);
              return;
            }
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.gap = '10px';
            btn.style.width = '100%';
            btn.style.padding = '8px 12px';
            btn.style.borderRadius = '6px';
            btn.style.border = 'none';
            btn.style.background = 'transparent';
            btn.style.color = 'var(--dsw-alias-label-primary, #fff)';
            btn.style.fontSize = '13px';
            btn.style.textAlign = 'left';
            btn.style.cursor = 'pointer';
            btn.style.fontFamily = 'inherit';

            btn.onmouseenter = function () { btn.style.background = 'var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.15))'; };
            btn.onmouseleave = function () { btn.style.background = 'transparent'; };
            btn.onclick = function (ev) {
              ev.stopPropagation();
              closeMenu();
              item.action();
            };

            var iconSpan = document.createElement('span');
            iconSpan.style.width = '16px';
            iconSpan.style.height = '16px';
            iconSpan.style.display = 'inline-flex';
            iconSpan.style.alignItems = 'center';
            iconSpan.style.justifyContent = 'center';
            iconSpan.style.color = 'var(--dsw-alias-label-secondary, #a8a8a8)';
            iconSpan.innerHTML = item.icon;

            var textSpan = document.createElement('span');
            textSpan.style.flex = '1';
            textSpan.textContent = item.label;

            btn.appendChild(iconSpan);
            btn.appendChild(textSpan);
            menuEl.appendChild(btn);
          });

          menuContainer.appendChild(menuEl);
          menuContainer.style.display = 'block';

          var menuWidth = 220;
          var menuHeight = 240;
          var finalX = (x + menuWidth > window.innerWidth) ? (x - menuWidth) : x;
          var finalY = (y + menuHeight > window.innerHeight) ? (y - menuHeight) : y;

          menuContainer.style.left = Math.max(8, finalX) + 'px';
          menuContainer.style.top = Math.max(8, finalY) + 'px';
        };

        document.addEventListener('click', closeMenu);
        document.addEventListener('scroll', closeMenu, true);
        window.addEventListener('keydown', onKeyDown);
        document.addEventListener('contextmenu', onContextMenu, true);

        window.__dsh_cleanup_context_menu__ = function () {
          document.removeEventListener('click', closeMenu);
          document.removeEventListener('scroll', closeMenu, true);
          window.removeEventListener('keydown', onKeyDown);
          document.removeEventListener('contextmenu', onContextMenu, true);
        };
      }
    }
    //#endregion
    exports.apply = apply;
    exports.inject = ['slots', 'locale', 'layout', 'sessions', 'workspaces', 'connection'];
    return module.exports;
  },
});
