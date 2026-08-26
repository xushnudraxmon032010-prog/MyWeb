# React + Vite

## Ishga tushirish

Windows’da frontend va backendni birga ishga tushirish uchun:

```bash
npm run dev:all
```

Login oynasida serverdagi admin login ma’lumotlaridan foydalaning. Faqat `npm run dev` ishga tushirilsa, API ishlamagani uchun login va ariza yuborish ishlamaydi.

## Vercel’ga joylashtirish

Bu loyiha Supabase’ni global ma’lumotlar bazasi sifatida ishlatadi. Avval Supabase **SQL Editor** oynasida [`supabase/schema.sql`](supabase/schema.sql) faylidagi SQL kodni bir marta ishga tushiring.

Admin login uchun Supabase **Authentication → Users** bo‘limida admin foydalanuvchi yarating. Login oynasida shu foydalanuvchining email va parolini kiriting.

Vercel project settings’da quyidagi environment variable’larni qo‘shing:

```env
VITE_SUPABASE_URL=https://sizning-loyiha-id.supabase.co
VITE_SUPABASE_ANON_KEY=sizning-publishable-key
```

Keyin Vercel’da redeploy qiling. So‘rovlar Supabase’ga tushadi va tasdiqlangan tanishlar barcha qurilmalarda ko‘rinadi.

Lokal backend (`server/server.js`) eski development rejimi uchun qoldirilgan.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
