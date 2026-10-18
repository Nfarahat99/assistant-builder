/**
 * عقد المهارة ↔ القالب: كل شي تعتمد عليه المهارة من القالب موجود ومطابق.
 * التشغيل من جذر القالب: TEMPLATE_DIR=. node --import tsx --test <builder>/tests/contract/template-contract.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { GENERATED, BLANK } from '../../plugins/assistant-builder/skills/build-assistant/scripts/env-init.mjs'

const T = resolve(process.env.TEMPLATE_DIR ?? process.cwd())
const SKILL_DIR = fileURLToPath(new URL('../../plugins/assistant-builder/skills/build-assistant/', import.meta.url))
const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const skill = read(join(SKILL_DIR, 'SKILL.md'))
const refsDir = join(SKILL_DIR, 'references')
const ref = (f) => read(join(refsDir, f))
const all = [skill, ...readdirSync(refsDir).filter((f) => f.endsWith('.md')).map(ref)].join('\n')
const load = (p) => import(pathToFileURL(join(T, p)).href)
const pkg = JSON.parse(read(join(T, 'package.json')))

test('contract number matches', () => {
  const mine = Number(/onboardingContract = (\d+)/.exec(skill)?.[1])
  assert.equal(pkg.assistantTemplate?.onboardingContract, mine)
})

test('template root has the marker file the skill uses to detect an assistant repo', () => {
  assert.ok(existsSync(join(T, 'assistant.config.example.json')), 'assistant.config.example.json missing at template root')
})

test('npm scripts the skill runs exist', () => {
  for (const s of ['doctor', 'telegram-link']) assert.ok(pkg.scripts?.[s], s)
  assert.match(all, /npm run doctor -- --online/)
  assert.match(all, /npm run telegram-link/)
})

test('config template in the skill matches the profile schema', async () => {
  const { ProfileSchema } = await load('src/profile.ts')
  const shape = Object.keys(ProfileSchema.shape)
  const block = /## قالب الإعدادات[\s\S]*?```json\n([\s\S]*?)```/.exec(ref('04-config.md'))?.[1]
  assert.ok(block, 'config block')
  const keys = [...block.matchAll(/^  "(\w+)":/gm)].map((m) => m[1])
  for (const k of keys) assert.ok(shape.includes(k), `unknown key in skill template: ${k}`)
  for (const k of ['owner', 'assistant', 'user_type', 'github']) assert.ok(keys.includes(k), `required key missing: ${k}`)
  assert.match(block, /"user_type": "<programmer\|non_programmer>"/)
  assert.match(block, /"language": "<ar\|en>"/)
  assert.match(block, /"default_branch": "<الفرع المؤكَّد>"/)
  assert.doesNotMatch(block, /"default_branch": "main"|"user_type": "non_programmer"|"language": "ar"/)
  assert.match(block, /"timezone": "Asia\/Riyadh"/)
})

test('personal questions source exists', async () => {
  const { QUESTIONS } = await load('src/onboarding/questions.ts')
  assert.ok(Array.isArray(QUESTIONS) && QUESTIONS.length > 0)
  assert.match(all, /src\/onboarding\/questions\.ts/)
})

const PHRASES = ['ملف الإعدادات سليم', 'القناة جاهزة: تيليجرام', 'توكن تيليجرام صحيح', 'توكن تيليجرام غلط', 'ما قدرت أتحقق من توكن تيليجرام',
  'مفتاح Gemini صحيح', 'مفتاح Gemini غلط', 'متطلبات ربط واتساب من اللوحة كاملة', 'ما فيه PUBLIC_URL ولا RAILWAY_PUBLIC_DOMAIN']

test('doctor messages the skill quotes still exist, and the skill quotes them', async () => {
  const { runChecks, runOnlineChecks } = await load('src/doctor.ts')
  const cfg = read(join(T, 'assistant.config.example.json')).replace('اسم المالك', 'Tester').replace('github-user/my-assistant', 'someone/my-assistant')
  const env = { TELEGRAM_BOT_TOKEN: 't', TELEGRAM_LINK_CODE: 'abc123', GEMINI_API_KEY: 'g', DASHBOARD_PASSWORD: 'x'.repeat(32), SECRETS_KEY: 'a'.repeat(64),
    WEBHOOK_SECRET: 'w'.repeat(32), GATEWAY_URL: 'https://gw.example.com', GATEWAY_PROVISION_KEY: 'p', GITHUB_TOKEN: 'x' }
  const reply = (ok) => (async (u) => new Response(JSON.stringify(String(u).includes('telegram') ? { ok, result: { username: 'demo_bot' } } : { models: [] }), { status: ok ? 200 : 401 }))
  const msgs = [
    ...runChecks(env, cfg), ...runChecks({ ...env, TELEGRAM_BOT_TOKEN: '' }, null), ...runChecks({}, cfg),
    ...runChecks({ ...env, PUBLIC_URL: 'https://a.example.com' }, cfg),
    ...(await runOnlineChecks(env, { fetch: reply(true) })), ...(await runOnlineChecks(env, { fetch: reply(false) })),
    ...(await runOnlineChecks(env, { fetch: async () => { throw new Error('down') } })),
  ].map((c) => c.message_ar)
  for (const p of PHRASES) {
    assert.ok(msgs.some((m) => m.includes(p)), `doctor no longer says: ${p}`)
    assert.ok(all.includes(p), `skill does not quote: ${p}`)
  }
})

test('env vars the script writes are known to the template source', () => {
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)])
  const src = walk(join(T, 'src')).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts')).map(read).join('\n')
  for (const k of [...Object.keys(GENERATED), ...BLANK, 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'OPENAI_BASE_URL', 'GATEWAY_URL', 'GATEWAY_PROVISION_KEY'])
    assert.ok(src.includes(`env.${k}`), `template src does not read ${k}`)
})
