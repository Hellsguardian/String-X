# STRING X — Production Deployment Guide

## 1. Environments Overview

| Environment | Purpose | Database / Supabase | Hosting Platform |
|---|---|---|---|
| **Local Development** | Engineering, QA, feature dev | Local mock fallback or local Supabase CLI (`http://127.0.0.1:54321`) | `localhost:3000` via Vite |
| **Staging / Preview** | Pull request verification, team sign-off | Supabase Staging Project | Vercel Preview / Cloud Run Preview |
| **Production** | Live student traffic | Supabase Production Project (High availability, RLS active) | Custom Domain / Vercel / Cloud Run |

---

## 2. Production Build Process

Run the build script:
```bash
npm run build
```

This compiles TypeScript, optimizes Tailwind CSS, minifies JavaScript chunks, and outputs the production bundle to `dist/`:
```
dist/
├── index.html
└── assets/
    ├── index-BNG5zpXH.css   (~97 kB)
    └── index-CrvOGr2O.js   (~760 kB)
```

To preview the compiled production output locally:
```bash
npm run preview
```

---

## 3. Single Page App (SPA) Routing Rewrites

Because STRING X is a single-page React application, your hosting provider must redirect all non-file route queries back to `/index.html`.

### Vercel (`vercel.json`)
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Netlify (`_redirects` in `public/`)
```
/*    /index.html   200
```

### Nginx (Custom Server / Docker)
```nginx
location / {
  root /usr/share/nginx/html;
  try_files $uri $uri/ /index.html;
}
```

---

## 4. Supabase Storage CORS Setup

To allow student webcam selfies and photo uploads from your production domain, ensure your Supabase Storage bucket (`profile-photos`) permits your domain's origin:

In the Supabase Dashboard:
1. Navigate to **Storage** $\to$ **Settings** $\to$ **CORS Policies**.
2. Add your production domain:
   - **Allowed Origins:** `https://yourdomain.com`, `https://*.vercel.app`
   - **Allowed Methods:** `GET`, `POST`, `PUT`, `DELETE`, `HEAD`
   - **Allowed Headers:** `*`
   - **Max Age (seconds):** `3600`

---

## 5. Deployment Verification Checklist

- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured in the hosting provider's dashboard.
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` is present in frontend variables.
- [ ] SPA fallback rewrite rule is verified (refreshing deep links returns `index.html`).
- [ ] WebRTC camera permissions prompt properly over HTTPS.
- [ ] Supabase Auth SMS provider (e.g. Twilio / MessageBird) is enabled and funded in production.
- [ ] Public asset `/models/facefinder` loads over HTTPS without 404 errors.
