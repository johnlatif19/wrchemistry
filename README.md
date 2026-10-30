# WR Chemistry Platform

منصة تعليمية متكاملة لمادة الكيمياء، مخصصة للأستاذ وليد الروضي.

## المتطلبات الأساسية
- Node.js (الإصدار 18 أو أحدث)
- حساب Firebase (Firestore و Authentication)
- حساب Cloudinary
- حساب Vercel (للنشر)

## التشغيل المحلي

1. قم بتثبيت الحزم:
   npm install

2. قم بإنشاء ملف .env بناءً على .env.example وقم بتعبئة البيانات المطلوبة.

3. قم بتوليد حساب الأدمن:
   npm run admin:create

4. قم بتشغيل السيرفر:
   npm run dev

المنصة ستعمل على: http://localhost:3000

## النشر على Vercel

1. قم برفع المشروع على GitHub (تأكد من عدم رفع ملف .env).
2. قم بربط المستودع بحسابك في Vercel.
3. أضف متغيرات البيئة (Environment Variables) في إعدادات المشروع على Vercel (نفس محتويات .env).
4. اضغط Deploy.

## الأمان
- كلمات المرور مشفرة باستخدام Argon2id.
- الإجابات الصحيحة محمية بقواعد Firestore.
- رفع الملفات يتم عبر Cloudinary بروابط موقعة (Signed Uploads).
- تسجيل الدخول للأدمن مؤمن بـ JWT و HttpOnly Cookies.