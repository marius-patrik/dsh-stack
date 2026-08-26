import type { Candle } from "@dsh-stack/trading-research";

export interface MarketDataQuery {
  readonly symbol: string;
  readonly start?: number;
  readonly end?: number;
  readonly limit?: number;
}

export interface MarketDataProvider {
  readonly id: string;
  listSymbols(): Promise<readonly string[]>;
  getCandles(query: MarketDataQuery): Promise<readonly Candle[]>;
}

export class MarketDataRegistry {
  private readonly providers = new Map<string, MarketDataProvider>();

  /** register implementation. */
  register(provider: MarketDataProvider): void {
    if (this.providers.has(provider.id))
      throw new Error(`Market-data provider already registered: ${provider.id}`);
    this.providers.set(provider.id, provider);
  }

  /** get implementation. */
  get(id: string): MarketDataProvider | undefined {
    return this.providers.get(id);
  }

  /** list implementation. */
  list(): readonly MarketDataProvider[] {
    return [...this.providers.values()];
  }
}

export class MemoryMarketDataProvider implements MarketDataProvider {
  readonly id: string;
  private readonly symbols = new Map<string, Candle[]>();

  /** Constructs an instance. */
  constructor(id = "memory") {
    this.id = id;
  }

  /** seed implementation. */
  seed(symbol: string, candles: readonly Candle[]): void {
    const normalized = [...candles].sort((a, b) => a.time - b.time);
    this.symbols.set(symbol, normalized);
  }

  /** listSymbols implementation. */
  async listSymbols(): Promise<readonly string[]> {
    return [...this.symbols.keys()].sort();
  }

  /** getCandles implementation. */
  async getCandles(query: MarketDataQuery): Promise<readonly Candle[]> {
    const data = this.symbols.get(query.symbol) ?? [];
    const filtered = data.filter((candle) => {
      if (query.start !== undefined && candle.time < query.start) return false;
      if (query.end !== undefined && candle.time > query.end) return false;
      return true;
    });
    return query.limit === undefined ? filtered : filtered.slice(-Math.max(0, query.limit));
  }
}
