import assert from "node:assert/strict";
import { runBacktest } from "./lib/index.js";

const candles = Array.from({ length: 4 }, (_, index) => ({
  time: index,
  open: 100 + index,
  high: 101 + index,
  low: 99 + index,
  close: 100 + index,
  volume: 1_000,
}));

let seen = 0;
const result = runBacktest(candles, {
  id: "buy-on-first-close",
  onCandle(context) {
    if (seen === 0) context.buy(1);
    if (seen === candles.length - 1) context.close();
    seen += 1;
  },
});

assert.equal(result.trades.length, 1);
assert.ok(result.finalEquity > result.initialCapital);
assert.equal(result.trades[0]?.entryTime, 0);
assert.equal(result.trades[0]?.exitTime, 3);
console.log("Trading backtest verification passed.");
