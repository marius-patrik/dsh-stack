import type { BacktestResult, Strategy } from '@dsh-stack/trading-backtest';
import { runBacktest } from '@dsh-stack/trading-backtest';
import type { Candle } from '@dsh-stack/trading-research';

export type ParameterValue = string | number | boolean;
export type ParameterGrid = Readonly<Record<string, readonly ParameterValue[]>>;

export interface Evaluation {
  readonly parameters: Readonly<Record<string, ParameterValue>>;
  readonly train: BacktestResult;
  readonly test?: BacktestResult;
}

export interface OptimizationOptions {
  readonly minimumTrainTrades?: number;
  readonly objective?: (result: BacktestResult) => number;
  readonly limit?: number;
}

export function gridSearch(
  candles: readonly Candle[],
  createStrategy: (parameters: Readonly<Record<string, ParameterValue>>) => Strategy,
  trainSplit: number,
  grid: ParameterGrid,
  options: OptimizationOptions = {},
  testCandles?: readonly Candle[],
): readonly Evaluation[] {
  if (!(trainSplit > 0 && trainSplit < 1)) throw new Error('trainSplit must be between 0 and 1');
  const splitIndex = Math.floor(candles.length * trainSplit);
  const train = candles.slice(0, splitIndex);
  const test = testCandles ?? candles.slice(splitIndex);
  const objective = options.objective ?? ((result) => result.totalReturn - result.maxDrawdown);
  const minimumTrainTrades = options.minimumTrainTrades ?? 0;
  const evaluations: Evaluation[] = [];

  for (const parameters of combinations(grid)) {
    const trainResult = runBacktest(train, createStrategy(parameters));
    if (trainResult.trades.length < minimumTrainTrades) continue;
    const testResult = test.length > 0 ? runBacktest(test, createStrategy(parameters)) : undefined;
    evaluations.push({ parameters, train: trainResult, test: testResult });
  }

  evaluations.sort((left, right) => {
    const leftScore = objective(left.test ?? left.train);
    const rightScore = objective(right.test ?? right.train);
    return rightScore - leftScore;
  });
  return options.limit === undefined ? evaluations : evaluations.slice(0, Math.max(0, options.limit));
}

function* combinations(grid: ParameterGrid): Generator<Record<string, ParameterValue>> {
  const entries = Object.entries(grid);
  function* walk(index: number, current: Record<string, ParameterValue>): Generator<Record<string, ParameterValue>> {
    if (index === entries.length) {
      yield { ...current };
      return;
    }
    const [key, values] = entries[index]!;
    if (values.length === 0) return;
    for (const value of values) {
      current[key] = value;
      yield* walk(index + 1, current);
    }
    delete current[key];
  }
  yield* walk(0, {});
}
