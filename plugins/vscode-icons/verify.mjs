import assert from 'node:assert/strict';
import { VscodeIconThemeRegistry } from './lib/index.js';
import { IconEngine } from '@dsh-stack/icon-engine';

const icons = new IconEngine();
const registry = new VscodeIconThemeRegistry(icons);
registry.register({
  id: 'test',
  label: 'Test',
  fileExtensions: { ts: 'typescript' },
  fileNames: { 'package.json': 'npm' },
  folderNames: { src: 'folder-src' },
  folderNamesExpanded: { src: 'folder-src-open' },
});
assert.equal(registry.list().length, 1);
assert.equal(icons.resolve({ extension: 'ts' }), 'typescript');
assert.equal(icons.resolve({ fileName: 'package.json' }), 'npm');
assert.throws(() => registry.register({ id: 'test', label: 'Duplicate' }));
console.log('VS Code icon plugin verification passed.');
