import { createHash } from 'node:crypto'
import { promises as fs } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const packagesDir = join(root, 'packages')
const codeExts = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx'])
const ignoredDirs = new Set(['node_modules', '.git', 'dist', 'coverage'])
const errors = []
const packageNames = new Map()
const sourceHashes = new Map()

function fail(message) { errors.push(message) }
function assert(condition, message) { if (!condition) fail(message) }

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else yield path
  }
}

async function main() {
  const rootPlugins = join(root, 'plugins')
  try { await fs.access(rootPlugins); fail('legacy plugins/ directory still exists') } catch {}

  const packageDirs = (await fs.readdir(packagesDir, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()

  for (const name of packageDirs) {
    const dir = join(packagesDir, name)
    const manifestPath = join(dir, 'package.json')
    let manifest
    try {
      manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
    } catch (error) {
      fail(`${relative(root, dir)} has no valid package.json: ${error.message}`)
      continue
    }

    assert(typeof manifest.name === 'string' && manifest.name.length > 0, `${relative(root, manifestPath)} has no package name`)
    if (typeof manifest.name === 'string') {
      const previous = packageNames.get(manifest.name)
      if (previous) fail(`duplicate package name ${manifest.name}: ${previous} and ${relative(root, manifestPath)}`)
      else packageNames.set(manifest.name, relative(root, manifestPath))
    }
    assert(manifest.private === true || manifest.license || manifest.publishConfig, `${relative(root, manifestPath)} has neither private nor publish metadata`)
  }

  for await (const file of walk(packagesDir)) {
    const rel = relative(root, file).replaceAll('\\', '/')
    const ext = rel.slice(rel.lastIndexOf('.'))
    if (!codeExts.has(ext)) continue
    const text = await fs.readFile(file, 'utf8')
    assert(!text.includes('plugins/'), `${rel} references removed plugins/ tree`)
    for (const marker of ['TODO', 'FIXME', 'not implemented']) {
      assert(!text.toLowerCase().includes(marker.toLowerCase()), `${rel} contains unfinished marker ${marker}`)
    }
    if (text.length < 400) continue
    const hash = createHash('sha256').update(text).digest('hex')
    const previous = sourceHashes.get(hash)
    if (previous && !/\/fixtures\/|\/snapshots\//.test(rel) && !/\/index\.(js|mjs|ts)$/.test(rel)) {
      fail(`duplicate source implementation: ${previous} and ${rel}`)
    } else if (!previous) {
      sourceHashes.set(hash, rel)
    }
  }

  const catalogPath = join(packagesDir, 'composition', 'src', 'catalog.ts')
  const catalog = await fs.readFile(catalogPath, 'utf8')
  for (const match of catalog.matchAll(/id:\s*'([^']+)'/g)) {
    assert(match[1].includes('.'), `catalog id ${match[1]} is not namespaced`)
  }

  if (errors.length) {
    console.error(errors.join('\n'))
    process.exit(1)
  }
  console.log(`Stack verification passed: ${packageNames.size} packages, ${sourceHashes.size} unique source bodies.`)
}

await main()
