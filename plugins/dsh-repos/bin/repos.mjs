#!/usr/bin/env node
/**
 * The `dsh repos` command: the owner surface over the dsh-repos repo workflows.
 * It reads/writes the `dsh-repos` section of `settings.yaml` under the same
 * agent home the harness boots (DSH_HOME) and runs the same `git` commands the
 * model-facing tools run — never shell-interpreted. GitHub push/PR flows are
 * the model tools' job; this CLI stops at local repo state and the settings
 * section (the remote and default base branch the tools use).
 *
 * Verbs:
 *   list                          — show the configured repo defaults
 *   set <key> <value>             — set a default (remote, defaultBaseBranch)
 *   status [path]                 — current branch + staged/unstaged/untracked
 *   branch <path>                 — list branches
 *   branch create <name> [path]   — create a branch
 *   branch switch <name> [path]   — switch to a branch
 *   branch delete <name> [path]   — delete a branch
 *   commit <path> <message>       — stage all + commit with a message
 */

import { homedir } from 'node:os'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const home = resolve(process.env.DSH_HOME ?? join(homedir(), '.agents'))
const settingsPath = join(home, 'settings.yaml')
const NS = 'dsh-repos'

function* readSection(text, section) {
  let inSection = false
  for (const line of text.split('\n')) {
    if (new RegExp(`^${section}\\s*:`).test(line)) { inSection = true; continue }
    if (inSection && !/^\s/.test(line)) break
    if (!inSection) continue
    const match = line.match(/^\s+([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/)
    if (match) {
      yield [match[1], match[2].trim().replace(/^(['"])(.*)\1$/, '$2')]
    }
  }
}

function parseJsonValue(raw) {
  if (raw === '' || raw === 'null') return null
  if (raw[0] === '{' || raw[0] === '[') {
    try { return JSON.parse(raw) } catch { /* fall through */ }
  }
  if (raw === 'true') return true
  if (raw === 'false') return false
  const num = Number(raw)
  if (raw !== '' && Number.isFinite(num)) return num
  return raw
}

async function readSectionData() {
  try {
    const text = await readFile(settingsPath, 'utf8')
    const section = {}
    for (const [key, value] of readSection(text, NS)) {
      section[key] = parseJsonValue(value)
    }
    return section
  } catch { /* no document yet */ }
  return {}
}

async function writeSectionData(section) {
  let text = ''
  try { text = await readFile(settingsPath, 'utf8') } catch { /* new file */ }
  const pattern = /^dsh-repos[^\n]*\n(?:[ \t][^\n]*\n)*/m
  const block = `dsh-repos:\n  remote: ${section.remote ?? 'origin'}\n  defaultBaseBranch: ${section.defaultBaseBranch ?? 'main'}\n`
  const without = text.replace(pattern, '')
  const rest = without.replace(/\n{3,}/g, '\n\n').trim()
  const out = `${rest}${rest.endsWith('\n') ? '' : '\n'}${block}`
  await mkdir(dirname(settingsPath), { recursive: true })
  await writeFile(settingsPath, out, 'utf8')
}

function git(cwd, args) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8' })
  if (res.status !== 0) {
    throw new Error(`git ${args.join(' ')} exited ${res.status}: ${(res.stderr ?? '').trim()}`)
  }
  return (res.stdout ?? '').trim()
}

function currentBranch(cwd) {
  const out = git(cwd, ['branch', '--show-current'])
  return out.length > 0 ? out : null
}

function workDir(rawPath) {
  return rawPath !== undefined && rawPath.length > 0 ? rawPath : process.cwd()
}

function printHelp() {
  process.stdout.write(`usage: dsh repos <verb> [args]

verbs:
  list
  set <key> <value>          keys: remote, defaultBaseBranch
  status [path]
  branch <path>
  branch create <name> [path]
  branch switch <name> [path]
  branch delete <name> [path]
  commit <path> <message>
`)
}

async function main() {
  const verb = process.argv[2]
  const argv = process.argv.slice(3)

  if (verb === 'list') {
    const section = await readSectionData()
    process.stdout.write(`remote: ${section.remote ?? 'origin'}\n`)
    process.stdout.write(`defaultBaseBranch: ${section.defaultBaseBranch ?? 'main'}\n`)
    return
  }

  if (verb === 'set') {
    const key = argv[0]
    const value = argv[1]
    if ((key !== 'remote' && key !== 'defaultBaseBranch') || value === undefined) {
      process.stderr.write('dsh repos set: expected <remote|defaultBaseBranch> <value>\n')
      process.exitCode = 1
      return
    }
    const section = await readSectionData()
    section[key] = value
    await writeSectionData(section)
    process.stdout.write(`${key}: ${value}\n`)
    return
  }

  if (verb === 'status') {
    const path = workDir(argv[0])
    const branch = currentBranch(path)
    const statusOut = git(path, ['status', '--porcelain=v1'])
    const staged = []
    const unstaged = []
    const untracked = []
    for (const line of statusOut.split('\n')) {
      if (line.length === 0) continue
      const xy = line.slice(0, 2)
      const rest = line.length > 3 ? line.slice(3).trim() : line
      if (xy[0] !== ' ' && xy[0] !== '?') staged.push(rest)
      if (xy[1] !== ' ') unstaged.push(rest)
      if (xy[0] === '?') untracked.push(rest)
    }
    process.stdout.write(branch === null ? 'detached HEAD\n' : `branch: ${branch}\n`)
    process.stdout.write(`staged: ${staged.length > 0 ? staged.join(', ') : '-'}\n`)
    process.stdout.write(`unstaged: ${unstaged.length > 0 ? unstaged.join(', ') : '-'}\n`)
    process.stdout.write(`untracked: ${untracked.length > 0 ? untracked.join(', ') : '-'}\n`)
    return
  }

  if (verb === 'branch') {
    const sub = argv[0]
    const path = workDir(argv[1])
    if (sub === undefined || (sub !== 'create' && sub !== 'switch' && sub !== 'delete')) {
      const list = git(path, ['branch', '--list'])
      process.stdout.write(`${list.length > 0 ? list + '\n' : ''}`)
      return
    }
    const name = argv[1]
    if (name === undefined) {
      process.stderr.write(`dsh repos branch ${sub}: missing <name>\n`)
      process.exitCode = 1
      return
    }
    if (sub === 'create') git(path, ['branch', name])
    if (sub === 'switch') git(path, ['checkout', name])
    if (sub === 'delete') git(path, ['branch', '-d', name])
    process.stdout.write(`${sub}d branch ${name}\n`)
    return
  }

  if (verb === 'commit') {
    const path = workDir(argv[0])
    const message = argv[1]
    if (message === undefined) {
      process.stderr.write('dsh repos commit: expected <path> <message>\n')
      process.exitCode = 1
      return
    }
    git(path, ['add', '-A'])
    git(path, ['commit', '-m', message])
    const short = git(path, ['rev-parse', '--short', 'HEAD'])
    process.stdout.write(`committed ${short}\n`)
    return
  }

  printHelp()
}

main().catch((err) => {
  process.stderr.write(`dsh repos: ${err.message}\n`)
  process.exitCode = 1
})
