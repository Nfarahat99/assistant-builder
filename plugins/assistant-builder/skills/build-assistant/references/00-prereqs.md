# المتطلبات (الخطوة ٠ — الجزء الأول)

> هذا الملف يغطي: الخطوة ٠ (البنود: git، Node، GitHub CLI وتسجيل الدخول). التالي: [المستودع](01-repo.md).

شغّل الفحوصات بنفسك بدون ما تسأل، وثبّت الناقص.

1. **git:** `git --version`. لو مو موجود: ويندوز `winget install --id Git.Git -e`، ماك `xcode-select --install`. (بعد التثبيت قد تحتاج تفتح نافذة طرفية جديدة عشان يظهر الأمر.)
2. **Node.js 20 أو أحدث:** `node -v` — لو مو موجود ثبّته (ويندوز `winget install OpenJS.NodeJS.LTS`، ماك `brew install node`).
3. **GitHub CLI (`gh`) وتسجيل الدخول:** تحقق بـ `gh --version` ثم `gh auth status`. لو `gh` مو موجود: ويندوز `winget install --id GitHub.cli -e`، ماك `brew install gh`.
   - **صلاحية `workflow` لازمة:** القالب فيه ملفات `.github/workflows`، وGitHub يرفض دفعها بدون هذي الصلاحية. لذلك الدخول دائماً بـ `--scopes workflow`.
   - لو مو مسجّل دخول: اطلب من المالك يفتح **نافذة طرفية ثانية** ويكتب (هذا أحد الأمرين اللي يكتبهم بنفسه — قل له: «هذا من الأمرين الوحيدين اللي بتكتبهم بنفسك»):
     `gh auth login --web --git-protocol https --scopes workflow`
     ويدخل الرمز اللي يطلع له في المتصفح. بعدها شغّل أنت `gh auth setup-git`.
   - لو مسجّل دخول: تحقق من `gh auth status` (سطر Token scopes). لو `workflow` ناقصة، المالك يكتب في نافذة ثانية `gh auth refresh -h github.com -s workflow` (يُحسب هو نفس أمر «gh auth login» اللي يكتبه بنفسه، فما يزيد عدد الأوامر عن الأمرين) ويدخل الرمز في المتصفح، ثم شغّل أنت `gh auth setup-git`.
   - إذا نسخنا مستودع المساعد الموجود عنده ([المستودع](01-repo.md)) وفشل النسخ بسبب الصلاحية (`Repository not found` أو 403 أو طلب تسجيل دخول):
     1. تأكد إن المالك **قبل الدعوة** للمستودع (Accept invitation في بريده أو إشعارات GitHub).
     2. على ويندوز غالباً تطلع نافذة تسجيل دخول GitHub تلقائياً (Git Credential Manager) — قل له يسجّل دخوله فيها ثم أعد المحاولة.
     3. وإلا استخدم `gh auth login --web --git-protocol https --scopes workflow` أعلاه ثم `gh auth setup-git` وأعد النسخ.

لو أي أمر فشل: اشرح السبب بجملة بسيطة واقترح الحل (القاعدة ٨ في `SKILL.md`).
