# STRING X — Campus Cultural Matchmaking Platform

STRING X is a high-energy, university campus social & matchmaking web application (featuring the Navratri 2026 festival pairing experience, live client-side face verification, interactive physical vibe sliders, and a synchronized partner reveal countdown).

Built with **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS v4**, and **Supabase**.

---

## Key Features

- **Neo-Brutalist Visual Design:** High-contrast borders, solid offset drop-shadows, signature glowing pink connecting string, and responsive mobile viewport.
- **Institutional Authentication & Domain Gate:** Supabase Auth with Google OAuth restricted to official `@paruluniversity.ac.in` student accounts, backed by an administrative bypass allowlist (`allowed_auth_emails`).
- **Unified Multi-Attempt Verification:** Decoupled profile photo (DP) review and live webcam facial verification using local Pico.js ML cascade model with mandatory geolocation telemetry as a secondary security signal.
- **Dual-Domain Onboarding:**
  - *Core Student Profile* (Screens 03–11): Identity, campus, hostel, age, photo upload, height ruler, weight dial, home state, college year, department course, and face verification.
  - *Festival Vibe Registration* (Screens 13–21): Partner preferences, garba energy, evening spots, personality prompts, and Instagram connection.
- **Campus Radar Scanner & Real-Time Sync:** Procedural candidate search radar gated by verification standing and paired with Supabase Realtime platform counters.
- **Synchronized Partner Reveal:** Days/hours/minutes countdown ticker with symmetric, pair-level match reveal.
- **Developer Screen Rail:** Desktop sidebar tool allowing one-click navigation across all 24 application screens during development and QA.

---

## Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | [React 19](https://react.dev/) + [Vite 8](https://vite.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) (Strict mode) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom CSS Tokens |
| **Animation** | [Motion](https://motion.dev/) (Framer Motion v12) |
| **Icons & Effects** | [Lucide React](https://lucide.dev/) & [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti) |
| **Computer Vision** | [Pico.js](https://github.com/nenadmarkus/picojs) local face cascade detector |
| **Backend** | [Supabase](https://supabase.com/) (Google OAuth, PostgreSQL 15+, Storage, Realtime) |

---

## Getting Started

### 1. Prerequisites
- **Node.js** v18.0.0 or higher (v20+ recommended).
- **npm** v9.0.0 or higher.

### 2. Installation
```bash
# Clone the repository
git clone <repo-url> string-x
cd string-x

# Install dependencies (use --legacy-peer-deps for Vite 8 / Tailwind v4 resolution)
npm install --legacy-peer-deps
```

### 3. Environment Variables
Copy the template file to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your Supabase credentials:
```env
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```
*(Note: If omitted, STRING X automatically operates in local mock fallback mode using browser storage.)*

### 4. Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Typecheck & Build
```bash
# Typecheck
npm run lint

# Production build
npm run build
```

---

## Architecture Overview

STRING X enforces strict uni-directional layered dependencies:
$$\text{UI Layer (Pages / Steps)} \longrightarrow \text{Domain Hooks} \longrightarrow \text{Service Layer} \longrightarrow \text{Supabase Client} \longrightarrow \text{PostgreSQL / Storage}$$

UI components never contain database queries or SDK calls. All data mutations pass through domain services returning strongly-typed `ServiceResult<T>` records.

---

## Developer Documentation Index

Comprehensive technical documentation is located in the [`docs/`](docs/) directory:

- 🏗️ **Architecture:** [docs/architecture.md](docs/architecture.md) — Layer responsibilities, dependency rules, and data flows.
- 🗄️ **Database:** [docs/database.md](docs/database.md) — PostgreSQL schemas, unified verification, and Row Level Security (RLS) policies.
- 🗺️ **Database ERD:** [docs/database-erd.md](docs/database-erd.md) — 18-table visual Entity-Relationship Diagram and projection view models.
- 🛡️ **Database Security:** [docs/database-security.md](docs/database-security.md) — Security tiers, email identity protection, and RLS policy matrix.
- 🔄 **Migrations:** [docs/migrations.md](docs/migrations.md) — Sequential 16-migration manifest and post-deployment checklist.
- 🔐 **Authentication:** [docs/authentication.md](docs/authentication.md) — Google OAuth institutional flow, email allowlist, and session management.
- 🗺️ **Routing:** [docs/routing.md](docs/routing.md) — Route catalog, semantic keys, and `DevScreenRail` index mapping.
- 📝 **Onboarding:** [docs/onboarding.md](docs/onboarding.md) — Deep dive into core profile and Navratri registration steps.
- 💃 **Matchmaking:** [docs/matchmaking.md](docs/matchmaking.md) — Compatibility vectors, verification gating, single-value assignment, and countdown reveal.
- 🎨 **Design System:** [docs/design.md](docs/design.md) — Exact HEX color palette, typography, borders, shadows, and status badges.
- 🧩 **Components:** [docs/components.md](docs/components.md) — Catalogue of UI primitives, interactive inputs, and illustrations.
- ⚙️ **Services:** [docs/services.md](docs/services.md) — Business logic layer and data access functions.
- 🔄 **State Management:** [docs/state-management.md](docs/state-management.md) — AuthContext, OnboardingContext, and local UI state.
- 📦 **Storage:** [docs/storage.md](docs/storage.md) — Supabase Storage bucket setup, paths, and photo handling.
- 🛡️ **Security:** [docs/security.md](docs/security.md) — RLS policies, credential isolation, and input sanitization.
- 🌐 **Environment:** [docs/environment.md](docs/environment.md) — Vite environment variable definitions and `.env.local`.
- 💻 **Development:** [docs/development.md](docs/development.md) — Scripts, shortcuts (QuickFill), and local debugging.
- 🚀 **Deployment:** [docs/deployment.md](docs/deployment.md) — Production build, SPA rewrites, and CORS configuration.
- 🧪 **Testing:** [docs/testing.md](docs/testing.md) — Test matrix, type verification, and mobile testing guide.
- 🩺 **Troubleshooting:** [docs/troubleshooting.md](docs/troubleshooting.md) — Symptoms, root causes, and verified fixes.
- 📡 **Internal API:** [docs/api.md](docs/api.md) — Service layer function signatures and types.
- 📋 **ADRs:** [docs/decisions.md](docs/decisions.md) — Architecture Decision Records (ADRs 01–20) for key architectural choices.
- 📜 **Changelog:** [docs/changelog.md](docs/changelog.md) — Major architectural updates and release history (v1.0.0 through v2.11.0).
- 🤝 **Contributing:** [CONTRIBUTING.md](CONTRIBUTING.md) — Pull request guidelines and engineering standards.

---

## License

Private repository. Copyright © 2026 STRING X. All rights reserved.
