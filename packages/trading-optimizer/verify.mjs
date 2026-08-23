import assert from "node:assert/strict";
import { gridSearch } from "./lib/index.js";

const candles = Array.from({ length: 20 }, (_, time) => ({
  time,
  open: 100 + time,
  high: 101 + time,
  low: 99 + time,
  close: 100 + time,
  volume: 1000,
}));
const evaluations = gridSearch(candles, () => ({ id: "hold", onCandle() {} }), 0.7, {
  size: [1, 2],
  enabled: [true, false],
});
assert.equal(evaluations.length, 4);
console.log("Trading optimizer verification passed.");
