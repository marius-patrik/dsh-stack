import type { Candle } from '@dsh-stack/trading-research';

export type PositionSide = 'long' | 'short';

export interface Position {
  readonly side: PositionSide;
  readonly quantity: number;
  readonly entryPrice: number;
  readonly entryTime: number;
}

export interface BacktestContext {
  readonly candle: Candle;
  readonly position: Position | null;
  readonly equity: number;
  readonly cash: number;
  readonly history: readonly Trade[];
  buy(quantity: number): void;
  sell(quantity: number): void;
  close(): void;
}

export interface Strategy {
  readonly id: string;
  onCandle(context: BacktestContext): void;
}

export interface Trade {
  readonly side: PositionSide;
  readonly quantity: number;
  readonly entryPrice: number;
  readonly exitPrice: number;
  readonly entryTime: number;
  readonly exitTime: number;
  readonly pnl: number;
}

export interface BacktestResult {
  readonly initialCapital: number;
  readonly finalEquity: number;
  readonly totalReturn: number;
  readonly maxDrawdown: number;
  readonly winRate: number;
  readonly trades: readonly Trade[];
}

export interface BacktestOptions {
  readonly initialCapital?: number;
  readonly commissionPerTrade?: number;
  readonly slippageBps?: number;
}

export function runBacktest(candles: readonly Candle[], strategy: Strategy, options: BacktestOptions = {}): BacktestResult {
  if (candles.length === 0) throw new Error('Cannot backtest an empty candle series');
  const initialCapital = options.initialCapital ?? 10000;
  if (!(initialCapital > 0)) throw new Error('Initial capital must be positive');
  const commission = options.commissionPerTrade ?? 0;
  const slippage = (options.slippageBps ?? 0) / 10_000;
  let cash = initialCapital;
  let position: Position | null = null;
  const trades: Trade[] = [];
  const equityCurve: number[] = [];

  const executionPrice = (price: number, side: 'buy' | 'sell'): number => side === 'buy' ? price * (1 + slippage) : price * (1 - slippage);
  const mark = (price: number): number => position === null
    ? cash
    : cash + (position.side === 'long' ? position.quantity * price : -position.quantity * price);

  for (const candle of candles) {
    const context: BacktestContext = {
      candle,
      position,
      equity: mark(candle.close),
      cash,
      history: trades,
      buy(quantity) {
        if (!(quantity > 0)) throw new Error('Buy quantity must be positive');
        if (position?.side === 'short') {
          close();
          if (quantity > 0) openLong(quantity);
          return;
        }
        if (position !== null) throw new Error('A long position is already open');
        openLong(quantity);
      },
      sell(quantity) {
        if (!(quantity > 0)) throw new Error('Sell quantity must be positive');
        if (position?.side === 'long') {
          close();
          if (quantity > 0) openShort(quantity);
          return;
        }
        if (position !== null) throw new Error('A short position is already open');
        openShort(quantity);
      },
      close,
    };

    strategy.onCandle(context);
    equityCurve.push(mark(candle.close));
  }

  if (position !== null) closeAt(candles.at(-1)!.close, candles.at(-1)!.time);

  const finalEquity = cash;
  const peaks: number[] = [];
  let maxDrawdown = 0;
  let peak = -Infinity;
  for (const equity of [...equityCurve, finalEquity]) {
    peak = Math.max(peak, equity);
    peaks.push(peak);
    if (peak > 0) maxDrawdown = Math.max(maxDrawdown, (peak - equity) / peak);
  }

  const wins = trades.filter((trade) => trade.pnl > 0).length;
  return {
    initialCapital,
    finalEquity,
    totalReturn: (finalEquity - initialCapital) / initialCapital,
    maxDrawdown,
    winRate: trades.length === 0 ? 0 : wins / trades.length,
    trades,
  };

  function openLong(quantity: number): void {
    const price = executionPrice(candles.findLast((candle) => candle.time <= currentTime())?.close ?? candles[0]!.close, 'buy');
    position = { side: 'long', quantity, entryPrice: price, entryTime: currentTime() };
    cash -= quantity * price + commission;
  }

  function openShort(quantity: number): void {
    const price = executionPrice(candles.findLast((candle) => candle.time <= currentTime())?.close ?? candles[0]!.close, 'sell');
    position = { side: 'short', quantity, entryPrice: price, entryTime: currentTime() };
    cash += quantity * price - commission;
  }

  function closeAt(price: number, time: number): void {
    if (position === null) return;
    const exit = position.side === 'long' ? executionPrice(price, 'sell') : executionPrice(price, 'buy');
    const pnl = position.side === 'long'
      ? position.quantity * (exit - position.entryPrice) - commission
      : position.quantity * (position.entryPrice - exit) - commission;
    if (position.side === 'long') cash += position.quantity * exit - commission;
    else cash -= position.quantity * exit + commission;
    trades.push({
      side: position.side,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      exitPrice: exit,
      entryTime: position.entryTime,
      exitTime: time,
      pnl,
    });
    position = null;
  }

  function close(): void {
    const candle = candles.findLast((candidate) => candidate.time <= currentTime()) ?? candles[0]!;
    closeAt(candle.close, candle.time);
  }

  function currentTime(): number {
    return candles.findLast((candidate) => candidate.time === currentTimeFrame())?.time ?? candles[0]!.time;
  }

  function currentTimeFrame(): number {
    return candles.at(-1)!.time;
  }
}
