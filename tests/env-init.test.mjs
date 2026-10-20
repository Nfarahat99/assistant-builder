import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { GENERATED, BLANK, initEnv, addKeys, regenKey } from '../plugins/assistant-builder/skills/build-assistant/scripts/env-init.mjs'

const SCRIPT = fileURLToPath(new URL('../plugins/assistant-builder/skills/build-assistant/scripts/env-init.mjs', import.meta.url))
const val = (text, k) => text.split(/\r?\n/).find((l) => l.startsWith(k + '='))?.slice(k.length + 1)
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
  const before = '\uFEFF# my notes\r\nTELEGRAM_BOT_TOKEN=123:abc\r\nSECRETS_KEY=\r\nWEBHOOK_SECRET=   # fill me\r\nDASHBOARD_PASSWORD=keepme\r\nOTHER=x'
  const { text, changed } = initEnv(before)
  assert.deepEqual(changed.sort(), ['SECRETS_KEY', 'TELEGRAM_LINK_CODE', 'WEBHOOK_SECRET'].sort())
  assert.equal(val(text, 'TELEGRAM_BOT_TOKEN'), '123:abc')
  assert.equal(val(text, 'DASHBOARD_PASSWORD'), 'keepme')
  assert.equal(val(text, 'OTHER'), 'x')
  assert.ok(text.startsWith('﻿# my notes\r\nTELEGRAM_BOT_TOKEN=123:abc\r\n'), 'BOM, comment and CRLF endings kept')
  assert.ok(!/[^\r]\n/.test(text), 'new lines follow the file\'s CRLF endings')
  assert.equal(text.split('\n').filter((l) => l.startsWith('TELEGRAM_BOT_TOKEN=')).length, 1, 'no duplicate slots')
})

test('keys are recognised with export prefix, spaces around = and leading whitespace; comments are not keys', () => {
  const before = [
    'export SECRETS_KEY=s1', '  DASHBOARD_PASSWORD = keep me', '\tWEBHOOK_SECRET=w1', 'export   TELEGRAM_LINK_CODE =',
    '# GEMINI_API_KEY=commented', '  # GITHUB_TOKEN=also-commented', 'TELEGRAM_BOT_TOKEN = 123:abc',
  ].join('\n') + '\n'
  const { text, changed } = initEnv(before, (n) => 'g'.repeat(n * 2))
  assert.deepEqual(changed, ['TELEGRAM_LINK_CODE'])
  const lines = text.split('\n')
  for (const l of before.split('\n').filter((l) => !l.includes('TELEGRAM_LINK_CODE'))) assert.ok(lines.includes(l), `line kept: ${l}`)
  assert.ok(lines.includes('export   TELEGRAM_LINK_CODE = ' + 'g'.repeat(24)), 'empty key filled in place, prefix kept')
  for (const k of ['SECRETS_KEY', 'DASHBOARD_PASSWORD', 'WEBHOOK_SECRET', 'TELEGRAM_BOT_TOKEN', 'TELEGRAM_LINK_CODE'])
    assert.equal(lines.filter((l) => new RegExp(`^\\s*(export\\s+)?${k}\\s*=`).test(l)).length, 1, `no duplicate ${k}`)
  assert.ok(lines.includes('GEMINI_API_KEY='), 'commented key does not count as present')
  assert.ok(lines.includes('GITHUB_TOKEN='), 'indented comment does not count as present')
  assert.equal(initEnv(text).text, text, 'idempotent')
})

test('addKeys and regenKey recognise the same forms', () => {
  const a = addKeys('export ANTHROPIC_API_KEY=sk\n  OPENAI_API_KEY = o\n', ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'OPENAI_BASE_URL'])
  assert.deepEqual(a.changed, ['OPENAI_BASE_URL'])
  assert.equal(a.text, 'export ANTHROPIC_API_KEY=sk\n  OPENAI_API_KEY = o\nOPENAI_BASE_URL=\n')
  const r = regenKey('A=1\nexport SECRETS_KEY = old\nB=2\n', 'SECRETS_KEY', () => 'new')
  assert.equal(r.text, 'A=1\nexport SECRETS_KEY = new\nB=2\n')
})

test('addKeys error does not echo rejected key names (they may be secrets)', () => {
  assert.throws(() => addKeys('', ['sk-fake-secret-000', 'OK_KEY', 'also bad']), (e) => {
    assert.doesNotMatch(e.message, /sk-fake-secret-000|also bad/)
    assert.match(e.message, /\b2\b/)
    return true
  })
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

test('CLI runs when reached through a directory link (junction/symlink)', () => {
  const dir = tempRepo(true)
  const linkRoot = mkdtempSync(join(tmpdir(), 'env-init-link-'))
  const link = join(linkRoot, 'scripts')
  symlinkSync(dirname(SCRIPT), link, process.platform === 'win32' ? 'junction' : 'dir')
  const r = spawnSync(process.execPath, [join(link, 'env-init.mjs')], { cwd: dir, encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
  assert.equal(r.stdout.trim(), 'OK .env: TELEGRAM_LINK_CODE, DASHBOARD_PASSWORD, SECRETS_KEY, WEBHOOK_SECRET')
  assert.equal(existsSync(join(dir, '.env')), true)
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

test('CLI twice on a BOM + CRLF .env with comments and export / spaced forms: original bytes kept, second run is a no-op', () => {
  const dir = tempRepo(true)
  const original = '﻿# fake test values only\r\nexport SECRETS_KEY=' + 'a'.repeat(64) + '\r\n  DASHBOARD_PASSWORD = keep me\r\n'
    + '\tWEBHOOK_SECRET=' + 'b'.repeat(64) + '\r\n# TELEGRAM_LINK_CODE=from-a-comment\r\n\r\nTELEGRAM_BOT_TOKEN = 000000:fake\r\nGEMINI_API_KEY="g # x"\r\n'
  writeFileSync(join(dir, '.env'), original)
  const r1 = run(dir)
  assert.equal(r1.status, 0, r1.stderr)
  assert.equal(r1.stdout.trim(), 'OK .env: TELEGRAM_LINK_CODE')
  const after1 = readFileSync(join(dir, '.env'))
  assert.ok(after1.subarray(0, Buffer.byteLength(original)).equals(Buffer.from(original)), 'every original line byte-identical')
  const added = after1.subarray(Buffer.byteLength(original)).toString('utf8')
  assert.match(added, /^TELEGRAM_LINK_CODE=[0-9a-f]{24}\r\nGITHUB_TOKEN=\r\n$/)
  const r2 = run(dir)
  assert.equal(r2.status, 0, r2.stderr)
  assert.equal(r2.stdout.trim(), 'OK .env: -')
  assert.ok(readFileSync(join(dir, '.env')).equals(after1), 'second run changes nothing')
})

test('CLI refuses when .env is tracked by git, even if listed in .gitignore', () => {
  const dir = tempRepo(true)
  writeFileSync(join(dir, '.env'), 'TELEGRAM_BOT_TOKEN=000000:fake\n')
  execFileSync('git', ['add', '-f', '.env'], { cwd: dir })
  const r = run(dir)
  assert.equal(r.status, 2)
  assert.equal(readFileSync(join(dir, '.env'), 'utf8'), 'TELEGRAM_BOT_TOKEN=000000:fake\n', 'nothing written')
  assert.doesNotMatch(r.stdout + r.stderr, /000000:fake/)
})

test('CLI from a subfolder writes .env at the repo root', () => {
  const dir = tempRepo(true)
  const sub = join(dir, 'a', 'b')
  mkdirSync(sub, { recursive: true })
  const r = run(sub)
  assert.equal(r.status, 0, r.stderr)
  assert.equal(existsSync(join(dir, '.env')), true)
  assert.equal(existsSync(join(sub, '.env')), false)
})

test('CLI --add with invalid names prints only the count, not the names', () => {
  const dir = tempRepo(true)
  const r = run(dir, ['--add', 'sk-fake-secret-000', 'GOOD_KEY'])
  assert.equal(r.status, 1)
  assert.doesNotMatch(r.stdout + r.stderr, /sk-fake-secret-000/)
  assert.match(r.stderr, /\b1\b/)
  assert.equal(existsSync(join(dir, '.env')), false)
})
