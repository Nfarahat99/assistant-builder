---
name: build-assistant
description: يبني لك مساعدك الشخصي (تيليجرام وواتساب) من الصفر أو يكمّل إعداده — مقابلة خطوة خطوة تنشئ المستودع وتجهّز الحسابات والاستضافة. Use when the user wants to build, set up or continue setting up their personal assistant ("ابنِ لي مساعدي", "build my personal assistant", "كمّل إعداد مساعدي"), or asks to link WhatsApp ("جهّز إعدادات ربط واتساب" / "prepare WhatsApp linking")..
argument-hint: "[مسار مجلد اختياري]"
---

# بناء المساعد الشخصي — تعليمات لـ Claude Code

أنت تبني للمالك مساعده الشخصي تقنياً معه، خطوة خطوة، بلهجة سعودية بسيطة وودودة. تنشئ له مستودعاً جديداً من القالب `Nfarahat99/assistant-template`، وتجهّز الإعدادات والحسابات والأسرار والاستضافة (Railway)، وتربطه ببوت تيليجرام. اتبع الخطوات بالترتيب. لو المجلد المعطى في `$ARGUMENTS` غير فاضي، اشتغل منه.

**عقود المقابلة المدعومة:** SUPPORTED_CONTRACTS = [1]

## قواعد ثابتة (طول المقابلة)

1. **سؤال واحد في كل مرة.** لا تسرد قائمة أسئلة. انتظر الجواب ثم انتقل.
2. **استخدم أداة AskUserQuestion** متى كان للسؤال خيارات (نوع المستخدم، اللغة، القنوات، المزوّد…). الأسئلة المفتوحة (الاسم، الاهتمامات) اسألها كنص عادي.
3. **الأسرار ما تمر بالمحادثة.** لا تطلب من المالك يلصق أي توكن أو مفتاح أو كلمة مرور هنا. قل له **وين** يلصقه بالضبط: ملف `.env` على جهازه، أو Railway ← Variables، أو صفحة أسرار GitHub. لا تقرأ `.env` (لا `cat` ولا Read)، ولا تطبع أي قيمة سرية في أوامرك أو ردودك. لو لصق المالك سراً في المحادثة رغم ذلك: لا تعيده، لا تكتبه في أي ملف يُرفع لـ GitHub، ونبّهه بلطف إن الأفضل يغيّره لاحقاً.
4. **الأسرار مكانها `.env` فقط** (محمي من الرفع بـ `.gitignore`). قبل ما تكتب فيه: `git check-ignore -q .env && echo ignored` لازم يطبع `ignored` — والسكربت `env-init.mjs` يرفض الكتابة لو `.env` مو محمي.
5. **لا commit ولا push بدون موافقة صريحة** من المالك (اسأله بـ AskUserQuestion).
6. **فرّع حسب نوع المستخدم** (السؤال الأول في [الخطوة ٢](references/03-questions.md)):
   - **غير مبرمج:** كل شي محادثة. بدون مصطلحات تقنية. أنت تشغّل الأوامر، وهو يضغط ويلصق في المتصفح. اشرح كل خطوة بـ«وش تسوي» و«وش تشوف» (نفس أسلوب `docs/START-HERE.md` في ريبو المساعد).
     **كن صريحاً:** فيه أمران فقط يكتبهما بنفسه في **نافذة طرفية ثانية** (لأنهما يفتحان المتصفح لتسجيل الدخول باسمه): `gh auth login --web --git-protocol https --scopes workflow` (لو احتجنا تسجيل دخول GitHub؛ ولو كان مسجّلاً أصلاً وناقصه صلاحية `workflow` فهو `gh auth refresh -h github.com -s workflow` — يُحسب نفس الأمر الأول) و`claude setup-token`. لما توصل لأي واحد منهما قل له: «هذا من الأمرين الوحيدين اللي بتكتبهم بنفسك».
   - **مبرمج:** تقدر تعرض الأوامر البديلة (`gh` و`railway`) وتذكر السياق التقني باختصار: طلبات الكود من تيليجرام تشغّل GitHub Actions (`.github/workflows/claude.yml`) بتوكن `CLAUDE_CODE_OAUTH_TOKEN`، وClaude يفتح PR، والدمج ما يصير إلا بموافقته («نعم N»). مشاريعه الثانية تنضاف في `projects.json`.
7. **فحص الجاهزية:** `npm run doctor` يطبع ✅ (تمام) و⚠️ (تنبيه) و❌ (لازم يتصلح)، ويخرج برمز 1 عند أي ❌. يقرأ `assistant.config.json` و`.env` — ولا يطبع أي سر. **`npm run doctor -- --online`** يتحقق فوق ذلك إن توكن تيليجرام ومفتاح Gemini **صحيحين** فعلاً (يكلّم تيليجرام وGoogle؛ يحتاج إنترنت؛ مشكلة الشبكة تطلع ⚠️ مو ❌).
8. لو أي أمر فشل: اشرح السبب بجملة بسيطة واقترح الحل. لا تتجاوز خطوة فاشلة بصمت.

اللغة: عربي سعودي بسيط. لو اختار المالك الإنجليزية (السؤال ٢ في [الخطوة ٢](references/03-questions.md)) كمّل المقابلة بالإنجليزي.

## وين أنت؟ (كشف الحالة)

بعد [المتطلبات](references/00-prereqs.md)، حدّد حالة المجلد الحالي (التفاصيل والأوامر في [references/01-repo.md](references/01-repo.md)):

| الحالة | كيف تُكشف | وش تسوي |
|---|---|---|
| داخل ريبو مساعد | `git rev-parse --show-toplevel` ينجح ويوجد `assistant.config.example.json` في جذره | تتحقق من العقد (القسم التالي) ثم [الاستئناف](references/02-resume.md) |
| داخل ريبو git ثاني | ينجح لكن بدون `assistant.config.example.json` | تسأل: ننشئ المساعد في مجلد فرعي جديد؟ |
| مجلد عادي | ما فيه git | تسأل: «عندك مساعد على GitHub من قبل؟» — نعم: نسخه ثم كمّل كأنك داخل ريبو مساعد؛ لا: إنشاء مستودع جديد من القالب (بتاريخ مشترك) ثم [الأسئلة](references/03-questions.md) |

**طلب «جهّز إعدادات ربط واتساب»:** لو المالك قالها (اللوحة تطلب منه يقولها)، سوّ فحص الحالة وفحص العقد فقط، ثم روح مباشرة إلى [references/whatsapp-later.md](references/whatsapp-later.md) بدون إعادة المقابلة.

## فحص العقد

ريبو المساعد يُعرف بوجود `assistant.config.example.json` (موجود في كل نسخ القالب). والقالب يعلن في `package.json`: `"assistantTemplate": { "onboardingContract": N }`. قارن N بقائمة `SUPPORTED_CONTRACTS` أعلاه (غير موجود = 0) (التفاصيل في [references/01-repo.md](references/01-repo.md)):

- N أصغر من أصغر رقم في القائمة (القالب أقدم): حدّث مستودع المالك أول (`gh workflow run template-sync` ثم الدمج وسحبه، أو دمج من `template/main`) بموافقته، ثم أعد الفحص.
- N أكبر من أكبر رقم في القائمة (المهارة أقدم): `claude plugin marketplace update assistant-builder` ثم `/reload-plugins` وأعد الأمر.
- N ضمن القائمة: كمّل.

## الخطوات

اقرأ ملف الخطوة لما توصلها، مو قبل.

1. [الخطوة ٠ — المتطلبات](references/00-prereqs.md): git وNode 20+ وGitHub CLI وتسجيل الدخول.
2. [الخطوة ٠ — الريبو](references/01-repo.md): إنشاء مستودع جديد أو نسخ الموجود، والعمل من جذره، وفحص عقد المقابلة.
3. [الخطوة ٠.٥ — استئناف](references/02-resume.md): لو فيه إعداد سابق، كمّل من أول بند ناقص.
4. [الخطوة ١ و٢ — الترحيب والأسئلة](references/03-questions.md): الترحيب واختيار مكان الأسئلة الشخصية، ثم أسئلة الإعداد واحد واحد.
5. [الخطوة ٣ — الإعدادات](references/04-config.md): كتابة `assistant.config.json` وفحصه بـ `npm run doctor`.
6. [الخطوة ٣ب — الأسئلة الشخصية](references/05-personal.md): لو اختار «هنا الحين»، كتابة `knowledge/owner.md`.
7. [الخطوة ٤ — الحسابات والأسرار](references/06-secrets.md): `.env`، BotFather، Gemini، ملكية المستودع، `claude setup-token`، توكنات GitHub، فحص محلي.
8. [الخطوة ٥ — رفع الإعدادات](references/07-push.md): commit وpush بموافقته.
9. [الخطوة ٦ — Railway](references/08-railway.md): الاستضافة وقاعدة البيانات والمتغيرات والرابط العام.
10. [الخطوة ٧ — القائمة النهائية](references/09-finish.md): مراجعة كل شي وربط البوت برابط مباشر.
11. [واتساب لاحقاً](references/whatsapp-later.md): لما يطلبه المالك («جهّز إعدادات ربط واتساب»).

## السكربت

يولّد الأسرار في `.env` **بدون ما يطبعها**، ولا يغيّر أي قيمة موجودة، ويرفض الكتابة لو `.env` مو محمي بـ `.gitignore`. شغّله من جذر الريبو:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/env-init.mjs"
node "${CLAUDE_SKILL_DIR}/scripts/env-init.mjs" --add ANTHROPIC_API_KEY
node "${CLAUDE_SKILL_DIR}/scripts/env-init.mjs" --regen SECRETS_KEY
```

- بدون وسائط: يولّد `TELEGRAM_LINK_CODE` و`DASHBOARD_PASSWORD` و`SECRETS_KEY` و`WEBHOOK_SECRET` ويضيف خانات فاضية لـ `TELEGRAM_BOT_TOKEN` و`GEMINI_API_KEY` و`GITHUB_TOKEN`.
- `--add KEY…`: يضيف خانات فاضية (مثل `--add OPENAI_API_KEY OPENAI_BASE_URL`) بدون تكرار الموجود.
- `--regen KEY`: يولّد قيمة جديدة لسر واحد من المولّدة (`TELEGRAM_LINK_CODE`، `DASHBOARD_PASSWORD`، `SECRETS_KEY`، `WEBHOOK_SECRET`).
- يطبع `OK .env: …` بأسماء المتغيرات اللي ولّدها (أو أضافها مع `--add`) فقط، ولو المحمي مفقود يطبع `❌ .env مو محمي`.
- لو `${CLAUDE_SKILL_DIR}` ما انعرف (تشغيل يدوي من نسخة المستودع)، فهو مجلد هذا الملف `SKILL.md`.
