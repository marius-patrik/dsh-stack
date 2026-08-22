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
const publicPackages = new Map()

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

async function readJson(path, label) {
  try { return JSON.parse(await fs.readFile(path, 'utf8')) }
  catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`)
    return undefined
  }
}

async function main() {
  for (const file of await trackedGeneratedFiles()) fail(`${file} is checked-in generated output; source of truth must remain in src/`)

  const children = await fs.readdir(pluginsDir, { withFileTypes: true })
  for (const child of children) {
    if (!child.isDirectory() || ignoredDirs.has(child.name)) continue
    const dir = join(pluginsDir, child.name)
    const manifestPath = join(dir, 'package.json')
    try {
      const manifest = await readJson(manifestPath, `${relative(root, manifestPath)}`)
      if (manifest?.name) {
        const previous = packageNames.get(manifest.name)
        if (previous) fail(`duplicate package name ${manifest.name}: ${previous} and ${relative(root, manifestPath)}`)
        else packageNames.set(manifest.name, relative(root, manifestPath))
      }
    } catch {}

    const stackPath = join(dir, 'stack.json')
    try { await fs.access(stackPath) } catch { continue }
    const stack = await readJson(stackPath, `${relative(root, stackPath)}`)
    if (!stack) continue

    publicPackages.set(stack.id, { dir, stack })
    const label = `plugins/${child.name}/stack.json`
    assert(typeof stack.id === 'string' && /^stack\.[a-z0-9][a-z0-9.-]*$/.test(stack.id), `${label} id must be namespaced`)
    assert(['plugin', 'pack', 'library'].includes(stack.kind), `${label} has invalid kind`)
    assert(typeof stack.version === 'string' && /^\d+\.\d+\.\d+$/.test(stack.version), `${label} must have a semver version`)
    assert(typeof stack.name === 'string' && /^@dsh-stack\//.test(stack.name), `${label} must have an @dsh-stack package name`)
    assert(typeof stack.description === 'string' && stack.description.length > 0, `${label} must have a description`)
    assert(Array.isArray(stack.files) && stack.files.length > 0, `${label} must declare published files`)
    assert(Array.isArray(stack.dependencies ?? []), `${label} dependencies must be an array`)
    assert(Array.isArray(stack.optionalDependencies ?? []), `${label} optionalDependencies must be an array`)
    if (stack.kind === 'plugin') {
      try { await fs.access(join(dir, 'src')) } catch { fail(`${label} declares a plugin but has no src/ directory`) }
    }
  }

  assert(publicPackages.size > 0, 'no public Stack package manifests found under plugins/*/stack.json')

  const catalogPath = join(pluginsDir, 'composition', 'src', 'catalog.ts')
  const catalog = await readJson(join(root, 'plugins', 'composition', 'stack.json'), 'plugins/composition/stack.json')
  assert(catalog !== undefined, 'composition stack manifest is required')

  if (catalogPath) {
    try {
      const source = await fs.readFile(catalogPath, 'utf8')
      for (const match of source.matchAll(/(?:id|plugin|pack):\s*'([^']+)'/g)) {
        const id = match[1]
        assert(id.includes('.'), `catalog identifier ${id} is not namespaced`)
        if (id.startsWith('stack.') && (id.includes('profile.') || id.includes('workspace') || id.includes('planning') || id.includes('coding') || id.includes('trading') || id.includes('skyblock'))) continue
        assert(publicPackages.has(id) || source.includes(`plugin: '${id}'`), `catalog id ${id} has no public Stack package manifest`)
      }
    } catch (error) {
      fail(`unable to verify composition catalog: ${error.message}`)
    }
  }

  for await (const file of walk(pluginsDir)) {
    const rel = relative(root, file).replaceAll('\\', '/')
    const top = rel.split('/')[0] === 'plugins' ? rel.split('/')[1] : undefined
    if (!top || !publicPackagesHasDir(top)) continue
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
  console.log(`Stack verification passed: ${publicPackages.size} public packages, ${packageNames.size} workspace manifests, ${sourceHashes.size} unique public source bodies.`)
}

function publicPackagesHasDir(name) {
  for (const { dir } of publicPackages.values()) if (dir === join(pluginsDir, name)) return true
  return false
}

await main()
