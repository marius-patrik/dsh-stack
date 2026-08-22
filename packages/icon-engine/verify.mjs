import assert from 'node:assert/strict';
import { IconEngine } from './lib/index.js';

const engine = new IconEngine();
engine.registerPack({ id: 'test', label: 'Test', resolve: (key) => key === 'extension:ts' ? 'typescript' : null });
assert.equal(engine.resolve({ extension: '.ts' }), 'typescript');
assert.equal(engine.resolve({ extension: '.unknown' }), 'file');
assert.throws(() => engine.registerPack({ id: 'test', label: 'Duplicate', resolve: () => 'x' }));
console.log('Icon engine verification passed.');
