# احفظ الإعدادات في GitHub (الخطوة ٥)

> هذا الملف يغطي: الخطوة ٥ (بموافقة المالك). السابق: [الأسرار](06-secrets.md). التالي: [Railway](08-railway.md).

1. اعرض عليه بـ AskUserQuestion: «أرفع ملف الإعدادات (اسمك واسم المساعد فقط — بدون أي أسرار) لمستودعك؟» — ولو سوينا الأسئلة الشخصية هنا: «ومعه ذاكرة المساعد `knowledge/owner.md`» (`ارفعه` / `لا، بعدين`).
2. لو وافق:
   - `git status` — تأكد إن `.env` **مو** ضمن الملفات.
   - `git add assistant.config.json` (و`knowledge/owner.md` لو كتبته في [الخطوة ٣ب](05-personal.md)) ثم `git commit -m "chore: my assistant profile"`
   - `git push origin <default_branch>`.
3. لو فشل الدفع بسبب تسجيل الدخول: نفس حل [المتطلبات](00-prereqs.md) (`gh auth login --web --git-protocol https --scopes workflow` في نافذة ثانية، أو `gh auth refresh -h github.com -s workflow` لو ناقصة `workflow`، ثم `gh auth setup-git`). لو الفرع محمي: أنشئ فرعاً وافتح PR (`gh pr create`) وقل له يدمجه من صفحة المستودع.
4. لو رفض: كمّل، لكن نبّهه إن Railway ما يشتغل إلا بعد ما يُرفع الملف (الإقلاع يرفض القيم التجريبية).
