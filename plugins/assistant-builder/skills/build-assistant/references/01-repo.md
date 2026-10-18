# الريبو: إنشاؤه أو التعرف عليه (الخطوة ٠)

> هذا الملف يغطي: الخطوة ٠ (البنود: كشف الحالة، إنشاء الريبو، العمل من جذر الريبو، `npm ci`) وفحص عقد المقابلة. السابق: [المتطلبات](00-prereqs.md). التالي: [الاستئناف](02-resume.md) أو [الأسئلة](03-questions.md).

## فحص الحالة (بدون ما تسأل)

`git rev-parse --show-toplevel` ثم، لو نجح، اقرأ `package.json` في جذره.

| الحالة | كيف تُكشف | وش تسوي |
|---|---|---|
| داخل ريبو مساعد | `git rev-parse --show-toplevel` ينجح و`package.json` فيه `assistantTemplate` | تتحقق من العقد (أدناه) ثم [الاستئناف](02-resume.md) |
| داخل ريبو git ثاني | ينجح لكن بدون `assistantTemplate` | تسأل: ننشئ المساعد في مجلد فرعي جديد؟ |
| مجلد عادي | ما فيه git | إنشاء ريبو جديد (أدناه) |

### داخل ريبو مساعد: فحص العقد

اقرأ `package.json` ← `assistantTemplate.onboardingContract` وقارنه برقم العقد في `SKILL.md` (`onboardingContract = 1`):

- **غير موجود أو أقل من عقد المهارة:** قل «قالب ريبوك أقدم من المهارة. خلنا نحدّثه أول». بموافقته (AskUserQuestion، لأنه يغيّر ملفات):
  - لو `TEMPLATE_SYNC_TOKEN` مضاف: `gh workflow run template-sync` ثم يدمج PR «[template] تحديثات من القالب».
  - وإلا (أو للمبرمج): `git fetch template main && git merge template/main` (لو ما فيه remote `template`: `git remote add template https://github.com/Nfarahat99/assistant-template.git`) ثم `npm ci`.
- **أكبر من عقد المهارة:** قل «المهارة عندك أقدم من ريبوك». شغّل `claude plugin marketplace update assistant-builder` ثم قل للمالك يكتب `/reload-plugins` وأعد الأمر.
- **مساوي:** كمّل إلى [الاستئناف](02-resume.md).

### داخل ريبو git ثاني

قل: «هذا المجلد مشروع ثاني. أسوي المساعد في مجلد فرعي جديد؟» (AskUserQuestion: `مجلد فرعي جديد` / `أختار مجلد ثاني`). لا تنشئ شي داخل ريبو غير المساعد. إذا وافق، ادخل المجلد الفرعي الجديد (أو الذي اختاره) وتعامل معه كمجلد عادي.

### مجلد عادي: إنشاء ريبو جديد

ما نستخدم زر **Use this template** في GitHub لأنه ينشئ تاريخاً منفصلاً فتفشل المزامنة الأسبوعية؛ لذلك ننشئ الريبو بتاريخ مشترك مع القالب:

1. **حساب الإنشاء:** `gh api user -q .login`؛ لو عنده منظمات (`gh api user/orgs`) اسأله (AskUserQuestion) يحطه باسمه أو باسم منظمة.
2. **اسم الريبو:** نص، الافتراضي `my-assistant`. تأكد إنه مو موجود (`gh repo view <owner>/<name>` لازم يفشل).
3. **يُنشأ خاص دائماً** (فيه إعداداته وذاكرته) — قلها له بجملة ولا تسأل: `gh repo create <owner>/<name> --private`.
4. انسخ القالب وغيّر الـ remotes:

   ```bash
   git clone https://github.com/Nfarahat99/assistant-template.git <name>
   cd <name>
   git remote rename origin template
   git remote add origin https://github.com/<owner>/<name>.git
   git push -u origin main
   ```

5. `npm ci`.
6. لو فشل أي أمر بعد إنشاء الريبو: اشرح وأعد المحاولة من الخطوة الفاشلة (الريبو الفاضي ما يضر). لا تحذف شي.

بعد `npm ci` سوّ **فحص العقد** (نفس القاعدة أعلاه — المفروض يطابق لأنه نسخة جديدة)، ثم كمّل إلى [الأسئلة](03-questions.md) (ما فيه إعداد سابق).

## اشتغل من جذر الريبو

بعد الإنشاء أو النسخ ادخل المجلد (`cd <اسم المجلد>`) وتأكد بـ `git rev-parse --show-toplevel` وبـ `git remote get-url origin` إن كل الأوامر الجاية (`npm`، `notepad .env`، `git`) تنفّذ من جذر مستودع المالك. لو ما قدرت تثبت على المجلد: قل للمالك يسكّر Claude، ويفتح الطرفية **داخل مجلد المستودع** ويكتب `claude`، ثم يقول لك «كمّل بناء مساعدي».

`npm ci` لو `node_modules` مو موجود.
