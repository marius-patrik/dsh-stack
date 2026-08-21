import assert from 'node:assert';
import * as plugin from './lib/index.js';

assert.strictEqual(plugin.name, 'tab-manager');
assert.strictEqual(typeof plugin.apply, 'function');
assert.ok(Array.isArray(plugin.inject));

const emitted = [];
const ctx = {
  tabManager: null,
  slots: {},
  sessions: {},
  webServer: {},
  emit: (event, data) => emitted.push({ event, data })
};

plugin.apply(ctx, {});
assert.ok(ctx.tabManager);

// 1. Open tabs
ctx.tabManager.openTab({ id: 'chat-1', type: 'chat', title: 'Main Session' });
ctx.tabManager.openTab({ id: 'file-1', type: 'file', title: 'index.ts', path: '/src/index.ts' });
ctx.tabManager.openTab({ id: 'diff-1', type: 'diff', title: 'Diff (main)' });

assert.strictEqual(ctx.tabManager.getTabs().length, 3);
assert.strictEqual(emitted.length, 3);

// 2. Split pane (move diff-1 to split right)
const splitPane = ctx.tabManager.splitPane('pane-main', 'horizontal', 'diff-1');
assert.ok(splitPane.id);
assert.strictEqual(splitPane.tabs.includes('diff-1'), true);

// 3. Close other tabs in main pane
ctx.tabManager.closeOtherTabs('file-1');
const mainPaneTabs = ctx.tabManager.getPanes().find((p) => p.id === 'pane-main')?.tabs;
assert.strictEqual(mainPaneTabs?.length, 1);
assert.strictEqual(mainPaneTabs?.[0], 'file-1');

// 4. Toggle bottom dock
assert.strictEqual(ctx.tabManager.isBottomDockOpen(), false);
assert.strictEqual(ctx.tabManager.toggleBottomDock(true), true);
assert.strictEqual(ctx.tabManager.isBottomDockOpen(), true);

console.log('ux/tab-manager complete verification passed');
