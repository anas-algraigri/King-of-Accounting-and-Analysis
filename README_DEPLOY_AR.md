# إطلاق النظام كموقع سحابي

هذه الحزمة جاهزة للرفع على Vercel كتطبيق واجهة، ومعها ملف قاعدة بيانات Supabase.

## ما تم تضمينه

- نسخة التطبيق بدون واتساب.
- تصدير PDF وExcel.
- تجهيز إرسال الإيميل لاحقًا من السيرفر فقط، وليس كرسالة نصية.
- ملف `supabase_schema.sql` لإنشاء قاعدة البيانات.
- ملف `.env.example` للمتغيرات السرية.
- ملف `vercel.json` للنشر على Vercel.

## خطوات الإطلاق

### 1) إنشاء مشروع Supabase

1. افتح Supabase.
2. أنشئ مشروع جديد.
3. افتح SQL Editor.
4. انسخ محتوى `supabase_schema.sql` وشغله.
5. احفظ بيانات الاتصال:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`

### 2) إنشاء مشروع Vercel

من داخل مجلد الحزمة:

```bash
npm install
npx vercel login
npx vercel link
npx vercel --prod
```

### 3) إضافة المتغيرات في Vercel

من لوحة Vercel > Project Settings > Environment Variables أضف القيم الموجودة في `.env.example`.

### 4) الإيميل

الإيميل يحتاج إعداد SMTP أو خدمة بريد مثل Resend/SendGrid/Mailgun. الإرسال يجب أن يرسل PDF كمرفق من السيرفر، وليس نصًا فقط.

## ملاحظة مهمة

هذه الحزمة تجعل النظام جاهزًا للنشر. الربط السحابي الكامل لكل عملية حفظ وقراءة يحتاج بعد ذلك مرحلة API/Backend تربط شاشات النظام مباشرة بجداول Supabase بدل التخزين المحلي. لا تستخدم مفاتيح الخدمة `SERVICE_ROLE` داخل المتصفح.
