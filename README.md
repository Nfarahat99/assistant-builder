# assistant-builder

## العربية

مهارة (Skill) لـ Claude Code تبني لك **مساعدك الشخصي** على تيليجرام (وواتساب لاحقاً) من القالب [Nfarahat99/assistant-template](https://github.com/Nfarahat99/assistant-template) عبر مقابلة تقنية خطوة خطوة: تنشئ لك ريبو خاص جديد، وتكتب إعداداتك، وتجهّز الأسرار (بدون ما تمر بالمحادثة)، وتربط الاستضافة على Railway، ثم توصّلك بالبوت.

### التثبيت

داخل Claude Code:

```
/plugin marketplace add Nfarahat99/assistant-builder
/plugin install assistant-builder@assistant-builder
```

ثم اكتب `/reload-plugins`.

### التشغيل

اكتب `/assistant-builder:build-assistant` أو بالكلام: «ابنِ لي مساعدي» / «كمّل إعداد مساعدي». شغّلها من مجلد فاضي (أو أي مجلد عادي ليس ريبو git).

### المتطلبات

- Claude Code
- حساب GitHub
- حساب تيليجرام
- حساب Google (لمفتاح Gemini المجاني)
- حساب Railway (للاستضافة)

المهارة تتأكد من git وNode 20+ وGitHub CLI وتثبّت الناقص بموافقتك.

### التحديث

```
claude plugin marketplace update assistant-builder
```

ثم `/reload-plugins`.

القالب: https://github.com/Nfarahat99/assistant-template

---

## English

A Claude Code skill that builds your **personal assistant** (Telegram, with WhatsApp later) from the [Nfarahat99/assistant-template](https://github.com/Nfarahat99/assistant-template) template through a guided, step-by-step technical interview. It creates a new private repo for you, writes your config, prepares secrets (they never pass through the chat), sets up Railway hosting, and links you to your bot. The interview itself is conducted in Arabic (or English if you choose it).

### Install

Inside Claude Code:

```
/plugin marketplace add Nfarahat99/assistant-builder
/plugin install assistant-builder@assistant-builder
```

Then run `/reload-plugins`.

### Use

Run `/assistant-builder:build-assistant`, or just say "build my personal assistant" / "continue setting up my assistant". Start from an empty folder (or any plain folder that is not a git repo).

### Requirements

- Claude Code
- A GitHub account
- A Telegram account
- A Google account (for the free Gemini API key)
- A Railway account (hosting)

The skill checks git, Node 20+ and the GitHub CLI, and installs what is missing with your approval.

### Update

```
claude plugin marketplace update assistant-builder
```

Then `/reload-plugins`.

Template: https://github.com/Nfarahat99/assistant-template

---

## Development

No dependencies: ESM `.mjs` files and `node:test` only (Node 20+).

```
npm test                                   # skill structure + env-init unit and CLI tests
npm run test:contract -- ../assistant-template
# or: TEMPLATE_DIR=../assistant-template npm run test:contract
```

The contract test runs inside the template folder with the template's own `tsx` (run `npm ci` there first). A relative template path resolves against the folder you ran `npm` from. It checks that everything the skill relies on still exists in the template: required config keys (read from the template's `ProfileSchema`), npm scripts, doctor messages the skill quotes, and the onboarding contract number.

### Bumping the onboarding contract

`SKILL.md` lists the template contracts the skill supports: `SUPPORTED_CONTRACTS = [N]`. The template declares its own in `package.json` → `assistantTemplate.onboardingContract`. The contract test passes when the template's number is in that list. To move from N to N+1:

1. **Skill first:** set `SUPPORTED_CONTRACTS = [N, N+1]` and make the references handle both. Merge and publish.
2. **Then the template:** bump `onboardingContract` to N+1.
3. **Later (optional):** once no one is left on N, drop it: `SUPPORTED_CONTRACTS = [N+1]`.

Landing the template bump first would make every installed skill tell owners their skill is out of date until the skill catches up.

License: MIT (see `LICENSE`).
