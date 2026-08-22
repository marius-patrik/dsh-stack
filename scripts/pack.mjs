import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { spawn } from 'node:child_process'

const command = process.argv[2]
if (!['build', 'typecheck', 'test', 'verify'].includes(command)) {
  console.error('usage: node pack.mjs <build|typecheck|test|verify>')
  process.exit(2)
}

const root = process.cwd()
const entries = await fs.readdir(root, { withFileTypes: true })
const children = []
for (const entry of entries) {
  if (!entry.isDirectory() || entry.name.startsWith('.')) continue
  const manifestPath = join(root, entry.name, 'package.json')
  try {
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
    if (manifest.scripts?.[command]) children.push({ name: entry.name, cwd: join(root, entry.name) })
  } catch {}
}
children.sort((a, b) => a.name.localeCompare(b.name))

const run = (child) => new Promise((resolve, reject) => {
  const childProcess = spawn('pnpm', ['run', command], {
    cwd: child.cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  })
  childProcess.on('error', reject)
  childProcess.on('exit', (code, signal) => {
    if (signal) reject(new Error(`${child.name} ${command} terminated by ${signal}`))
    else if (code === 0) resolve()
    else reject(new Error(`${child.name} ${command} exited with ${code}`))
  })
})

for (const child of children) await run(child)
console.log(`${command}: ${children.length} child packages`)
