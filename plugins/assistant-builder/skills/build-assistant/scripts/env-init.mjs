#!/usr/bin/env node
/**
 * يجهّز ملف .env للمساعد: يولّد الأسرار الداخلية ويضيف خانات فاضية للمفاتيح اللي يجيبها المالك.
 * لا يطبع أي قيمة، ولا يغيّر أي قيمة موجودة، ويرفض الكتابة لو .env مو محمي بـ .gitignore.
 *   node env-init.mjs              تهيئة
 *   node env-init.mjs --add K…     يضيف خانات فاضية (K=) لو مو موجودة
 *   node env-init.mjs --regen K    قيمة جديدة لسر مولّد واحد
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

/** الأسرار المولّدة: الاسم ← عدد البايتات (القيمة hex بضعف الطول). TELEGRAM_LINK_CODE = 24 خانة تناسب رابط تيليجرام المباشر */
export const GENERATED = { TELEGRAM_LINK_CODE: 12, DASHBOARD_PASSWORD: 16, SECRETS_KEY: 32, WEBHOOK_SECRET: 32 }
/** خانات فاضية يلصق فيها المالك مفاتيحه */
export const BLANK = ['TELEGRAM_BOT_TOKEN', 'GEMINI_API_KEY', 'GITHUB_TOKEN']

const KEY = /^[A-Z][A-Z0-9_]*$/
const hex = (n) => randomBytes(n).toString('hex')
const toLines = (text) => {
  const t = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').trimEnd()
  return t ? t.split('\n') : []
}
const find = (lines, k) => lines.findIndex((l) => l.startsWith(k + '='))
const isEmpty = (line, k) => line.slice(k.length + 1).split('#')[0].trim() === ''
const out = (lines, changed) => ({ text: lines.join('\n') + '\n', changed })

export function initEnv(text, gen = hex) {
  const lines = toLines(text)
  const changed = []
  for (const [k, bytes] of Object.entries(GENERATED)) {
    const i = find(lines, k)
    if (i < 0) lines.push(`${k}=${gen(bytes)}`)
    else if (isEmpty(lines[i], k)) lines[i] = `${k}=${gen(bytes)}`
    else continue
    changed.push(k)
  }
  for (const k of BLANK) if (find(lines, k) < 0) lines.push(`${k}=`)
  return out(lines, changed)
}

export function addKeys(text, keys) {
  const bad = keys.filter((k) => !KEY.test(k))
  if (bad.length) throw new Error(`invalid key name: ${bad.join(', ')}`)
  const lines = toLines(text)
  const changed = []
  for (const k of keys) if (find(lines, k) < 0 && !changed.includes(k)) { lines.push(`${k}=`); changed.push(k) }
  return out(lines, changed)
}

export function regenKey(text, key, gen = hex) {
  if (!Object.hasOwn(GENERATED, key)) throw new Error(`only generated keys can be regenerated: ${Object.keys(GENERATED).join(', ')}`)
  const lines = toLines(text)
  const i = find(lines, key)
  const fresh = `${key}=${gen(GENERATED[key])}`
  if (i < 0) lines.push(fresh)
  else lines[i] = fresh
  return out(lines, [key])
}

function insideGit() {
  try { execFileSync('git', ['rev-parse', '--is-inside-work-tree'], { stdio: 'ignore' }); return true } catch { return false }
}
function isIgnored(file) {
  try { execFileSync('git', ['check-ignore', '-q', file], { stdio: 'ignore' }); return true } catch { return false }
}

function main(argv) {
  const file = '.env'
  let apply
  if (argv.length === 0) apply = (t) => initEnv(t)
  else if (argv[0] === '--add' && argv.length > 1) apply = (t) => addKeys(t, argv.slice(1))
  else if (argv[0] === '--regen' && argv.length === 2) apply = (t) => regenKey(t, argv[1])
  else {
    console.error('usage: env-init.mjs | --add KEY [KEY…] | --regen KEY')
    process.exitCode = 1
    return
  }
  if (insideGit() && !isIgnored(file)) {
    console.error('❌ .env مو محمي بـ .gitignore — ما كتبت شي. / .env is not git-ignored; nothing written.')
    process.exitCode = 2
    return
  }
  let result
  try {
    result = apply(existsSync(file) ? readFileSync(file, 'utf8') : '')
  } catch (e) {
    console.error(`❌ ${e.message}`)
    process.exitCode = 1
    return
  }
  writeFileSync(file, result.text)
  console.log('OK .env: ' + (result.changed.join(', ') || '-'))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2))
