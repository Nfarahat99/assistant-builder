# الحسابات والأسرار (الخطوة ٤)

> هذا الملف يغطي: الخطوة ٤ كاملة (٤.١–٤.٧)، واحد واحد. السابق: [الأسئلة الشخصية](05-personal.md) أو [الإعدادات](04-config.md). التالي: [رفع الإعدادات](07-push.md).

## ٤.١ جهّز ملف الأسرار `.env` (أنت تشغّله)

تأكد أولاً إن `.env` محمي (القاعدة ٤ في `SKILL.md`: `git check-ignore -q .env && echo ignored` لازم يطبع `ignored`)، ثم شغّل هذا الأمر من جذر المستودع. يولّد `TELEGRAM_LINK_CODE` و`DASHBOARD_PASSWORD` و`SECRETS_KEY` و`WEBHOOK_SECRET` ويكتبها في `.env` **بدون ما يطبعها**، ويضيف خانات فاضية للمفاتيح اللي يجيبها المالك (`TELEGRAM_BOT_TOKEN` و`GEMINI_API_KEY` و`GITHUB_TOKEN`). ما يمس أي قيمة موجودة. (`TELEGRAM_LINK_CODE` = ٢٤ خانة hex — تناسب رابط تيليجرام المباشر اللي يقبل حروف إنجليزية وأرقام و`_` و`-` حتى ٦٤ خانة.)

```bash
node "${CLAUDE_SKILL_DIR}/scripts/env-init.mjs"
```

يطبع `OK .env: …` بأسماء المتغيرات اللي ولّدها فقط (أو `-` لو ما ولّد شي). لو طبع `❌ .env مو محمي`: أضف `.env` لـ `.gitignore` بموافقته وأعد الأمر.

- لو اختار Claude أو مزوّد OpenAI في [السؤال ١٠](03-questions.md)، أضف خاناته الفاضية بهذا الأمر (ما يكرر خانة موجودة):
  `node "${CLAUDE_SKILL_DIR}/scripts/env-init.mjs" --add ANTHROPIC_API_KEY`
  أو لمزوّد OpenAI: `node "${CLAUDE_SKILL_DIR}/scripts/env-init.mjs" --add OPENAI_API_KEY OPENAI_BASE_URL`
- لو احتجت **قيمة جديدة** لواحد من الأسرار المولّدة (الفحص قال `SECRETS_KEY` غير صالح، أو `TELEGRAM_LINK_CODE` فيه رموز ما يقبلها الرابط): بدّل `SECRETS_KEY` باسم المتغير المطلوب (المسموح: `TELEGRAM_LINK_CODE`، `DASHBOARD_PASSWORD`، `SECRETS_KEY`، `WEBHOOK_SECRET`):
  `node "${CLAUDE_SKILL_DIR}/scripts/env-init.mjs" --regen SECRETS_KEY`
  (لو المساعد منشور: القيمة الجديدة لازم تنحط في Railway ← Variables بعد.)
  - **انتبه مع `SECRETS_KEY` بالذات:** المساعد يشفّر فيه بيانات محفوظة (مثل مفاتيح جلسة واتساب). لو بدّلته على مساعد شغّال، البيانات المشفّرة القديمة **ما تنقرى** وبيحتاج يعيد ربط واتساب وغيره. استخدم `--regen SECRETS_KEY` فقط في **تثبيت جديد** (ما انربط فيه شي بعد)، أو بعد **موافقة المالك الصريحة** (AskUserQuestion) بعد ما تشرح له هالأثر بجملة بسيطة.
- **فتح الملف للمالك** (كل ما احتاج يلصق شي): ويندوز `notepad .env`، ماك `open -e .env`. قل له: «الصق القيمة بعد علامة `=` في السطر المطلوب، بدون مسافات، واحفظ (Ctrl+S أو ⌘S) وسكّر الملف».
- قل له: **`TELEGRAM_LINK_CODE` و`DASHBOARD_PASSWORD` موجودة في هذا الملف — ياخذ منها نسخة في مكان آمن** (يحتاج `DASHBOARD_PASSWORD` للوحة، و`TELEGRAM_LINK_CODE` احتياطاً لو ما اشتغل رابط الربط). الملف يبقى على جهازه وما يُرفع لـ GitHub.

## ٤.٢ بوت تيليجرام (BotFather)

1. افتح تيليجرام ← ابحث عن **@BotFather** (عليه علامة التوثيق الزرقاء) أو افتح https://t.me/BotFather ← **Start**.
2. اكتب `/newbot`.
3. يسألك عن **اسم البوت** (يظهر للناس، مثل اسم المساعد) ثم **اسم المستخدم** (لازم ينتهي بـ `bot`، مثل `rafiq_helper_bot`).
4. **وش تشوف:** رسالة فيها توكن طويل بالشكل `123456789:ABC...`. انسخه.
5. افتح `.env` (أنا أفتحه لك) والصقه بعد `TELEGRAM_BOT_TOKEN=` واحفظ.
6. شغّل أنت `npm run doctor -- --online`. لازم يطلع ✅ «توكن تيليجرام صحيح — البوت @…» — أكّد معه إن هذا اسم بوته. لو ❌ «توكن تيليجرام غلط»: غالباً انقص حرف أو انضافت مسافة — افتح له `.env` يلصقه من جديد (من BotFather: `/mybots` ← بوته ← **API Token**). لو ⚠️ «ما قدرت أتحقق من توكن تيليجرام»: مشكلة إنترنت — كمّل وأعد الفحص بعدين.

## ٤.٣ مفتاح Gemini (مجاني)

1. افتح https://aistudio.google.com/apikey وسجّل دخولك بحساب Google.
2. اضغط **Create API key** (لو سألك عن مشروع اختر الافتراضي أو أنشئ واحد).
3. انسخ المفتاح والصقه في `.env` بعد `GEMINI_API_KEY=` واحفظ.
4. (لو اختار Claude: المفتاح من https://console.anthropic.com ← API Keys، ويُلصق بعد `ANTHROPIC_API_KEY=`.)

بعدها شغّل `npm run doctor -- --online`: لازم سطر القناة ✅ («القناة جاهزة: تيليجرام») وسطر الذكاء ✅ و**«مفتاح Gemini صحيح»** ✅. لو ❌ «مفتاح Gemini غلط»: افتح `.env` للمالك يلصقه من جديد (لا تقرأه أنت).

## ٤.٤ من يملك المستودع؟ (قبل أسرار GitHub والتوكنات وRailway)

إضافة أسرار المستودع، ونوع توكن GitHub، وربط Railway تعتمد على **صاحب المستودع**. لا تفترض — تحقق:

1. تأكد إن `gh` مثبت ومسجّل دخول: `gh --version` ثم `gh auth status` (التفاصيل وصلاحية `workflow` في [المتطلبات](00-prereqs.md)). لو مو مثبت: ويندوز `winget install --id GitHub.cli -e`، ماك `brew install gh`. لو مو مسجّل: المالك يكتب في نافذة طرفية ثانية `gh auth login --web --git-protocol https --scopes workflow` (قل له: «هذا من الأمرين الوحيدين اللي بتكتبهم بنفسك»).
2. شغّل: `gh repo view <owner>/<name> --json owner,viewerPermission,isInOrganization` وخذ منه `owner.login` و`viewerPermission`. وخذ اسم حسابه: `gh api user -q .login`.
   - لو `gh` ما اشتغل أبداً: اسأله عن اسم حسابه في GitHub (نص)، واعتبره صاحب المستودع فقط لو يطابق `<owner>`.
3. **`viewerPermission` = `ADMIN`** (المستودع باسمه أو هو مدير فيه): كمّل عادي — هو يضيف الأسرار (٤.٥–٤.٦) ويربط Railway ([الخطوة ٦](08-railway.md)) بنفسه، وتوكن GitHub من النوع Fine-grained.
4. **غير `ADMIN`** (مثلاً `WRITE` — مضاف كمشارك على مستودع باسم غيره): اشرح له ببساطة:
   > «المستودع مسجّل باسم `<owner.login>`، وأنت مضاف عليه كمشارك. فيه أشياء ما يقدر يسويها إلا صاحب المستودع: ربط Railway بالمستودع، وغالباً إضافة الأسرار في GitHub. والحل الأسهل: `<owner.login>` ينقل المستودع لحسابك (وتصير فواتير GitHub Actions عليك بدل عليه)، وبعدها تسوي كل شي بنفسك.»

   ثم اسأله بـ AskUserQuestion: `أطلب منه ينقل المستودع لي (الأسهل)` / `صاحب المستودع يسوي الخطوات` / `نجرّب أنا أول`.
   - جهّز له **رسالة قصيرة يرسلها لصاحب المستودع** (بدون أي قيمة سرية)، بدّل القيم بين `<>`:

     > السلام عليكم، أجهّز مساعدي على مستودع `<owner>/<name>`. أحتاج منك واحد من اثنين:
     > (أ) **تنقل المستودع لحسابي `<his_login>`:** صفحة المستودع ← Settings ← General ← Danger Zone ← **Transfer ownership** ← اكتب `<his_login>`. بعدها أكمّل كل شي بنفسي (وتقدر تبقى مشارك فيه).
     > (ب) **أو تسوي هذي بنفسك:**
     > ١) Railway: تسمح لتطبيق Railway على GitHub يوصل لهذا المستودع (أو تنشئ مشروع Railway منه ← New Project ← Deploy from GitHub repo).
     > ٢) سرّين في GitHub: Settings ← Secrets and variables ← Actions ← New repository secret — `CLAUDE_CODE_OAUTH_TOKEN` و`TEMPLATE_SYNC_TOKEN`. القيم أرسلها لك بشكل خاص، مو في هذي الرسالة.
   - **بعد النقل:** شغّل الفحص (الخطوة ٢ من هذا القسم) مرة ثانية — المفروض يطلع `ADMIN`. حدّث `github.owner` و`github.self_repo` في `assistant.config.json`، و`git remote set-url origin https://github.com/<his_login>/<name>.git`، ثم كمّل عادي.
   - **لو بيبقى المستودع باسم غيره:**
     - **الأسرار (٤.٥–٤.٦):** جرّب أول: افتح له صفحة الأسرار (الرابط في ٤.٥). لو انفتحت وظهر زر **Add secret** يضيفها بنفسه. لو طلعت 404 أو ما عنده صلاحية: صاحب المستودع يضيفها (القيم يرسلها له المالك بشكل خاص).
     - **`GITHUB_TOKEN` و`TEMPLATE_SYNC_TOKEN`:** لازم **Classic PAT** (مو Fine-grained) — الـ Fine-grained يوصل بس لمستودعات صاحب التوكن نفسه (أو منظمة هو عضو فيها). التفاصيل في ٤.٦.
     - **Railway ([الخطوة ٦](08-railway.md)):** لو ما ظهر المستودع في Railway، صاحب المستودع لازم يسمح لتطبيق Railway على GitHub يوصل للمستودع — أو يسوي خطوة Railway بنفسه.
   - **مستودع في منظمة (`isInOrganization` = true):** صلاحية `WRITE` تكفي لإضافة الأسرار، وتوكن Fine-grained ممكن لو المنظمة تسمح (اختر المنظمة كـ Resource owner)؛ ربط Railway يحتاج مدير المنظمة.

## ٤.٥ توكن Claude للتطوير الذاتي (`claude setup-token`)

هذا يخلي المساعد يقدر يطوّر نفسه (ولمشاريع المبرمج) عبر GitHub Actions.

1. اطلب من المالك يفتح **نافذة طرفية ثانية** (مو هذي) ويكتب: `claude setup-token` ← يفتح المتصفح ← يوافق. (قل له: «هذا من الأمرين الوحيدين اللي بتكتبهم بنفسك».)
2. **وش يشوف:** توكن طويل يبدأ بـ `sk-ant-oat01-`. ينسخه — **لا يلصقه هنا**.
3. افتح له صفحة أسرار المستودع: `https://github.com/<owner>/<name>/settings/secrets/actions/new`
   - **Name:** `CLAUDE_CODE_OAUTH_TOKEN` — **Secret:** يلصق التوكن ← **Add secret**.
   - المبرمج يقدر بدلها يكتب في طرفيته هو: `gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo <owner>/<name>` (يطلب القيمة بدون ما تظهر).
   - لو الصفحة ما انفتحت له (مو صاحب المستودع — ٤.٤): صاحب المستودع يضيف السر.

## ٤.٦ توكنات GitHub

1. **`GITHUB_TOKEN`** (للمساعد نفسه — يطلب تعديلات الكود ويتابعها). النوع حسب ٤.٤:
   - **المستودع باسمه (`ADMIN`) — Fine-grained:**
     - افتح https://github.com/settings/personal-access-tokens/new
     - **Token name:** مثلاً `assistant` — **Expiration:** سنة (وذكّره يجدده).
     - **Repository access:** Only select repositories ← مستودع المساعد `<owner>/<name>` فقط (المبرمج يضيف مستودعات مشاريعه).
     - **Permissions:** Actions و Contents و Pull requests ← **Read and write**.
     - **Generate token** ← ينسخه ويلصقه في `.env` بعد `GITHUB_TOKEN=`.
   - **المستودع باسم غيره — Classic:**
     - افتح https://github.com/settings/tokens/new?scopes=repo,workflow&description=assistant (النطاقان `repo` و`workflow` مختاران مسبقاً).
     - **Expiration:** سنة ← **Generate token** ← ينسخه ويلصقه في `.env` بعد `GITHUB_TOKEN=`.
     - نبّهه: التوكن الـ Classic يوصل لكل مستودعاته — يحفظه في `.env` وRailway فقط.
2. **`TEMPLATE_SYNC_TOKEN`** (سر في GitHub لمزامنة تحديثات القالب أسبوعياً): القالب عام، فيكفي توكن **Fine-grained** على مستودعك وحده (الصلاحيات وشروطها في `docs/TEMPLATE.md` القسم ٤): https://github.com/settings/personal-access-tokens/new ← Only select repositories ← مستودع المساعد ← Permissions: Contents وPull requests وWorkflows ← Read and write. لو المستودع باسم شخص ثاني ([٤.٤](06-secrets.md)): Classic بـ `repo` و`workflow`. يُضاف من نفس صفحة الأسرار (Name: `TEMPLATE_SYNC_TOKEN`). لغير المبرمج: لو صعب، أجّله ونبّهه إنه بدونه ما توصله تحديثات القالب تلقائياً (أو تسويه الجهة اللي زوّدته بالقالب).

## ٤.٧ فحص محلي

شغّل `npm run doctor -- --online` واشرح النتيجة للمالك سطر سطر:
- لازم **ما فيه ❌**.
- ⚠️ «ما فيه PUBLIC_URL ولا RAILWAY_PUBLIC_DOMAIN» طبيعي على الجهاز — على Railway يتعبّى تلقائياً.
