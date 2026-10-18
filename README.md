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
