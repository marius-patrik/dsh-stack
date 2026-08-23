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
  readonly macd: {
    readonly line: number | null;
    readonly signal: number | null;
    readonly histogram: number | null;
  };
  readonly mfi: number | null;
  readonly atr: number | null;
  readonly sma20: number | null;
  readonly sma50: number | null;
  readonly sma200: number | null;
  readonly ema20: number | null;
  readonly bollinger: {
    readonly middle: number | null;
    readonly upper: number | null;
    readonly lower: number | null;
  };
}

export function sma(values: readonly number[], period: number): number | null {
  if (period <= 0 || values.length < period) return null;
  let sum = 0;
  for (let i = values.length - period; i < values.length; i++) sum += values[i]!;
  return sum / period;
}

export function ema(values: readonly number[], period: number): number | null {
  return emaSeries(values, period).at(-1) ?? null;
}

export function emaSeries(values: readonly number[], period: number): number[] {
  if (period <= 0 || values.length < period) return [];
  const alpha = 2 / (period + 1);
  let value = values.slice(0, period).reduce((sum, current) => sum + current, 0) / period;
  const result = [value];
  for (let i = period; i < values.length; i++) {
    value = values[i]! * alpha + value * (1 - alpha);
    result.push(value);
  }
  return result;
}

export function rsi(closes: readonly number[], period = 14): number | null {
  if (period <= 0 || closes.length <= period) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const change = closes[i]! - closes[i - 1]!;
    if (change >= 0) gain += change;
    else loss -= change;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i]! - closes[i - 1]!;
    avgGain = (avgGain * (period - 1) + Math.max(change, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-change, 0)) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

export function atr(candles: readonly Candle[], period = 14): number | null {
  if (period <= 0 || candles.length < period) return null;
  const ranges = trueRanges(candles);
  let value = sma(ranges.slice(0, period), period)!;
  for (let i = period; i < ranges.length; i++) value = (value * (period - 1) + ranges[i]!) / period;
  return value;
}

export function adx(
  candles: readonly Candle[],
  period = 14,
): { adx: number | null; diPlus: number | null; diMinus: number | null } {
  if (period <= 0 || candles.length < period * 2 + 1)
    return { adx: null, diPlus: null, diMinus: null };
  const tr = trueRanges(candles).slice(1);
  const plusDm: number[] = [];
  const minusDm: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i]!;
    const previous = candles[i - 1]!;
    const up = current.high - previous.high;
    const down = previous.low - current.low;
    plusDm.push(up > down && up > 0 ? up : 0);
    minusDm.push(down > up && down > 0 ? down : 0);
  }
  let trSmooth = tr.slice(0, period).reduce((sum, value) => sum + value, 0);
  let plusSmooth = plusDm.slice(0, period).reduce((sum, value) => sum + value, 0);
  let minusSmooth = minusDm.slice(0, period).reduce((sum, value) => sum + value, 0);
  const dx: number[] = [];
  let lastPlus = 0;
  let lastMinus = 0;
  for (let i = period; i <= tr.length; i++) {
    if (i > period) {
      trSmooth = trSmooth - trSmooth / period + tr[i - 1]!;
      plusSmooth = plusSmooth - plusSmooth / period + plusDm[i - 1]!;
      minusSmooth = minusSmooth - minusSmooth / period + minusDm[i - 1]!;
    }
    lastPlus = trSmooth === 0 ? 0 : (100 * plusSmooth) / trSmooth;
    lastMinus = trSmooth === 0 ? 0 : (100 * minusSmooth) / trSmooth;
    const sum = lastPlus + lastMinus;
    dx.push(sum === 0 ? 0 : (100 * Math.abs(lastPlus - lastMinus)) / sum);
  }
  if (dx.length < period)
    return { adx: null, diPlus: lastPlus || null, diMinus: lastMinus || null };
  let adxValue = dx.slice(0, period).reduce((sum, value) => sum + value, 0) / period;
  for (let i = period; i < dx.length; i++) adxValue = (adxValue * (period - 1) + dx[i]!) / period;
  return { adx: adxValue, diPlus: lastPlus, diMinus: lastMinus };
}

export function mfi(candles: readonly Candle[], period = 14): number | null {
  if (period <= 0 || candles.length <= period) return null;
  const typical = candles.map((candle) => (candle.high + candle.low + candle.close) / 3);
  let positive = 0;
  let negative = 0;
  for (let i = Math.max(1, candles.length - period); i < candles.length; i++) {
    const flow = typical[i]! * candles[i]!.volume;
    if (typical[i]! > typical[i - 1]!) positive += flow;
    else if (typical[i]! < typical[i - 1]!) negative += flow;
  }
  if (negative === 0) return positive === 0 ? 50 : 100;
  return 100 - 100 / (1 + positive / negative);
}

export function bollinger(
  closes: readonly number[],
  period = 20,
  deviations = 2,
): RegimeSnapshot["bollinger"] {
  const middle = sma(closes, period);
  if (middle === null) return { middle: null, upper: null, lower: null };
  const window = closes.slice(-period);
  const variance = window.reduce((sum, value) => sum + (value - middle) ** 2, 0) / period;
  const standardDeviation = Math.sqrt(variance);
  return {
    middle,
    upper: middle + deviations * standardDeviation,
    lower: middle - deviations * standardDeviation,
  };
}

export function snapshot(candles: readonly Candle[]): RegimeSnapshot {
  const closes = candles.map((candle) => candle.close);
  const ema12 = emaSeries(closes, 12);
  const ema26 = emaSeries(closes, 26);
  const offset = ema12.length - ema26.length;
  const macdSeries = ema26.map((value, index) => (ema12[index + offset] ?? value) - value);
  const macdLine = macdSeries.at(-1) ?? null;
  const macdSignal = ema(macdSeries, 9);
  const highest = candles
    .slice(-14)
    .reduce((value, candle) => Math.max(value, candle.high), Number.NEGATIVE_INFINITY);
  const lowest = candles
    .slice(-14)
    .reduce((value, candle) => Math.min(value, candle.low), Number.POSITIVE_INFINITY);
  const last = closes.at(-1);
  const stochastic =
    last === undefined || !Number.isFinite(highest) || highest === lowest
      ? null
      : ((last - lowest) / (highest - lowest)) * 100;
  const dmi = adx(candles);
  return {
    rsi: rsi(closes),
    stochastic,
    adx: dmi.adx,
    diPlus: dmi.diPlus,
    diMinus: dmi.diMinus,
    macd: {
      line: macdLine,
      signal: macdSignal,
      histogram: macdLine !== null && macdSignal !== null ? macdLine - macdSignal : null,
    },
    mfi: mfi(candles),
    atr: atr(candles),
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
    ema20: ema(closes, 20),
    bollinger: bollinger(closes, 20, 2),
  };
}

function trueRanges(candles: readonly Candle[]): number[] {
  return candles.map((candle, index) => {
    const previous = candles[index - 1];
    return previous
      ? Math.max(
          candle.high - candle.low,
          Math.abs(candle.high - previous.close),
          Math.abs(candle.low - previous.close),
        )
      : candle.high - candle.low;
  });
}
