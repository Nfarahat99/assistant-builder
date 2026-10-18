# المستودع: إنشاؤه أو التعرف عليه (الخطوة ٠)

> هذا الملف يغطي: الخطوة ٠ (البنود: كشف الحالة، إنشاء المستودع أو نسخ الموجود، العمل من جذر المستودع، `npm ci`) وفحص عقد المقابلة. السابق: [المتطلبات](00-prereqs.md). التالي: [الاستئناف](02-resume.md) أو [الأسئلة](03-questions.md).

## فحص الحالة (بدون ما تسأل)

`git rev-parse --show-toplevel` ثم، لو نجح، شوف هل يوجد `assistant.config.example.json` في جذره (الملف موجود في كل نسخ القالب، فيعرّف ريبو المساعد حتى لو كان قديماً).

| الحالة | كيف تُكشف | وش تسوي |
|---|---|---|
| داخل ريبو مساعد | `git rev-parse --show-toplevel` ينجح ويوجد `assistant.config.example.json` في جذره | تتحقق من العقد (أدناه) ثم [الاستئناف](02-resume.md) |
| داخل ريبو git ثاني | ينجح لكن بدون `assistant.config.example.json` | تسأل: ننشئ المساعد في مجلد فرعي جديد؟ |
| مجلد عادي | ما فيه git | تسأل: عندك مساعد على GitHub من قبل؟ (أدناه) |

### داخل ريبو مساعد: فحص العقد

اقرأ `package.json` ← `assistantTemplate.onboardingContract` وقارنه برقم العقد في `SKILL.md` (`onboardingContract = 1`). **غير موجود = 0** (أقدم من المهارة):

- **أقل من عقد المهارة (أو غير موجود):** قل «نسخة مساعدك أقدم من المهارة. خلنا نحدّثها أول». بموافقته (AskUserQuestion، لأنه يغيّر ملفات):
  - **قبل أي سحب أو دمج:** شغّل `git status --porcelain` — لازم يكون فاضي. لو فيه تعديلات غير محفوظة: اشرح له بجملة بسيطة واسأله (AskUserQuestion) يحفظها (commit) أو يوقفها مؤقتاً (stash) قبل ما نكمّل. لا تتخلص من أي تعديل أبداً.
  - **عبر المزامنة** (لو `TEMPLATE_SYNC_TOKEN` مضاف — تحقق: `gh secret list --repo <owner>/<name>` يظهر فيه `TEMPLATE_SYNC_TOKEN`):
    1. `gh workflow run template-sync`، وانتظر انتهاء التشغيل (`gh run watch`).
    2. المالك يدمج الـ PR «[template] تحديثات من القالب» (أو أنت `gh pr merge` بموافقته).
    3. `git pull origin <default_branch>` ثم `npm ci`.
    4. أعد فحص العقد.
  - **يدوياً** (ما فيه توكن، أو المالك مبرمج): `git fetch template main && git merge template/main` (لو ما فيه remote `template`: `git remote add template https://github.com/Nfarahat99/assistant-template.git`).
    - عند التعارض: في ملفات الهوية فقط (`assistant.config.json` و`knowledge/owner.md` و`projects.json` و`README.md`) خذ نسخة المالك (نفس قاعدة `template-sync.yml`). أي تعارض ثاني: وقّف واشرح له.
    - ثم `npm ci`، وأعد فحص العقد، ثم ارفع (`git push origin <default_branch>`) بموافقته (AskUserQuestion).
- **أكبر من عقد المهارة:** قل «المهارة عندك أقدم من مستودعك». شغّل `claude plugin marketplace update assistant-builder` ثم قل للمالك يكتب `/reload-plugins` وأعد الأمر.
- **مساوي:** كمّل إلى [الاستئناف](02-resume.md).

### داخل ريبو git ثاني

قل: «هذا المجلد مشروع ثاني. أسوي المساعد في مجلد فرعي جديد؟» (AskUserQuestion: `مجلد فرعي جديد` / `أختار مجلد ثاني`). لا تنشئ شي داخل ريبو غير المساعد. إذا وافق، ادخل المجلد الفرعي الجديد (أو الذي اختاره) وتعامل معه كمجلد عادي.

### مجلد عادي: عندك مساعد من قبل؟

اسأل (AskUserQuestion): «عندك مساعد على GitHub من قبل؟» (`لا، أنشئ واحد جديد` / `إيه، عندي واحد`).

- **إيه، عندي واحد:** اطلب رابط المستودع (رابط صفحته على GitHub — مو سر) ثم `git clone <الرابط>` (لو فشل بسبب الصلاحية: خطوات الدعوة وتسجيل الدخول في [المتطلبات](00-prereqs.md)). ادخل المجلد (`cd <اسم المجلد>`) وكمّل كأنك **داخل ريبو مساعد** (فحص العقد أعلاه ثم [الاستئناف](02-resume.md)).
- **لا، أنشئ واحد جديد:** الخطوات التالية.

### إنشاء مستودع جديد

ما نستخدم زر **Use this template** في GitHub لأنه ينشئ تاريخاً منفصلاً فتفشل المزامنة الأسبوعية؛ لذلك ننشئ المستودع بتاريخ مشترك مع القالب:

1. **حساب الإنشاء:** `gh api user -q .login`؛ لو عنده منظمات (`gh api user/orgs`) اسأله (AskUserQuestion) يحطه باسمه أو باسم منظمة.
2. **اسم المستودع:** نص، الافتراضي `my-assistant`. تأكد إنه مو موجود: `gh repo view <owner>/<name>` لازم يفشل. لو نجح فالاسم محجوز — اسأله (AskUserQuestion) يختار اسماً ثانياً، أو يتحول لمسار «إيه، عندي واحد» أعلاه.
3. **يُنشأ خاص دائماً** (فيه إعداداته وذاكرته) — قلها له بجملة ولا تسأل: `gh repo create <owner>/<name> --private`.
4. انسخ القالب وغيّر الـ remotes (الدفع يحتاج صلاحية `workflow` في تسجيل دخول `gh` — [المتطلبات](00-prereqs.md)):

   ```bash
   git clone https://github.com/Nfarahat99/assistant-template.git <name>
   cd <name>
   git remote rename origin template
   git remote add origin https://github.com/<owner>/<name>.git
   git push -u origin main
   ```

5. `npm ci`.
6. لو فشل أي أمر بعد إنشاء المستودع: اشرح وأعد المحاولة من الخطوة الفاشلة (المستودع الفاضي ما يضر). لا تحذف شي.

بعد `npm ci` سوّ **فحص العقد** (نفس القاعدة أعلاه — المفروض يطابق لأنه نسخة جديدة)، ثم كمّل إلى [الأسئلة](03-questions.md) (ما فيه إعداد سابق).

## اشتغل من جذر المستودع

بعد الإنشاء أو النسخ ادخل المجلد (`cd <اسم المجلد>`) وتأكد بـ `git rev-parse --show-toplevel` وبـ `git remote get-url origin` إن كل الأوامر الجاية (`npm`، `notepad .env`، `git`) تنفّذ من جذر مستودع المالك. لو ما قدرت تثبت على المجلد: قل للمالك يسكّر Claude، ويفتح الطرفية **داخل مجلد المستودع** ويكتب `claude`، ثم يقول لك «كمّل بناء مساعدي».

`npm ci` لو `node_modules` مو موجود.
