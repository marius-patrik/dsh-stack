export interface Candle {
  readonly time: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export interface RegimeSnapshot {
  readonly rsi: number | null;
  readonly stochastic: number | null;
  readonly adx: number | null;
  readonly diPlus: number | null;
  readonly diMinus: number | null;
  readonly macd: { readonly line: number | null; readonly signal: number | null; readonly histogram: number | null };
  readonly mfi: number | null;
  readonly atr: number | null;
  readonly sma20: number | null;
  readonly sma50: number | null;
  readonly sma200: number | null;
  readonly ema20: number | null;
  readonly bollinger: { readonly middle: number | null; readonly upper: number | null; readonly lower: number | null };
}

export function sma(values: readonly number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null;
  let sum = 0;
  for (let i = values.length - period; i < values.length; i++) sum += values[i]!;
  return sum / period;
}

export function ema(values: readonly number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null;
  const alpha = 2 / (period + 1);
  let value = 0;
  for (let i = 0; i < period; i++) value += values[i]!;
  value /= period;
  for (let i = period; i < values.length; i++) value = values[i]! * alpha + value * (1 - alpha);
  return value;
}

export function rsi(closes: readonly number[], period = 14): number | null {
  if (period <= 0 || closes.length <= period) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i]! - closes[i - 1]!;
    if (change >= 0) gain += change; else loss -= change;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i]! - closes[i - 1]!;
    avgGain = ((avgGain * (period - 1)) + Math.max(change, 0)) / period;
    avgLoss = ((avgLoss * (period - 1)) + Math.max(-change, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

export function atr(candles: readonly Candle[], period = 14): number | null {
  if (period <= 0 || candles.length <= period) return null;
  const ranges: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const current = candles[i]!;
    const previous = candles[i - 1];
    ranges.push(previous ? Math.max(current.high - current.low, Math.abs(current.high - previous.close), Math.abs(current.low - previous.close)) : current.high - current.low);
  }
  return sma(ranges.slice(-period), period);
}

export function bollinger(closes: readonly number[], period = 20, deviations = 2): RegimeSnapshot['bollinger'] {
  const middle = sma(closes, period);
  if (middle === null) return { middle: null, upper: null, lower: null };
  const window = closes.slice(-period);
  const variance = window.reduce((sum, value) => sum + ((value - middle) ** 2), 0) / period;
  const std = Math.sqrt(variance);
  return { middle, upper: middle + deviations * std, lower: middle - deviations * std };
}

export function snapshot(candles: readonly Candle[]): RegimeSnapshot {
  const closes = candles.map((candle) => candle.close);
  const macdLine = ema(closes, 12) !== null && ema(closes, 26) !== null ? ema(closes, 12)! - ema(closes, 26)! : null;
  const macdSeries = macdLine === null ? [] : [macdLine];
  const macdSignal = macdSeries.length >= 9 ? ema(macdSeries, 9) : null;
  const middle = sma(closes, 20);
  const stdBand = bollinger(closes, 20, 2);
  const highest = candles.slice(-14).reduce((value, candle) => Math.max(value, candle.high), Number.NEGATIVE_INFINITY);
  const lowest = candles.slice(-14).reduce((value, candle) => Math.min(value, candle.low), Number.POSITIVE_INFINITY);
  const last = closes.at(-1);
  const stochastic = last === undefined || !Number.isFinite(highest) || highest === lowest ? null : ((last - lowest) / (highest - lowest)) * 100;
  return {
    rsi: rsi(closes),
    stochastic,
    adx: null,
    diPlus: null,
    diMinus: null,
    macd: { line: macdLine, signal: macdSignal, histogram: macdLine !== null && macdSignal !== null ? macdLine - macdSignal : null },
    mfi: null,
    atr: atr(candles),
    sma20: middle,
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
    ema20: ema(closes, 20),
    bollinger: stdBand,
  };
}
