/**
 * عقد المهارة ↔ القالب: كل شي تعتمد عليه المهارة من القالب موجود ومطابق.
 * التشغيل (من جذر المهارة؛ القالب لازم يكون عليه npm ci):
 *   npm run test:contract -- <template-dir>      أو      TEMPLATE_DIR=<template-dir> npm run test:contract
 * (scripts/test-contract.mjs يشغّل `node --import tsx --test <هذا الملف>` من داخل مجلد القالب، عشان يستخدم tsx وzod حقه.)
 *
 * ترتيب رفع رقم العقد (onboardingContract) من N إلى N+1:
 *   1. المهارة أولاً: SUPPORTED_CONTRACTS = [N, N+1] في SKILL.md، والمراجع تدعم الحالتين. ادمج وانشر.
 *   2. بعدها القالب: "assistantTemplate": { "onboardingContract": N+1 } في package.json.
 *   3. لاحقاً (اختياري)، لما ما يبقى أحد على N: SUPPORTED_CONTRACTS = [N+1].
 * هذا الاختبار يتحقق إن رقم القالب ضمن SUPPORTED_CONTRACTS، فما ينكسر لما المهارة تسبق القالب بخطوة.
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

test('template contract is in the skill\'s supported range', () => {
  const list = /SUPPORTED_CONTRACTS = \[([\d,\s]+)\]/.exec(skill)?.[1]
  assert.ok(list, 'SUPPORTED_CONTRACTS line in SKILL.md')
  const supported = list.split(',').map((n) => Number(n.trim()))
  assert.ok(supported.every((n, i) => Number.isInteger(n) && (i === 0 || n === supported[i - 1] + 1)), `not consecutive: [${supported}]`)
  const tpl = pkg.assistantTemplate?.onboardingContract
  assert.ok(supported.includes(tpl), `template onboardingContract ${tpl} is not in SUPPORTED_CONTRACTS [${supported}]`)
})

test('template root has the marker file the skill uses to detect an assistant repo', () => {
  assert.ok(existsSync(join(T, 'assistant.config.example.json')), 'assistant.config.example.json missing at template root')
})

test('npm scripts the skill runs exist', () => {
  for (const s of ['doctor', 'telegram-link']) assert.ok(pkg.scripts?.[s], s)
  assert.match(all, /npm run doctor -- --online/)
  assert.match(all, /npm run telegram-link/)
})

/** يفك optional/default/nullable لين يوصل للمخطط الداخلي (zod 3 و4) */
const unwrap = (s) => {
  for (let i = 0; i < 10 && s && !s.shape; i++) s = (s.def ?? s._def)?.innerType
  return s
}
/** مسارات المفاتيح المطلوبة (اللي ما تقبل undefined) من مخطط zod، بما فيها المتداخلة مثل github.self_repo */
function requiredPaths(schema, prefix = '') {
  const out = []
  for (const [k, f] of Object.entries(schema.shape)) {
    if (f.safeParse(undefined).success) continue
    out.push(prefix + k)
    const inner = unwrap(f)
    if (inner?.shape) out.push(...requiredPaths(inner, `${prefix}${k}.`))
  }
  return out
}
/** كل المسارات الموجودة في كائن JSON */
const presentPaths = (obj, prefix = '') => Object.entries(obj).flatMap(([k, v]) =>
  v && typeof v === 'object' && !Array.isArray(v) ? [prefix + k, ...presentPaths(v, `${prefix}${k}.`)] : [prefix + k])
const knownPath = (schema, path) => {
  let s = schema
  for (const part of path.split('.')) {
    s = unwrap(s)?.shape?.[part]
    if (!s) return false
  }
  return true
}

test('config template in the skill covers every required key of the profile schema', async () => {
  const { ProfileSchema } = await load('src/profile.ts')
  const block = /## قالب الإعدادات[\s\S]*?```json\n([\s\S]*?)```/.exec(ref('04-config.md'))?.[1]
  assert.ok(block, 'config block')
  // القيم بين <> نصوص، إلا مصفوفة مثل [<أيام الدوام…>] نحولها لمصفوفة فاضية عشان يصير JSON صالح
  const cfg = JSON.parse(block.replace(/\[<[^\]]*>\]/g, '[]'))
  const required = requiredPaths(ProfileSchema)
  assert.ok(required.includes('owner.name') && required.includes('github.self_repo'), `schema introspection looks wrong: ${required}`)
  const present = presentPaths(cfg)
  for (const p of required) assert.ok(present.includes(p), `required config key missing from the skill template: ${p}`)
  for (const p of present) assert.ok(knownPath(ProfileSchema, p), `unknown key in skill template: ${p}`)
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
