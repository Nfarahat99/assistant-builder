#!/usr/bin/env node
/**
 * يشغّل اختبار العقد (tests/contract/template-contract.mjs) ضد نسخة محلية من القالب.
 * Cross-platform (no shell syntax). The template must have its dependencies installed (npm ci).
 *   npm run test:contract -- <template-dir>
 *   TEMPLATE_DIR=<template-dir> npm run test:contract
 * A relative path resolves against the directory npm was started from (INIT_CWD), not the package root.
 */
import { existsSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const CONTRACT = fileURLToPath(new URL('../tests/contract/template-contract.mjs', import.meta.url))

/** مسار القالب المطلق، أو null لو ما انعطى */
export function templateDir({ argv, env, cwd }) {
  const raw = argv[0] ?? env.TEMPLATE_DIR
  if (!raw) return null
  return resolve(env.INIT_CWD ?? cwd, raw)
}

function main() {
  const dir = templateDir({ argv: process.argv.slice(2), env: process.env, cwd: process.cwd() })
  if (!dir) {
    console.error('usage: npm run test:contract -- <template-dir>   (or set TEMPLATE_DIR)')
    return 1
  }
  if (!existsSync(join(dir, 'node_modules', 'tsx'))) {
    console.error(`tsx not found in ${dir}/node_modules — run "npm ci" in the template first`)
    return 1
  }
  // --import tsx resolves from the cwd, so run inside the template to use its own tsx and zod.
  const r = spawnSync(process.execPath, ['--import', 'tsx', '--test', CONTRACT], {
    cwd: dir,
    env: { ...process.env, TEMPLATE_DIR: dir },
    stdio: 'inherit',
  })
  if (r.error) {
    console.error(r.error.message)
    return 1
  }
  return r.status ?? 1
}

function isMainModule() {
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])
  } catch {
    return false
  }
}

if (isMainModule()) process.exitCode = main()
