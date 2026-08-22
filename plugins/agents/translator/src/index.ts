import { Service, type Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

export const name = 'translator'
export const inject = ['dialects', 'llm']
export const optional: string[] = []

export type DialectMessage = Record<string, unknown>
export type DialectAdapter = (message: DialectMessage) => DialectMessage

export class TranslatorService extends Service {
  static inject = ['dialects', 'llm']
  private readonly adapters = new Map<string, DialectAdapter>()

  constructor(ctx: Context) {
    super(ctx, 'translator')
  }

  registerAdapter(sourceDialect: string, targetDialect: string, adapter: DialectAdapter): void {
    const key = `${sourceDialect}->${targetDialect}`
    if (!sourceDialect || !targetDialect) throw new Error('Translator dialect names must be non-empty')
    this.adapters.set(key, adapter)
  }

  translatePrompt(sourceDialect: string, targetDialect: string, message: DialectMessage): DialectMessage {
    if (sourceDialect === targetDialect) return structuredClone(message)
    const adapter = this.adapters.get(`${sourceDialect}->${targetDialect}`)
    if (!adapter) throw new Error(`No translator adapter registered for ${sourceDialect} -> ${targetDialect}`)
    return adapter(structuredClone(message))
  }
}

export const Config = Schema.object({})

export function apply(ctx: Context): void {
  new TranslatorService(ctx)
}
