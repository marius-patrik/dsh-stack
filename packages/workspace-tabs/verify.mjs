import assert from 'node:assert/strict';
import { createWorkspaceTabs, reduceWorkspaceTabs } from './lib/index.js';

let state = createWorkspaceTabs();
state = reduceWorkspaceTabs(state, { type: 'open', tab: { id: 'a', kind: 'file', title: 'a.ts' } });
state = reduceWorkspaceTabs(state, { type: 'open', tab: { id: 'b', kind: 'file', title: 'b.ts' } });
assert.deepEqual(state.panes[state.mainPaneId]?.tabs, ['a', 'b']);
state = reduceWorkspaceTabs(state, { type: 'close-others', tabId: 'b' });
assert.deepEqual(state.panes[state.mainPaneId]?.tabs, ['b']);
state = reduceWorkspaceTabs(state, { type: 'split', sourcePaneId: state.mainPaneId, orientation: 'vertical', tabId: 'b' }, { idFactory: () => 'pane-side' });
assert.equal(state.panes['pane-side']?.activeTabId, 'b');
console.log('Workspace tabs verification passed.');
