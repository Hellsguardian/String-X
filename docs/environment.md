# STRING X — Environment Variables & Configuration

## 1. Environment Configuration Overview

STRING X uses **Vite environment variables** loaded at build and development time.
In accordance with Vite conventions, only variables prefixed with **`VITE_`** are exposed to the client-side browser code via `import.meta.env`.

```
.env.example    # Version-controlled template with empty placeholders
.env.local      # Local developer secrets (git-ignored, NEVER committed)
```

---

## 2. Variable Definitions

| Variable Name | Required | Default / Fallback | Purpose & Description |
|---|---|---|---|
| `VITE_SUPABASE_URL` | **Yes** (for live backend) | `''` (Fallback mock mode) | The REST/HTTPS URL of your Supabase project (e.g. `https://xyz.supabase.co`). |
| `VITE_SUPABASE_ANON_KEY` | **Yes** (for live backend) | `''` (Fallback mock mode) | The public anonymous API key for your Supabase project. Safe for browser code. |
| `GEMINI_API_KEY` | Optional | `''` | Google Gemini API key (used if leveraging generative AI prompt enrichers in Google AI Studio). |
| `APP_URL` | Optional | `http://localhost:3000` | Canonical hosted application URL (for deep links, OAuth redirects, and Cloud Run). |

---

## 3. Template Configuration (`.env.example`)

The root repository contains `.env.example`:

```bash
# STRING X Environment Variables Template
# Copy this file to .env.local for local development.

# Supabase Configuration
# Obtain these from your Supabase project dashboard (Settings > API)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"

# Gemini AI (Optional - configured via AI Studio secrets)
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# Hosted App URL (Optional - injected in Cloud Run / hosting environments)
APP_URL="http://localhost:3000"
```

---

## 4. Local Setup Instructions

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` in your editor and input your Supabase project details.
3. Restart the Vite development server (`npm run dev`) for changes to take effect.

---

## 5. Security Guardrails

- **Never commit `.env.local` to git:** Verify `.gitignore` contains `.env.local` and `.env.*.local`.
- **Never store `SUPABASE_SERVICE_ROLE_KEY`:** Service-role keys bypass all PostgreSQL RLS policies and must NEVER be placed in any file prefixed with `VITE_`.
- **Offline / CI Resilience:** If `VITE_SUPABASE_URL` is omitted or contains placeholder strings (`your-project`), the app runs in local mock fallback mode without crashing.
