import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SKILL_DIR = join(ROOT, 'plugins/assistant-builder/skills/build-assistant')
const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const skill = read(join(SKILL_DIR, 'SKILL.md'))
const refs = readdirSync(join(SKILL_DIR, 'references')).filter((f) => f.endsWith('.md'))
const ref = (f) => read(join(SKILL_DIR, 'references', f))
const all = [skill, ...refs.map(ref)].join('\n')

test('marketplace and plugin manifests agree', () => {
  const mk = JSON.parse(read(join(ROOT, '.claude-plugin/marketplace.json')))
  assert.equal(mk.name, 'assistant-builder')
  assert.ok(mk.owner?.name)
  assert.equal(mk.plugins.length, 1)
  assert.equal(mk.plugins[0].name, 'assistant-builder')
  const src = join(ROOT, mk.plugins[0].source)
  const pj = JSON.parse(read(join(src, '.claude-plugin/plugin.json')))
  assert.equal(pj.name, 'assistant-builder')
  assert.equal(pj.version, undefined, 'no version → updates track commits')
  assert.ok(existsSync(join(src, 'skills/build-assistant/SKILL.md')))
})

test('SKILL.md frontmatter, size and contract line', () => {
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(skill)?.[1]
  assert.ok(fm, 'frontmatter')
  assert.match(fm, /^name: build-assistant$/m)
  assert.match(fm, /^description: .*(مساعد).*(assistant)/mi)
  assert.match(fm, /جهّز إعدادات ربط واتساب/)
  assert.doesNotMatch(fm, /disable-model-invocation:\s*true/)
  assert.ok(skill.split('\n').length < 500, 'SKILL.md under 500 lines')
  assert.match(skill, /\*\*عقد المقابلة المدعوم:\*\* onboardingContract = 1/)
})

test('every reference file is linked from SKILL.md and every link resolves', () => {
  const expected = ['00-prereqs.md', '01-repo.md', '02-resume.md', '03-questions.md', '04-config.md', '05-personal.md', '06-secrets.md', '07-push.md', '08-railway.md', '09-finish.md', 'whatsapp-later.md']
  assert.deepEqual([...refs].sort(), [...expected].sort())
  for (const f of expected) assert.ok(skill.includes(`references/${f}`), `SKILL.md links ${f}`)
  for (const [file, text] of [['SKILL.md', skill], ...refs.map((f) => [`references/${f}`, ref(f)])]) {
    for (const m of text.matchAll(/\]\(([^)#\s]+\.md)(#[^)]*)?\)/g)) {
      if (/^https?:/.test(m[1])) continue
      assert.ok(existsSync(join(SKILL_DIR, dirname(file), m[1])), `${file} → ${m[1]}`)
    }
  }
})

test('the skill never reads or prints .env and uses the bundled script', () => {
  assert.doesNotMatch(all, /\b(cat|type|Get-Content|less|more|head|tail|bat)\s+\.env\b/)
  assert.doesNotMatch(all, /node -e "const fs=require\('fs'\)/, 'long one-liners replaced by env-init.mjs')
  assert.match(all, /node "\$\{CLAUDE_SKILL_DIR\}\/scripts\/env-init\.mjs"/)
  assert.match(all, /--add ANTHROPIC_API_KEY/)
  assert.match(all, /--regen SECRETS_KEY/)
  assert.match(all, /git check-ignore -q \.env/)
})

test('repo step covers the three starting states, shared history and the contract check', () => {
  const repo = ref('01-repo.md')
  for (const s of ['gh repo create', '--private', 'git clone https://github.com/Nfarahat99/assistant-template.git',
    'git remote rename origin template', 'git remote add origin', 'git push -u origin main', 'assistantTemplate', 'onboardingContract',
    'gh workflow run template-sync', 'assistant.config.example.json', 'gh secret list', 'git pull origin', 'عندك مساعد على GitHub من قبل؟', 'claude plugin marketplace update assistant-builder', '/reload-plugins', 'Use this template'])
    assert.ok(repo.includes(s), `01-repo.md missing: ${s}`)
  assert.match(repo, /مجلد فرعي/)
})

test('content carried over from the Phase 2 interview', () => {
  for (const re of [
    /gh repo view <owner>\/<name> --json owner,viewerPermission/, /ADMIN/, /Transfer ownership/, /Classic/, /Fine-grained/,
    /npm run doctor -- --online/, /npm run telegram-link/, /claude setup-token/, /gh auth login --web --git-protocol https/,
    /نسويها هنا الحين \/ لاحقاً مع المساعد في المحادثة/, /src\/onboarding\/questions\.ts/, /knowledge\/owner\.md/,
    /GATEWAY_PROVISION_KEY/, /\$\{\{Postgres\.DATABASE_URL\}\}/, /FILES_DIR/, /AskUserQuestion/,
  ]) assert.match(all, re)
  assert.match(ref('04-config.md'), /## قالب الإعدادات[\s\S]*?```json\n/)
})

test('gh login always requests the workflow scope', () => {
  assert.match(all, /gh auth login --web --git-protocol https --scopes workflow/)
  assert.match(all, /gh auth refresh -h github.com -s workflow/)
  assert.doesNotMatch(all, /gh auth login --web --git-protocol https(?! --scopes workflow)/)
})
