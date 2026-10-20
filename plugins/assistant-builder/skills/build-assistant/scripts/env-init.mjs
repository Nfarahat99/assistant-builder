#!/usr/bin/env node
/**
 * يجهّز ملف .env للمساعد: يولّد الأسرار الداخلية ويضيف خانات فاضية للمفاتيح اللي يجيبها المالك.
 * لا يطبع أي قيمة، ولا يغيّر أي قيمة موجودة، ولا يحذف أي سطر (يحافظ على BOM ونهايات CRLF).
 * يرفض الكتابة لو .env مو محمي بـ .gitignore أو كان مرفوعاً (متتبَّعاً) في git.
 * .env دائماً في جذر المستودع (git rev-parse --show-toplevel)، حتى لو شغّلته من مجلد فرعي.
 *   node env-init.mjs              تهيئة
 *   node env-init.mjs --add K…     يضيف خانات فاضية (K=) لو مو موجودة
 *   node env-init.mjs --regen K    قيمة جديدة لسر مولّد واحد
 */
import { readFileSync, writeFileSync, existsSync, realpathSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

/** الأسرار المولّدة: الاسم ← عدد البايتات (القيمة hex بضعف الطول). TELEGRAM_LINK_CODE = 24 خانة تناسب رابط تيليجرام المباشر */
export const GENERATED = { TELEGRAM_LINK_CODE: 12, DASHBOARD_PASSWORD: 16, SECRETS_KEY: 32, WEBHOOK_SECRET: 32 }
/** خانات فاضية يلصق فيها المالك مفاتيحه */
export const BLANK = ['TELEGRAM_BOT_TOKEN', 'GEMINI_API_KEY', 'GITHUB_TOKEN']

/** كل الأسماء اللي تمر على find/head تطابق هذا النمط، فما تحتاج تهريب داخل RegExp */
const KEY = /^[A-Z][A-Z0-9_]*$/
const hex = (n) => randomBytes(n).toString('hex')

/**
 * يقسم النص لأسطر ويحفظ نهاية كل سطر كما هي، عشان كل سطر أصلي يرجع بنفس البايتات.
 * الأسطر الجديدة تاخذ نهاية الملف السائدة (CRLF لو موجودة، وإلا LF).
 */
function parse(text) {
  const bom = text.startsWith('﻿') ? '﻿' : ''
  const body = text.slice(bom.length)
  const parts = body.split(/(\r?\n)/)
  const lines = []
  for (let i = 0; i < parts.length; i += 2) lines.push({ text: parts[i], end: parts[i + 1] ?? '' })
  if (lines.at(-1)?.text === '' && lines.at(-1)?.end === '') lines.pop()
  return { bom, eol: body.includes('\r\n') ? '\r\n' : '\n', lines }
}
const isComment = (line) => /^\s*#/.test(line)
/** بداية سطر المفتاح حتى علامة = بما فيها: يقبل `export ` والمسافات قبل الاسم وحول = */
const head = (line, k) => (isComment(line) ? undefined : new RegExp(`^\\s*(?:export\\s+)?${k}\\s*=`).exec(line)?.[0])
const find = (doc, k) => doc.lines.findIndex((l) => head(l.text, k) !== undefined)
const isEmpty = (line, k) => line.slice(head(line, k).length).split('#')[0].trim() === ''
/** يبدّل القيمة فقط ويبقي بداية السطر (export والمسافات) كما هي؛ صيغة `KEY = v` تبقى بمسافة بعد = */
const setValue = (doc, i, k, v) => {
  const h = head(doc.lines[i].text, k)
  doc.lines[i].text = h + (/\s=$/.test(h) ? ' ' : '') + v
}
const append = (doc, line) => doc.lines.push({ text: line, end: '' })
const out = (doc, changed) => ({ text: doc.bom + doc.lines.map((l) => l.text + (l.end || doc.eol)).join(''), changed })

export function initEnv(text, gen = hex) {
  const doc = parse(text)
  const changed = []
  for (const [k, bytes] of Object.entries(GENERATED)) {
    const i = find(doc, k)
    if (i < 0) append(doc, `${k}=${gen(bytes)}`)
    else if (isEmpty(doc.lines[i].text, k)) setValue(doc, i, k, gen(bytes))
    else continue
    changed.push(k)
  }
  for (const k of BLANK) if (find(doc, k) < 0) append(doc, `${k}=`)
  return out(doc, changed)
}

export function addKeys(text, keys) {
  const bad = keys.filter((k) => !KEY.test(k))
  // لا نطبع الأسماء المرفوضة: ممكن تكون سراً انلصق بالغلط مكان اسم المتغير
  if (bad.length) throw new Error(`invalid key names: ${bad.length} (use A-Z, 0-9 and _, starting with a letter)`)
  const doc = parse(text)
  const changed = []
  for (const k of keys) if (find(doc, k) < 0 && !changed.includes(k)) { append(doc, `${k}=`); changed.push(k) }
  return out(doc, changed)
}

export function regenKey(text, key, gen = hex) {
  if (!Object.hasOwn(GENERATED, key)) throw new Error(`only generated keys can be regenerated: ${Object.keys(GENERATED).join(', ')}`)
  const doc = parse(text)
  const i = find(doc, key)
  if (i < 0) append(doc, `${key}=${gen(GENERATED[key])}`)
  else setValue(doc, i, key, gen(GENERATED[key]))
  return out(doc, [key])
}

/** جذر المستودع، أو null لو مو داخل git */
function gitRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null
  } catch {
    return null
  }
}
const gitOk = (cwd, args) => {
  try { execFileSync('git', args, { cwd, stdio: 'ignore' }); return true } catch { return false }
}

function main(argv) {
  let apply
  if (argv.length === 0) apply = (t) => initEnv(t)
  else if (argv[0] === '--add' && argv.length > 1) apply = (t) => addKeys(t, argv.slice(1))
  else if (argv[0] === '--regen' && argv.length === 2) apply = (t) => regenKey(t, argv[1])
  else {
    console.error('usage: env-init.mjs | --add KEY [KEY…] | --regen KEY')
    process.exitCode = 1
    return
  }
  const root = gitRoot()
  const file = root ? join(root, '.env') : '.env'
  if (root && gitOk(root, ['ls-files', '--error-unmatch', '--', '.env'])) {
    console.error('❌ .env مرفوع في git (متتبَّع) — ما كتبت شي. لازم ينشال من git أول (git rm --cached .env) ويتغيّر أي سر فيه. / .env is tracked by git; nothing written.')
    process.exitCode = 2
    return
  }
  if (root && !gitOk(root, ['check-ignore', '-q', '.env'])) {
    console.error('❌ .env مو محمي بـ .gitignore — ما كتبت شي. / .env is not git-ignored; nothing written.')
    process.exitCode = 2
    return
  }
  const before = existsSync(file) ? readFileSync(file, 'utf8') : null
  let result
  try {
    result = apply(before ?? '')
  } catch (e) {
    console.error(`❌ ${e.message}`)
    process.exitCode = 1
    return
  }
  if (result.text !== before) writeFileSync(file, result.text)
  console.log('OK .env: ' + (result.changed.join(', ') || '-'))
}

// Compare real paths: Node resolves junctions/symlinks in import.meta.url but not in argv[1].
function isMainModule() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])
  } catch {
    return false
  }
}

if (isMainModule()) main(process.argv.slice(2))
