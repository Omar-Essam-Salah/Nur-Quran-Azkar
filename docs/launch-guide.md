# Nur — دليل النشر على Google Play (للمطوّر لأول مرة)

## 1) حماية الحساب من الإغلاق — نقاط عملية
- حساب **واحد** بهوية صادقة تطابق التوثيق. لا تربطه بأي حساب سبق إغلاقه.
- كن صادقًا في **Data safety**: «No data collected · No data shared» (وهو الصحيح).
- في الاختبار المغلق استخدم **مختبرين حقيقيين** (أهل/أصدقاء) — بلا بوتات، ولا شراء مختبرين، ولا تقييمات مزيّفة.
- **رُدّ على أي رسالة من Google بسرعة** (خلال المهلة). تجاهُل التنبيه = أكبر سبب للإغلاق.
- لا تستخدم أسماء/شعارات/علامات تجارية لغيرك. أبقِ رابط سياسة الخصوصية حيًّا.
- شبكة أمان: الكود والـ APK منشوران على GitHub، فحتى لو حدثت مشكلة في حساب Play يبقى التطبيق متاحًا للتحميل المباشر.

## 2) الاختبار المغلق (Closed testing) — 12 مختبِرًا / 14 يومًا
سياسة Google للحسابات الشخصية الجديدة: قبل النشر للإنتاج، شغّل نسخة خاصة (Closed) مع 12 مختبِرًا مدة 14 يومًا متواصلة، ثم تقدّم لطلب الإنتاج.

الخطوات في Play Console:
1. تطبيقك → **Testing → Closed testing** → **Create track** (سمّه مثلًا `beta`).
2. داخل التراك: **Create release** → ارفع `Nur-v1.0.0.aab` → Save → Review → Start rollout.
3. تبويب **Testers** → **Create email list** → أضف 12 إيميل Gmail على الأقل → Save.
4. انسخ **«Copy link»** (رابط الانضمام) وأرسله للمختبرين.
5. كل مختبِر: يفتح الرابط من موبايله → **Become a tester** → يثبّت من Google Play.
6. أبقِهم مختبرين 14 يومًا، واطلب منهم فتح التطبيق عدة مرات خلال الأسبوعين.
7. بعد اكتمال المدة والعدد: يظهر **Apply for production access** → املأه → مراجعة → نشر عام.

## 3) رسالة جاهزة لإرسالها للمختبرين

**عربي:**
> السلام عليكم 🌙
> بجرّب أنشر تطبيق قرآن وأذكار مجاني اسمه «نُور» (بلا إعلانات، ويعمل بدون إنترنت)، ومحتاج مساعدتك كمُختبِر أسبوعين بس — والأجر صدقة جارية إن شاء الله 🤍
> من موبايل أندرويد:
> 1) افتح الرابط ده: [الصق رابط الانضمام هنا]
> 2) اضغط «Become a tester» ثم نزّل التطبيق من Google Play.
> 3) افتحه عدة مرات خلال الأسبوعين.
> جزاك الله خيرًا.

**English:**
> Assalāmu ʿalaykum 🌙 I’m publishing a free, ad-free, offline Quran & Azkar app called “Nur”, and I need your help as a tester for just two weeks.
> On an Android phone:
> 1) Open this link: [paste the opt-in link]
> 2) Tap “Become a tester”, then install the app from Google Play.
> 3) Open it a few times over the two weeks. JazākAllāhu khayran.

## 4) بيانات التواصل و«Trader status»
- Google يعرض **إيميل** المطوّر على صفحة التطبيق (مطلوب قانونًا). أنشئ إيميلًا مخصّصًا (مثل `nur.app.help@gmail.com`) واستخدمه كإيميل تواصل حتى لا يظهر بريدك الشخصي.
- عند سؤال **Trader status** (للاتحاد الأوروبي): بما أن التطبيق **مجاني بلا ربح**، اختر **«I am not a trader»** — فلا يُطلب عرض عنوانك الفعلي للعامة.

## 5) Release notes (جاهزة للّصق)
- English: `First release of Nur — a free, ad-free, offline Quran & Azkar app: paper Mushaf, recitations, word-by-word, prayer times, Qibla, azkar, duʿāʾ, hadith and more.`
- Arabic: `أول إصدار من «نُور» — تطبيق قرآن وأذكار مجاني بلا إعلانات يعمل دون إنترنت: مصحف ورقي، تلاوات، كلمة بكلمة، مواقيت، قبلة، أذكار، أدعية، حديث والمزيد.`

## 6) ملفات الرفع الجاهزة (في مجلد Downloads)
- `Nur-v1.0.0.aab` — ملف الرفع (Closed testing ثم Production).
- `Nur-play-icon-512.png` — أيقونة 512×512.
- `docs/feature-graphic.html` — افتحه في Chrome وصوّره (1024×500).
- رابط الخصوصية: https://omar-essam-salah.github.io/Nur-Quran-Azkar/privacy-policy.html
