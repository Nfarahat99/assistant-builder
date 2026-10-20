import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { templateDir } from '../scripts/test-contract.mjs'

const RUNNER = fileURLToPath(new URL('../scripts/test-contract.mjs', import.meta.url))

test('templateDir: argument wins, relative paths resolve against the original cwd (INIT_CWD)', () => {
  const base = resolve('/work/builder')
  assert.equal(templateDir({ argv: ['../tpl'], env: { INIT_CWD: base, TEMPLATE_DIR: 'x' }, cwd: '/elsewhere' }), resolve(base, '../tpl'))
  assert.equal(templateDir({ argv: [], env: { INIT_CWD: base, TEMPLATE_DIR: '../tpl' }, cwd: '/elsewhere' }), resolve(base, '../tpl'))
  assert.equal(templateDir({ argv: [], env: { TEMPLATE_DIR: 'tpl' }, cwd: base }), resolve(base, 'tpl'))
  const abs = resolve('/abs/tpl')
  assert.equal(templateDir({ argv: [abs], env: { INIT_CWD: base }, cwd: base }), abs)
  assert.equal(templateDir({ argv: [], env: {}, cwd: base }), null)
})

test('runner exits 1 with a hint when no template dir is given', () => {
  const env = { ...process.env }
  delete env.TEMPLATE_DIR
  const r = spawnSync(process.execPath, [RUNNER], { encoding: 'utf8', env })
  assert.equal(r.status, 1)
  assert.match(r.stderr, /TEMPLATE_DIR/)
})

test('runner exits 1 when the template has no installed tsx', () => {
  const empty = mkdtempSync(join(tmpdir(), 'tpl-'))
  const r = spawnSync(process.execPath, [RUNNER, empty], { encoding: 'utf8' })
  assert.equal(r.status, 1)
  assert.match(r.stderr, /npm ci/)
})
