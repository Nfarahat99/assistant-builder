# Railway (الاستضافة) (الخطوة ٦)

> هذا الملف يغطي: الخطوة ٦. السابق: [رفع الإعدادات](07-push.md). التالي: [القائمة النهائية](09-finish.md).

إذا الجهة هي اللي تدير الحسابات ([السؤال ٨](03-questions.md))، أو المستودع باسم غيره وما انتقل ([٤.٤](06-secrets.md)): أعطه قائمة الخطوات أدناه يرسلها لهم، وقل له يلصق الأسرار بنفسه أو يعطيهم ملف `.env` بطريقة آمنة (مو في محادثة عامة).

نفس خطوات `docs/START-HERE.md` (قسم «الإعداد على Railway») في مستودع المساعد، واحدة واحدة:

1. https://railway.com ← سجّل دخول بـ GitHub ← **New Project** ← **Deploy from GitHub repo** ← اختر مستودع المساعد. (لو ما ظهر: **Configure GitHub App** واسمح بالمستودع — لو المستودع باسم غيره، صاحبه هو اللي يسمح.)
2. **قاعدة البيانات:** داخل المشروع **+ New** (أو `Ctrl/⌘ + K`) ← **Database** ← **PostgreSQL**.
3. خدمة المساعد ← **Variables** ← **New Variable**: `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`.
4. **Volume:** `Ctrl/⌘ + K` ← **Volume** ← خدمة المساعد ← **Mount path** = `/data`. ثم متغير `FILES_DIR` = `/data/files`.
5. **الأسرار:** خدمة المساعد ← **Variables** ← **Raw Editor**. يفتح المالك `.env` (افتحه له)، وينسخ **السطور اللي فيها قيم فقط**، ويلصقها **تحت** الموجود في Raw Editor (لا يحذف شي) ← **Update Variables**.
6. **الرابط العام:** خدمة المساعد ← **Settings** ← **Networking** ← **Public Networking** ← **Generate Domain**. اطلب منه الرابط (مو سر) وسجّل اسم المشروع إن حب في `hosting.railway_project` (ثم commit/push بموافقته كما في [الخطوة ٥](07-push.md)).
7. **وش يشوف:** بعد دقيقتين أو ثلاث يصير النشر أخضر (Deployed). تحقق أنت: `curl -s https://<الرابط>/health` ← فيه `"ok":true`. أول نشر قبل المتغيرات يفشل عادة — طبيعي؛ بعد اللصق يعيد Railway النشر (أو **Redeploy**).

**للمبرمج (بديل بالأوامر):** `railway login` ← `railway link` ← `railway add --database postgres` ← `railway volume add --mount-path /data` ← المتغيرات من الواجهة (أأمن من سجل الطرفية) ← `railway up` ← `railway domain`. ويقدر يفحص متغيرات Railway نفسها بـ: `railway run npm run doctor -- --online`.
