# تشغيل النظام كنسخة Cloud Database مرتبطة بـ Supabase

## 1) إنشاء مشروع Supabase
- افتح Supabase وأنشئ مشروعًا جديدًا.
- افتح SQL Editor.
- انسخ محتوى ملف `supabase_cloud_schema.sql` وشغّله مرة واحدة.

## 2) نسخ بيانات الاتصال
من Supabase افتح:
Project Settings > API
ثم انسخ:
- Project URL
- anon public key

## 3) ضبط النظام
افتح الملف:
`app/supabase-config.js`

وضع القيم:
```js
window.KING_SUPABASE_CONFIG = {
  url: "https://xxxx.supabase.co",
  anonKey: "ضع_anon_public_key_هنا",
  companyId: "main",
  table: "king_accounting_state"
};
```

لا تستخدم `service_role key` داخل الموقع.

## 4) الرفع على GitHub ثم Vercel
ارفع الملفات إلى GitHub. سيقوم Vercel بإعادة النشر تلقائيًا.

## 5) نقل بيانات الجهاز الحالية إلى السحابة
من داخل النظام:
النظام والنسخ > النسخة الاحتياطية > ربط قاعدة البيانات السحابية Supabase
ثم اضغط:
`رفع بيانات هذا الجهاز للسحابة`

بعدها أي مستخدم يفتح الموقع من جهاز آخر سيقرأ نفس البيانات من Supabase.

## ملاحظات مهمة
- النسخة تستخدم جدول JSONB مركزي باسم `king_accounting_state` حتى يتوافق التطبيق الحالي بسرعة مع Supabase.
- الحسابات والقيود والفواتير والعملاء والموردون والمستخدمون والصلاحيات تحفظ في قاعدة مشتركة.
- تسجيل الدخول داخل النظام أصبح مركزيًا من بيانات Supabase، وليس من جهاز المستخدم فقط.
- للاستخدام المؤسسي عالي الأمان، يفضل لاحقًا إضافة Supabase Auth وربط كل مستخدم ببريد وكلمة مرور مشفرة وسياسات RLS تفصيلية.
