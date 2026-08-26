# React + Vite

## Ishga tushirish

Windows’da frontend va backendni birga ishga tushirish uchun:

```bash
npm run dev:all
```

Login oynasida serverdagi admin login ma’lumotlaridan foydalaning. Faqat `npm run dev` ishga tushirilsa, API ishlamagani uchun login va ariza yuborish ishlamaydi.

## Vercel’ga joylashtirish

Bu loyiha frontend (Vite) va Express/SQLite backend’dan iborat. Vercel frontend build’ini ishga tushiradi, lekin `server/server.js` ni avtomatik ravishda alohida server sifatida ishga tushirmaydi.

1. `server` papkasini Render, Railway yoki boshqa Node.js hosting xizmatiga deploy qiling.
2. Vercel project settings’da `VITE_API_BASE` nomli environment variable yarating va unga backend manzilini `/api` siz kiriting, masalan `https://myweb-api.example.com/api`.
3. Vercel’da redeploy qiling.

`VITE_API_BASE` berilmasa, production frontend same-origin `/api` manzilidan foydalanadi. Bu faqat backend Vercel route sifatida ham deploy qilingan holatda ishlaydi; oddiy frontend deploy’da ma’lumotlar, login va admin amallari ishlamaydi.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
