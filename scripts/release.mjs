import { promises as fs } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const root = process.cwd()
const pluginsDir = join(root, 'plugins')
const command = process.argv[2]
const bumpArg = process.argv[3] ?? 'patch'
const validBumps = new Set(['major', 'minor', 'patch'])
if (!['manifest', 'version'].includes(command)) {
  console.error('usage: node scripts/release.mjs <manifest|version> [major|minor|patch]')
  process.exit(2)
}
if (command === 'version' && !validBumps.has(bumpArg)) {
  console.error(`invalid version bump: ${bumpArg}`)
  process.exit(2)
}

async function readJson(path) { return JSON.parse(await fs.readFile(path, 'utf8')) }
async function writeJson(path, value) { await fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8') }
async function exec(args) { const { stdout } = await execFileAsync('git', args, { cwd: root }); return stdout.trim() }

function bumpVersion(version, kind) {
  const parts = version.split('.').map(Number)
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) throw new Error(`invalid semver: ${version}`)
  if (kind === 'major') return `${parts[0] + 1}.0.0`
  if (kind === 'minor') return `${parts[0]}.${parts[1] + 1}.0`
  return `${parts[0]}.${parts[1]}.${parts[2] + 1}`
}

async function discoverPackages() {
  const entries = await fs.readdir(pluginsDir, { withFileTypes: true })
  const packages = []
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    const dir = join(pluginsDir, entry.name)
    try {
      const [stack, pkg] = await Promise.all([readJson(join(dir, 'stack.json')), readJson(join(dir, 'package.json'))])
      packages.push({ dir, stack, pkg })
    } catch {}
  }
  packages.sort((a, b) => a.stack.id.localeCompare(b.stack.id))
  return packages
}

async function catalogMembership() {
  const source = await fs.readFile(join(pluginsDir, 'composition', 'src', 'catalog.ts'), 'utf8')
  const packs = {}
  const profiles = {}
  let section = null
  let current = null
  for (const raw of source.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('export const packs')) { section = 'packs'; continue }
    if (line.startsWith('export const profiles')) { section = 'profiles'; continue }
    const objectMatch = line.match(/^id:\s*'([^']+)'/)
    if (objectMatch) {
      current = objectMatch[1]
      if (section === 'packs') packs[current] = []
      else if (section === 'profiles') profiles[current] = []
      continue
    }
    const quoted = line.match(/'([^']+)'/g)?.map((value) => value.slice(1, -1)) ?? []
    if (current !== null) {
      if (section === 'packs') for (const id of quoted) if (id.startsWith('stack.')) packs[current].push(id)
      if (section === 'profiles') for (const id of quoted) if (id.startsWith('stack.')) profiles[current].push(id)
    }
    if (line === '},') current = null
  }
  return { packs, profiles }
}

async function buildManifest() {
  const rootPackage = await readJson(join(root, 'package.json'))
  const packages = await discoverPackages()
  const byId = new Map(packages.map((item) => [item.stack.id, item]))
  const membership = await catalogMembership()
  const catalogPackages = packages.map(({ stack, pkg, dir }) => ({
    id: stack.id,
    name: stack.name,
    version: stack.version,
    kind: stack.kind,
    dependencies: (stack.dependencies ?? []).map((id) => ({ id, version: byId.get(id)?.stack.version ?? null })),
    optionalDependencies: (stack.optionalDependencies ?? []).map((id) => ({ id, version: byId.get(id)?.stack.version ?? null })),
    files: stack.files,
    packagePath: relative(root, dir),
    packagePrivate: pkg.private === true,
    packs: Object.entries(membership.packs).filter(([, ids]) => ids.includes(stack.id)).map(([id]) => id),
    profiles: Object.entries(membership.profiles).filter(([, ids]) => ids.includes(stack.id)).map(([id]) => id),
  }))
  return {
    format: 1,
    stack: { name: rootPackage.name, version: rootPackage.version },
    packages: catalogPackages,
    packs: membership.packs,
    profiles: membership.profiles,
  }
}

async function manifest() {
  const value = await buildManifest()
  const outputDir = join(root, '.release')
  await fs.mkdir(outputDir, { recursive: true })
  const output = join(outputDir, 'stack-release.json')
  await writeJson(output, value)
  const integrity = createHash('sha256').update(await fs.readFile(output)).digest('hex')
  await fs.writeFile(join(outputDir, 'stack-release.sha256'), `${integrity}  stack-release.json\n`, 'utf8')
  console.log(output)
}

async function version() {
  const rootPackagePath = join(root, 'package.json')
  const rootPackage = await readJson(rootPackagePath)
  const commitText = await exec(['log', '--format=%s%n%b', '-n', '200'])
  const rootBump = /BREAKING CHANGE|^[^\n]*!:/m.test(commitText) ? 'major' : /^(feat)(\([^)]*\))?:/m.test(commitText) ? 'minor' : bumpArg
  rootPackage.version = bumpVersion(rootPackage.version, rootBump)
  await writeJson(rootPackagePath, rootPackage)

  const packages = await discoverPackages()
  for (const item of packages) {
    const dirName = relative(pluginsDir, item.dir)
    const changed = await exec(['diff', '--name-only', 'HEAD^', 'HEAD', '--', `plugins/${dirName}`])
    if (!changed) continue
    const messages = await exec(['log', '--format=%s%n%b', '-n', '50', '--', `plugins/${dirName}`])
    const bump = /BREAKING CHANGE|^[^\n]*!:/m.test(messages) ? 'major' : /^(feat)(\([^)]*\))?:/m.test(messages) ? 'minor' : bumpArg
    const next = bumpVersion(item.stack.version, bump)
    item.stack.version = next
    item.pkg.version = next
    await writeJson(join(item.dir, 'stack.json'), item.stack)
    await writeJson(join(item.dir, 'package.json'), item.pkg)
  }
  console.log(`Stack version: ${rootPackage.version}`)
}

if (command === 'manifest') await manifest()
else await version()
