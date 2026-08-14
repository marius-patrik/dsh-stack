import * as plugin from './lib/index.js'
import { Context } from '@deepseek-ai/cordis'

if (plugin.name !== 'dsh-dialects') throw new Error('bad name')
if (typeof plugin.apply !== 'function') throw new Error('bad apply')
if (!Array.isArray(plugin.inject)) throw new Error('bad inject')
if (plugin.default !== undefined) throw new Error('function plugins must not have a default export')
console.log('loader shape ok:', plugin.name, 'inject=', JSON.stringify(plugin.inject))

const ctx = new Context()
plugin.apply(ctx, {})
if (!ctx.dialects) throw new Error('ctx.dialects not provided')
const ids = ctx.dialects.list().map(d => d.id)
console.log('registry dialects:', ids)
const request = ctx.dialects.get('claude').serialize(
  { provider: 'p', model: 'm', messages: [] },
  { apiKey: 'k' },
  'https://api.anthropic.com/v1',
  { maxTokens: 10 },
)
console.log('claude serialize url:', request.url, '| framing:', request.framing)
console.log('plugin check passed')
