import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { join, relative } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const root = process.cwd()
const pluginsDir = join(root, 'plugins')
const codeExts = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx'])
const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'coverage', 'lib'])
const errors = []
const packageNames = new Map()
const sourceHashes = new Map()
let publishableCount = 0

function fail(message) { errors.push(message) }
function assert(condition, message) { if (!condition) fail(message) }

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else yield path
  }
}

async function trackedGeneratedFiles() {
  try {
    const { stdout } = await execFileAsync('git', ['ls-files', '--', 'plugins/**/lib/**', 'plugins/**/dist/**', 'plugins/**/node_modules/**'], { cwd: root })
    return stdout.split('\n').map((entry) => entry.trim()).filter(Boolean)
  } catch (error) {
    fail(`unable to inspect tracked generated files: ${error.message}`)
    return []
  }
}

async function main() {
  for (const file of await trackedGeneratedFiles()) fail(`${file} is checked-in generated output; source of truth must remain in src/`)

  const manifests = []
  for await (const file of walk(pluginsDir)) if (file.endsWith('/package.json')) manifests.push(file)
  manifests.sort()
  assert(manifests.length > 0, 'plugins/ contains no workspace packages')

  for (const manifestPath of manifests) {
    const dir = join(manifestPath, '..')
    const relManifest = relative(root, manifestPath).replaceAll('\\', '/')
    let manifest
    try { manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) }
    catch (error) {
      fail(`${relManifest} is not valid JSON: ${error.message}`)
      continue
    }

    assert(typeof manifest.name === 'string' && manifest.name.length > 0, `${relManifest} has no package name`)
    if (typeof manifest.name === 'string') {
      const previous = packageNames.get(manifest.name)
      if (previous) fail(`duplicate package name ${manifest.name}: ${previous} and ${relManifest}`)
      else packageNames.set(manifest.name, relManifest)
    }

    const pathParts = relManifest.split('/')
    const isTopLevelPlugin = pathParts.length === 3 && pathParts[0] === 'plugins'
    if (!isTopLevelPlugin) continue

    publishableCount += 1
    assert(manifest.name.startsWith('@dsh-stack/'), `${relManifest} package name must use @dsh-stack namespace`)
    assert(typeof manifest.version === 'string', `${relManifest} has no package version`)
    assert(manifest.type === 'module', `${relManifest} must use ESM`)
    assert(manifest.stack && ['plugin', 'pack'].includes(manifest.stack.kind), `${relManifest} must declare stack.kind`)
    assert(typeof manifest.stack?.id === 'string' && manifest.stack.id.includes('.'), `${relManifest} stack.id must be namespaced`)
    assert(manifest.private !== true, `${relManifest} must be publishable, not private`)
    assert(manifest.publishConfig?.access === 'public', `${relManifest} must declare public publishConfig.access`)
    assert(Array.isArray(manifest.files) && manifest.files.length > 0, `${relManifest} must explicitly declare published files`)
    assert(typeof manifest.scripts?.build === 'string', `${relManifest} must provide a build script`)
    assert(typeof manifest.scripts?.typecheck === 'string', `${relManifest} must provide a typecheck script`)
    assert(typeof manifest.scripts?.test === 'string', `${relManifest} must provide a test script`)
    assert(typeof manifest.scripts?.verify === 'string', `${relManifest} must provide a verify script`)
    if (manifest.stack.kind === 'plugin') {
      try { await fs.access(join(dir, 'src')) }
      catch { fail(`${relManifest} declares a plugin but has no src/ directory`) }
      assert(typeof manifest.exports === 'object' || typeof manifest.main === 'string', `${relManifest} plugin must declare exports or main`)
    }
  }

  assert(publishableCount > 0, 'plugins/ contains no publishable top-level plugins or packs')

  const catalogPath = join(pluginsDir, 'composition', 'src', 'catalog.ts')
  try {
    const catalog = await fs.readFile(catalogPath, 'utf8')
    for (const match of catalog.matchAll(/id:\s*'([^']+)'/g)) assert(match[1].includes('.'), `catalog id ${match[1]} is not namespaced`)
  } catch (error) {
    fail(`unable to verify composition catalog: ${error.message}`)
  }

  for await (const file of walk(pluginsDir)) {
    const rel = relative(root, file).replaceAll('\\', '/')
    const ext = rel.slice(rel.lastIndexOf('.'))
    if (!codeExts.has(ext)) continue
    const text = await fs.readFile(file, 'utf8')
    const lower = text.toLowerCase()
    for (const marker of ['todo', 'fixme', 'not implemented', 'initialized: true']) assert(!lower.includes(marker), `${rel} contains unfinished or placeholder marker ${marker}`)
    assert(!/\bas any\b/.test(text), `${rel} contains an unchecked 'as any' cast`)
    if (text.length < 400) continue
    const hash = createHash('sha256').update(text).digest('hex')
    const previous = sourceHashes.get(hash)
    if (previous && !/\/fixtures\/|\/snapshots\//.test(rel) && !/\/index\.(js|mjs|ts)$/.test(rel)) fail(`duplicate source implementation: ${previous} and ${rel}`)
    else if (!previous) sourceHashes.set(hash, rel)
  }

  if (errors.length) {
    console.error(errors.join('\n'))
    process.exit(1)
  }
  console.log(`Stack verification passed: ${publishableCount} publishable plugins/packs, ${packageNames.size} total workspace packages, ${sourceHashes.size} unique source bodies.`)
}

await main()
