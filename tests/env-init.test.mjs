import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { GENERATED, BLANK, initEnv, addKeys, regenKey } from '../plugins/assistant-builder/skills/build-assistant/scripts/env-init.mjs'

const SCRIPT = fileURLToPath(new URL('../plugins/assistant-builder/skills/build-assistant/scripts/env-init.mjs', import.meta.url))
const val = (text, k) => text.split('\n').find((l) => l.startsWith(k + '='))?.slice(k.length + 1)
const START_PAYLOAD = /^[A-Za-z0-9_-]{1,64}$/ // قيود رابط تيليجرام المباشر (?start=)

test('init on empty: generates the four secrets as hex of the right length, adds blank slots', () => {
  const { text, changed } = initEnv('')
  assert.deepEqual(changed, Object.keys(GENERATED))
  for (const [k, bytes] of Object.entries(GENERATED)) assert.match(val(text, k), new RegExp(`^[0-9a-f]{${bytes * 2}}$`), k)
  for (const k of BLANK) assert.equal(val(text, k), '', k)
  assert.match(val(text, 'TELEGRAM_LINK_CODE'), START_PAYLOAD)
  assert.ok(text.endsWith('\n'))
})

test('init keeps existing values, comments and unrelated lines; fills only empty generated keys', () => {
  const before = '﻿# my notes\r\nTELEGRAM_BOT_TOKEN=123:abc\r\nSECRETS_KEY=\r\nWEBHOOK_SECRET=   # fill me\r\nDASHBOARD_PASSWORD=keepme\r\nOTHER=x'
  const { text, changed } = initEnv(before)
  assert.deepEqual(changed.sort(), ['SECRETS_KEY', 'TELEGRAM_LINK_CODE', 'WEBHOOK_SECRET'].sort())
  assert.equal(val(text, 'TELEGRAM_BOT_TOKEN'), '123:abc')
  assert.equal(val(text, 'DASHBOARD_PASSWORD'), 'keepme')
  assert.equal(val(text, 'OTHER'), 'x')
  assert.ok(text.startsWith('# my notes\n'), 'BOM removed, comment kept, LF endings')
  assert.ok(!text.includes('\r'))
  assert.equal(text.split('\n').filter((l) => l.startsWith('TELEGRAM_BOT_TOKEN=')).length, 1, 'no duplicate slots')
})

test('init is idempotent', () => {
  const once = initEnv('').text
  const twice = initEnv(once)
  assert.deepEqual(twice.changed, [])
  assert.equal(twice.text, once)
})

test('addKeys appends only missing keys and rejects invalid names', () => {
  const { text, changed } = addKeys('ANTHROPIC_API_KEY=sk\n', ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'OPENAI_BASE_URL'])
  assert.deepEqual(changed, ['OPENAI_API_KEY', 'OPENAI_BASE_URL'])
  assert.equal(val(text, 'ANTHROPIC_API_KEY'), 'sk')
  assert.equal(val(text, 'OPENAI_API_KEY'), '')
  assert.throws(() => addKeys('', ['bad name']))
  assert.throws(() => addKeys('', ['lower_case']))
})

test('regenKey replaces only that generated key; refuses non-generated keys', () => {
  const base = initEnv('TELEGRAM_BOT_TOKEN=t\n').text
  const { text, changed } = regenKey(base, 'SECRETS_KEY')
  assert.deepEqual(changed, ['SECRETS_KEY'])
  assert.notEqual(val(text, 'SECRETS_KEY'), val(base, 'SECRETS_KEY'))
  for (const k of ['TELEGRAM_LINK_CODE', 'DASHBOARD_PASSWORD', 'WEBHOOK_SECRET', 'TELEGRAM_BOT_TOKEN']) assert.equal(val(text, k), val(base, k), k)
  assert.throws(() => regenKey(base, 'TELEGRAM_BOT_TOKEN'))
})

function tempRepo(ignored) {
  const dir = mkdtempSync(join(tmpdir(), 'env-init-'))
  execFileSync('git', ['init', '-q'], { cwd: dir })
  if (ignored) writeFileSync(join(dir, '.gitignore'), '.env\n')
  return dir
}
const run = (cwd, args = []) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8' })

test('CLI refuses to write when .env is not git-ignored', () => {
  const dir = tempRepo(false)
  const r = run(dir)
  assert.equal(r.status, 2)
  assert.equal(existsSync(join(dir, '.env')), false)
})

test('CLI writes .env and never prints a generated value', () => {
  const dir = tempRepo(true)
  const r = run(dir)
  assert.equal(r.status, 0, r.stderr)
  assert.equal(r.stdout.trim(), 'OK .env: TELEGRAM_LINK_CODE, DASHBOARD_PASSWORD, SECRETS_KEY, WEBHOOK_SECRET')
  const env = readFileSync(join(dir, '.env'), 'utf8')
  for (const k of Object.keys(GENERATED)) assert.ok(!(r.stdout + r.stderr).includes(val(env, k)), k)
  assert.equal(run(dir).stdout.trim(), 'OK .env: -')
  assert.equal(run(dir, ['--add', 'ANTHROPIC_API_KEY']).stdout.trim(), 'OK .env: ANTHROPIC_API_KEY')
  assert.equal(run(dir, ['--regen', 'SECRETS_KEY']).stdout.trim(), 'OK .env: SECRETS_KEY')
  assert.equal(run(dir, ['--regen', 'GEMINI_API_KEY']).status, 1)
  assert.equal(run(dir, ['--bogus']).status, 1)
})
